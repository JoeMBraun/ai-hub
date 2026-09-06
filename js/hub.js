const HUB_DIRECTORY = [
    {
        id: "interfaces",
        label: "Start Here",
        links: [
            { href: "index.html", text: "🤖 AI Chatbot Hub →" },
            { href: "prompt-hub.html", text: "✍️ AI Prompt Hub →" },
            { href: "course-hub.html", text: "🎓 AI Courses Hub →" }
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

function getCurrentHubPage() {
    const pathSegment = window.location.pathname.split("/").pop();
    const isEmptyPath = pathSegment === null || pathSegment === undefined || pathSegment === "";
    if (isEmptyPath) {
        return "index.html";
    }
    const isHtmlPage = pathSegment.endsWith(".html");
    if (isHtmlPage) {
        return pathSegment;
    }
    return "index.html";
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
        return window.localStorage.getItem(NAV_COLLAPSE_STORAGE_KEY) === "1";
    } catch (storageError) {
        return false;
    }
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
            return '<a href="' + link.href + '"' + classAttr + ariaAttr + ">" + link.text + "</a>";
        }).join("\n        ");
        return '<div class="nav-group">\n        <div class="nav-label">' + group.label + "</div>\n        " + linksMarkup + "\n    </div>";
    }).join("\n\n    ");

    const shell = ensureNavShell(nav);
    applyNavCollapsed(shell, readNavCollapsed());
}

document.addEventListener("DOMContentLoaded", renderHubDirectory);

class RoutingException extends Error {
    constructor(message, errorId) {
        super(message);
        this.name = "RoutingException";
        this.errorId = errorId;
    }
}

function generatePromptAndRouteToLanguageModel(event, conceptText, languageModelProvider) {
    const isEventValid = event !== null && event !== undefined;
    if (isEventValid) { event.stopPropagation(); }

    console.info("[HUBUI100I] Starting prompt generation and routing...");
    try {
        const aiPrefixedConcept = "AI " + conceptText;
        const generatedPromptText = "I would like a detailed explanation of how to implement " + aiPrefixedConcept + ".";
        const urlEncodedPrompt = encodeURIComponent(generatedPromptText);

        const languageModelUrls = {
            "ChatGPT": "https://chatgpt.com/?q=",
            "Perplexity": "https://www.perplexity.ai/?q=",
            "Claude": "https://claude.ai/new?q="
        };

        const isProviderValid = languageModelProvider in languageModelUrls;

        if (isProviderValid) {
            const targetRoutingUrl = languageModelUrls[languageModelProvider] + urlEncodedPrompt;
            window.open(targetRoutingUrl, '_blank');
            console.info("[HUBUI101I] Routing to " + languageModelProvider + " completed successfully.");
        } else {
            throw new RoutingException("Provider mapping not found.", "[HUBUI102E]");
        }
    } catch (executionError) {
        const isCustomException = executionError instanceof RoutingException;
        if (isCustomException) {
            console.error(`${executionError.errorId} Prompt generation and routing completed unsuccessfully. Details: ${executionError.message}`);
        } else {
            console.error(`[HUBUI103E] Prompt generation and routing completed unsuccessfully. Details: ${executionError.message}`);
        }
    }
}
