# AI Hub — Revamp Work Package

Drop-in package for `joembraun/ai-hub`. Unzip into the repo root (or anywhere you like —
nothing here is read by the site or by CI).

## Contents

| File | Use |
|------|-----|
| `CONTEXT.md` | Repo invariants and verified baseline facts. Read first, every session. |
| `tasks/T0.md` … `tasks/T8.md` | One task per file. Paste one into Cursor per PR. |
| `SEQUENCING.md` | Merge order, blocking relationships, out-of-scope list, global acceptance. |
| `ai-hub-implementation-plan.md` | The whole plan as a single document. |

## How to run this

1. Open `CONTEXT.md` in Cursor and keep it in context for the whole session.
2. `git checkout -b revamp` (that is T0).
3. Feed **one** task file at a time. Merge, then move to the next.
4. Order: T1, T2, T3, then T4 and T5 (both require T3), then T6, T7, T8 in any order.

## Two things that will break the build if skipped

- **New pages must be registered in three places** — the `required` array and the `pages`
  array in `.github/workflows/deploy-pages.yml`, and the page list in
  `scripts/usability_suite.py`. Affects T5 and T7.
- **Never hand-edit nav markup.** The navigation renders from `HUB_DIRECTORY` in `js/hub.js`.

## Needs human review before merge

T6 and T7. Their definitions of done can verify that prompt text and provenance fields
exist, but not that the content is good. Everything else is mechanically checkable.
