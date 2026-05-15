# QA Gate — AcademyOS

QA requirements, browser QA protocol, and per-sprint QA results.

**Last updated:** 2026-05-15

---

## Gate Requirements

A sprint may not be committed unless ALL of the following pass:

| Gate | Requirement |
|---|---|
| TypeScript | `npx tsc --noEmit` exits 0 |
| Browser QA | 0 FAIL (WARN allowed with human approval) |
| Regression | Prior sprint features verified as unbroken |
| Protected actions | No automatic execution without director approval |
| DONNA naming | No "DANA" in any file touched by the sprint |

For docs-only sprints: TypeScript and browser QA are not required. State "Docs only — no browser QA required" in the QA result.

---

## Browser QA Protocol

### Setup

```js
const { chromium } = require('/workspaces/AcademyOS/node_modules/playwright-core')
```

**Never** use `require('playwright')` — not available at system level.

### Auth pattern

```js
const PROJECT_REF = 'dbjjhhxdkpdreytsozlq'
const ANON_KEY = 'sb_publishable_JF7VzCaSKlRkG9AwkskfTQ_AGJwzxFw'
const TEST_EMAIL = 'qa-test-director@academyos.test'
const TEST_PASSWORD = 'QAtest2026!'
const BASE_URL = 'http://localhost:3000'

// 1. POST to Supabase auth to get session token
// 2. Set cookie: `sb-${PROJECT_REF}-auth-token`
// 3. Navigate to target route
```

### QA script location

QA scripts live in `/tmp/donna-qa-NNN.js` (not committed). Name using the sprint number.

### Result format

Always report as: `N PASS / N FAIL / N WARN`

PASS: assertion succeeds
FAIL: assertion fails — blocks commit
WARN: non-critical issue (e.g., voice permission in headless browser) — allowed with human approval

### Standard QA sections

Every sprint with UI changes should cover:

**Section A — Page load and auth**
- Page loads without error (HTTP 200, no crash)
- Redirects to `/login` if unauthenticated (middleware works)
- Director role authenticated and lands on correct route

**Section B — Core feature (sprint-specific)**
- New screen renders with correct data
- All new UI elements present
- Loading states shown while data fetches

**Section C — DONNA integration**
- DONNA panel opens on the new route
- DONNA context intro matches `donnaPageContextRegistry` entry
- Relevant DONNA commands route correctly (at least 2 commands)
- Draft creation flow ends with Save button (not auto-save)
- No external sends triggered

**Section D — Protected actions**
- Mutations go through `proposed_actions` (not direct DB write)
- No auto-execution without director approval
- Architecture red lines not crossed

**Section E — Prior sprint regression**
- DONNA panel still opens on `/director` (dashboard)
- Save Template flow still works (Sprint 383.5 fix)
- Attendance exception draft still works (Sprint 383)
- Sprint 384 extracted components render correctly

**Section F — Developer tools (non-production only)**
- Dev tools panel visible in dev mode
- No console errors from dev tools panel

---

## Per-Sprint QA Results

---

### Sprint 385.5 — Five-Agent Workflow Setup V1

**Date:** 2026-05-15
**QA type:** Docs only — no browser QA required
**TypeScript:** Not applicable (no source changes)
**Result:** PASS (docs only)

---

### Sprint 385 — Prototype Screen Adoption Audit V1

**Date:** 2026-05-15
**QA type:** Docs only — no browser QA required
**TypeScript:** Not applicable (no source changes)
**Result:** PASS (docs only)

---

### Sprint 384 — DONNA Modularization for Parallel Agent Development V1

**Date:** 2026-05-15
**QA type:** Full browser QA (Playwright)
**TypeScript:** CLEAN (`npx tsc --noEmit` exits 0)

**Section A — Panel and input:** 8 PASS
**Section B — Golden path (template draft):** 8 PASS
**Section C — Save template (Sprint 383.5 regression):** 7 PASS
**Section D — Attendance exception (Sprint 383 regression):** 6 PASS
**Section E — COO commands:** 7 PASS
**Section F — Developer tools:** 5 PASS, 2 WARN

**Result: 41 PASS / 0 FAIL / 2 WARN**

WARN details:
- Voice permission prompt not available in headless browser — expected, not a regression
- TTS audio not verifiable in headless mode — expected

**Approved for commit:** Yes (WARNs are headless-environment limitations only)

---

### Sprint 383.5 — Fix class template level to development_track mapping

**Date:** 2026-05-15
**QA type:** Targeted (Save Template flow)
**TypeScript:** CLEAN
**Result:** PASS — Save Template no longer throws Postgres invalid enum error

---

### Sprint 383 — DONNA Attendance Exception Session Resolution V1

**Date:** 2026-05-15
**QA type:** Full browser QA (Playwright)
**TypeScript:** CLEAN
**Result:** PASS (QA details in Sprint 383 session)

---

## QA Template for New Sprints

When the QA Agent writes a new result, use this structure:

```markdown
### Sprint NNN — [Title]

**Date:** YYYY-MM-DD
**QA type:** Full browser QA / Targeted / Docs only
**TypeScript:** CLEAN / ERRORS (list files)
**Script:** /tmp/donna-qa-NNN.js

**Section A — Page load and auth:** N PASS
**Section B — [Sprint feature]:** N PASS, N FAIL, N WARN
**Section C — DONNA integration:** N PASS
**Section D — Protected actions:** N PASS
**Section E — Prior sprint regression:** N PASS
**Section F — Developer tools:** N PASS, N WARN

**Result: N PASS / N FAIL / N WARN**

[WARN details if any]
[FAIL details if any — must be resolved before commit]

**Approved for commit:** Yes / No / Pending fix
```

---

*Last updated: Sprint 385.5*
