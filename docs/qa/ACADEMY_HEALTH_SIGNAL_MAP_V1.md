# Academy Health Signal Map V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2016–2030

---

## Signal Inventory

| Signal | Source | Already Computed? | Already Surfaced? | DONNA Today? | Academy Health? | Priority |
|---|---|---|---|---|---|---|
| Curriculum bottleneck (level + stall count) | `player_requirement_progress` via `loadCurriculumBottleneck()` | ✓ | ✓ (DONNA Today brief, Health card) | ✓ | ✓ Curriculum Health | P0 |
| Curriculum template coverage gaps | Set diff: `player_curriculum_states.current_level_id` vs `templates.curriculum_level_id` | ✓ (Sprint 2011–2015) | ✗ (not yet surfaced in Health) | ✗ | ✓ Curriculum Health | P1 |
| Tagged curriculum concern | `coach_observations.tags` via `loadCurriculumBottleneck()` | ✓ (Sprint 2006–2010) | ✓ (CurriculumIntelligenceCard top-3, attention item) | ✓ via attention engine | ✓ Curriculum Health | P1 |
| Player progress stalls | `player_curriculum_states.enrolled_at` + join to `players` | ✓ (Sprint 2011–2015) | Partial (attention item with names) | ✓ via attention engine | ✓ Player Progress Health | P0 |
| Advancement eligible count | `player_curriculum_states.advancement_eligible` | ✓ | ✓ (KPI tile, DONNA Today) | ✓ via attention engine | ✓ Player Progress Health | P0 |
| Assessment coverage gaps (overdue) | `getReassessmentPipeline()` | ✓ | ✓ (KPI tile) | ✓ via attention engine | ✓ Player Progress Health | P1 |
| Players without assessment evidence | `assessmentCoverageGapDetector` | ✓ | ✓ via Academy Health brief | ✓ via health brief | ✓ Player Progress Health | P1 |
| Stale review queue age | `proposed_actions.created_at` oldest pending | ✓ (Sprint 2011–2015) | ✗ (fires in attention engine) | ✓ via attention engine | ✓ Review & Approval Health | P0 |
| Pending reviews (total) | `proposed_actions` WHERE status=pending_review | ✓ | ✓ (header badge, KPI tile) | ✓ via attention engine | ✓ Review & Approval Health | P0 |
| Missing coach wrap-ups | Cross: `sessions` vs `voice_notes` | ✓ | ✓ (KPI tile, attention item) | ✓ via attention engine | ✓ Coach Execution Health | P0 |
| Attendance exceptions | `proposed_actions` WHERE target_module=session_wrap_up_v1 | ✓ | ✓ (KPI tile) | ✓ via attention engine | ✓ Coach Execution Health | P1 |
| High-risk player count | `players.player_status` (on_hold, reassessment_due) | ✓ | ✓ (KPI tile, Priority Queue) | ✓ via attention engine | ✓ Parent Communication Health | P0 |
| Onboarding readiness level | Derived: activePlayers + classTemplateCount + sessionsExist | ✓ (Sprint 2011–2015) | ✗ (fires in attention engine) | ✓ via attention engine | ✓ Onboarding Health | P1 |
| Session activity (this week) | `sessions` WHERE scheduled_date in week range | ✓ | ✓ (Sessions This Week section) | ✗ | — | P2 |
| Recent decisions | `proposed_actions` ORDER BY approved_at DESC LIMIT 15 | ✓ (full context path) | ✗ | ✗ | — | P2 |
| Curriculum drafts / AI suggestions | `academy_suggestions` WHERE status=pending | ✓ | ✓ (KPI tile, AI Suggestions section) | ✓ via attention engine | ✓ Curriculum Health | P2 |
| Parent trust coverage | No pipeline built yet | ✗ | ✗ | ✗ | — | Deferred |
| Group health score | No aggregation view built | ✗ | ✗ | ✗ | — | Deferred |
| Coach support needs | No scoring engine built | ✗ | ✗ | ✗ | — | Deferred |

---

## Section Mapping

### Curriculum Health
Signals used:
- `mostBlockedLevelStalledCount` + `mostBlockedLevelName` + `mostBlockedLevelAvgCompletion`
- `curriculumTemplateCoverageGapCount`
- `topTaggedConcern`
- `curriculumGaps.length`
- `curriculumDraftCount`

Status thresholds:
- `critical` when `mostBlockedLevelStalledCount >= 3`
- `action_needed` when stalls > 0 OR template gaps > 0 OR structural gaps > 0
- `watch` when concern only OR drafts only
- `good` when no signals

### Player Progress Health
Signals used:
- `playerProgressStallCount` + `playerProgressStalls[]`
- `advancementEligibleCount`
- `assessmentCoverageGaps[]` (overdue filter)
- `eligibleWithoutAssessmentEvidence` (full context path only)

Status thresholds:
- `critical` when high-severity stalls >= 3
- `action_needed` when stalls >= 3 OR stalls + overdue > 0
- `watch` when stalls > 0
- `good` when eligible only and no stalls

### Review & Approval Health
Signals used:
- `pendingReviews`
- `oldestPendingReviewAgeDays`

Status thresholds:
- `critical` when `oldestPendingReviewAgeDays >= 14`
- `action_needed` when pending >= 5 OR age >= 7
- `watch` when pending > 0
- `good` when queue empty

### Coach Execution Health
Signals used:
- `missingWrapUps`
- `todaySessions`

Status thresholds:
- `critical` when `missingWrapUps >= 5`
- `action_needed` when `missingWrapUps >= 3`
- `watch` when `missingWrapUps > 0`
- `good` when all wrapped or no sessions

### Parent Communication Health
Signals used:
- `highRiskPlayerCount`
- `mediumRiskPlayerCount`
- `attendanceExceptions`

Status thresholds:
- `action_needed` when `highRiskPlayerCount >= 3`
- `watch` when highRisk > 0 OR attendance > 0
- `good` when no risk signals

Note: `parent_trust_coverage` (last parent contact date per family) is not yet built. This section uses high-risk player flags as a proxy.

### Onboarding Health
Signals used:
- `onboardingReadinessLevel` (not_started / partial / nearly_ready / ready_signal / unknown)

Status thresholds:
- `critical` when `not_started`
- `action_needed` when `partial`
- `watch` when `nearly_ready`
- `good` when `ready_signal`

---

## Hidden Signals (not yet surfaced in any health section)

| Signal | Where Computed | Why Not Surfaced |
|---|---|---|
| `skillTaggedObservationsLast30Days` | `CurriculumBottleneckResult` | Not mapped to `DirectorDonnaContext` |
| Per-level concern breakdown | `coach_observations` | Aggregated globally; no per-level breakdown |
| Coach wrap-up submission rate (%) | `computeRecapCompletionRate()` | Not passed into `DirectorDonnaContext` on dashboard path |
| Group capacity signals | `v_group_summary` | Available on dashboard page but not in context |
| Parent last contact date | Not built | `parent_trust_coverage` requires new pipeline |
| Evidence drought | `player_evidence_records` | 0 rows — no evidence generation pipeline yet |
