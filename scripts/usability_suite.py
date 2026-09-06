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
        if tag == "link" and attributes.get("rel") == "stylesheet" and attributes.get("href") == "css/hub.css":
            self.has_css = True
        if tag == "script" and attributes.get("src") == "js/hub.js":
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
        "Links css/hub.css." if parser.has_css else "Missing css/hub.css.",
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
    checks.append(make_check(
        "DIR-ADMIN",
        "Site Admin is hidden from public nav",
        "pass" if not admin_in_directory else "fail",
        "admin-hub.html is not in HUB_DIRECTORY." if not admin_in_directory else "admin-hub.html is still listed in public navigation.",
    ))

    course_in_start = bool(re.search(r'label:\s*"Start Here"[\s\S]*?course-hub\.html', hub_js))
    course_in_safety = bool(re.search(r'id:\s*"safety"[\s\S]*?course-hub\.html', hub_js))
    checks.append(make_check(
        "DIR-COURSE",
        "Courses hub is in Start Here",
        "pass" if course_in_start and not course_in_safety else "fail",
        "course-hub.html is listed under Start Here." if course_in_start and not course_in_safety else "course-hub.html is not in the Start Here group.",
    ))

    admin_group_exists = 'label: "Site Admin"' in hub_js
    checks.append(make_check(
        "DIR-ADMIN-GROUP",
        "Site Admin navigation group is absent",
        "pass" if not admin_group_exists else "fail",
        "No Site Admin group in HUB_DIRECTORY." if not admin_group_exists else "Site Admin group is still present.",
    ))

    start_here_exists = 'label: "Start Here"' in hub_js
    checks.append(make_check(
        "DIR-START",
        "Start Here navigation group exists",
        "pass" if start_here_exists else "fail",
        'Found the "Start Here" group.' if start_here_exists else "Start Here group is missing.",
    ))

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
