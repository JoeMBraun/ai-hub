#!/usr/bin/env python3
"""Build a static search index from hubs, concept cards, and guides."""

from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "search-index.json"


class PageText(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._skip = False
        self._title: list[str] = []
        self._h1: list[str] = []
        self._capture_title = False
        self._capture_h1 = False
        self.cards: list[tuple[str, str]] = []
        self._card_name: list[str] = []
        self._card_desc: list[str] = []
        self._in_card_name = False
        self._in_card_desc = False
        self._current_class = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key: (value or "") for key, value in attrs}
        classes = attributes.get("class", "")
        if tag in {"script", "style"}:
            self._skip = True
        if tag == "title":
            self._capture_title = True
        if tag == "h1":
            self._capture_h1 = True
        if tag in {"div", "a"} and "card-name" in classes.split():
            self._in_card_name = True
            self._card_name = []
        if tag == "div" and "card-desc" in classes.split():
            self._in_card_desc = True
            self._card_desc = []

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"}:
            self._skip = False
        if tag == "title":
            self._capture_title = False
        if tag == "h1":
            self._capture_h1 = False
        if tag in {"div", "a"} and self._in_card_name:
            self._in_card_name = False
        if tag == "div" and self._in_card_desc:
            self._in_card_desc = False
            name = " ".join("".join(self._card_name).split())
            desc = " ".join("".join(self._card_desc).split())
            if name:
                self.cards.append((name, desc))

    def handle_data(self, data: str) -> None:
        if self._skip:
            return
        if self._capture_title:
            self._title.append(data)
        if self._capture_h1:
            self._h1.append(data)
        if self._in_card_name:
            self._card_name.append(data)
        if self._in_card_desc:
            self._card_desc.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self._title).split())

    @property
    def h1(self) -> str:
        return " ".join("".join(self._h1).split())


def parse_page(path: Path) -> PageText:
    parser = PageText()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def hub_label(filename: str) -> str:
    return filename.replace(".html", "").replace("-", " ")


def main() -> int:
    entries: list[dict] = []
    seen: set[tuple[str, str]] = set()

    html_files: list[Path] = sorted(ROOT.glob("*.html"))
    html_files += sorted((ROOT / "guides").glob("*.html"))

    for path in html_files:
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        parsed = parse_page(path)
        title = parsed.h1 or parsed.title or rel
        is_guide = rel.startswith("guides/")
        page_type = "guide" if is_guide else "hub"
        description = parsed.title
        keywords = title
        key = (rel, title)
        if key not in seen:
            seen.add(key)
            entries.append({
                "title": title,
                "type": page_type,
                "hub": hub_label(path.name),
                "href": rel,
                "description": description,
                "keywords": keywords,
            })
        if is_guide:
            continue
        for name, desc in parsed.cards:
            card_key = (rel + "#" + name, name)
            if card_key in seen:
                continue
            seen.add(card_key)
            entries.append({
                "title": name,
                "type": "concept",
                "hub": title,
                "href": rel,
                "description": desc or name,
                "keywords": f"{name} {desc} {title}",
            })

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} entries={len(entries)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
