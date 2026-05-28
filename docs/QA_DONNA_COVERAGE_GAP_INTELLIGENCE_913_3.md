# QA — DONNA Coverage Gap Intelligence V1
**Sprint:** 913.3
**Date:** 2026-05-28
**Method:** Static code analysis of `donnaAttentionRankingEngine.ts`

---

## Static QA Scenarios

### Scenario 1 — Player stalls only ✅ PASS

**Setup:** `playerProgressStallCount=3, playerProgressStallContextAvailable=true`, all other signals 0/false

**Expected ranking:**
1. `player_progress_stalls` — score `cap(62 + 3×3, 78) = 71` — `player_development` / high

**Output (brief):**
"Here's your academy status (ranked by urgency):\n1. 3 players may be stalled in development\n\nBest next step: Review the stalled player profiles..."

**Expected:** ✅ Stall signal surfaces as #1 when no higher-urgency signals exist.

---

### Scenario 2 — Assessment coverage gaps only ✅ PASS

**Setup:** `assessmentCoverageGapCount=2, assessmentContextAvailable=true, eligibleWithoutAssessmentEvidence=1`

**Expected ranking:**
1. `assessment_coverage_gaps` — score `cap(58 + 2×2, 72) = 62` — `curriculum` / medium

**Evidence text includes:** "2 assessment coverage gaps detected. Including 1 advancement-eligible player without promotion-ready assessment on record."

**Expected:** ✅ `eligibleWithoutAssessmentEvidence` enriches the evidence text when > 0.

---

### Scenario 3 — Template coverage gaps only ✅ PASS

**Setup:** `curriculumTemplateCoverageGapCount=3, templateCoverageContextAvailable=true`

**Expected ranking:**
1. `curriculum_template_coverage_gaps` — score `cap(56 + 3×2, 70) = 62` — `curriculum` / high (≥3)

**bestNextAction:** "Open Templates and create or assign session templates for the affected curriculum levels."

**Expected:** ✅ Template gap surfaces with correct severity and href to `/director/templates`.

---

### Scenario 4 — Player stalls + curriculum drafts ✅ PASS

**Setup:** `playerProgressStallCount=2, playerProgressStallContextAvailable=true, curriculumDraftCount=3`

**Expected ranking:**
1. `player_progress_stalls` — score `cap(62 + 2×3, 78) = 68`
2. `curriculum_drafts` — score `cap(40 + 3×2, 55) = 46`

**Key:** Player stalls (68) outrank curriculum drafts (46) ✅

**Expected:** ✅ "Player stalls should often outrank curriculum drafts" — confirmed.

---

### Scenario 5 — Assessment gaps + pending reviews ✅ PASS

**Setup:** `assessmentCoverageGapCount=2, assessmentContextAvailable=true, pendingReviews=3, oldestPendingReviewAgeDays=2`

Queue is NOT stale (2 < 7) → `pending_reviews` signal, score `cap(60 + 3, 75) = 63`
Assessment gaps score: `cap(58 + 2×2, 72) = 62`

**Expected ranking:**
1. `pending_reviews` — score 63
2. `assessment_coverage_gaps` — score 62

**Key:** Pending reviews narrowly outrank assessment gaps in this scenario (63 vs 62). ✅

**Expected:** ✅ Assessment gaps rank just below fresh pending reviews — correct ordering.

---

### Scenario 6 — Template gaps + onboarding partial ✅ PASS

**Setup:** `curriculumTemplateCoverageGapCount=2, templateCoverageContextAvailable=true, onboardingReadinessLevel='partial'`

**Expected ranking:**
1. `curriculum_template_coverage_gaps` — score `cap(56 + 2×2, 70) = 60`
2. `onboarding_incomplete` — score 30

**Key:** Template coverage gaps (60) outrank onboarding partial (30) ✅

**Expected:** ✅ Template gaps above onboarding partial.

---

### Scenario 7 — High-risk players + coverage gaps ✅ PASS

**Setup:** `highRiskPlayerCount=1, assessmentCoverageGapCount=3, assessmentContextAvailable=true, curriculumTemplateCoverageGapCount=2, templateCoverageContextAvailable=true, playerProgressStallCount=2, playerProgressStallContextAvailable=true`

**Expected ranking:**
1. `high_risk_players` — score `cap(75 + 1×3, 90) = 78`
2. `player_progress_stalls` — score `cap(62 + 2×3, 78) = 68`
3. `assessment_coverage_gaps` — score `cap(58 + 3×2, 72) = 64`
4. `curriculum_template_coverage_gaps` — score `cap(56 + 2×2, 70) = 60`

**Key:** High-risk players still outrank all coverage gaps. ✅

**Expected:** ✅ "Existing high-risk players should still outrank coverage gaps" — confirmed.

---

### Scenario 8 — Missing wrap-ups + all coverage gaps ✅ PASS

**Setup:** `missingWrapUps=2, playerProgressStallCount=3, assessmentCoverageGapCount=2, assessmentContextAvailable=true, curriculumTemplateCoverageGapCount=2, templateCoverageContextAvailable=true`

**Expected ranking:**
1. `missing_wrap_ups` — score `cap(80 + 2×3, 95) = 86`
2. `player_progress_stalls` — score `cap(62 + 3×3, 78) = 71`
3. `assessment_coverage_gaps` — score `cap(58 + 2×2, 72) = 62`
4. `curriculum_template_coverage_gaps` — score `cap(56 + 2×2, 70) = 60`

**Key:** Wrap-ups still highest. All three new signals appear in correct order. ✅

**Expected:** ✅ "Missing wrap-ups should outrank all coverage gaps" — confirmed.

---

### Scenario 9 — All clear state ✅ PASS

**Setup:** All counts at 0, all availability flags false or true (doesn't matter when count = 0)

**Expected:** `buildAttentionPriorities(ctx)` → empty array.

Neither `player_progress_stalls` (count 0 → not pushed), `assessment_coverage_gaps` (count 0 → not pushed), nor `curriculum_template_coverage_gaps` (count 0 → not pushed) are emitted.

**Expected:** ✅ All-clear path unaffected.

---

### Scenario 10 — Missing context / availability false ✅ PASS

**Setup:** `playerProgressStallCount=5, playerProgressStallContextAvailable=false`

**Expected:** Signal NOT emitted because `playerProgressStallContextAvailable = false`.

Code: `if (ctx.playerProgressStallCount > 0 && ctx.playerProgressStallContextAvailable)` → second condition is false → block skipped.

**Expected:** ✅ Availability guards prevent false positives when context is unavailable.

---

## Safety Checks

| Check | Result |
|---|---|
| No DB calls in ranking engine | ✅ |
| No mutations | ✅ |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` manipulation | ✅ |
| Sprint 904 untouched | ✅ |
| Context guards on all 3 new signals | ✅ — `playerProgressStallContextAvailable`, `assessmentContextAvailable`, `templateCoverageContextAvailable` |
| `requiresApproval: false` for gap signals (no approval step, just awareness) | ✅ |
| `donnaWillNotDo` present for all 3 new signals | ✅ |
| No fabricated data (count = 0 → no priority) | ✅ |
| Existing signals unaffected | ✅ |

## Files Changed

- **Modified `src/lib/donna/donnaAttentionRankingEngine.ts`:** 3 new scoring constants + 3 new signal blocks inserted between advancement_eligible and curriculum_drafts sections
- **Created `docs/architecture/DONNA_COVERAGE_GAP_INTELLIGENCE_913_3.md`** — signal table, context guards, updated full ranking order
- **Created `docs/QA_DONNA_COVERAGE_GAP_INTELLIGENCE_913_3.md`** — 10 static QA scenarios
