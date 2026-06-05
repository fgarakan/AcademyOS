# Academy Health Activation V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2016–2030
**Goal:** Turn Academy Health from scattered signals into one executive intelligence layer.

---

## What Was Activated

### Phase 1 — Health Signal Inventory
Created `docs/qa/ACADEMY_HEALTH_SIGNAL_MAP_V1.md` mapping all 19 signals across source, computed status, surfaced status, and section assignment.

---

### Phase 2 — Academy Health Brief Sections Restructured

**File:** `src/lib/donna/intelligence/academyHealthBrief.ts`

**Before:** 6 sections with ad-hoc labels: Player progression, Assessment health, Coach wrap-ups, Curriculum health, Review queue, Retention signals.

**After:** 6 sections aligned to the sprint spec:

| Section | Label | Key Signals |
|---|---|---|
| 1 | Curriculum Health | bottleneck level, template gaps, tagged concerns, structural gaps |
| 2 | Player Progress Health | stalls, advancement eligible, assessment overdue |
| 3 | Review & Approval Health | pending count, oldest item age |
| 4 | Coach Execution Health | missing wrap-ups, session count |
| 5 | Parent Communication Health | high-risk players, attendance exceptions |
| 6 | Onboarding Health | onboardingReadinessLevel |

---

### Phase 3 — Critical Status Added

**File:** `src/lib/donna/intelligence/academyHealthBrief.ts`

**Before:** `status` was `'good' | 'watch' | 'action_needed'` — no severity above action_needed.

**After:** Added `'critical'` status. Thresholds:

| Section | `critical` trigger |
|---|---|
| Curriculum Health | `mostBlockedLevelStalledCount >= 3` |
| Player Progress Health | high-severity stalls >= 3 |
| Review & Approval Health | `oldestPendingReviewAgeDays >= 14` |
| Coach Execution Health | `missingWrapUps >= 5` |
| Parent Communication Health | not used (no hard threshold without parent comm data) |
| Onboarding Health | `onboardingReadinessLevel === 'not_started'` |

`buildAcademyHealthBriefAnswer()` updated: critical → 🚨, action_needed → 🔴, watch → 🟡, good → ✅.

---

### Phase 4 — DONNA Today Health Summary

**File:** `src/app/director/page.tsx`

**Before:** When `cooAttentionReport.topAction` was null, the brief fell directly to the all-clear message or counter list.

**After:** New intermediate branch: when `cooAttentionReport.topAction` is null but `academyHealthReport.topIssue` is set, the brief shows the top health issue and its recommendation. DONNA Today now reads from the health layer when the attention engine has no ranked item.

**Example:**
- Attention engine: no topAction
- Health report: `topIssue = "Setup incomplete — players or class templates still missing"`
- DONNA Today shows: "Setup incomplete — players or class templates still missing" with "Review" link

---

### Phase 5 — Source Map Cleanup

**File:** `src/lib/donna/academyHealthSourceMap.ts`

Changes:
- Fixed `daily_sessions` → `sessions` (incorrect table name in multiple entries)
- Updated `player_attention_risk` from stale table refs to current query pattern
- Updated `wrap_up_coverage_rate` from `partial` to `live`; corrected table to `sessions` + `voice_notes`
- Added 7 new signals with `live` availability: `curriculum_template_coverage_gaps`, `tagged_curriculum_concern` (partial), `player_progress_stalls`, `stale_review_queue`, `advancement_eligible`, `onboarding_readiness`, `assessment_coverage_gaps`

**Status summary after cleanup:**
| Availability | Count | KPI IDs |
|---|---|---|
| `live` | 8 | curriculum_template_coverage_gaps, player_progress_stalls, stale_review_queue, advancement_eligible, onboarding_readiness, assessment_coverage_gaps, player_attention_risk, wrap_up_coverage_rate |
| `partial` | 2 | curriculum_bottleneck, tagged_curriculum_concern |
| `deferred` | 2 | group_health, coach_support_needed |
| `not_yet_built` | 2 | review_queue_throughput, parent_trust_coverage |

---

### Phase 6 — AcademyHealthReport Object

**File:** `src/lib/donna/intelligence/academyHealthBrief.ts`

New exported types:
```ts
export type HealthStatus = 'good' | 'watch' | 'action_needed' | 'critical'

export interface AcademyHealthSection {
  id: string
  label: string
  status: HealthStatus
  summary: string
}

export interface AcademyHealthReport {
  overallStatus: HealthStatus
  topIssue: string | null
  topRecommendation: string | null
  recommendedRoute: string | null
  sections: AcademyHealthSection[]
  evidence: string[]
  limitations: string[]
  confidence: 'high' | 'partial' | 'low'
}
```

New function `buildAcademyHealthReport(ctx: DirectorDonnaContext): AcademyHealthReport`.

This function is **dashboard-path-safe** — it uses only fields populated by `buildDashboardAttentionContext()`. It does NOT call `buildAcademyHealthBrief()` which requires extended context fields.

`overallStatus` = worst status across all 6 sections. `topIssue` = first critical/action_needed section's summary.

---

## What Remains Hidden

| Intelligence | Why Hidden | What Would Unlock It |
|---|---|---|
| Parent last contact date per family | `parent_trust_coverage` KPI not yet built | Requires parent message send pipeline |
| Group health scores | No aggregation view built | Requires session-to-group attendance rollup |
| Coach engagement score | No scoring engine | Requires wrap-up frequency + quality analysis |
| `skillTaggedObservationsLast30Days` | Computed but not mapped to context | 1-field mapping sprint |
| Recap completion % in health report | `recapCompletionPct` computed on page but not in context | Pass through `buildDashboardAttentionContext` |

---

## What Should Go to Future Academy Health UI

The `AcademyHealthReport` object is ready to power a dedicated `/director/health` page:
- `overallStatus` → page-level status banner
- `sections[]` → 6-row section breakdown
- `evidence[]` → supporting data panel
- `topIssue` + `topRecommendation` → hero card
- `recommendedRoute` → primary CTA button

No new schema or queries needed. The object is fully computed from existing dashboard data.

---

## Acceptance Criteria

| Criterion | Status |
|---|---|
| Academy health signal map created | ✓ |
| Academy health brief sections restructured (6 named sections) | ✓ |
| `'critical'` status added with deterministic thresholds | ✓ |
| DONNA Today uses top health issue when attention engine has no topAction | ✓ |
| Source map cleaned up — stale entries corrected, 7 new signals added | ✓ |
| `AcademyHealthReport` object created | ✓ |
| `buildAcademyHealthReport()` is dashboard-path-safe | ✓ |
| QA report created | ✓ |
| Scorecard created | ✓ |
| No new schema | ✓ |
| No migrations | ✓ |
| No redesign | ✓ |
| TypeScript clean | ✓ |
