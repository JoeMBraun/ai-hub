#!/usr/bin/env python3
"""Usability evaluation suite for the AI Hub static site."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB_JS = ROOT / "js" / "hub.js"
OUTPUT = ROOT / "data" / "usability-suite-run.json"


class HubPageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.lang = ""
        self.has_viewport = False
        self.title_parts: list[str] = []
        self.in_title = False
        self.h1_count = 0
        self.has_css = False
        self.has_hub_js = False
        self.images_missing_alt = 0
        self.image_count = 0
        self.http_links = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key: (value or "") for key, value in attrs}
        if tag == "html":
            self.lang = attributes.get("lang", "")
        if tag == "meta" and attributes.get("name") == "viewport":
            self.has_viewport = True
        if tag == "title":
            self.in_title = True
        if tag == "h1":
            self.h1_count += 1
        if tag == "link" and attributes.get("rel") == "stylesheet" and attributes.get("href", "").endswith("css/hub.css"):
            self.has_css = True
        if tag == "script" and attributes.get("src", "").endswith("js/hub.js"):
            self.has_hub_js = True
        if tag == "img":
            self.image_count += 1
            alt_is_present = "alt" in attributes
            if not alt_is_present:
                self.images_missing_alt += 1
        if tag == "a" and attributes.get("href", "").startswith("http://"):
            self.http_links += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)

    @property
    def title(self) -> str:
        return "".join(self.title_parts).strip()


def load_directory_pages(hub_js: str) -> list[str]:
    pages: list[str] = []
    for href in re.findall(r'href:\s*"([^"]+\.html)"', hub_js):
        already_listed = href in pages
        if not already_listed:
            pages.append(href)
    return pages


def make_check(check_id: str, name: str, status: str, detail: str, page: str = "directory") -> dict:
    return {
        "id": check_id,
        "name": name,
        "status": status,
        "detail": detail,
        "page": page,
    }


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def outcome_checks(hub_js: str, index_html: str) -> list[dict]:
    checks: list[dict] = []
    choose_guide = (ROOT / "guides" / "choose-an-ai.html").read_text(encoding="utf-8")
    coding_guide = (ROOT / "guides" / "choose-an-ai-coding-tool.html").read_text(encoding="utf-8")
    rag_guide = (ROOT / "guides" / "build-your-first-rag-app.html").read_text(encoding="utf-8")
    agent_guide = (ROOT / "guides" / "build-your-first-ai-agent.html").read_text(encoding="utf-8")
    local_guide = (ROOT / "guides" / "run-ai-locally.html").read_text(encoding="utf-8")
    eval_guide = (ROOT / "guides" / "evaluate-an-ai-application.html").read_text(encoding="utf-8")
    chatbot_html = (ROOT / "chatbot-hub.html").read_text(encoding="utf-8")
    harness_html = (ROOT / "harness-hub.html").read_text(encoding="utf-8")
    local_html = (ROOT / "local-models-hub.html").read_text(encoding="utf-8")
    architecture_html = (ROOT / "architecture-hub.html").read_text(encoding="utf-8")
    security_html = (ROOT / "security-hub.html").read_text(encoding="utf-8")

    start_ok = (
        'id="start-here"' in index_html
        and "guides/choose-an-ai.html" in index_html
        and "course-hub.html" in index_html
        and 'id="whats-new"' in index_html
    )
    checks.append(make_check(
        "OUT-START-LEARNING",
        "A visitor can start learning from Home",
        "pass" if start_ok else "fail",
        "Home links Start Here, courses, guides, and What’s New." if start_ok else "Home is missing the learning path.",
        "index.html",
    ))

    choose_ok = (
        "This is not a ranking" in chatbot_html
        and "If you need" in chatbot_html
        and "Decision tree" in choose_guide
        and "chatbot-hub.html" in choose_guide
    )
    checks.append(make_check(
        "OUT-CHOOSE-CHATBOT",
        "A visitor can choose a chatbot without a fake ranking",
        "pass" if choose_ok else "fail",
        "Chatbot Hub and the choose-an-AI guide use job-based tables." if choose_ok else "Chatbot decision path is missing.",
        "chatbot-hub.html",
    ))

    coding_ok = (
        "How to choose" in harness_html
        and "Claude Code" in harness_html
        and "Decision tree" in coding_guide
        and "harness-hub.html" in coding_guide
    )
    checks.append(make_check(
        "OUT-CODING-TOOL",
        "A visitor can choose a coding tool from a workflow",
        "pass" if coding_ok else "fail",
        "Harness Hub and the coding-tool guide match tools to workflows." if coding_ok else "Coding-tool decision path is missing.",
        "harness-hub.html",
    ))

    knowledge = read_json(ROOT / "data" / "knowledge-units.json")
    rag_unit = knowledge.get("RAG Architecture", {})
    rag_ok = (
        "When not to use RAG" in rag_guide
        and isinstance(rag_unit.get("whenNot"), list)
        and len(rag_unit.get("whenNot", [])) >= 2
        and "what" in rag_unit
    )
    checks.append(make_check(
        "OUT-RAG",
        "RAG meaning and when-not are documented",
        "pass" if rag_ok else "fail",
        "RAG guide and knowledge unit include when not to use it." if rag_ok else "RAG when-not guidance is missing.",
        "guides/build-your-first-rag-app.html",
    ))

    local_ok = (
        "Exact requirements vary" in local_html
        and "Exact requirements vary" in local_guide
        and "Ollama" in local_html
    )
    checks.append(make_check(
        "OUT-LOCAL",
        "Local-model path explains hardware variance",
        "pass" if local_ok else "fail",
        "Local hub and guide warn that RAM/VRAM needs vary." if local_ok else "Local-model hardware caveats are missing.",
        "local-models-hub.html",
    ))

    security_ok = (
        "Prompt Injection" in security_html
        and "Prompt Injection" in knowledge
        and "untrusted" in knowledge["Prompt Injection"]["what"].lower()
    )
    checks.append(make_check(
        "OUT-SECURITY",
        "Prompt injection is explained as untrusted text",
        "pass" if security_ok else "fail",
        "Security Hub and the knowledge unit cover prompt injection." if security_ok else "Prompt injection knowledge is missing.",
        "security-hub.html",
    ))

    agent_ok = (
        "ReAct" in agent_guide
        and "Reflexion" in agent_guide
        and "Human-in-the-loop" in agent_guide
        and "Which pattern first?" in architecture_html
    )
    checks.append(make_check(
        "OUT-AGENT-PATTERNS",
        "Agent patterns can be compared without scores",
        "pass" if agent_ok else "fail",
        "Agent guide and Architecture hub compare patterns." if agent_ok else "Agent pattern comparison is missing.",
        "guides/build-your-first-ai-agent.html",
    ))

    explain_uses_concept = 'return "Explain " + conceptName' in hub_js
    no_ai_prefix = 'return "AI " +' not in hub_js
    intents_ok = 'ASK_AI_INTENTS = ["explain", "implement", "compare", "troubleshoot"]' in hub_js
    default_explain = 'let selectedIntent = "explain"' in hub_js
    providers_ok = all(name in hub_js for name in ("ChatGPT", "Claude", "Perplexity"))
    skip_anchor_cards = 'if (card.tagName === "A")' in hub_js
    ask_ok = explain_uses_concept and no_ai_prefix and intents_ok and default_explain and providers_ok and skip_anchor_cards
    checks.append(make_check(
        "OUT-ASK-AI",
        "Ask AI 2.0 uses intents and does not prefix AI",
        "pass" if ask_ok else "fail",
        "Default Explain uses the concept name; ChatGPT, Claude, and Perplexity are wired." if ask_ok else "Ask AI 2.0 contract is not met.",
        "js/hub.js",
    ))

    golden_ok = 'Explain " + conceptName + " in the context of "' in hub_js and "AI Golden Sets" not in hub_js
    checks.append(make_check(
        "OUT-ASK-AI-GOLDEN",
        "Explain Golden Sets does not become AI Golden Sets",
        "pass" if golden_ok else "fail",
        "Prompt builder concatenates Explain + concept name with no AI prefix." if golden_ok else "Golden Sets prompt construction is unsafe.",
        "prompt-hub.html",
    ))

    review_ok = (
        "Needs review" in chatbot_html
        and "Needs review" in choose_guide
        and "Last reviewed: 2026-09-07" in choose_guide
        and "independently verified" in chatbot_html
    )
    checks.append(make_check(
        "OUT-REVIEW-STATUS",
        "Pages show review status without invented verification",
        "pass" if review_ok else "fail",
        "Editorial pages have Last reviewed; volatile hubs say Needs review." if review_ok else "Freshness labels are missing.",
        "directory",
    ))

    updates = read_json(ROOT / "data" / "updates.json")
    whats_new_ok = (
        'id="whats-new"' in index_html
        and isinstance(updates, list)
        and 5 <= len(updates) <= 10
        and all("title" in item and "date" in item and "description" in item for item in updates)
        and "renderWhatsNew" in hub_js
    )
    checks.append(make_check(
        "OUT-WHATS-NEW",
        "Home What’s New lists real site changes",
        "pass" if whats_new_ok else "fail",
        f"updates.json has {len(updates)} site-change items." if whats_new_ok else "What’s New data or mount is missing.",
        "index.html",
    ))

    units_ok = len(knowledge) >= 20
    required_keys = [
        "RAG Architecture", "Agent Architecture", "Hybrid Routing", "Model Cascading",
        "ReAct", "ReAct Pattern", "Reflexion", "Human-in-the-Loop", "Guardrails",
        "Vector Memory", "Memory Architectures", "Prompt Injection", "Context Isolation",
        "Golden Sets", "LLM-as-a-Judge", "Edge Deployment", "Model Cards", "System Cards",
        "Semantic Chunking", "Embeddings",
    ]
    missing_keys = [key for key in required_keys if key not in knowledge]
    checks.append(make_check(
        "KNOW-UNITS",
        "At least 20 knowledge units keyed by card name",
        "pass" if units_ok and not missing_keys else "fail",
        f"{len(knowledge)} units on disk." if units_ok and not missing_keys else "Missing keys: " + ", ".join(missing_keys),
        "data/knowledge-units.json",
    ))

    search_index_path = ROOT / "data" / "search-index.json"
    search_ok = search_index_path.is_file()
    search_entries = read_json(search_index_path) if search_ok else []
    search_has_guide = any(item.get("href") == "guides/choose-an-ai.html" for item in search_entries)
    search_has_concept = any(item.get("title") == "RAG Architecture" for item in search_entries)
    search_ui = "site-search-input" in hub_js and "No matching hubs, concepts, or guides." in hub_js
    checks.append(make_check(
        "SEARCH-INDEX",
        "Search index covers hubs, concepts, and guides",
        "pass" if search_ok and search_has_guide and search_has_concept and search_ui else "fail",
        f"Index has {len(search_entries)} entries." if search_ok and search_has_guide and search_has_concept and search_ui else "Search index or UI is incomplete.",
        "data/search-index.json",
    ))

    seo_ok = (
        (ROOT / "sitemap.xml").is_file()
        and (ROOT / "robots.txt").is_file()
        and "joembraun.github.io/ai-hub" in (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        and 'name="description"' in index_html
        and "prefers-reduced-motion" in (ROOT / "css" / "hub.css").read_text(encoding="utf-8")
    )
    checks.append(make_check(
        "SEO-HARDENING",
        "Canonical metadata, sitemap, robots, reduced motion",
        "pass" if seo_ok else "fail",
        "SEO files and reduced-motion CSS are present." if seo_ok else "SEO or a11y hardening is incomplete.",
        "index.html",
    ))

    eval_ok = "Golden Sets" in eval_guide and "LLM-as-a-Judge" in eval_guide
    checks.append(make_check(
        "OUT-EVALUATE",
        "Evaluation guide uses golden sets before vibe checks",
        "pass" if eval_ok else "fail",
        "Evaluate guide covers golden sets and judges." if eval_ok else "Evaluate guide is incomplete.",
        "guides/evaluate-an-ai-application.html",
    ))

    issue_template = ROOT / ".github" / "ISSUE_TEMPLATE" / "stale-info.yml"
    checks.append(make_check(
        "FRESH-ISSUE",
        "Stale-info issue template exists",
        "pass" if issue_template.is_file() else "fail",
        "Issue template for stale pages is present." if issue_template.is_file() else "Missing .github/ISSUE_TEMPLATE/stale-info.yml.",
        "directory",
    ))

    return checks


def inspect_page(page: str) -> list[dict]:
    path = ROOT / page
    checks: list[dict] = []
    page_exists = path.is_file()
    if not page_exists:
        checks.append(make_check(f"LOAD-{page}", "Page loads", "fail", "File is missing from the site.", page))
        return checks

    html = path.read_text(encoding="utf-8")
    parser = HubPageParser()
    parser.feed(html)

    checks.append(make_check(f"LOAD-{page}", "Page loads", "pass", "HTML file is present in the site.", page))

    lang_is_present = parser.lang.strip() != ""
    checks.append(make_check(
        f"LANG-{page}",
        "Language declared",
        "pass" if lang_is_present else "fail",
        f'html lang="{parser.lang}"' if lang_is_present else "Missing html lang attribute.",
        page,
    ))

    checks.append(make_check(
        f"VIEW-{page}",
        "Responsive viewport",
        "pass" if parser.has_viewport else "fail",
        "Viewport meta tag is present." if parser.has_viewport else "Missing viewport meta tag.",
        page,
    ))

    title_is_present = parser.title != ""
    checks.append(make_check(
        f"TITLE-{page}",
        "Document title",
        "pass" if title_is_present else "fail",
        parser.title if title_is_present else "Missing document title.",
        page,
    ))

    heading_status = "pass" if parser.h1_count == 1 else "fail"
    checks.append(make_check(
        f"H1-{page}",
        "Single page heading",
        heading_status,
        f"Found {parser.h1_count} h1 element(s).",
        page,
    ))

    checks.append(make_check(
        f"CSS-{page}",
        "Shared stylesheet",
        "pass" if parser.has_css else "fail",
        "Links css/hub.css (root or ../ for guides)." if parser.has_css else "Missing css/hub.css.",
        page,
    ))

    checks.append(make_check(
        f"JS-{page}",
        "Shared directory script",
        "pass" if parser.has_hub_js else "fail",
        "Loads js/hub.js so Site Admin and Evaluation stay in nav." if parser.has_hub_js else "Missing js/hub.js; directory nav will not render.",
        page,
    ))

    image_status = "pass" if parser.images_missing_alt == 0 else "fail"
    checks.append(make_check(
        f"ALT-{page}",
        "Images have alt text",
        image_status,
        f"{parser.image_count} image(s) include alt text." if parser.images_missing_alt == 0 else f"{parser.images_missing_alt} image(s) missing alt.",
        page,
    ))

    http_status = "pass" if parser.http_links == 0 else "warn"
    checks.append(make_check(
        f"HTTPS-{page}",
        "Prefers HTTPS links",
        http_status,
        "No insecure http:// links." if parser.http_links == 0 else f"{parser.http_links} http:// link(s) should be https://.",
        page,
    ))
    return checks


def run_suite() -> dict:
    started_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    hub_js = HUB_JS.read_text(encoding="utf-8")
    pages = load_directory_pages(hub_js)
    checks: list[dict] = []

    evaluation_listed = "evaluation-hub.html" in pages
    checks.append(make_check(
        "DIR-EVAL",
        "Evaluation page is in the directory",
        "pass" if evaluation_listed else "fail",
        "evaluation-hub.html is listed under AI Data & Evaluation." if evaluation_listed else "evaluation-hub.html is missing from HUB_DIRECTORY.",
    ))

    data_group_has_eval = bool(re.search(r'id:\s*"data"[\s\S]*?evaluation-hub\.html', hub_js))
    checks.append(make_check(
        "DIR-EVAL-GROUP",
        "Evaluation sits in Data & Evaluation",
        "pass" if data_group_has_eval else "fail",
        "AI Evaluation Hub is a navigation option in AI Data & Evaluation." if data_group_has_eval else "AI Evaluation Hub is not in the AI Data & Evaluation group.",
    ))

    admin_in_directory = "admin-hub.html" in pages
    admin_is_option = bool(re.search(r'id:\s*"admin"[\s\S]*?admin-hub\.html', hub_js))
    checks.append(make_check(
        "DIR-ADMIN",
        "Site Evaluation is an Admin directory option on every page",
        "pass" if admin_in_directory and admin_is_option else "fail",
        "admin-hub.html is listed under Admin in the shared directory." if admin_in_directory and admin_is_option else "admin-hub.html is missing from the Admin group.",
    ))

    course_in_start = bool(re.search(r'label:\s*"Start Here"[\s\S]*?course-hub\.html', hub_js))
    course_in_safety = bool(re.search(r'id:\s*"safety"[\s\S]*?course-hub\.html', hub_js))
    checks.append(make_check(
        "DIR-COURSE",
        "Courses hub is in Start Here",
        "pass" if course_in_start and not course_in_safety else "fail",
        "course-hub.html is listed under Start Here." if course_in_start and not course_in_safety else "course-hub.html is not in the Start Here group.",
    ))

    admin_group_exists = bool(re.search(r'id:\s*"admin"', hub_js)) and 'label: "Admin"' in hub_js
    checks.append(make_check(
        "DIR-ADMIN-GROUP",
        "Admin navigation group exists",
        "pass" if admin_group_exists else "fail",
        'Found the "Admin" group.' if admin_group_exists else "Admin group is missing.",
    ))

    checks.append(make_check(
        "DIR-ADMIN-PUBLIC",
        "Site Evaluation stays in the public directory",
        "pass" if admin_in_directory and admin_is_option and admin_group_exists else "fail",
        "Owner decision: Admin / Site Evaluation remains in HUB_DIRECTORY so the link renders on every page."
        if admin_in_directory and admin_is_option and admin_group_exists
        else "Site Evaluation was removed from the public directory; restore the Admin group in js/hub.js.",
    ))

    start_here_exists = 'label: "Start Here"' in hub_js
    checks.append(make_check(
        "DIR-START",
        "Start Here navigation group exists",
        "pass" if start_here_exists else "fail",
        'Found the "Start Here" group.' if start_here_exists else "Start Here group is missing.",
    ))

    home_in_start = bool(re.search(r'label:\s*"Start Here"[\s\S]*?href:\s*"index\.html"', hub_js))
    chatbot_still_on_index = bool(re.search(r'href:\s*"index\.html",\s*text:\s*"[^"]*Chatbot', hub_js))
    checks.append(make_check(
        "DIR-HOME",
        "Start Here includes the AI Hub home page",
        "pass" if home_in_start and not chatbot_still_on_index else "fail",
        "index.html is the home page in Start Here." if home_in_start and not chatbot_still_on_index else "index.html is missing from Start Here or still labeled as Chatbot Hub.",
    ))

    chatbot_in_start = bool(re.search(r'label:\s*"Start Here"[\s\S]*?chatbot-hub\.html', hub_js))
    checks.append(make_check(
        "DIR-CHATBOT",
        "Chatbot Hub has its own directory page",
        "pass" if chatbot_in_start else "fail",
        "chatbot-hub.html is listed under Start Here." if chatbot_in_start else "chatbot-hub.html is missing from Start Here.",
    ))

    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    home_explains_product = (
        "A practical map of modern AI" in index_html
        and "What do you want to do?" in index_html
        and "chatbot-hub.html" in index_html
        and "<title>AI Chatbot Hub</title>" not in index_html
    )
    checks.append(make_check(
        "HOME-FRONT-DOOR",
        "Root page explains AI Hub and routes by goal",
        "pass" if home_explains_product else "fail",
        "index.html is the product home page with goal routes." if home_explains_product else "index.html is not a goal-based home page.",
    ))

    course_html = (ROOT / "course-hub.html").read_text(encoding="utf-8")
    courses_wording_ok = (
        "Never pay for AI courses" not in course_html
        and "Start with free first-party AI training" in course_html
    )
    checks.append(make_check(
        "COURSE-WORDING",
        "Courses copy is not absolute",
        "pass" if courses_wording_ok else "fail",
        "Courses recommends free first-party training without a never-pay absolute." if courses_wording_ok else "course-hub.html still uses absolute never-pay wording.",
    ))

    stale_nav_pages = []
    html_paths = list(ROOT.glob("*.html")) + list((ROOT / "guides").glob("*.html"))
    for html_path in sorted(html_paths):
        html_text = html_path.read_text(encoding="utf-8")
        if "AI Interfaces" in html_text or "nav-admin" in html_text:
            stale_nav_pages.append(str(html_path.relative_to(ROOT)))
    checks.append(make_check(
        "NAV-SHARED",
        "Public pages do not ship a second stale nav taxonomy",
        "pass" if not stale_nav_pages else "fail",
        "Shared .nav target only; HUB_DIRECTORY is the source of truth." if not stale_nav_pages else "Stale nav remains in: " + ", ".join(stale_nav_pages),
    ))

    guides_group = 'id: "guides"' in hub_js and 'label: "Guides"' in hub_js
    expected_guides = [
        "guides/choose-an-ai.html",
        "guides/choose-an-ai-coding-tool.html",
        "guides/build-your-first-rag-app.html",
        "guides/build-your-first-ai-agent.html",
        "guides/run-ai-locally.html",
        "guides/evaluate-an-ai-application.html",
    ]
    guides_listed = all(page in pages for page in expected_guides)
    guides_exist = all((ROOT / page).is_file() for page in expected_guides)
    checks.append(make_check(
        "DIR-GUIDES",
        "Guides group lists the six how-to pages",
        "pass" if guides_group and guides_listed and guides_exist else "fail",
        "Six guides are in HUB_DIRECTORY and on disk." if guides_group and guides_listed and guides_exist else "Guides group or files are missing.",
    ))

    checks.extend(outcome_checks(hub_js, index_html))

    pages_to_inspect = list(pages)
    if "admin-hub.html" not in pages_to_inspect:
        pages_to_inspect.append("admin-hub.html")

    for page in pages_to_inspect:
        checks.extend(inspect_page(page))

    passed = sum(1 for check in checks if check["status"] == "pass")
    failed = sum(1 for check in checks if check["status"] == "fail")
    warned = sum(1 for check in checks if check["status"] == "warn")
    finished_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return {
        "suite": "AI Hub website usability",
        "source": "scripts/usability_suite.py",
        "startedAt": started_at,
        "finishedAt": finished_at,
        "summary": {
            "total": len(checks),
            "passed": passed,
            "failed": failed,
            "warned": warned,
        },
        "pages": pages,
        "checks": checks,
    }


def main() -> int:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    report = run_suite()
    OUTPUT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    summary = report["summary"]
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")
    print(f"passed={summary['passed']} failed={summary['failed']} warned={summary['warned']} total={summary['total']}")
    return 1 if summary["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
