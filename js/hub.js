// Site Evaluation (admin-hub.html) is the quality-metrics dashboard.
// Owner decision: keep the Admin / Site Evaluation link in this directory
// so it renders on every page. Do not delete the page, suite, or scores.
const HUB_DIRECTORY = [
    {
        id: "interfaces",
        label: "Start Here",
        links: [
            { href: "index.html", text: "🏠 AI Hub Home →" },
            { href: "chatbot-hub.html", text: "🤖 AI Chatbot Hub →" },
            { href: "prompt-hub.html", text: "✍️ AI Prompt Hub →" },
            { href: "course-hub.html", text: "🎓 AI Courses Hub →" }
        ]
    },
    {
        id: "guides",
        label: "Guides",
        links: [
            { href: "guides/choose-an-ai.html", text: "🧭 Choose an AI →" },
            { href: "guides/choose-an-ai-coding-tool.html", text: "🛠️ Choose a coding tool →" },
            { href: "guides/build-your-first-rag-app.html", text: "📚 First RAG app →" },
            { href: "guides/build-your-first-ai-agent.html", text: "🧠 First AI agent →" },
            { href: "guides/run-ai-locally.html", text: "💻 Run AI locally →" },
            { href: "guides/evaluate-an-ai-application.html", text: "🧪 Evaluate an app →" }
        ]
    },
    {
        id: "development",
        label: "AI Development",
        links: [
            { href: "harness-hub.html", text: "🛠️ AI Harness Hub →" },
            { href: "architecture-hub.html", text: "🏗️ AI Architecture Hub →" },
            { href: "agents-hub.html", text: "🧠 AI Agents Hub →" },
            { href: "local-models-hub.html", text: "💻 AI Local Models Hub →" }
        ]
    },
    {
        id: "data",
        label: "AI Data & Evaluation",
        links: [
            { href: "data-hub.html", text: "📚 AI Data Hub →" },
            { href: "benchmark-hub.html", text: "📊 AI Benchmark Hub →" },
            { href: "evaluation-hub.html", text: "🧪 AI Evaluation Hub →" }
        ]
    },
    {
        id: "safety",
        label: "AI Safety & Ops",
        links: [
            { href: "security-hub.html", text: "🔒 AI Security Hub →" },
            { href: "governance-hub.html", text: "⚖️ AI Governance Hub →" },
            { href: "deployment-hub.html", text: "🚀 AI Deployment Hub →" }
        ]
    },
    {
        id: "admin",
        label: "Admin",
        links: [
            { href: "admin-hub.html", text: "🧭 Site Evaluation →" }
        ]
    }
];

const ASK_AI_INTENTS = ["explain", "implement", "compare", "troubleshoot"];
const ASK_AI_PROVIDERS = {
    "ChatGPT": "https://chatgpt.com/?q=",
    "Perplexity": "https://www.perplexity.ai/?q=",
    "Claude": "https://claude.ai/new?q="
};

function getCurrentHubPage() {
    const parts = window.location.pathname.split("/").filter(function (part) {
        return part !== "";
    });
    if (parts.length === 0) {
        return "index.html";
    }
    const last = parts[parts.length - 1];
    if (!last.endsWith(".html")) {
        return "index.html";
    }
    if (parts.length >= 2 && parts[parts.length - 2] === "guides") {
        return "guides/" + last;
    }
    return last;
}

function assetPrefix() {
    return getCurrentHubPage().indexOf("/") >= 0 ? "../" : "";
}

function resolveHref(href) {
    const current = getCurrentHubPage();
    const inGuides = current.indexOf("guides/") === 0;
    if (!inGuides) {
        return href;
    }
    if (href.indexOf("guides/") === 0) {
        return href.slice("guides/".length);
    }
    return "../" + href;
}

function currentHubLabel() {
    const page = getCurrentHubPage();
    let label = "Directory";
    HUB_DIRECTORY.forEach(function (group) {
        group.links.forEach(function (link) {
            const isCurrent = link.href === page;
            if (isCurrent) {
                label = link.text.replace(" →", "");
            }
        });
    });
    return label;
}

const NAV_COLLAPSE_STORAGE_KEY = "aiHub.navCollapsed";

function readNavCollapsed() {
    try {
        const stored = window.localStorage.getItem(NAV_COLLAPSE_STORAGE_KEY);
        if (stored === "1") {
            return true;
        }
        if (stored === "0") {
            return false;
        }
    } catch (storageError) {
        return getCurrentHubPage() === "index.html";
    }
    return getCurrentHubPage() === "index.html";
}

function writeNavCollapsed(isCollapsed) {
    try {
        window.localStorage.setItem(NAV_COLLAPSE_STORAGE_KEY, isCollapsed ? "1" : "0");
    } catch (storageError) {
        return;
    }
}

function applyNavCollapsed(shell, isCollapsed) {
    const toggle = shell.querySelector(".nav-toggle");
    const label = shell.querySelector(".nav-toggle-label");
    const controlsArePresent = toggle !== null && label !== null;
    if (!controlsArePresent) {
        return;
    }

    if (isCollapsed) {
        shell.classList.add("is-collapsed");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Expand directory navigation");
        label.textContent = "Directory · " + currentHubLabel();
    } else {
        shell.classList.remove("is-collapsed");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Collapse directory navigation");
        label.textContent = "Directory";
    }
}

function ensureNavShell(nav) {
    const parent = nav.parentElement;
    const shellAlreadyExists = parent !== null && parent.classList.contains("nav-shell");
    if (shellAlreadyExists) {
        return parent;
    }

    const shell = document.createElement("div");
    shell.className = "nav-shell";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.setAttribute("aria-controls", "hub-directory");
    nav.id = "hub-directory";
    toggle.innerHTML = '<span class="nav-toggle-label">Directory</span><span class="nav-toggle-icon" aria-hidden="true"></span>';
    nav.parentNode.insertBefore(shell, nav);
    shell.appendChild(toggle);
    shell.appendChild(nav);
    mountSiteSearch(shell);

    toggle.addEventListener("click", function () {
        const willCollapse = !shell.classList.contains("is-collapsed");
        applyNavCollapsed(shell, willCollapse);
        writeNavCollapsed(willCollapse);
    });
    nav.addEventListener("click", function (event) {
        const link = event.target.closest("a[href]");
        const isDirectoryLink = link !== null && nav.contains(link);
        if (isDirectoryLink) {
            writeNavCollapsed(true);
        }
    });
    return shell;
}

function renderHubDirectory() {
    const nav = document.querySelector(".nav");
    const navIsPresent = nav !== null && nav !== undefined;
    if (!navIsPresent) {
        return;
    }

    const currentPage = getCurrentHubPage();
    nav.innerHTML = HUB_DIRECTORY.map(function (group) {
        const linksMarkup = group.links.map(function (link) {
            const isCurrent = link.href === currentPage;
            const classAttr = isCurrent ? ' class="nav-current"' : "";
            const ariaAttr = isCurrent ? ' aria-current="page"' : "";
            return '<a href="' + resolveHref(link.href) + '"' + classAttr + ariaAttr + ">" + link.text + "</a>";
        }).join("\n        ");
        return '<div class="nav-group">\n        <div class="nav-label">' + group.label + "</div>\n        " + linksMarkup + "\n    </div>";
    }).join("\n\n    ");

    const shell = ensureNavShell(nav);
    applyNavCollapsed(shell, readNavCollapsed());
}

function currentHubTopic() {
    const heading = document.querySelector("h1");
    if (heading === null) {
        return "AI Hub";
    }
    return heading.textContent.replace(/^[^\w]+/, "").trim();
}

function buildAskAiPrompt(conceptName, hubTopic, intent) {
    if (intent === "implement") {
        return "Show me how to implement " + conceptName + " for a production-quality AI system in the context of " + hubTopic + ". Explain the architecture, prerequisites, implementation steps, example code or configuration where appropriate, testing strategy, failure modes, security concerns, and a minimal working version.";
    }
    if (intent === "compare") {
        return "Compare " + conceptName + " with the most common alternatives in the context of " + hubTopic + ". Explain the tradeoffs in complexity, cost, reliability, performance, and maintainability. End with a decision table and clear recommendations for when to choose each option.";
    }
    if (intent === "troubleshoot") {
        return "Help me troubleshoot an implementation of " + conceptName + " in the context of " + hubTopic + ". Give me a diagnostic checklist ordered by likelihood and impact, then explain common failure modes, what evidence to collect, and how to isolate the problem.";
    }
    return "Explain " + conceptName + " in the context of " + hubTopic + ". Start with a plain-English explanation, then give a concrete example, when it is useful, when it is unnecessary, common mistakes, and what I should learn next.";
}

class RoutingException extends Error {
    constructor(message, errorId) {
        super(message);
        this.name = "RoutingException";
        this.errorId = errorId;
    }
}

function routeAskAi(conceptName, hubTopic, intent, provider, event) {
    if (event !== null && event !== undefined) {
        event.preventDefault();
        event.stopPropagation();
    }
    const promptText = buildAskAiPrompt(conceptName, hubTopic, intent);
    const providerUrl = ASK_AI_PROVIDERS[provider];
    if (!providerUrl) {
        console.error("[HUBUI102E] Provider mapping not found.");
        return;
    }
    window.open(providerUrl + encodeURIComponent(promptText), "_blank");
}

function generatePromptAndRouteToLanguageModel(event, conceptText, languageModelProvider) {
    routeAskAi(conceptText, currentHubTopic(), "explain", languageModelProvider, event);
}

function createAskAiWidget(conceptName, hubTopic) {
    const root = document.createElement("div");
    root.className = "ask-ai";
    root.setAttribute("data-concept", conceptName);

    const label = document.createElement("p");
    label.className = "ask-ai-label";
    label.textContent = "Ask AI";
    root.appendChild(label);

    const intentGroup = document.createElement("div");
    intentGroup.className = "ask-ai-intents";
    intentGroup.setAttribute("role", "group");
    intentGroup.setAttribute("aria-label", "Ask AI intent for " + conceptName);

    let selectedIntent = "explain";
    ASK_AI_INTENTS.forEach(function (intent) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ask-ai-intent";
        button.setAttribute("data-intent", intent);
        button.setAttribute("aria-pressed", intent === selectedIntent ? "true" : "false");
        button.textContent = intent.charAt(0).toUpperCase() + intent.slice(1);
        button.addEventListener("click", function (clickEvent) {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            selectedIntent = intent;
            Array.prototype.forEach.call(intentGroup.querySelectorAll(".ask-ai-intent"), function (other) {
                other.setAttribute("aria-pressed", other.getAttribute("data-intent") === selectedIntent ? "true" : "false");
            });
        });
        intentGroup.appendChild(button);
    });
    root.appendChild(intentGroup);

    const providerGroup = document.createElement("div");
    providerGroup.className = "ask-ai-providers";
    providerGroup.setAttribute("role", "group");
    providerGroup.setAttribute("aria-label", "Ask AI provider for " + conceptName);
    Object.keys(ASK_AI_PROVIDERS).forEach(function (provider) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ask-ai-provider";
        button.textContent = provider;
        button.addEventListener("click", function (clickEvent) {
            routeAskAi(conceptName, hubTopic, selectedIntent, provider, clickEvent);
        });
        providerGroup.appendChild(button);
    });
    root.appendChild(providerGroup);
    return root;
}

function enhanceAskAiWidgets() {
    const hubTopic = currentHubTopic();
    document.querySelectorAll(".card").forEach(function (card) {
        if (card.tagName === "A") {
            return;
        }
        const nameEl = card.querySelector(".card-name");
        if (nameEl === null) {
            return;
        }
        const conceptName = (card.getAttribute("data-concept") || nameEl.textContent).trim();
        const existingActions = card.querySelector(".llm-actions");
        const shouldAdd = existingActions !== null || card.hasAttribute("data-knowledge");
        if (!shouldAdd) {
            return;
        }
        if (card.querySelector(".ask-ai")) {
            return;
        }
        const widget = createAskAiWidget(conceptName, hubTopic);
        if (existingActions !== null) {
            existingActions.replaceWith(widget);
        } else {
            card.appendChild(widget);
        }
    });
}

function renderKnowledgeUnit(unit) {
    const details = document.createElement("details");
    details.className = "knowledge-unit";
    const summary = document.createElement("summary");
    summary.textContent = "Learn more";
    details.appendChild(summary);

    function addBlock(title, html) {
        const heading = document.createElement("h3");
        heading.textContent = title;
        details.appendChild(heading);
        const body = document.createElement("div");
        body.className = "knowledge-body";
        body.innerHTML = html;
        details.appendChild(body);
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    addBlock("What is it?", "<p>" + escapeHtml(unit.what) + "</p>");
    addBlock("Why should I care?", "<p>" + escapeHtml(unit.why) + "</p>");
    addBlock("When should I use it?", "<ul>" + unit.when.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>");
    addBlock("When should I not use it?", "<ul>" + unit.whenNot.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>");
    addBlock("Simple example", "<p>" + escapeHtml(unit.example) + "</p>");
    addBlock("Implementation path", "<ol>" + unit.steps.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ol>");
    addBlock("Failure modes", "<ul>" + unit.failures.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>");
    if (unit.related && unit.related.length) {
        const prefix = assetPrefix();
        const links = unit.related.map(function (item) {
            return '<li><a href="' + prefix + item.href + '">' + escapeHtml(item.label) + "</a></li>";
        }).join("");
        addBlock("Related concepts", "<ul>" + links + "</ul>");
    }
    return details;
}

function enhanceKnowledgeUnits(unitsByName) {
    document.querySelectorAll(".card").forEach(function (card) {
        if (card.tagName === "A") {
            return;
        }
        const nameEl = card.querySelector(".card-name");
        if (nameEl === null) {
            return;
        }
        const key = (card.getAttribute("data-knowledge") || nameEl.textContent).trim();
        const unit = unitsByName[key];
        if (!unit) {
            return;
        }
        if (card.querySelector(".knowledge-unit")) {
            return;
        }
        const desc = card.querySelector(".card-desc");
        const block = renderKnowledgeUnit(unit);
        if (desc !== null && desc.nextSibling) {
            card.insertBefore(block, desc.nextSibling);
        } else {
            card.appendChild(block);
        }
    });
}

function mountSiteSearch(shell) {
    if (shell.querySelector(".site-search")) {
        return;
    }
    const wrap = document.createElement("div");
    wrap.className = "site-search";
    wrap.innerHTML = '<label class="visually-hidden" for="site-search-input">Search AI Hub</label>' +
        '<input id="site-search-input" type="search" autocomplete="off" placeholder="Search hubs, concepts, and guides">' +
        '<div id="site-search-results" class="site-search-results" hidden role="listbox" aria-label="Search results"></div>';
    shell.appendChild(wrap);
    const input = wrap.querySelector("#site-search-input");
    const results = wrap.querySelector("#site-search-results");
    let index = [];

    fetch(assetPrefix() + "data/search-index.json", { cache: "no-store" }).then(function (response) {
        if (!response.ok) {
            return [];
        }
        return response.json();
    }).then(function (data) {
        index = data;
    }).catch(function () {
        index = [];
    });

    function closeResults() {
        results.hidden = true;
        results.innerHTML = "";
    }

    function renderHits(hits) {
        if (hits.length === 0) {
            results.hidden = false;
            results.innerHTML = '<p class="site-search-empty">No matching hubs, concepts, or guides.</p>';
            return;
        }
        results.hidden = false;
        results.innerHTML = hits.map(function (hit) {
            return '<a class="site-search-hit" role="option" href="' + resolveHref(hit.href) + '">' +
                '<strong>' + hit.title + "</strong>" +
                '<span>' + hit.type + " · " + hit.hub + "</span>" +
                "<span>" + hit.description + "</span></a>";
        }).join("");
    }

    input.addEventListener("input", function () {
        const query = input.value.trim().toLowerCase();
        if (query.length < 2) {
            closeResults();
            return;
        }
        const hits = index.filter(function (item) {
            return (item.title + " " + item.description + " " + item.keywords + " " + item.hub).toLowerCase().indexOf(query) !== -1;
        }).slice(0, 8);
        renderHits(hits);
    });
    input.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeResults();
            input.blur();
        }
    });
}

function renderWhatsNew(updates) {
    const mount = document.getElementById("whats-new");
    if (mount === null) {
        return;
    }
    const items = updates.slice(0, 8);
    mount.innerHTML = items.map(function (item) {
        const href = item.relatedPage ? resolveHref(item.relatedPage) : "";
        const link = href ? '<a href="' + href + '">' + item.title + "</a>" : item.title;
        return "<li><time datetime=\"" + item.date + "\">" + item.date + "</time> " + link + " — " + item.description + "</li>";
    }).join("");
}

function bootSiteExtras() {
    enhanceAskAiWidgets();
    fetch(assetPrefix() + "data/knowledge-units.json", { cache: "no-store" }).then(function (response) {
        if (!response.ok) {
            return {};
        }
        return response.json();
    }).then(function (unitsByName) {
        enhanceKnowledgeUnits(unitsByName);
        enhanceAskAiWidgets();
    }).catch(function () {
        return;
    });
    if (document.getElementById("whats-new")) {
        fetch(assetPrefix() + "data/updates.json", { cache: "no-store" }).then(function (response) {
            if (!response.ok) {
                return [];
            }
            return response.json();
        }).then(renderWhatsNew).catch(function () {
            return;
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    renderHubDirectory();
    bootSiteExtras();
});
