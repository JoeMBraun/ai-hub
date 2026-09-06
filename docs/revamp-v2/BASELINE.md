# Revamp V2 — P0 baseline

Recorded **2026-09-06** from current `main`.

| Field | Value |
|---|---|
| `main` SHA | `59d9153bace1bd4f54402272e517eab58173b1c4` |
| Commit | Merge pull request #13 from JoeMBraun/cursor/admin-nav-site-evaluation-1b44 |
| Commit date | 2026-09-06 17:19:16 -0500 |
| Work branch | `cursor/revamp-v2-16ec` (cloud-agent naming; the V2 plan asked for `revamp-v2`) |
| Live site | https://joembraun.github.io/ai-hub/ |
| Architecture | Static HTML / CSS / vanilla JS. No package manager, build tool, framework, or backend. |

P0 did not change production HTML, CSS, JS, workflow, or deployed data. The usability suite was run; `data/usability-suite-run.json` was restored afterward so only timestamps would have changed.

## Usability suite (P0 run)

Command:

```
python3 scripts/usability_suite.py
```

Result (this run):

```
passed=132 failed=0 warned=0 total=132
```

Stored report on `main` (unchanged by P0): `data/usability-suite-run.json`

- `startedAt` / `finishedAt`: `2026-09-06T22:17:57Z`
- Summary: **132 passed, 0 failed, 0 warned**
- Pages inspected from `HUB_DIRECTORY` plus `admin-hub.html`: 14 HTML hubs

This is one check higher than V1 T0 (`131/131` at `6b9681e`) because Site Evaluation (`admin-hub.html`) is now in the directory and the suite inspects it.

The suite currently **requires** a public Admin group (`DIR-ADMIN`, `DIR-ADMIN-GROUP`). P1 must update those checks when Admin is removed from `HUB_DIRECTORY`, or the stored suite will fail while the product change is correct.

## Stored UX score (do not re-score in P0)

Source: `data/ux-measurements.json` (`evaluatedAt`: 2026-09-06T17:30:00Z). Method must stay unchanged until P9.

| Dimension | Score |
|---|---|
| Overall | **3.5 / 5** (Adequate) |
| Usefulness | 3.7 |
| Usability | 3.8 |
| Value | 4.1 |
| Ease of use | 4.0 |
| Freshness | **2.9** |
| Return-visit pull | **2.4** |

V2 P9 targets: overall ≥ 4.3, freshness ≥ 4.0, return-visit value ≥ 3.5.

## Architecture inventory (verified 2026-09-06)

### Pages

14 root HTML pages, all with a full static `<div class="nav">` block that JS replaces at runtime:

`index.html`, `prompt-hub.html`, `course-hub.html`, `harness-hub.html`, `architecture-hub.html`, `agents-hub.html`, `local-models-hub.html`, `data-hub.html`, `benchmark-hub.html`, `evaluation-hub.html`, `security-hub.html`, `governance-hub.html`, `deployment-hub.html`, `admin-hub.html`.

Shared assets: `css/hub.css`, `js/hub.js`, `js/usability-suite.js`.

Deploy/CI: `.github/workflows/deploy-pages.yml` (`verify` then GitHub Pages). New pages must be added to the workflow `required` list, the smoke-test `pages` list, and `scripts/usability_suite.py` (the suite currently derives the page list from `HUB_DIRECTORY` in `js/hub.js`, and always inspects `admin-hub.html`).

### Navigation (P1 gap)

Canonical data: `HUB_DIRECTORY` in `js/hub.js`.

Rendered groups: **Start Here**, **AI Development**, **AI Data & Evaluation**, **AI Safety & Ops**, **Admin**.

- Start Here already includes Chatbot, Prompt, and Courses.
- Admin still exposes `admin-hub.html` (“Site Evaluation”) on every page.
- All **14** public HTML files still contain a stale static nav: label **AI Interfaces** (not Start Here), Courses still under **AI Safety & Ops**, and a **Site Admin** group. `renderHubDirectory()` overwrites this on load, so two taxonomies exist.
- **Owner decision (2026-09-06):** Site Admin quality metrics stay. Later nav cleanup may unlist Admin from the public visitor menu, but `admin-hub.html`, the scores, the suite, the README link, and https://joembraun.github.io/ai-hub/admin-hub.html are kept. If preferred, Admin can remain in the public menu.

### Cards and Ask AI (P2 / P4 / P5 gap)

| Count | Fact |
|---|---|
| 266 | `class="card"` across 12 content pages (admin and courses have none) |
| 169 | link cards (`<a class="card">`) |
| 97 | inert/concept cards (`<div class="card">`) |
| 266 / 234 | card names / unique name strings |
| 282 | `generatePromptAndRouteToLanguageModel(...)` call sites (same as 282 `.llm-icon-btn`) |
| 0 | visible “Ask AI” button text |
| 0 | `<pre>` or `<code>` elements |

Prompt Hub has Ask-an-AI on **25/25** cards. Other hubs are partial. The shared generator still prefixes `AI` and asks “how to implement …”. Example: Golden Sets on `prompt-hub.html` calls `generatePromptAndRouteToLanguageModel(event, 'Golden Sets for Prompt Validation', …)`, which becomes *“I would like a detailed explanation of how to implement AI Golden Sets for Prompt Validation.”*

No `aiHub.skillLevel` storage. No shared card-hydration helper.

`.card { cursor: pointer }` plus hover lift apply to **all** cards, including inert concept cards.

### Responsive shell (P2 gap)

`css/hub.css` has **no** `@media` breakpoints and **no** `prefers-reduced-motion`. `:focus-visible` exists only on `.nav-toggle`. Nav is a wrapping flex column of groups; there is a collapsible directory (`aiHub.navCollapsed`) but not a compact mobile nav or 44×44 tap-target policy.

### Homepage (P3 / P7 gap)

`index.html` is a hard-coded September 2026 vendor roster (23 link cards). No task-oriented “What are you here to do?” section. No DOM surface for What’s New / Recently Reviewed. No `data/models.json`.

### Missing V2 surfaces

| Planned | Present on `main`? |
|---|---|
| `glossary.html` / `js/glossary.js` / `data/catalog.json` / `scripts/build_catalog.py` | No |
| Literal Prompt Hub prompt bodies, copy buttons, provenance | No (`card-desc` one-liners only) |
| `symptoms-hub.html` | No |
| `data/models.json` | No |

Catalog sizing note for P4: unique `card-name` strings are **234**; unique `div.card` concept names are **95**. If P4 indexes only concept cards, that is fewer than 250 and must be documented. If it indexes all named cards, unique names are still **234**, also under 250 unless other eligible terms (section copy, list items, etc.) are included.

### Courses (V1 T2)

`course-hub.html` copy is the corrected “Free Education” list (no “providew” / “there tooling”). Courses lives in Start Here in `HUB_DIRECTORY`, not in the safety group.

## V1 task reconciliation (files vs V2 audit)

| V1 | V2 audit | File evidence at `59d9153` |
|---|---|---|
| T0 baseline | DONE | Prior `docs/revamp/T0-BASELINE.md`; suite now 132/132 |
| T1 navigation/admin | PARTIAL | Start Here exists in JS; Admin still public; stale HTML nav on all 14 pages |
| T2 Courses copy/icon | DONE | `course-hub.html` copy and 🎓 in directory |
| T3 Ask-an-AI + skill tiers | NOT DONE | `js/hub.js` still `AI ` + “how to implement” |
| T4 Ask-an-AI coverage | NOT DONE | 97 concept cards; hydration not shared; coverage incomplete outside Prompt Hub |
| T5 searchable glossary | NOT DONE | No glossary/catalog files |
| T6 literal Prompt Hub prompts | NOT DONE | Descriptions only; no copyable prompt / provenance |
| T7 failure-symptom page | NOT DONE | No `symptoms-hub.html` |
| T8 data-driven model roster | NOT DONE | Homepage roster hard-coded in `index.html` |

## Manual checks (P0)

- Confirmed working tree on `main` matched `origin/main` at `59d9153` before branching.
- Re-ran `python3 scripts/usability_suite.py` → 132/132; restored `data/usability-suite-run.json` so production data timestamps did not change.
- Did not browse or alter live GitHub Pages. P9 owns live smoke after later phases deploy.

## Remaining risks (for later phases, not P0)

- P1 will fail the current `DIR-ADMIN` / `DIR-ADMIN-GROUP` checks unless the suite is updated in the same phase.
- Stale HTML nav is a no-JS fallback that still advertises Site Admin and the old taxonomy.
- V1 `docs/revamp/CONTEXT.md` still says 256 cards; current tree has **266**. Treat this baseline, not CONTEXT.md, as the V2 source of truth.
- Do not fabricate model facts, course URLs, verification dates, or prompt provenance in later phases.
