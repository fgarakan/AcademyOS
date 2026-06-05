# DONNA Executive Intelligence Scorecard V1

**Date:** 2026-06-05
**Sprints covered:** 2006–2015

---

## Attention Engine Signal Status

| Priority Item | Base Score | Status | Data Source |
|---|---|---|---|
| `missing_wrap_ups` | 80 | **LIVE** | `coachRecapsMissing` (completedSessionIds vs voice_notes) |
| `high_risk_players` | 75 | **LIVE** | `attentionCount` (on_hold or reassessment_due) |
| `attendance_exceptions` | 70 | **LIVE** | `pendingWrapUpsCount` |
| `stale_review_queue` | 65–75 | **LIVE** (Sprint 2011–2015) | `oldestPendingReviewAgeDays` — min age of pending proposed_action |
| `pending_reviews` | 60 | **LIVE** | `totalPendingReviews` |
| `player_progress_stalls` | 62 | **LIVE** (Sprint 2011–2015) | `playerProgressStalls[]` — named stall objects with days |
| `assessment_coverage_gaps` | 58 | **LIVE** | `reassessmentPipeline` |
| `curriculum_template_coverage_gaps` | 56 | **LIVE** (Sprint 2011–2015) | Set diff: enrolled level IDs vs template level IDs |
| `medium_risk_players` | 55 | **ZERO** | `mediumRiskPlayerCount` hardcoded 0 — no risk classifier yet |
| `curriculum_bottleneck` | 52 | **LIVE** (Sprint 1996–2005) | `loadCurriculumBottleneck()` → `player_requirement_progress` |
| `advancement_eligible` | 50 | **LIVE** | `advancementReadyCount` |
| `tagged_curriculum_concern` | 45 | **LIVE** (Sprint 2006–2010, gated Sprint 2011–2015) | `topTaggedConcern` + `topTaggedConcernCount ≥ 2` |
| `curriculum_drafts` | 40 | **LIVE** | `pendingSuggestionsCount` |
| `curriculum_gaps` | 35 | **LIVE** | `curricGapCount` |
| `onboarding_incomplete` | 30–45 | **LIVE** (Sprint 2011–2015) | `onboardingReadinessLevel` derived from activePlayers + classTemplateCount + sessionsExist |

**11 of 15 items: LIVE. 1 item: ZERO. 3 items: N/A (no data source exists yet)**

---

## Executive Brief Path (`constitutionBrief`)

| Source | Before Sprint 2006 | After Sprint 2006–2010 |
|---|---|---|
| Text content | Hardcoded counter list | `cooAttentionReport.topAction.label` when available |
| Urgency | Hardcoded based on total count | Maps from `topAction.severity` |
| Action link | Hardcoded "Review Queue" | `topAction.href` when available |
| Fallback | — | Counter list (preserved) |

---

## Academy Health Curriculum Row

| Signal | Before Sprint 2006 | After Sprint 2006–2010 |
|---|---|---|
| Lead content | Template gaps + structural gaps | Bottleneck level + stall count + completion % |
| Top concern | Not shown | `topTaggedConcern` appended |
| Status trigger | Template or structural gaps | Also triggers on stall data |

---

## Curriculum Intelligence Card (`/director/curriculum`)

| Signal | Before Sprint 1996 | After Sprint 1996–2005 | After Sprint 2006–2010 | After Sprint 2011–2015 |
|---|---|---|---|---|
| Most blocked level | Not shown | ✓ Level name + stall count + completion % | + `lowestDomainCompletionPct` | unchanged |
| Top tagged concern | Not shown | `topConcern` (rank #1 only) | unchanged | Top-3 ranked list with counts |
| Action link | Not shown | `?improve=[levelKey]` | unchanged | unchanged |

---

## Source Map Reality

| KPI | Availability | Tables |
|---|---|---|
| `curriculum_bottleneck` | `partial` | `player_requirement_progress`, `curriculum_levels`, `coach_observations` |
| `player_attention_risk` | `partial` | `players`, `coach_observations` |
| `wrap_up_coverage_rate` | `partial` | `sessions`, `voice_notes` |
| `group_health` | `deferred` | No data source yet |

---

## Remaining Gaps (Priority Order)

1. **`medium_risk_players`** — no risk classifier exists. Score 55. When built, this will rank above curriculum signals.
2. **`skillTaggedObservationsLast30Days`** — computed in `CurriculumBottleneckResult`, not mapped to `DirectorDonnaContext`. Would improve concern-gating granularity.
3. **Per-level concern breakdown** — bottleneck loader aggregates globally. Director cannot see "this concern is concentrated at Orange Ball 2".
4. **`evidence_threshold_met` gate** — threshold field is free-text; no parser built. Gate always evaluates to true.
