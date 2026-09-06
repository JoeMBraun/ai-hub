function listDirectoryPages() {
    const pages = [];
    HUB_DIRECTORY.forEach(function (group) {
        group.links.forEach(function (link) {
            const alreadyListed = pages.indexOf(link.href) !== -1;
            if (!alreadyListed) {
                pages.push(link.href);
            }
        });
    });
    return pages;
}

function directoryContains(href) {
    return listDirectoryPages().indexOf(href) !== -1;
}

function directoryGroupContains(groupId, href) {
    const matchingGroups = HUB_DIRECTORY.filter(function (group) {
        return group.id === groupId;
    });
    const groupIsPresent = matchingGroups.length > 0;
    if (!groupIsPresent) {
        return false;
    }
    return matchingGroups[0].links.some(function (link) {
        return link.href === href;
    });
}

function makeCheck(id, name, status, detail, page) {
    return {
        id: id,
        name: name,
        status: status,
        detail: detail,
        page: page || "directory"
    };
}

function inspectPageDocument(page, doc, responseOk) {
    const checks = [];
    if (!responseOk) {
        checks.push(makeCheck("LOAD-" + page, "Page loads", "fail", "Fetch did not return a usable HTML document.", page));
        return checks;
    }

    checks.push(makeCheck("LOAD-" + page, "Page loads", "pass", "HTML document was retrieved successfully.", page));

    const lang = doc.documentElement.getAttribute("lang");
    const langIsPresent = lang !== null && lang !== undefined && lang.trim() !== "";
    checks.push(makeCheck("LANG-" + page, "Language declared", langIsPresent ? "pass" : "fail", langIsPresent ? 'html lang="' + lang + '"' : "Missing html lang attribute.", page));

    const viewport = doc.querySelector('meta[name="viewport"]');
    const viewportIsPresent = viewport !== null && viewport !== undefined;
    checks.push(makeCheck("VIEW-" + page, "Responsive viewport", viewportIsPresent ? "pass" : "fail", viewportIsPresent ? "Viewport meta tag is present." : "Missing viewport meta tag.", page));

    const titleText = doc.title ? doc.title.trim() : "";
    const titleIsPresent = titleText !== "";
    checks.push(makeCheck("TITLE-" + page, "Document title", titleIsPresent ? "pass" : "fail", titleIsPresent ? titleText : "Missing document title.", page));

    const headings = doc.querySelectorAll("h1");
    const headingCount = headings.length;
    const headingStatus = headingCount === 1 ? "pass" : "fail";
    checks.push(makeCheck("H1-" + page, "Single page heading", headingStatus, "Found " + headingCount + " h1 element(s).", page));

    const cssLink = doc.querySelector('link[rel="stylesheet"][href="css/hub.css"]');
    const cssIsPresent = cssLink !== null && cssLink !== undefined;
    checks.push(makeCheck("CSS-" + page, "Shared stylesheet", cssIsPresent ? "pass" : "fail", cssIsPresent ? "Links css/hub.css." : "Missing css/hub.css.", page));

    const scriptTag = doc.querySelector('script[src="js/hub.js"]');
    const scriptIsPresent = scriptTag !== null && scriptTag !== undefined;
    checks.push(makeCheck("JS-" + page, "Shared directory script", scriptIsPresent ? "pass" : "fail", scriptIsPresent ? "Loads js/hub.js so Site Admin and Evaluation stay in nav." : "Missing js/hub.js; directory nav will not render.", page));

    const images = Array.prototype.slice.call(doc.querySelectorAll("img"));
    const missingAlt = images.filter(function (img) {
        const alt = img.getAttribute("alt");
        return alt === null || alt === undefined;
    });
    const imageStatus = missingAlt.length === 0 ? "pass" : "fail";
    checks.push(makeCheck("ALT-" + page, "Images have alt text", imageStatus, missingAlt.length === 0 ? images.length + " image(s) include alt text." : missingAlt.length + " image(s) missing alt.", page));

    const httpLinks = Array.prototype.slice.call(doc.querySelectorAll('a[href^="http://"]'));
    const httpStatus = httpLinks.length === 0 ? "pass" : "warn";
    checks.push(makeCheck("HTTPS-" + page, "Prefers HTTPS links", httpStatus, httpLinks.length === 0 ? "No insecure http:// links." : httpLinks.length + " http:// link(s) should be https://.", page));

    return checks;
}

async function runUsabilitySuite() {
    const startedAt = new Date().toISOString();
    const checks = [];
    const pages = listDirectoryPages();

    checks.push(makeCheck(
        "DIR-EVAL",
        "Evaluation page is in the directory",
        directoryContains("evaluation-hub.html") ? "pass" : "fail",
        directoryContains("evaluation-hub.html")
            ? "evaluation-hub.html is listed under AI Data & Evaluation."
            : "evaluation-hub.html is missing from HUB_DIRECTORY."
    ));

    checks.push(makeCheck(
        "DIR-EVAL-GROUP",
        "Evaluation sits in Data & Evaluation",
        directoryGroupContains("data", "evaluation-hub.html") ? "pass" : "fail",
        directoryGroupContains("data", "evaluation-hub.html")
            ? "AI Evaluation Hub is a navigation option in AI Data & Evaluation."
            : "AI Evaluation Hub is not in the AI Data & Evaluation group."
    ));

    checks.push(makeCheck(
        "DIR-ADMIN",
        "Site Evaluation is an Admin directory option",
        directoryContains("admin-hub.html") && directoryGroupContains("admin", "admin-hub.html") ? "pass" : "fail",
        directoryContains("admin-hub.html") && directoryGroupContains("admin", "admin-hub.html")
            ? "admin-hub.html is listed under Admin."
            : "admin-hub.html is missing from the Admin group."
    ));

    checks.push(makeCheck(
        "DIR-COURSE",
        "Courses hub is in Start Here",
        directoryGroupContains("interfaces", "course-hub.html") ? "pass" : "fail",
        directoryGroupContains("interfaces", "course-hub.html")
            ? "course-hub.html is listed under Start Here."
            : "course-hub.html is not in the Start Here group."
    ));

    const siteAdminGroup = HUB_DIRECTORY.filter(function (group) {
        return group.id === "admin" && group.label === "Admin";
    });
    checks.push(makeCheck(
        "DIR-ADMIN-GROUP",
        "Admin navigation group exists",
        siteAdminGroup.length === 1 ? "pass" : "fail",
        siteAdminGroup.length === 1 ? 'Found the "Admin" group.' : "Admin group is missing."
    ));

    const startHereGroup = HUB_DIRECTORY.filter(function (group) {
        return group.label === "Start Here";
    });
    checks.push(makeCheck(
        "DIR-START",
        "Start Here navigation group exists",
        startHereGroup.length === 1 ? "pass" : "fail",
        startHereGroup.length === 1 ? 'Found the "Start Here" group.' : "Start Here group is missing."
    ));

    const pagesToInspect = pages.slice();
    const adminAlreadyListed = pagesToInspect.indexOf("admin-hub.html") !== -1;
    if (!adminAlreadyListed) {
        pagesToInspect.push("admin-hub.html");
    }

    for (let index = 0; index < pagesToInspect.length; index += 1) {
        const page = pagesToInspect[index];
        try {
            const response = await fetch(page, { cache: "no-store" });
            const responseOk = response.ok;
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, "text/html");
            inspectPageDocument(page, doc, responseOk).forEach(function (check) {
                checks.push(check);
            });
        } catch (executionError) {
            checks.push(makeCheck("LOAD-" + page, "Page loads", "fail", executionError.message, page));
        }
    }

    const passed = checks.filter(function (check) { return check.status === "pass"; }).length;
    const failed = checks.filter(function (check) { return check.status === "fail"; }).length;
    const warned = checks.filter(function (check) { return check.status === "warn"; }).length;
    const finishedAt = new Date().toISOString();

    return {
        suite: "AI Hub website usability",
        source: "browser",
        startedAt: startedAt,
        finishedAt: finishedAt,
        summary: {
            total: checks.length,
            passed: passed,
            failed: failed,
            warned: warned
        },
        pages: pages,
        checks: checks
    };
}

function statusBadgeClass(status) {
    if (status === "pass") {
        return "badge badge-pass";
    }
    if (status === "fail") {
        return "badge badge-fail";
    }
    return "badge badge-warn";
}

function renderSuiteRun(report) {
    const summaryRoot = document.getElementById("suite-summary");
    const tableBody = document.getElementById("suite-results-body");
    const meta = document.getElementById("suite-meta");
    const rootsArePresent = summaryRoot !== null && tableBody !== null && meta !== null;
    if (!rootsArePresent) {
        return;
    }

    const summary = report.summary;
    summaryRoot.innerHTML =
        '<div class="suite-stat"><div class="suite-stat-value">' + summary.total + '</div><div class="suite-stat-label">Checks</div></div>' +
        '<div class="suite-stat"><div class="suite-stat-value" style="color:#4ade80">' + summary.passed + '</div><div class="suite-stat-label">Passed</div></div>' +
        '<div class="suite-stat"><div class="suite-stat-value" style="color:#f87171">' + summary.failed + '</div><div class="suite-stat-label">Failed</div></div>' +
        '<div class="suite-stat"><div class="suite-stat-value" style="color:#facc15">' + summary.warned + '</div><div class="suite-stat-label">Warnings</div></div>';

    meta.textContent = "Source: " + report.source + " · Finished " + report.finishedAt;

    tableBody.innerHTML = report.checks.map(function (check) {
        return "<tr>" +
            "<td>" + check.id + "</td>" +
            "<td>" + check.name + "</td>" +
            "<td>" + check.page + "</td>" +
            '<td><span class="' + statusBadgeClass(check.status) + '">' + check.status + "</span></td>" +
            "<td>" + check.detail + "</td>" +
            "</tr>";
    }).join("");
}

async function loadRecordedSuiteRun() {
    const response = await fetch("data/usability-suite-run.json", { cache: "no-store" });
    const responseOk = response.ok;
    if (!responseOk) {
        throw new Error("Recorded suite run was not found.");
    }
    return response.json();
}

async function handleRunSuiteClick() {
    const button = document.getElementById("run-suite-btn");
    const buttonIsPresent = button !== null && button !== undefined;
    if (buttonIsPresent) {
        button.disabled = true;
        button.textContent = "Running suite…";
    }
    try {
        const report = await runUsabilitySuite();
        renderSuiteRun(report);
    } catch (executionError) {
        const meta = document.getElementById("suite-meta");
        const metaIsPresent = meta !== null && meta !== undefined;
        if (metaIsPresent) {
            meta.textContent = "Suite run completed unsuccessfully. " + executionError.message;
        }
    } finally {
        if (buttonIsPresent) {
            button.disabled = false;
            button.textContent = "Run suite now";
        }
    }
}

function scorePercent(score, maxScore) {
    return Math.max(0, Math.min(100, (score / maxScore) * 100));
}

function renderMeasurements(report) {
    const grid = document.getElementById("measure-grid");
    const detail = document.getElementById("measure-detail");
    const meta = document.getElementById("measure-meta");
    const rootsArePresent = grid !== null && detail !== null && meta !== null;
    if (!rootsArePresent) {
        return;
    }

    const maxScore = report.scale.max;
    meta.textContent = report.site + " · " + report.method + " Overall " + report.overall.score + " / " + maxScore + " (" + report.overall.label + "). Evaluated " + report.evaluatedAt + ".";

    grid.innerHTML = report.dimensions.map(function (dimension) {
        const isFrequencyGoal = dimension.goal === "frequency";
        const cardClass = isFrequencyGoal ? "measure-card measure-card-frequency" : "measure-card";
        return '<div class="' + cardClass + '">' +
            "<h3>" + dimension.label + "</h3>" +
            '<div class="measure-score">' + dimension.score.toFixed(1) + " <span>/ " + maxScore + "</span></div>" +
            '<div class="measure-bar"><div class="measure-bar-fill" style="width:' + scorePercent(dimension.score, maxScore) + '%"></div></div>' +
            '<p class="measure-summary">' + dimension.summary + "</p>" +
            "</div>";
    }).join("");

    detail.innerHTML = report.dimensions.map(function (dimension) {
        const criteria = dimension.criteria.map(function (item) {
            return "<li>" + item.name + " — " + item.score.toFixed(1) + " / " + maxScore + "</li>";
        }).join("");
        const evidence = dimension.evidence.map(function (item) {
            return "<li>" + item + "</li>";
        }).join("");
        return "<h3>" + dimension.label + "</h3>" +
            "<p class=\"measure-summary\"><strong>Criteria</strong></p><ul>" + criteria + "</ul>" +
            "<p class=\"measure-summary\"><strong>Evidence</strong></p><ul>" + evidence + "</ul>";
    }).join("");
}

async function loadMeasurements() {
    const response = await fetch("data/ux-measurements.json", { cache: "no-store" });
    const responseOk = response.ok;
    if (!responseOk) {
        throw new Error("UX measurements file was not found.");
    }
    return response.json();
}

async function initializeUsabilitySuitePage() {
    const button = document.getElementById("run-suite-btn");
    const buttonIsPresent = button !== null && button !== undefined;
    if (buttonIsPresent) {
        button.addEventListener("click", handleRunSuiteClick);
    }

    try {
        const measurements = await loadMeasurements();
        renderMeasurements(measurements);
    } catch (measurementError) {
        const meta = document.getElementById("measure-meta");
        const metaIsPresent = meta !== null && meta !== undefined;
        if (metaIsPresent) {
            meta.textContent = "Measurements could not be loaded. " + measurementError.message;
        }
    }

    try {
        const recorded = await loadRecordedSuiteRun();
        renderSuiteRun(recorded);
    } catch (recordedError) {
        await handleRunSuiteClick();
    }
}

document.addEventListener("DOMContentLoaded", initializeUsabilitySuitePage);
