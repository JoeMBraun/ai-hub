# AI Hub — Implementation Plan

Repo: `joembraun/ai-hub` · Live: https://joembraun.github.io/ai-hub/
Baseline commit: depth-1 clone of `main`, 2026-09-06.

## Context for the implementing agent

Static site. No build step. 14 hand-authored HTML pages at repo root, shared `css/hub.css`
and `js/hub.js`. Deployment is `.github/workflows/deploy-pages.yml`, which runs a `verify`
job (required-file check, `scripts/usability_suite.py`, HTTP 200 smoke test on an explicit
page list) before deploying to GitHub Pages.

Two invariants that constrain every task below:

1. **Any new page must be added in three places** or CI fails: the `required` array in the
   workflow's "Check required pages exist" step, the `pages` array in the smoke-test step,
   and `scripts/usability_suite.py`'s page list.
2. **The navigation is data-driven.** It renders from the `HUB_DIRECTORY` constant in
   `js/hub.js`. Never hand-edit nav markup into an HTML file.

Work on branch `revamp`. Each task below is independently shippable — merge one at a time.
Do not batch tasks into a single PR.

### Baseline facts (verified, do not re-derive)

- 256 elements matching `class="card"` across 12 content pages.
- 282 `generatePromptAndRouteToLanguageModel` call sites = 94 cards (37%) with Ask-an-AI
  buttons. Full coverage only on `prompt-hub.html` (25/25).
- Zero `<pre>` and zero `<code>` elements repo-wide.
- Card markup shape:
  ```html
  <div class="card">
    <div class="card-name">Chain-of-Thought</div>
    <div class="card-desc">Step-by-step reasoning for complex tasks</div>
    <div class="llm-actions">
      <button class="llm-icon-btn" onclick="generatePromptAndRouteToLanguageModel(event, 'Chain-of-Thought', 'ChatGPT')" ...>
      <!-- + Perplexity, + Claude -->
    </div>
  </div>
  ```

---

## T0 — Branch and baseline

**Files:** none (git only)

**Steps**
1. `git checkout -b revamp`
2. Run `python3 scripts/usability_suite.py` and record the pass/fail counts.

**Definition of done**
- Branch `revamp` exists off `main`.
- Baseline suite result recorded in the PR description (expected: 131/131 pass).

---

## T1 — Fix navigation taxonomy and hide admin from public nav

`course-hub.html` is currently grouped under **AI Safety & Ops** alongside Security,
Governance, and Deployment. Courses is neither safety nor operations. The `Site Admin`
group exposes internal scaffolding in the primary nav of every public page.

**Files:** `js/hub.js`, `css/hub.css`

**Steps**
1. In `HUB_DIRECTORY`, move the `course-hub.html` entry out of the `safety` group.
   Place it in the `interfaces` group, and rename that group's label to
   `Start Here`.
2. Remove the `admin` group from `HUB_DIRECTORY`. Keep `admin-hub.html` reachable by
   direct URL — do not delete the page.
3. Remove the now-dead `.nav-admin` rule from `css/hub.css` if nothing else references it.

**Definition of done**
- `grep -c 'admin-hub' js/hub.js` returns `0`.
- `course-hub.html` appears in the `Start Here` group and not in the `safety` group.
- Loading any page and inspecting `.nav` shows 4 groups, 14 links, zero admin links.
- Navigating directly to `/admin-hub.html` still returns 200 and renders.
- `python3 scripts/usability_suite.py` passes at the T0 baseline count or higher.

---

## T2 — Correct Courses Hub copy

Line 56 of `course-hub.html` reads: *"**AI course** are web apps that AI vendors providew
to interact with there tooling."* Three typos, and the definition is wrong — it describes a
playground, not a course. It is template text carried over from another hub.

**Files:** `course-hub.html`

**Steps**
1. Replace the definition sentence with an accurate one describing vendor-published training
   material.
2. Fix `providew` → `provide`, `there` → `their`, `AI course are` → `AI courses are`.
3. Reconcile the icon: the `<h1>` uses the brain glyph, which is also Agents Hub's icon in
   `HUB_DIRECTORY`. Change the Courses `<h1>` to the graduation-cap glyph used in the nav.

**Definition of done**
- `grep -c 'providew\|there tooling' course-hub.html` returns `0`.
- No two entries in `HUB_DIRECTORY` share a leading emoji, and each page's `<h1>` glyph
  matches its own nav entry glyph.
- Page passes a spellcheck run over visible text with zero errors.

---

## T3 — Rewrite the Ask-an-AI prompt template and add skill tiers

Current template in `js/hub.js`:
```js
const aiPrefixedConcept = "AI " + conceptText;
const generatedPromptText = "I would like a detailed explanation of how to implement " + aiPrefixedConcept + ".";
```
This yields "how to implement AI Golden Sets" and "how to implement AI Brand Alignment."
The unconditional `AI ` prefix is wrong for most of the 256 concepts, and `implement` is
wrong for anything that is not a buildable pattern.

This task is where beginner / intermediate / expert differentiation belongs. It is a
per-reader control over prompt depth, not a restructuring of the site.

**Files:** `js/hub.js`, `css/hub.css`, all 12 content pages (attribute additions only)

**Steps**
1. Delete the `"AI " +` prefix. Pass the concept verbatim.
2. Add a `level` parameter to `generatePromptAndRouteToLanguageModel` with three templates:
   - `beginner` — asks for a plain-language explanation, one concrete everyday example, and
     why the reader should care. Explicitly instructs the model to avoid jargon.
   - `intermediate` — asks for a worked example, when to use it, and when not to.
   - `expert` — asks for tradeoffs, failure modes, cost characteristics, and comparison to
     the nearest alternative technique.
3. Add a single persistent level selector in the page header. Persist to `localStorage` under
   key `aiHub.skillLevel`, defaulting to `intermediate`. Reuse the existing
   read/write/apply pattern already used for `aiHub.navCollapsed`.
4. Add a visible text label to the `.llm-actions` row — e.g. `Ask an AI →` — preceding the
   three icon buttons. Unlabeled repeated favicons carry no information scent.

**Definition of done**
- `grep -c '"AI " +' js/hub.js` returns `0`.
- Clicking a button with level `beginner` on the concept `Golden Sets` opens a URL whose
  decoded `q` parameter contains `Golden Sets`, does not contain `AI Golden Sets`, and does
  not contain the word `implement`.
- Switching the level selector and reloading the page preserves the selection.
- Each `.llm-actions` block renders a text label that is present in the accessibility tree
  (verify: the row is not three bare `<img>` buttons).
- All three providers still open in a new tab and receive a non-empty `q` parameter.

---

## T4 — Extend Ask-an-AI coverage to all concept cards

94 of 256 cards (37%) have the buttons. Missing entirely on `index.html`,
`benchmark-hub.html`, `harness-hub.html`, `local-models-hub.html`; partial on the rest.
Only `prompt-hub.html` is complete.

Do not hand-write 162 button blocks. Generate them.

**Files:** `js/hub.js`, all 12 content pages

**Steps**
1. Add a `hydrateCardActions()` function to `js/hub.js` that, on `DOMContentLoaded`, finds
   every `.card` containing a `.card-name` but no `.llm-actions`, and appends the actions
   block using the card's `.card-name` text as the concept.
2. Exclude cards that are pure outbound tool links (those wrapping an `<a href>` to an
   external vendor) — those already have a destination and do not need an explainer.
3. Do not modify the 94 existing hand-written blocks. Let hydration fill only the gaps.

**Definition of done**
- After DOM load on every content page, the count of `.card` elements lacking an
  `.llm-actions` child, excluding outbound-link cards, is `0`.
- Total concept cards with actions ≥ 250 of 256 (any exclusions must be outbound-link cards,
  enumerated in the PR description).
- No duplicate `.llm-actions` blocks appear on any card (assert exactly one per card).
- `prompt-hub.html` renders identically to `main` — hydration must be a no-op there.

---

## T5 — Consolidate a searchable Glossary

The site's 256 stubs are a glossary fragmented across 14 category pages. A reader who
encounters "Reflexion" must guess it lives under Agents rather than Prompt. This task makes
the existing content usable without writing new content.

**Files:** new `data/glossary.json`, new `glossary.html`, new `js/glossary.js`,
`js/hub.js`, `.github/workflows/deploy-pages.yml`, `scripts/usability_suite.py`

**Steps**
1. Write a one-off extraction script that walks all content pages and emits
   `data/glossary.json` as an array of `{ term, description, sourcePage, sourceSection }`,
   derived from `.card-name`, `.card-desc`, the containing `.section-label`, and the filename.
   Commit both the script (under `scripts/`) and its output.
2. Build `glossary.html`: alphabetical listing, client-side substring filter over `term` and
   `description`, each entry linking back to its source hub section and carrying the same
   Ask-an-AI actions from T3.
3. Add `glossary.html` to `HUB_DIRECTORY` in the `Start Here` group.
4. Register the new page in all three CI locations (see invariant 1 above).

**Definition of done**
- `data/glossary.json` contains ≥ 250 entries, each with all four fields non-empty.
- Zero duplicate `term` values, or duplicates are explicitly reconciled and listed in the PR.
- Typing `reflex` into the filter surfaces the Reflexion entry in under 200ms with no network
  request.
- Every entry's `sourcePage` link resolves to an existing anchor (assert: no 404s, no dead
  fragments).
- CI `verify` job passes with `glossary.html` present in all three required lists.

---

## T6 — Put literal prompt text into the Prompt Hub

`prompt-hub.html` lists 25 prompt patterns and contains zero prompts. Repo-wide there are no
`<pre>` or `<code>` elements. This is the highest-value content gap on the site.

**Files:** `prompt-hub.html`, `css/hub.css`, `js/hub.js`

**Steps**
1. For each of the 25 patterns, add a collapsible block containing the literal prompt text,
   verbatim and copyable.
2. Add a copy-to-clipboard control per block.
3. Add a provenance line to each block with four fields: model identifier, date tested,
   settings (temperature / reasoning effort), and any tool definitions assumed. A prompt
   without provenance becomes misinformation rather than merely becoming stale.
4. Collapse the blocks by default so the page remains scannable.

**Definition of done**
- `grep -c '<pre' prompt-hub.html` returns ≥ 25.
- Every one of the 25 `.card` entries has an associated prompt block — assert
  `count(.card) == count(.prompt-body)`.
- Every prompt block carries all four provenance fields, none empty or placeholder.
- Copy control places the exact prompt text on the clipboard, verified for 3 sampled blocks.
- Page weight increase does not push first contentful paint beyond 1.5s on a throttled
  Fast 3G profile.

---

## T7 — Add a failure-symptom page for chat users

Existing published work on LLM failure modes targets engineers running observability
pipelines. Nothing serves the reader in a chat window who thinks the tool is broken. Scope
tightly to that reader; do not reproduce a production taxonomy.

**Files:** new `symptoms-hub.html`, `js/hub.js`, `.github/workflows/deploy-pages.yml`,
`scripts/usability_suite.py`

**Steps**
1. Author 12–20 entries. Each has exactly three parts: **symptom** in the reader's own words,
   **mechanism** in one short paragraph, **what to do** as concrete steps.
2. Seed set: output stopped mid-sentence; model invented a citation; quality dropped after a
   long session; model refused something reasonable; model agreed with a wrong correction;
   model forgot an instruction given earlier; repeated identical tool call; answer contradicts
   an uploaded document.
3. Add to `HUB_DIRECTORY` under `Start Here`. Register in all three CI locations.

**Definition of done**
- ≥ 12 entries, each with all three parts present and non-empty.
- Zero entries requiring API, SDK, or observability-tooling knowledge to act on — verify by
  checking no entry references code, endpoints, or eval frameworks.
- Readability of the symptom and action text at US grade 9 or below.
- CI `verify` passes with the new page registered.

---

## T8 — Separate volatile from durable content

`index.html` asserts specific September 2026 model identities as current. These decay within
weeks, and a beginner will trust them. Note an existing inconsistency: every vendor is
represented by a frontier model except Google, which is represented by a model the page
itself labels as the fast tier.

**Files:** `index.html`, new `data/models.json`, `js/hub.js`

**Steps**
1. Move the model roster out of `index.html` markup into `data/models.json` with a top-level
   `lastVerified` ISO date and a per-entry `tier` field.
2. Render the roster client-side, displaying `lastVerified` prominently above it.
3. Add a build-time or CI warning when `lastVerified` is older than 60 days.
4. Reconcile the Google entry so all listed models share a comparable tier, or label tiers
   explicitly so the comparison is not misleading.

**Definition of done**
- `index.html` contains no hard-coded model version strings.
- `lastVerified` renders visibly above the roster.
- CI emits a non-blocking warning when `lastVerified` exceeds 60 days — verified by
  temporarily backdating the field.
- Every roster entry has a `tier` value, and entries of differing tiers are visually
  distinguished.

---

## Sequencing and merge order

Merge in this order. T1–T4 are mechanical and low-risk; T5–T8 introduce content.

| Task | Type | Risk | Blocks |
|------|------|------|--------|
| T0 | setup | none | all |
| T1 | fix | low | — |
| T2 | fix | none | — |
| T3 | behavior | low | T4, T5 |
| T4 | behavior | medium | — |
| T5 | new page | medium | — |
| T6 | content | low | — |
| T7 | content | low | — |
| T8 | behavior | medium | — |

T3 must land before T4 and T5, since both reuse the corrected prompt template.
T6, T7, and T8 are independent of each other and of T4/T5.

## Out of scope

Deliberately excluded, to be reconsidered only after T1–T6 ship: task-oriented entry layer
above the hubs; per-hub opinion and Redbook-style scenario sections; freezing the twelve
non-priority hubs; navigation reduction beyond T1. These are real but subordinate — if
T1–T6 land, they become obvious and cheap; if they do not, none of the rest matters.

## Global acceptance

- `python3 scripts/usability_suite.py` passes on `revamp` at or above the T0 baseline.
- The `verify` job in `.github/workflows/deploy-pages.yml` is green.
- Every page returns HTTP 200 from the smoke-test list.
- No task merged as part of a batch — one PR per task.
