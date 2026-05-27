# Sprint 863 — DONNA Session Detail Context V1

**Date:** 2026-05-27
**Sprint:** 863
**Type:** Implementation — Server Action fetch function + switch case
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Scope

Implements `fetchSessionDetailContext` in `donnaContextActions.ts` and wires it into
the `fetchDonnaContext` switch via `case 'session_detail':`.

This sprint also widens the `fetchDonnaContext` params type to include `sessionId` and
`templateId`, enabling future sprints (867 — template detail) without further signature changes.

**Route targeted:** `/director/sessions/<uuid>` — context type `session_detail` (routed since Sprint 862)

**Not implemented in this sprint (by design):**
- `fetchClassTemplateDetailContext` — Sprint 867
- `fetchCoachHomeContext`, `fetchCoachSessionContext`, `fetchCoachPlayersContext` — Sprint 865
- `fetchCoachWrapUpContext` — Sprint 866
- Focus target DOM attributes — Sprint 868

---

## Data fetched (6 read-only queries)

| # | Table | Scope | Columns | Notes |
|---|---|---|---|---|
| 1 | `sessions` | `id = sessionId AND academy_id = academyId` | `id, name, scheduled_date, scheduled_time, status, duration_min, location, coach_id, template_id, group_id, session_notes` | Primary safety anchor; academy_id double-checked here |
| 2 | `profiles` | `id = session.coach_id` | `full_name, first_name` | Coach name only; not fetched if no coach assigned |
| 3 | `session_blocks` | `session_id = sessionId` ORDER BY `order_index` | `id, name, type, duration_min, order_index, actual_status, intensity` | rawDb — `actual_status` not in typed schema |
| 4 | `session_attendance` | `session_id = sessionId` | `player_id, status` | NO `academy_id` column — scoped via session_id (safe: session verified in Q1) |
| 5 | `players` | `id IN (player_ids) AND academy_id = academyId` | `id, full_name, first_name, last_name` | Only fetched if attendance exists; explicit `academy_id` scope |
| 6 | `proposed_actions` | `academy_id = academyId AND target_object_id = sessionId AND target_module = 'session_wrap_up_v1'` | `id, status, created_at` | Latest wrap-up only; `limit(1).maybeSingle()` |

### Safety note — `session_attendance`

`session_attendance` has no `academy_id` column. It is scoped via `session_id` only.
This is safe because `session_id` is verified in Query 1 with `AND academy_id = academyId`.
If the session does not belong to the academy, Q1 returns null and the function returns a
fallback before Q4 is ever executed.

---

## Files Modified

### `src/app/director/_actions/donnaContextActions.ts`

#### Change 1 — `fetchDonnaContext` params type widened

```typescript
// Before (Sprint 856–862):
params?: { playerId?: string; coachId?: string }

// After (Sprint 863):
params?: { playerId?: string; coachId?: string; sessionId?: string; templateId?: string }
```

`templateId` included for Sprint 867 — no logic change in Sprint 863.

#### Change 2 — `case 'session_detail':` added to switch

```typescript
case 'session_detail': return fetchSessionDetailContext(supabase, academyId, params?.sessionId)  // Sprint 863
```

Placed between `session_context` and `class_template_collection` for readability.

#### Change 3 — `fetchSessionDetailContext` function added (end of file)

Full function with 6 queries, early returns on missing sessionId and missing session,
complete `DonnaContextSummary` output.

**Guard 1 — missing sessionId:**
```typescript
if (!sessionId) {
  return makeFallbackSummary('session_detail', 'No session ID found in the current URL. Open a specific session to use this summary.')
}
```

**Guard 2 — session not found:**
```typescript
if (!sessionRaw) {
  return makeFallbackSummary('session_detail', 'Session not found or access denied.')
}
```

---

## `DonnaContextSummary` output shape

| Field | Content |
|---|---|
| `contextType` | `'session_detail'` |
| `title` | `"Session: <name or id prefix>"` |
| `summary` | One-line: label + status + coach + date + attendance fraction |
| `keyFacts` | Status, date/time, coach, location, duration, block count + completions, attendance breakdown, wrap-up status |
| `openQuestions` | Absent ≥2 players (names shown), pending wrap-up, no template |
| `suggestedNextSteps` | State-dependent: planned → assign coach/blocks; completed → request/review wrap-up; in_progress → check back |
| `dataUsed` | Tables actually queried (conditional based on data presence) |
| `missingData` | No coach, no blocks, no attendance, no wrap-up, no template |
| `safetyNotes` | Read-only; `session_attendance` scoping note |
| `recommendationInputsAvailable` | session_status, session_date, coach_name (if present), lesson plan, attendance, wrap-up |
| `recommendationInputsMissing` | coach_assignment, lesson_plan, attendance_records, wrap_up (based on gaps) |
| `possibleSuggestionTypes` | `session_focus_recommendation`, `player_attention_signal`, `parent_update_suggestion` |

---

## Runtime Behavior (post-863)

| contextType | Runtime behavior |
|---|---|
| `session_detail` | ✅ `fetchSessionDetailContext` — real data from 6 queries |
| `class_template_detail` | Falls to `fetchAcademyOverview` (Sprint 867) |
| `coach_session_context` | Falls to `fetchAcademyOverview` (Sprint 865) |
| `coach_wrap_up_context` | Falls to `fetchAcademyOverview` (Sprint 866) |
| `coach_home_context` | Falls to `fetchAcademyOverview` (Sprint 865) |
| `coach_players_context` | Falls to `fetchAcademyOverview` (Sprint 865) |

---

## Route Confirmation

| Pathname | contextType | sessionId passed | Fetch function |
|---|---|---|---|
| `/director/sessions/<uuid>` | `session_detail` | ✅ extracted by P3 | `fetchSessionDetailContext` |
| `/director/sessions/new` | `session_context` | — | `fetchSessionContext` (unchanged) |
| `/director/sessions` | `session_context` | — | `fetchSessionContext` (unchanged) |

---

## Files Created

### `docs/DONNA_SESSION_DETAIL_CONTEXT_863.md`
This file.

---

## Files Modified

### `src/app/director/_actions/donnaContextActions.ts`
- `fetchDonnaContext` params: added `sessionId?` and `templateId?`
- Switch: added `case 'session_detail':`
- Added `fetchSessionDetailContext` function (~200 lines, 6 read-only queries)

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `donnaContextTypes.ts` | Already updated in Sprint 862 |
| `DonnaAssistantButton.tsx` | Already updated in Sprint 862 |
| `donnaPageContextEngine.ts` | Already updated in Sprint 862 |
| All other switch cases | Untouched — no regression |
| SQL / RLS / migrations / seed / env | Unchanged |
| Session write path | Unchanged — read-only context only |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — 6 read-only queries, no inserts/updates/deletes |
| academy_id on sessions query | ✅ — double-scoped: `id = sessionId AND academy_id = academyId` |
| session_attendance scoping | ✅ — session_id verified via academy-scoped session query before attendance fetch |
| players.academy_id scoped | ✅ — explicit `.eq('academy_id', academyId)` on players query |
| proposed_actions.academy_id scoped | ✅ — explicit `.eq('academy_id', academyId)` |
| No cross-academy data exposure | ✅ — all paths verify academy ownership |
| No parent/player data exposure | ✅ — player names in context only (not notes, not private fields) |
| No auto-approval | ✅ — read-only summary; wrap-up review still goes through Review Queue |
| Fallback on missing sessionId | ✅ — honest fallback if URL extraction fails |
| Fallback on session not found | ✅ — honest fallback with 'not found or access denied' |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Known Limitations (post-863)

| Limitation | Impact | Resolution |
|---|---|---|
| `actual_status` queried via rawDb | Type safety reduced for session_blocks | Acceptable — consistent with project pattern |
| Group name not fetched | Session detail does not show group name | Could be added to Q1 join in a future sprint |
| Block-level notes not shown in context | Coach coaching notes per block not surfaced | By design — DONNA shows counts, not private notes |
| `attended_at` not used | session_attendance queried by session_id, not date | Correct — attendance is session-scoped, not time-scoped |
