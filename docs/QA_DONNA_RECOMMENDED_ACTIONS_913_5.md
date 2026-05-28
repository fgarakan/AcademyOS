# QA — DONNA Recommended Action Intelligence V1
**Sprint:** 913.5
**Date:** 2026-05-28
**Method:** Static code analysis

---

## Scenarios

### Scenario 1 — Top priority + matching recommended action ✅ PASS

**Setup:** `pendingReviews=3, recommendedActions=[{label:'Review 3 pending items', reason:'Coaches and players are waiting', ...}]`

**Brief output includes:**
`"Recommended: Review 3 pending items — Coaches and players are waiting."`

`formatRecommendedActions` with 1 action → single-action format with reason ✅

---

### Scenario 2 — Multiple recommended actions ✅ PASS

**Setup:** `recommendedActions=[{label:'Follow up on 2 missing wrap-ups'}, {label:'Check 1 at-risk player'}, {label:'Review 3 pending items'}]`

**Brief output includes:**
`"Recommended: Follow up on 2 missing wrap-ups, Check 1 at-risk player, Review 3 pending items."`

Multi-action format — labels only ✅

---

### Scenario 3 — Academy risks but no recommended actions ✅ PASS

**Setup:** `academyRisks=[{signal:'Pending reviews',...}], recommendedActions=[]`

`formatRecommendedActions([])` → `''` → filtered by `.filter(Boolean)` → NO "Recommended:" line shown.

Brief still shows ranked priorities and best next step. ✅

---

### Scenario 4 — No recommended actions and no risks ✅ PASS

**Setup:** All signals at 0.

`ranked = []` → `buildDirectorBriefSummary` returns "Academy looks clear..." (early return, `formatRecommendedActions` is never called). ✅

---

### Scenario 5 — High-risk player priority ✅ PASS

**Setup:** `highRiskPlayerCount=2, recommendedActions=[{label:'Check 2 at-risk players', reason:'High-risk flags require director awareness'}]`

Priority format: "Top priority: 2 players flagged high-risk... Best next action: Review flagged player profiles..."

Brief adds: `"Recommended: Check 2 at-risk players — High-risk flags require director awareness."`

`buildDashboardPriorityResponse` unchanged — no recommended section (would be redundant with `bestNextAction`). ✅

---

### Scenario 6 — Review queue priority ✅ PASS

**Setup:** `pendingReviews=5, recommendedActions=[{label:'Review 5 pending items', reason:'Coaches and players are waiting'}, {label:'Check at-risk players', ...}]`

Multi-action (2): `"Recommended: Review 5 pending items, Check at-risk players."` ✅

---

### Scenario 7 — Curriculum coverage priority ✅ PASS

**Setup:** `curriculumTemplateCoverageGapCount=2, recommendedActions=[]`

`formatRecommendedActions([])` → `''` → not shown. Brief shows ranked priorities only. ✅

---

### Scenario 8 — Onboarding partial priority ✅ PASS

**Setup:** `onboardingReadinessLevel='partial', recommendedActions=[]`

No recommended actions generated for onboarding in the loading function → `recommendedActions=[]` → no "Recommended:" line. ✅

---

### Scenario 9 — Raw IDs not exposed ✅ PASS

`formatRecommendedActions` uses only `actions.label` and (for single action) `actions.reason`. The `id` field (e.g., `'review_pending'`) is never accessed in the format function. ✅

Verification: `top[0].label` — string ✅ / `top[0].reason` — string ✅. No `.id` reference anywhere in the helper. ✅

---

### Scenario 10 — Existing all-clear state ✅ PASS

When `ranked.length === 0` → `buildDirectorBriefSummary` early-returns with "Academy looks clear..." before reaching the `formatRecommendedActions` call. ✅

---

## Safety Checks

| Check | Result |
|---|---|
| No `recommendedAction.id` exposed | ✅ |
| No `academyRisks` surfaced as separate section | ✅ (deliberately omitted — overlaps with ranked priorities) |
| `formatRecommendedActions` returns `''` for empty input | ✅ |
| `.filter(Boolean)` prevents empty lines in brief | ✅ |
| `buildDashboardPriorityResponse` unchanged (no redundancy added) | ✅ |
| Sprint 904 untouched | ✅ |
| No new imports | ✅ |
