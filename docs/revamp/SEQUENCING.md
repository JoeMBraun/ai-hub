# Sequencing, scope, and global acceptance

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
