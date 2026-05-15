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

### Sprint 389 — Parent Communication Center V1

**Date:** 2026-05-15
**QA type:** Full browser QA (Playwright)
**TypeScript:** CLEAN
**Script:** /tmp/donna-qa-389.js

**Result: 23 PASS / 0 FAIL / 1 WARN**

WARN: Test DB has no parent_updates — parent-safe preview card not browser-verified. Code verified: content truncated to 120 chars with `ShieldCheck` icon, "internal notes not shown" note. Pre-existing DONNA panel "Send" button confirmed not in page content.

**Approved for commit:** Yes

---

### Sprint 388 — Level Up Readiness Review V1

**Date:** 2026-05-15
**QA type:** Full browser QA (Playwright, form-based auth)
**TypeScript:** CLEAN
**Script:** /tmp/donna-qa-388.js

**Section A — Auth:** 1 PASS
**Section B — /director/level-up:** 9 PASS
**Section C — /director/today regression:** 2 PASS
**Section D — Sessions regression:** 1 PASS
**Section E — DONNA dashboard:** 2 PASS
**Section F — Templates regression:** 1 PASS
**Section G — Safety:** 5 PASS
**Section H — Console errors:** 1 PASS (1 filtered pre-existing)

**Result: 23 PASS / 0 FAIL / 0 WARN**

**Approved for commit:** Yes

---

### Sprint 387 — Sessions Detail DONNA Context V1

**Date:** 2026-05-15
**QA type:** Full browser QA (Playwright, form-based auth) + static code analysis
**TypeScript:** CLEAN (`npx tsc --noEmit` exits 0)
**Script:** /tmp/donna-qa-387.js

**Section A — Auth:** 1 PASS
**Section B — Sessions list regression:** 2 PASS
**Section C — Registry entry (static analysis):** 6 PASS
**Section D — DONNA chips (static analysis + test DB note):** 5 PASS, 1 WARN
**Section E — /director/today regression:** 3 PASS
**Section F — DONNA panel regression:** 2 PASS
**Section G — Class templates regression:** 1 PASS
**Section H — Protected actions:** 3 PASS
**Section I — TypeScript:** 1 PASS

**Result: 24 PASS / 0 FAIL / 1 WARN**

WARN: Test DB has 0 sessions for qa-test-director — live browser chip render not verifiable. Chip code verified at `page.tsx:688-694` via grep. Rendering logic is a static array map with no conditionals — functionally correct.

**Approved for commit:** Yes

---

### Sprint 386 — Today's Academy V1

**Date:** 2026-05-15
**QA type:** Full browser QA (Playwright, form-based auth)
**TypeScript:** CLEAN (`npx tsc --noEmit` exits 0)
**Script:** /tmp/donna-qa-386.js

**Section A — /director regression:** 3 PASS
**Section B — /director/today core:** 3 PASS
**Section C — Key UI sections:** 8 PASS
**Section D — DONNA availability:** 2 PASS
**Section E — Stability:** 1 PASS, 1 WARN
**Section F — Safety:** 5 PASS
**Section G — Template + session + review regression:** 5 PASS
**Section H — Edge cases:** 2 PASS

**Result: 30 PASS / 0 FAIL / 1 WARN**

WARN: `Failed to load resource: 406 ()` — pre-existing background Supabase call (present in prior sprints, not caused by Sprint 386). Likely `academy_suggestions` or similar table returning 406 in test environment.

**Approved for commit:** Yes

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

*Last updated: Sprint 389*
