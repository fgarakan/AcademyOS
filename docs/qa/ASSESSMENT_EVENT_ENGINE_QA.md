# Assessment Event Engine — QA Checklist

**Sprint:** Mega Sprint 1113-1120
**Date:** 2026-06-02

---

## File existence

| File | Status |
|---|---|
| `supabase/migrations/079_assessment_events.sql` | ✅ |
| `src/lib/blueprint/assessmentComparisonEngine.ts` | ✅ |
| `src/lib/blueprint/blueprintUpdateRecommendationEngine.ts` | ✅ |
| `src/app/director/players/[playerId]/assessmentEventActions.ts` | ✅ |

---

## Migration 079 — assessment_events

| Check | Expected | Status |
|---|---|---|
| Table created with all required columns | id, academy_id, player_id, type, mode, trigger_source, requested_by, assessor_id, scheduled_for, status, assessment_id, etc. | ✅ |
| `assessment_type` has correct CHECK constraint | 10 valid values | ✅ |
| `assessment_mode` has correct CHECK constraint | quick, standard, deep | ✅ |
| `status` has correct CHECK constraint | draft, scheduled, in_progress, completed, reviewed, archived | ✅ |
| RLS enabled | Yes | ✅ |
| Directors see all events | Policy present | ✅ |
| Coaches see only own assessor events | Policy present | ✅ |
| Directors can create events | INSERT policy present | ✅ |
| Coaches can update in_progress events only | Policy scope limited to in_progress + own assessor_id | ✅ |
| updated_at trigger present | Yes | ✅ |
| `assessment_id` FK references assessments | Yes | ✅ |
| `previous_assessment_id` FK references assessments | Yes | ✅ |

---

## Comparison Engine — `assessmentComparisonEngine.ts`

| Check | Expected | Status |
|---|---|---|
| `compareAssessments(prev, current)` returns all domains | 6 domains including overall | ✅ |
| `ChangeLabel` covers all 8 tiers | strong_improvement through strong_decline + no_data | ✅ |
| Null scores → `no_data` | Graceful null handling | ✅ |
| `delta > 1.5` → `strong_improvement` | Threshold correct | ✅ |
| `delta < -1.5` → `strong_decline` | Threshold correct | ✅ |
| `needsFocus = true` for declined or below-threshold domains | Logic correct | ✅ |
| `readyForLevelReview` requires overall improvement OR 3+ domains improved | Logic correct | ✅ |
| `blueprintUpdateRecommended` requires 14+ days + 2+ improved | Logic correct | ✅ |
| `summaryText` contains domain-by-domain comparison | Human-readable | ✅ |
| Pure TypeScript — no DB calls | Yes | ✅ |

---

## Blueprint Update Recommendation Engine — `blueprintUpdateRecommendationEngine.ts`

| Check | Expected | Status |
|---|---|---|
| `generateBlueprintUpdateRecommendations(comparison)` returns primary action | One of 6 actions | ✅ |
| `flag_concern` recommended when hasSignificantDecline + declined domains exist | Yes | ✅ |
| `trigger_level_review` recommended when readyForLevelReview | Yes | ✅ |
| `archive_and_regenerate` when 3+ domains improved and overall improved | Yes | ✅ |
| `update_priorities` when 2+ domains improved but not enough for full regeneration | Yes | ✅ |
| `trigger_parent_update` when overall improved + no significant decline | Yes | ✅ |
| `keep` when no significant changes | Default fallback | ✅ |
| All high-priority recs set `routesToReviewQueue: true` | Yes | ✅ |
| `requiresDirectorApproval: true` for all recs except `keep` | Yes | ✅ |
| Pure TypeScript — no DB calls | Yes | ✅ |

---

## Assessment Event Actions — `assessmentEventActions.ts`

| Check | Expected | Status |
|---|---|---|
| `createAssessmentEventAction` — auth check | Yes | ✅ |
| `createAssessmentEventAction` — academyId server-resolved | Yes | ✅ |
| `createAssessmentEventAction` — director/head_coach only | Yes | ✅ |
| `createAssessmentEventAction` — player verified in academy | Yes | ✅ |
| `createAssessmentEventAction` — links previous_assessment_id | Yes | ✅ |
| `createAssessmentEventAction` — schema missing detection | `isSchemaMissing: true` returned | ✅ |
| `createAssessmentEventAction` — audit log written | Yes | ✅ |
| `completeAssessmentEventAction` — creates assessments row | Yes — via `supabase.from('assessments').insert` | ✅ |
| `completeAssessmentEventAction` — runs comparison if previous exists | Yes | ✅ |
| `completeAssessmentEventAction` — stores blueprint_recommendation | Yes | ✅ |
| `completeAssessmentEventAction` — no automatic blueprint update | Recommendation only, no auto mutation | ✅ |
| `completeAssessmentEventAction` — audit log written | Yes | ✅ |
| `assertNotPreviewMode()` in both actions | Yes | ✅ |

---

## TypeScript

```
npx tsc --noEmit → clean
```

---

## Known V1 limitations

| Limitation | Notes |
|---|---|
| No assessment form UI | `createAssessmentEventAction` and `completeAssessmentEventAction` exist; UI form is a future sprint |
| Blueprint update not automatically triggered after completion | System generates recommendation; director manually triggers via separate action |
| AssessmentsTab "Start Reassessment" is placeholder | Action exists, form not yet built |
| Migration 079 must be applied to live DB | Actions return `isSchemaMissing: true` gracefully if not applied |
