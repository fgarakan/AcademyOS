# Player Development Blueprint — QA Checklist

**Sprint:** Player Development Blueprint System — Sprint 1112
**Date:** 2026-06-02

---

## File existence checks

| File | Status |
|---|---|
| `supabase/migrations/078_player_development_blueprints.sql` | ✅ |
| `src/lib/blueprint/priorityEngine.ts` | ✅ |
| `src/lib/blueprint/blueprintGenerator.ts` | ✅ |
| `src/app/director/placement/generateBlueprintAction.ts` | ✅ |
| `src/app/director/placement/placementDraftAction.ts` (modified) | ✅ |
| `src/lib/donna/donnaPlayerBlueprintContext.ts` | ✅ |
| `docs/architecture/PLAYER_DEVELOPMENT_BLUEPRINT.md` | ✅ |

---

## Priority Engine — `priorityEngine.ts`

| Check | Expected | Status |
|---|---|---|
| `generateBlueprintPriorities()` returns 4 pathways | skill, competition, fitness, mental — each with 3 priorities | ✅ |
| Each priority has rank, label, description, why, pathway | All 5 fields present | ✅ |
| Score tier `emerging` triggered when score < 5 | Returns beginning-level priorities | ✅ |
| Score tier `developing` triggered when score 5–7.5 | Returns intermediate priorities | ✅ |
| Score tier `established` triggered when score > 7.5 | Returns advanced priorities | ✅ |
| Null scores default to `emerging` | Graceful null handling | ✅ |
| Stage `red_foundation` uses foundation tier | Age-appropriate priorities returned | ✅ |
| Stage `high_performance` uses performance tier | Elite priorities returned | ✅ |
| Competition score uses average of `competition_score` + `tactical_score` | Both dimensions considered | ✅ |
| `getTopPriorities()` returns rank-1 from each pathway | 4 priorities, one per pathway | ✅ |

---

## Blueprint Generator — `blueprintGenerator.ts`

| Check | Expected | Status |
|---|---|---|
| `generateBlueprint()` accepts full input and returns all sections | Priorities, plan, missions, brief, parent summary, DONNA brief | ✅ |
| 30-day plan has one focus per pathway + rationale | skillFocus, competitionFocus, fitnessFocus, mentalFocus, rationale | ✅ |
| 30-day rationale references stage name | Stage label appears in rationale | ✅ |
| Mission generator produces exactly 3 missions | Skill, competition, mental pathways | ✅ |
| Each mission has label, description, linkedPriority, linkedPathway | 5 fields present | ✅ |
| Mission label templates map known priorities to friendly titles | ~20 templates verified | ✅ |
| Unknown priorities fall back to `Mission: {label}` | Graceful fallback | ✅ |
| Coach brief under ~200 words | Readable in <60 seconds | ✅ |
| Coach brief contains: player name, level, strengths, priorities, focus areas | All sections present | ✅ |
| Parent summary uses no ratings, no negative language, no internal terminology | Parent-safe validation | ✅ |
| Parent next steps are actionable and friendly | 3 steps, present-tense, encouraging | ✅ |
| DONNA brief is structured multi-line text | Parseable by DONNA context reader | ✅ |

---

## Server action — `generateBlueprintAction.ts`

| Check | Expected | Status |
|---|---|---|
| `assertNotPreviewMode()` called | Blocked in preview/demo mode | ✅ |
| `academyId` verified against `profiles.academy_id` | No cross-academy writes | ✅ |
| Role check: director or head_coach only | Other roles rejected | ✅ |
| Player verified to belong to this academy | Cross-player writes blocked | ✅ |
| `placement_recommendations` fetched with `status='activated'` | Latest activated placement used | ✅ |
| Falls back to latest baseline assessment if placement has no assessment_id | Graceful fallback | ✅ |
| Falls back to curriculum defaults if no level found | `levelName = 'Orange Ball 1'`, `stage = 'orange_development'` | ✅ |
| Existing active blueprint archived before new insert | `status → superseded` | ✅ |
| Blueprint insert uses rawDb | Table not in generated types | ✅ |
| `isSchemaMissing: true` returned when migration 078 not applied | Explicit error, no crash | ✅ |
| 3 missions created with `status='pending_review'` | Never auto-activated | ✅ |
| Mission insert failure is non-fatal | Blueprint still returned on mission failure | ✅ |
| `player_development_summary` upserted | Existing row updated if present | ✅ |
| `show_to_parent = false` on summary | Parent cannot see until director enables | ✅ |
| `audit_logs` written with full payload | blueprint_id, priorities, assessment_id, mission count | ✅ |
| `revalidatePath` for player profile, players list, review queue | Cache invalidated after generation | ✅ |
| Returns `{ ok, blueprintId, missionIds }` | Structured result for caller | ✅ |

---

## Placement integration — `placementDraftAction.ts`

| Check | Expected | Status |
|---|---|---|
| `activatePlayerAction` imports `generateBlueprintAction` | Import present | ✅ |
| `generateBlueprintAction` called after successful RPC | Triggered on success, not on error | ✅ |
| Call is fire-and-forget (`void`) | Blueprint failure does not block placement | ✅ |
| `activatePlayerAction` now returns `{ playerId? }` | Caller can chain actions | ✅ |
| TypeScript passes | No errors introduced | ✅ |

---

## DONNA Blueprint Context — `donnaPlayerBlueprintContext.ts`

| Check | Expected | Status |
|---|---|---|
| `donnaBlueprintAnswer()` routes all 8 intents correctly | All intent cases handled | ✅ |
| `why_placed_here` includes rationale and stage description | Not just level name | ✅ |
| `coach_first_focus` includes focus areas and 30-day plan | Actionable for coach | ✅ |
| `parent_summary` is role-gated | Directors see coach brief; parents see parent summary | ✅ |
| `player_home_practice` references 30-day plan | Directly tied to blueprint data | ✅ |
| `mission_status` references pending count and review queue | Actionable for director | ✅ |
| All functions return honest fallback when blueprint is null | No invented answers | ✅ |
| Parent-facing functions never reference coachBrief | Safety verified | ✅ |
| Player-facing functions use `parentThirtyDayPreview` only | Safety verified | ✅ |

---

## Parent safety checks

| Check | Expected |
|---|---|
| Parent summary has no score numbers | No "7.5 out of 10" language |
| Parent summary has no negative labels | No "weakness", "gap", "deficiency" |
| Parent summary has no internal coaching terminology | No "contact spacing", "serve rhythm" — uses plain language |
| Parent summary references strengths first | Positive framing |
| `show_to_parent = false` by default | Director must explicitly enable |
| DONNA parent summary is role-gated | Parents only see parentSummary field |

---

## Blueprint evolution checks

| Check | Expected |
|---|---|
| Existing active blueprint archived on new generation | `status = 'superseded'`, `superseded_at` set |
| `superseded_by` column supports future comparison | Schema supports chain traversal |
| Only one active blueprint per player at any time | Enforced by archive-before-insert pattern |

---

## Audit trail checks

| Mutation | Audit log entry | Expected |
|---|---|---|
| Blueprint generated | `action = 'player_blueprint_generated'` | ✅ |
| Blueprint includes mission IDs in payload | Traceable to review queue items | ✅ |
| Blueprint includes top 4 priority labels | Blueprint content in audit | ✅ |

---

## TypeScript

```
npx tsc --noEmit → clean
```

---

## Known V1 limitations

| Limitation | Notes |
|---|---|
| Migration 078 pending | `isSchemaMissing: true` returned gracefully until applied |
| No blueprint display UI | Data exists in DB; player profile tab is a future sprint |
| No blueprint comparison UI | Schema ready; comparison view deferred |
| Priority generation is deterministic | AI-enhanced suggestions are a future sprint |
| `show_to_parent = false` by default | Director must explicitly approve parent visibility |
