# Player Development Center — QA Checklist

**Sprint:** Mega Sprint 1113-1120
**Date:** 2026-06-02

---

## File existence

| File | Status |
|---|---|
| `src/app/director/players/[playerId]/_components/DevelopmentCenterTab.tsx` | ✅ |
| `src/app/director/players/[playerId]/_components/MissionsTab.tsx` | ✅ |
| `src/app/director/players/[playerId]/_components/AssessmentsTab.tsx` | ✅ |
| `src/app/director/players/[playerId]/_components/missionFormActions.ts` | ✅ |
| `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx` (modified) | ✅ |
| `src/app/director/players/[playerId]/page.tsx` (modified) | ✅ |

---

## PlayerProfileTabs changes

| Check | Expected | Status |
|---|---|---|
| VALID_TABS includes 'development', 'missions', 'assessments' | Yes | ✅ |
| New tabs are optional props (won't break if not passed) | `?: ReactNode` | ✅ |
| Blueprint tab appears BEFORE Skill Path | Logical ordering | ✅ |
| Existing tabs unchanged | Skill Path, Competition, Fitness, Notes, Session History still present | ✅ |

---

## DevelopmentCenterTab

| Check | Expected | Status |
|---|---|---|
| Server Component — no 'use client' | Yes | ✅ |
| Fetches blueprint via rawDb (table not in generated types) | Yes | ✅ |
| Fetches pending mission count separately | Yes | ✅ |
| Empty state shown when no blueprint | Clear message with directions | ✅ |
| Missing migration (rawDb error) handled gracefully | Try/catch, empty state shown | ✅ |
| All 4 priority pathways shown | skill, competition, fitness, mental | ✅ |
| Each pathway shows 3 priorities | rank, label, description | ✅ |
| 30-day plan shows 4 focuses + rationale | skillFocus, competitionFocus, fitnessFocus, mentalFocus | ✅ |
| Coach focus areas shown | Top 3 | ✅ |
| DONNA brief collapsible | details/summary element | ✅ |
| Pending missions alert shown | lime badge when count > 0 | ✅ |
| No parent/player data exposed | Director-only route | ✅ |

---

## MissionsTab

| Check | Expected | Status |
|---|---|---|
| Server Component | Yes | ✅ |
| Fetches from player_mission_assignments via rawDb | Yes | ✅ |
| Missing migration returns clear message | ✅ | ✅ |
| Groups by: pending_review, active, completed, other | 4 groups | ✅ |
| Empty state when no missions | Clear message | ✅ |
| Pending review group shows explanation banner | Yes | ✅ |
| Approve button uses `approveMissionFormAction.bind(null, id)` | Proper Next.js form action | ✅ |
| Skip button uses `skipMissionFormAction.bind(null, id)` | Proper Next.js form action | ✅ |
| Form action wrappers have correct `(id, FormData)` signature | Yes | ✅ |
| Actions route through `approveMissionAction` → `playerMissionDraftAction.ts` | Yes | ✅ |
| Actions write audit logs | Via approveMissionAction internals | ✅ |
| No raw coach notes shown | Mission labels only, no internal coach notes | ✅ |

---

## AssessmentsTab

| Check | Expected | Status |
|---|---|---|
| Server Component | Yes | ✅ |
| Reads from `assessments` table (always available) | Yes | ✅ |
| Reads from `assessment_events` with graceful fallback | Yes — try/catch | ✅ |
| Score bars render correctly per domain | 5 domains, colored by tier | ✅ |
| Change arrows shown when previous assessment exists | TrendingUp / TrendingDown / Minus | ✅ |
| Empty state when no assessments | Clear message | ✅ |
| Blueprint recommendations shown from completed events | Yes | ✅ |

---

## DONNA Development Intelligence

| Check | Expected | Status |
|---|---|---|
| 5 new intents added to BlueprintQuestionIntent type | is_ready_for_reassessment, is_ready_for_level_review, what_improved_since_last_assessment, what_missions_should_stay_active, what_is_blocking_level_movement | ✅ |
| DevelopmentIntelligenceInput extends BlueprintContextInput | Yes | ✅ |
| All 5 new answer functions return honest fallback when data missing | Yes | ✅ |
| donnaBlueprintAnswer router handles all 13 intents | Yes | ✅ |
| No level movement is implied/promised | "no movement without approval" in all level-related answers | ✅ |

---

## Safety checks

| Check | Expected |
|---|---|
| Parent summary never shown in DevelopmentCenterTab | Only coach_brief shown |
| DONNA brief is internal — shown in Director tab only | Correct |
| MissionsTab shows all statuses to director | Approved |
| Approve/Skip actions require active membership (from server action validation) | Yes |
| Cross-player writes blocked by player+academy_id filters | Yes |
| Audit logs written for mission approval/skip | Via existing approveMissionAction |

---

## TypeScript

```
npx tsc --noEmit → clean
```
