# AI Hub — Release checklist (R1–R10)

Copy this section into the PR for **one** release. Do not combine releases.

**Release:** R__
**Branch:**
**Base:** `main`
**Date:**

## Scope

- [ ] Inspected current `js/hub.js`, `css/hub.css`, tests, and related pages before editing
- [ ] Only this release’s files changed
- [ ] Static HTML / CSS / vanilla JS preserved (no framework, backend, CMS, or package ecosystem)
- [ ] No unrelated rename/cleanup
- [ ] No fabricated facts, dates, rankings, prices, or verification claims (use “Needs review” if unverified)

## Product / owner constraints

- [ ] Site Evaluation remains reachable from **every page** via Directory → Admin (do not unlist unless the owner says so)
- [ ] Shared navigation updated only in `HUB_DIRECTORY` (`js/hub.js`), not by inventing a second menu
- [ ] If adding pages under a folder (for example `guides/`), workflow “Stage site files” copies that folder

## Tests

```
python3 scripts/usability_suite.py
```

- [ ] Suite green, or only **pre-existing** failures recorded
- [ ] New behavior has targeted checks
- [ ] Internal links from new/changed pages resolve
- [ ] New HTML pages listed in:
  - [ ] `.github/workflows/deploy-pages.yml` `required`
  - [ ] workflow smoke `pages`
  - [ ] directory / suite page list (`HUB_DIRECTORY` and `admin-hub.html` as applicable)

Result: passed=__ failed=__ warned=__ total=__

## Manual checks

- [ ] Desktop (~1440px)
- [ ] Tablet (~768px)
- [ ] Mobile (~375px)
- [ ] Keyboard can reach new controls; `:focus-visible` where new
- [ ] No broken primary CTAs from the home page (once R1 exists)

Pages checked:

## Report (required at end of release)

### Files changed

### Behavior added

### Tests run

### Manual checks

### Known limitations

### Recommended next release

Only name the next one. Stop until instructed.
