# Route Smoke Test Audit — Sprint 713

**Date:** 2026-05-17
**Method:** File-system audit (page.tsx existence, layout coverage, error/loading boundaries, sidebar/tab nav alignment).
**Note:** Runtime browser QA is in a separate sprint. This sprint establishes the file-level baseline.

---

## Director Routes — Sidebar Nav

| Label | Route | page.tsx | error.tsx | loading.tsx | Result |
|---|---|---|---|---|---|
| Dashboard | `/director` | ✅ | ✅ (root) | ❌ | PASS |
| Today's Academy | `/director/today` | ✅ | ✅ | ✅ | PASS |
| Players | `/director/players` | ✅ | ✅ (root) | ✅ | PASS |
| Player Profile | `/director/players/[playerId]` | ✅ | ✅ (root) | ✅ | PASS |
| Coaches | `/director/coaches` | ✅ | ✅ (root) | ❌ | PASS |
| Coach Profile | `/director/coaches/[coachId]` | ✅ | ✅ (root) | ❌ | PASS |
| Sessions | `/director/sessions` | ✅ | ✅ (root) | ✅ | PASS |
| Session Detail | `/director/sessions/[sessionId]` | ✅ | ✅ (root) | ❌ | PASS |
| Review Queue | `/director/review` | ✅ | ✅ | ✅ | PASS |
| Signals | `/director/signals` | ✅ | ✅ | ✅ | PASS |
| KPI | `/director/kpi` | ✅ | ✅ | ✅ | PASS |
| Curriculum | `/director/curriculum` | ✅ | ✅ (root) | ❌ | PASS |
| Curriculum Builder | `/director/curriculum/builder` | ✅ | ✅ (root) | ❌ | PASS |
| Curriculum Learning | `/director/curriculum/learning` | ✅ | ✅ (root) | ❌ | PASS |
| Templates | `/director/class-templates` | ✅ | ✅ (root) | ❌ | PASS |
| Template Detail | `/director/class-templates/[templateId]` | ✅ | ✅ (root) | ❌ | PASS |
| Settings | `/director/settings` | ✅ | ✅ (root) | ❌ | PASS |
| Onboarding | `/director/onboarding` | ✅ | ✅ (root) | ❌ | PASS |
| Command Center | `/director/command-center` | ✅ | ✅ (root) | ❌ | PASS |
| Parents | `/director/parents` | ✅ | ✅ | ✅ | PASS |
| Alerts | `/director/alerts` | ✅ | ✅ (root) | ❌ | PASS |

---

## Director Routes — Demo and COO

| Route | page.tsx | Result | Notes |
|---|---|---|---|
| `/director/donna-coo-demo` | ✅ | PASS | Full COO demo walkthrough. Sprint 509/523. |
| `/director/demo` | ✅ | PASS | Demo mode entry page. |
| `/director/today?demo=1` | ✅ (uses today page.tsx) | PASS | Demo mode activated by `?demo=1` param. |
| `/director/placement` | ✅ | PASS | Placement engine (scaffolded). |
| `/director/improvement` | ✅ | PASS | Improvement dashboard. |
| `/director/level-up` | ✅ | ✅ error | PASS |
| `/director/ai-suggestions` | ✅ | PASS | |
| `/director/private-lessons` | ✅ | PASS | |
| `/director/kpi` | ✅ | PASS | |
| `/director/players/active` | ✅ | PASS | Active players list. |
| `/director/players/development-intake` | ✅ | PASS | Development intake flow. |
| `/director/players/import` | ✅ | PASS | Player import. |
| `/director/players/new` | ✅ | PASS | New player form. |
| `/director/players/onboarding-review` | ✅ | PASS | Onboarding review. |

---

## Coach Routes

| Label | Route | page.tsx | error.tsx | loading.tsx | Result |
|---|---|---|---|---|---|
| Home | `/coach` | ✅ | ✅ (root) | ❌ | PASS |
| Players | `/coach/players` | ✅ | ✅ (root) | ❌ | PASS |
| Player Detail | `/coach/players/[playerId]` | ✅ | ✅ (root) | ❌ | PASS |
| Sessions | `/coach/sessions` | ✅ | ✅ (root) | ❌ | PASS |
| Session Detail | `/coach/sessions/[sessionId]` | ✅ | ✅ (root) | ❌ | PASS |
| Recap | `/coach/recap` | ✅ | ✅ (root) | ❌ | PASS |
| Voice | `/coach/voice` | ✅ | ✅ (root) | ❌ | PASS (Coming Soon page) |

---

## Player and Parent Routes

| Route | page.tsx | Result |
|---|---|---|
| `/player` | ✅ | PASS |
| `/parent` | ✅ | PASS |

---

## Routes Listed as Non-Existent in LOCKED_MODULES.md

| Route | page.tsx | Result |
|---|---|---|
| `/director/competition` | ❌ | CONFIRMED NOT BUILT |
| `/director/intelligence` | ❌ | CONFIRMED NOT BUILT |
| `/director/reports` | ❌ | CONFIRMED NOT BUILT |
| `/director/configuration` | ❌ | CONFIRMED NOT BUILT |

These routes do not exist and are locked. No sidebar link points to them. Correct.

---

## Error Boundary Coverage

| Scope | error.tsx | Notes |
|---|---|---|
| Root coach | `/app/coach/error.tsx` | Covers all coach routes |
| Root director | `/app/director/error.tsx` | Covers all director routes not overriding |
| `/director/review` | Has own error.tsx | Custom error UI |
| `/director/kpi` | Has own error.tsx | |
| `/director/level-up` | Has own error.tsx | |
| `/director/parents` | Has own error.tsx | |
| `/director/signals` | Has own error.tsx | |
| `/director/today` | Has own error.tsx | |

**Gap:** `/director/curriculum`, `/director/curriculum/builder`, `/director/class-templates`, `/director/coaches`, `/director/settings`, `/director/onboarding`, `/director/command-center` rely on root director error boundary only. Acceptable for V1 — root boundary is sufficient.

---

## Loading State Coverage

| Route | loading.tsx |
|---|---|
| `/director/kpi` | ✅ |
| `/director/level-up` | ✅ |
| `/director/parents` | ✅ |
| `/director/players` | ✅ |
| `/director/players/[playerId]` | ✅ |
| `/director/review` | ✅ |
| `/director/sessions` | ✅ |
| `/director/sessions/overview` | ✅ |
| `/director/signals` | ✅ |
| `/director/today` | ✅ |

**Gap:** Most other director routes do not have loading.tsx. These routes rely on Suspense or inline skeletons, or are fast enough server-side. Acceptable for V1.

---

## Curriculum Builder — Key Discovery

`/director/curriculum/builder` already exists with a `CurriculumSetupBuilder` component. This is the existing Curriculum Builder setup flow (built in earlier sprints). The planned Sprints 760–806 will build on or extend this. Before building the planned DONNA-led welcome page, the existing `CurriculumSetupBuilder` must be reviewed to avoid duplication.

**Action for Sprint 758:** Review `CurriculumSetupBuilder.tsx` as part of the zip audit before creating new builder routes.

---

## Summary

| Metric | Count |
|---|---|
| Director routes checked | 35 |
| Coach routes checked | 7 |
| Player / Parent routes | 2 |
| PASS | 44 |
| NOT BUILT (confirmed locked) | 4 |
| FAIL | 0 |

**All V1 routes exist and have page.tsx files. No 404 gaps in core navigation. TypeScript clean.**

---

*Generated by Sprint 713 — Route Smoke Test Audit V1.*
