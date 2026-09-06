# Revamp V2 — phase ledger

Source plan: AI Hub Revamp V2 (audit date 2026-09-06).  
Work branch: `cursor/revamp-v2-16ec` from `main` `@59d9153bace1bd4f54402272e517eab58173b1c4`.  
Policy: one phase at a time. Stop after each phase until requested. No framework/backend/package ecosystem. Do not fabricate facts or provenance.

## Phases

| Phase | Title | Status | Notes |
|---|---|---|---|
| P0 | Re-baseline | **DONE** | Branch created; suite 132/132 recorded; this ledger created. No production behavior change. |
| P1 | Navigation source of truth / hide admin | NOT STARTED | **Owner override:** keep the Admin / Site Evaluation link in the shared directory on **every page**. Do not unlist it. Nav cleanup may still replace stale HTML nav, but `HUB_DIRECTORY` keeps the Admin group. `DIR-ADMIN-PUBLIC` guards this. |
| P2 | Responsive shell / honest affordances | NOT STARTED | No `@media` or inert-card split today. |
| P3 | Task-oriented homepage / What’s New | NOT STARTED | Wait for P4 before glossary links; P7 makes What’s New data-driven. |
| P4 | Searchable catalog/glossary | NOT STARTED | Unique card names today: 234 (95 concept `div.card` names). |
| P5 | Correct Ask AI + skill level + coverage | NOT STARTED | Old `AI` + “how to implement” remains. |
| P6 | Literal reusable Prompt Hub | NOT STARTED | Descriptions only. Flag drafted prompts for human review. |
| P7 | Data-driven model roster / freshness | NOT STARTED | Homepage roster is hard-coded. |
| P8 | Troubleshooting / symptoms hub | NOT STARTED | Page absent. |
| P9 | Quality gates / final acceptance | NOT STARTED | Re-score UX without changing the method. |

## Commits / PRs

| Date | Phase | SHA / PR | Summary |
|---|---|---|---|
| 2026-09-06 | P0 | `5b2f1dba0cc81b495dfc1e4ac6116203044db8fb` — https://github.com/JoeMBraun/ai-hub/pull/14 | Add `docs/revamp-v2/BASELINE.md` and `STATUS.md`. |
| 2026-09-06 | Keep Site Admin on every page | https://github.com/JoeMBraun/ai-hub/pull/14 | Owner override: Admin / Site Evaluation stays in the public directory on every page. |

## Tests

| Date | Phase | Command | Result |
|---|---|---|---|
| 2026-09-06 | P0 | `python3 scripts/usability_suite.py` | passed=132 failed=0 warned=0 total=132 |
| 2026-09-06 | P0 stored | `data/usability-suite-run.json` | 132/132 at 2026-09-06T22:17:57Z (left unchanged) |
| 2026-09-06 | Keep Site Admin on every page | `python3 scripts/usability_suite.py` | passed=133 failed=0 warned=0 total=133 (`DIR-ADMIN-PUBLIC` added) |

## P0 definition of done

- [x] Exact baseline/test result recorded
- [x] Phase ledger created
- [x] Production site behavior unchanged

## Owner decision — keep Site Admin on every page

Site Evaluation stays in the **public directory on every hub**. Do not remove the Admin group from `HUB_DIRECTORY`.

- Keep `admin-hub.html`, the scores, the suite, and “Run suite now”.
- Keep Directory → Admin → Site Evaluation on every page (this is how the quality dashboard is opened).
- The README and https://joembraun.github.io/ai-hub/admin-hub.html remain extra entry points.

`DIR-ADMIN`, `DIR-ADMIN-GROUP`, and `DIR-ADMIN-PUBLIC` in the usability suite must keep passing.

## Next

Public-nav cleanup (one shared menu, drop the old duplicate HTML nav) can still happen later. That cleanup must **not** drop Site Admin from the menu.
