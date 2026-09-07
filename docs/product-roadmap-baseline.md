# AI Hub — Product roadmap baseline (R0)

Recorded **2026-09-07**. No architecture or visitor-feature changes in this release.

| Field | Value |
|---|---|
| Live site | https://joembraun.github.io/ai-hub/ |
| `main` SHA | `b2d04ae68e0de150b5880f03171ab9981724a8cd` (merge of PR #14) |
| Work branch | `cursor/product-r0-baseline-16ec` (cloud-agent naming; roadmap suggested `product/r0-baseline`) |
| Architecture | Static HTML / CSS / vanilla JS. No `package.json`, framework, backend, or build step. |
| Deploy | `.github/workflows/deploy-pages.yml` — `verify` on push/PR, deploy to GitHub Pages on `main` push or `workflow_dispatch` |

## Usability suite

```
python3 scripts/usability_suite.py
passed=133 failed=0 warned=0 total=133
```

Stored report `data/usability-suite-run.json` (unchanged by R0): **133/133**, `startedAt` `2026-09-06T23:26:15Z`.

**Existing vs new failures:** the automated suite has **no failures**. Product gaps below are pre-existing; they are not suite regressions.

The suite is structural (lang, viewport, title, one `h1`, shared CSS/JS, alt text, HTTPS, directory membership). It does **not** measure “is this a useful home page?” A green suite can still be a weak product (roadmap R10).

Owner-locked check: `DIR-ADMIN-PUBLIC` requires Admin / Site Evaluation to remain in `HUB_DIRECTORY` so the link renders on every page.

## Internal links

Parsed every `a[href]` in the 14 root HTML pages that is not `http(s):`, `mailto:`, `tel:`, or `#`.

- **199** internal links
- **0** broken local targets
- **0** missing local images (favicon Ask-AI icons are remote Google favicon URLs)
- Unique internal destinations: the 14 existing hub HTML files only

External vendor links were not HTTP-probed (roadmap R9: do not fail deploy on vendor blocks).

## Shared navigation

Canonical source: `HUB_DIRECTORY` in `js/hub.js`. `renderHubDirectory()` replaces `.nav` inner HTML on `DOMContentLoaded`. Collapsible shell uses `localStorage` key `aiHub.navCollapsed`; clicking a directory link collapses the menu.

Rendered groups:

| Group | Pages |
|---|---|
| Start Here | Chatbot (`index.html`), Prompt, Courses |
| AI Development | Harness, Architecture, Agents, Local Models |
| AI Data & Evaluation | Data, Benchmark, Evaluation |
| AI Safety & Ops | Security, Governance, Deployment |
| Admin | Site Evaluation (`admin-hub.html`) |

**Duplicated navigation:** all **14** HTML files still contain a full static `<div class="nav">` block with a stale taxonomy (**AI Interfaces**, Courses under **AI Safety & Ops**, **Site Admin**). JS overwrites this when scripts run. No-JS fallback and View Source still show the old menu. Two taxonomies exist.

## Shared scripts and styles

Every hub page loads:

- `css/hub.css` (one stylesheet, ~8 KB)
- `js/hub.js` (directory + Ask-an-AI router)

`admin-hub.html` also loads `js/usability-suite.js` and reads `data/ux-measurements.json` plus `data/usability-suite-run.json`.

`css/hub.css` has **no** `@media` breakpoints and **no** `prefers-reduced-motion`. `:focus-visible` exists only on `.nav-toggle`. `.card { cursor: pointer }` plus hover lift apply to inert concept cards and to real links.

## Deployment assumptions

- GitHub Pages URL path prefix: `/ai-hub/`.
- Workflow copies `*.html`, `css/`, `js/`, `data/`, `.nojekyll` into `_site`. Subfolders such as a future `guides/` are **not** copied today (`cp *.html` only). R2 must change the Stage site files step if guides live in a directory.
- New pages must be added in three places or CI/smoke misses them: workflow `required` array, workflow smoke `pages` array, and `scripts/usability_suite.py` (page list is derived from `HUB_DIRECTORY`, with `admin-hub.html` always inspected).
- README notes Pages may still publish from the `main` branch until Settings → Pages → Source is GitHub Actions.

## Viewport checks (375 / 768 / 1440)

Checked `index.html`, `prompt-hub.html`, `agents-hub.html`, and `admin-hub.html` at **375×812**, **768×1024**, and **1440×900**.

| Width | Finding |
|---|---|
| 375 | Directory expands into a tall stack of full-width pills. On first load (nav not collapsed) it fills the first screen; the page `h1` sits below the Admin group. Nav is usable after scrolling. Cards are 220px wide, so they fit; no evidence of horizontal page overflow on these four pages. Tap targets for Ask-AI icons are ~16px images in 6px padding (below ~44×44). |
| 768 | Nav groups wrap in rows. Content (roster / cards / Site Evaluation scores) is visible under the directory. Usable. |
| 1440 | Same grouped nav; content uses leftover width. Cards stay 220px and wrap. Fine for a directory; not a designed desktop home layout. |

Headless first-load always shows the expanded directory. After a real click, JS collapses it, which is why later pages often open with only the Directory toggle until expanded.

## Product state vs roadmap

| Roadmap need | Current tree |
|---|---|
| True home page | **Missing.** `index.html` title/h1 are **AI Chatbot Hub**; root URL is a vendor model roster. |
| `chatbot-hub.html` | **Missing.** |
| Goal-based home / guides | **Missing.** No `guides/` directory. |
| Knowledge-unit template (~20 concepts) | **Missing.** Concept cards are one-line `card-desc` plus icon buttons. **0** `<details>` / `<pre>` / `<code>`. |
| Ask-an-AI 2.0 | **Missing.** One prompt: prefix `AI ` + “how to implement …”. **282** icon buttons; **0** visible “Ask AI” / Explain / Implement / Compare / Troubleshoot labels. |
| Decision support tables | **Missing** on Chatbot, Harness, Local Models, Architecture. |
| Search index | **Missing.** No `data/search-index.json`. |
| Review / verification metadata | **Missing.** No “Last reviewed” on pages. |
| What’s New | **Missing.** No `data/updates.json`. |
| SEO extras | **Missing** on all pages: meta description, canonical, Open Graph. No `sitemap.xml` or `robots.txt`. |
| Courses wording | **Existing issue:** `course-hub.html` still says “Never pay for AI courses.” |
| Site Admin | **Present on every page** (owner decision). Roadmap §5.8 / R1 step 5 asked to de-emphasize it. **Do not hide it** unless the owner reverses that. `DIR-ADMIN-PUBLIC` will fail if it is removed from `HUB_DIRECTORY`. |

Inventory (this tree): 14 HTML hubs; 266 cards (169 links, 97 concept `div.card`s); 234 unique card-name strings.

Stored UX scores (`data/ux-measurements.json`, 2026-09-06): overall **3.5/5**; freshness 2.9; return-visit pull 2.4.

## Tests that will break when the home page becomes real

These are **existing couplings**, not current failures:

- `HUB_DIRECTORY` Start Here first item is `{ href: "index.html", text: "🤖 AI Chatbot Hub →" }`.
- All 14 stale HTML navs link Chatbot to `index.html`.
- `getCurrentHubPage()` maps an empty path to `index.html` (correct once `index.html` is home; Chatbot must then live at `chatbot-hub.html`).
- Workflow required/smoke lists include `index.html` as a file, not as “Chatbot Hub”. Adding `chatbot-hub.html` still requires listing it in those arrays.
- Suite `TITLE-index.html` only checks that a title exists; it does not require the string “AI Chatbot Hub”. Renaming the title is safe for that check.
- Ask-an-AI coverage is absent on Chatbot / Harness / Local Models / Benchmark / Courses / Admin (link-only or no cards).

## Fragile areas

- Two nav taxonomies (JS vs copied HTML).
- New pages in a subdirectory will not deploy until the workflow `cp` step is updated.
- Hard-coded September 2026 model names on `index.html`.
- Inert cards look clickable.
- Dense directory competes with first-time orientation (especially at 375px with nav expanded).
- Prior `docs/revamp/` and `docs/revamp-v2/` plans remain in the repo. This product roadmap is the approved direction for the next phase; do not implement the old “hide Admin from public nav” item.

## Known existing issues (not introduced by R0)

1. Root URL is a chatbot directory, not a product home.
2. Ask-an-AI treats every concept as something to “implement”.
3. No search, guides, What’s New, or review dates.
4. Courses copy is absolute (“Never pay”).
5. No responsive CSS breakpoints.
6. Duplicate stale nav in every HTML file.
7. Site Evaluation is in the primary directory (intentional per owner).
8. Automated tests do not encode visitor outcomes.

## R0 acceptance

- [x] Baseline documented
- [x] Existing failures distinguished from new failures (none new; suite green)
- [x] No architecture changes
- [x] No unrelated cleanup
