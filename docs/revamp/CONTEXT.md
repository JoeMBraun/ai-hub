# AI Hub — Context for the implementing agent

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
