# Academy Health Scorecard V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2016–2030

---

## Section Readiness Scores

### 1. Curriculum Health — 7/10

| Dimension | Score | Notes |
|---|---|---|
| Signal coverage | 8/10 | Bottleneck, template gaps, tagged concerns, structural gaps all live |
| Scoring accuracy | 7/10 | Deterministic; missing per-level concern breakdown |
| DONNA Today integration | 8/10 | Leads brief when attention engine has curriculum bottleneck ranked |
| Data freshness | 6/10 | `player_requirement_progress` partial (10 rows); bottleneck data is available but thin |
| Future potential | 8/10 | Per-level concern breakdown would elevate to 9/10 |

**Current blockers:** `skillTaggedObservationsLast30Days` not mapped to context. Evidence drought in `player_evidence_records`.

---

### 2. Player Progress Health — 7/10

| Dimension | Score | Notes |
|---|---|---|
| Signal coverage | 8/10 | Stalls, eligible, assessment gaps all live with named player objects |
| Scoring accuracy | 8/10 | Deterministic thresholds; critical at >= 3 high-severity stalls |
| DONNA Today integration | 7/10 | Fires via attention engine (`player_progress_stalls` score 62) |
| Data freshness | 7/10 | All from live tables; `enrolled_at` staleness depends on data quality |
| Future potential | 8/10 | Gate evidence signals would elevate this section |

**Current blockers:** `eligibleWithoutAssessmentEvidence` only on full context path, not dashboard path.

---

### 3. Review & Approval Health — 9/10

| Dimension | Score | Notes |
|---|---|---|
| Signal coverage | 9/10 | Pending count + oldest item age both live |
| Scoring accuracy | 9/10 | Critical at 14+ days; action_needed at 7+ days — well-calibrated |
| DONNA Today integration | 9/10 | `stale_review_queue` fires at 7+ days in attention engine |
| Data freshness | 10/10 | Real-time from `proposed_actions` |
| Future potential | 8/10 | Per-module breakdown (wrap-ups vs placements vs assessments) would improve specificity |

**Strongest section** — all signals live, deterministic scoring, direct DONNA Today path.

---

### 4. Coach Execution Health — 7/10

| Dimension | Score | Notes |
|---|---|---|
| Signal coverage | 7/10 | Missing wrap-ups live; recap completion % computed but not in health report |
| Scoring accuracy | 7/10 | Critical at >= 5 gaps; action_needed at >= 3 — reasonable thresholds |
| DONNA Today integration | 8/10 | `missing_wrap_ups` is highest-weighted signal (score 80) |
| Data freshness | 8/10 | Cross-referenced from live sessions + voice_notes |
| Future potential | 7/10 | Coach engagement score would add depth |

**Improvement:** Pass `recapCompletionPct` into `buildDashboardAttentionContext` to surface the % in the health report.

---

### 5. Parent Communication Health — 5/10

| Dimension | Score | Notes |
|---|---|---|
| Signal coverage | 4/10 | Only proxy signals available (high-risk player count, attendance exceptions) |
| Scoring accuracy | 6/10 | Proxy thresholds are functional but indirect |
| DONNA Today integration | 5/10 | No direct parent comm attention item yet |
| Data freshness | 7/10 | Underlying signals are live |
| Future potential | 9/10 | `parent_trust_coverage` KPI would transform this section |

**Weakest section** — true parent communication data (last contact date, approval-to-send pipeline) is not yet built. This section is a holding signal until `parent_trust_coverage` is live.

---

### 6. Onboarding Health — 8/10

| Dimension | Score | Notes |
|---|---|---|
| Signal coverage | 8/10 | `onboardingReadinessLevel` correctly derived from 3 signals |
| Scoring accuracy | 9/10 | Deterministic 4-level classification; critical for not_started is appropriate |
| DONNA Today integration | 7/10 | `onboarding_incomplete` fires for not_started/partial in attention engine |
| Data freshness | 9/10 | Derived at request time from live data |
| Future potential | 7/10 | Official `academy.settings` onboarding flags would provide more detail |

---

## Overall Academy Health Readiness — 7/10

| Category | Score |
|---|---|
| Curriculum Health | 7/10 |
| Player Progress Health | 7/10 |
| Review & Approval Health | 9/10 |
| Coach Execution Health | 7/10 |
| Parent Communication Health | 5/10 |
| Onboarding Health | 8/10 |
| **Overall** | **7.2/10** |

---

## What Lifts the Score

| Action | Impact | Effort |
|---|---|---|
| Map `recapCompletionPct` to health report context | +0.3 Coach Execution | Low |
| Map `skillTaggedObservationsLast30Days` to `DirectorDonnaContext` | +0.5 Curriculum | Low |
| Build parent comm send pipeline + `parent_trust_coverage` | +2.0 Parent Communication | High |
| Build group health aggregation view | +0.5 new section | Medium |
| Add per-level concern breakdown to bottleneck loader | +1.0 Curriculum | Medium |
| Wire evidence records pipeline (`player_evidence_records`) | +1.0 Player Progress | High |

---

## Source Map Summary

| KPI | Availability | Health Section |
|---|---|---|
| `curriculum_bottleneck` | partial | Curriculum Health |
| `curriculum_template_coverage_gaps` | live | Curriculum Health |
| `tagged_curriculum_concern` | partial | Curriculum Health |
| `player_progress_stalls` | live | Player Progress Health |
| `advancement_eligible` | live | Player Progress Health |
| `assessment_coverage_gaps` | live | Player Progress Health |
| `stale_review_queue` | live | Review & Approval Health |
| `player_attention_risk` | live | Coach / Parent proxy |
| `wrap_up_coverage_rate` | live | Coach Execution Health |
| `onboarding_readiness` | live | Onboarding Health |
| `group_health` | deferred | Not yet assigned |
| `coach_support_needed` | deferred | Not yet assigned |
| `review_queue_throughput` | not_yet_built | Review & Approval (future) |
| `parent_trust_coverage` | not_yet_built | Parent Communication Health (future) |
