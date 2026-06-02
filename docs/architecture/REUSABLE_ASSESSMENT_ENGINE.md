# Reusable Assessment Engine Architecture

**Sprint:** Mega Sprint 1113-1120
**Date:** 2026-06-02
**Migration:** `079_assessment_events.sql`
**Library:** `src/lib/blueprint/assessmentComparisonEngine.ts`, `src/lib/blueprint/blueprintUpdateRecommendationEngine.ts`
**Server actions:** `src/app/director/players/[playerId]/assessmentEventActions.ts`

## Problem

The existing `assessments` table stores scored assessments but has no workflow state. It doesn't track:
- Whether an assessment was scheduled or ad-hoc
- What triggered it (onboarding, quarterly review, DONNA recommendation, etc.)
- The comparison to the previous assessment
- What blueprint changes should follow

## Solution

`assessment_events` wraps `assessments` with a workflow state machine:

```
draft → scheduled → in_progress → completed → reviewed → archived
```

On `completed`, the event is linked to a new `assessments` row via `assessment_id`.
On completion, the system automatically:
1. Runs `compareAssessments(previous, current)` if a previous assessment exists
2. Runs `generateBlueprintUpdateRecommendations(comparison)` to suggest blueprint changes
3. Stores `blueprint_recommendation` on the event row

All recommendations require director approval. No automatic blueprint updates.

## Assessment Event Types

| Type | When used |
|---|---|
| `onboarding_placement` | Initial placement assessment |
| `monthly_development_check` | Regular monthly progress check |
| `quarterly_progress_review` | Quarterly deep assessment |
| `level_readiness_review` | Assessing readiness for level move |
| `competition_readiness_review` | Pre-competition readiness |
| `fitness_review` | Fitness-specific assessment |
| `mental_performance_review` | Mental performance focus |
| `director_requested` | Ad-hoc director request |
| `coach_requested` | Coach-initiated request |
| `donna_recommended` | DONNA flagged a reassessment need |

## Assessment Modes

| Mode | Depth | Approximate time |
|---|---|---|
| `quick` | Key scores only (tech + movement + overall) | 10 min |
| `standard` | All 5 domains + strengths/gaps | 20-30 min |
| `deep` | All domains + priorities + notes + promotion review | 45-60 min |

## Comparison Engine

**File:** `src/lib/blueprint/assessmentComparisonEngine.ts`

`compareAssessments(previous, current)` returns:
- Per-domain change labels: `strong_improvement | improvement | slight_improvement | stable | slight_decline | decline | strong_decline | no_data`
- Summary counts: improved, declined, stable
- Derived flags: `overallImproved`, `hasSignificantDecline`, `readyForLevelReview`, `blueprintUpdateRecommended`
- `summaryText`: human-readable comparison for DONNA and director review

## Blueprint Update Recommendation Engine

**File:** `src/lib/blueprint/blueprintUpdateRecommendationEngine.ts`

`generateBlueprintUpdateRecommendations(comparison)` returns:
- Primary recommended action: `keep | update_priorities | archive_and_regenerate | trigger_level_review | trigger_parent_update | flag_concern`
- Ordered list of recommendations with priority, rationale, and review queue routing flag
- `overallStatus`: `no_change | update_recommended | review_required | concern_flagged`

All high-priority recommendations set `routesToReviewQueue: true`. No automatic mutations.

## Reassessment Workflow

```
Director → createAssessmentEventAction(playerId, type, mode)
        → event (draft or scheduled)

Director → completeAssessmentEventAction(eventId, scores, strengths, weaknesses)
        → new assessments row (via supabase.from('assessments').insert)
        → compareAssessments(previous, current)
        → generateBlueprintUpdateRecommendations(comparison)
        → event updated: status=completed, assessment_id, blueprint_recommendation
        → audit log written

Director reviews comparison → decides to:
  keep         → no changes
  update       → triggers generateBlueprintAction (fire-and-forget)
  level review → creates level_review proposed_action → review queue
  parent update → creates parent_communication proposed_action → review queue
```

## DONNA Development Intelligence (Sprint 1113-1120 extensions)

`donnaPlayerBlueprintContext.ts` now answers 5 additional intents:

| Intent | Question answered |
|---|---|
| `is_ready_for_reassessment` | Based on days since last assessment |
| `is_ready_for_level_review` | Based on gate completion percentage |
| `what_improved_since_last_assessment` | Uses comparisonSummary from comparison engine |
| `what_missions_should_stay_active` | References 30-day plan alignment |
| `what_is_blocking_level_movement` | Gates remaining + current gaps |

All answers are data-driven. DONNA never invents assessments or movements.

## V1 limitations

- `completeAssessmentEventAction` exists but no form UI for entering scores during a reassessment
- Blueprint update after completion requires a separate action call (not yet wired in the UI)
- AssessmentsTab shows the "Start Reassessment" CTA as text-only placeholder
