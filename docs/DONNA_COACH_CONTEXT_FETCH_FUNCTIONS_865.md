# Sprint 865 — DONNA Coach Context Fetch Functions V1

**Date:** 2026-05-27
**Sprint:** 865
**Type:** Implementation — Server Action coach context functions + identity extension
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Scope

Implements 3 coach-scoped DONNA context fetch functions so the floating DONNA button on
`/coach/**` returns correct coach-owned context instead of falling back to `academy_overview`.

**Sprint 862** already added routing (P20–P23) and `DonnaContextType` values for all 4 coach routes.
**Sprint 865** implements fetch functions for 3 of them:

| Context type | Route | Sprint 865 | Notes |
|---|---|---|---|
| `coach_home_context` | `/coach` | ✅ Implemented | `fetchCoachHomeContext` |
| `coach_players_context` | `/coach/players` | ✅ Implemented | `fetchCoachPlayersContext` |
| `coach_session_context` | `/coach/sessions/<id>` | ✅ Implemented | `fetchCoachSessionContext` |
| `coach_wrap_up_context` | `/coach/sessions/<id>/wrap-up` | ⏳ Sprint 866 | Falls to `fetchAcademyOverview` until 866 |

---

## Authenticated Coach Identity Source

### Problem identified

`resolveAcademyId()` (the helper used by all `fetchDonnaContext` calls) already called
`supabase.auth.getUser()` internally but only returned `{ supabase, academyId }`.
The authenticated user ID was computed but discarded.

### Solution — minimal safe extension

`resolveAcademyId` return type extended to include `userId: string | null`:

```typescript
// Before (Sprint 856–864):
Promise<{ supabase: ...; academyId: string | null }>

// After (Sprint 865):
Promise<{ supabase: ...; academyId: string | null; userId: string | null }>
```

- `userId` is sourced from `supabase.auth.getUser()` — server-side, not client-provided
- **All 12 existing call sites** (`const { supabase, academyId } = ...`) still work — TypeScript destructuring ignores extra fields
- No new auth calls required — `getUser()` was already being called

### Coach identity guard in `fetchDonnaContext`

Added before the switch statement:

```typescript
if (
  !userId &&
  (contextType === 'coach_home_context' || contextType === 'coach_players_context' ||
   contextType === 'coach_session_context' || contextType === 'coach_wrap_up_context')
) {
  return makeFallbackSummary(contextType, 'Coach identity could not be verified. Please sign in.')
}
```

### Security contract

> `params?.coachId` is **never used** as the identity anchor for coach-scoped queries.
>
> All coach context functions receive `coachId: string` which is **always** `resolveAcademyId().userId` —
> the server-side authenticated user ID. Client-passed params cannot influence ownership gates.

---

## Functions Implemented

### `fetchCoachHomeContext(supabase, academyId, coachId)`

Coach's own session dashboard — today's sessions, upcoming, recent completions, pending review items.

**Queries (2):**

| # | Table | Columns | Scope | Safety |
|---|---|---|---|---|
| Q1 | `sessions` | `id, name, scheduled_date, scheduled_time, status, template_id` | `academy_id eq + coach_id = userId, gte 30 days ago` | Double-scoped |
| Q2 | `proposed_actions` | `id, target_module, status` | `academy_id eq + proposed_by_id = userId + status = pending_review` | Double-scoped |

**Output:** Today's session names+times, upcoming count, completed count, pending wrap-up count, other pending items.
**Next steps:** "Run today's N sessions", "Review lesson plans", "Submit wrap-ups".

---

### `fetchCoachPlayersContext(supabase, academyId, coachId)`

Players encountered by this coach through their own sessions in the last 60 days.

**Queries (5):**

| # | Table | Columns | Scope | Safety |
|---|---|---|---|---|
| Q1 | `sessions` | `id` | `academy_id eq + coach_id = userId, gte 60 days ago` | Double-scoped — session ID anchor |
| Q2 | `session_attendance` | `player_id, session_id, status` | `session_id IN (Q1 IDs)` | No academy_id — scoped via Q1 coach-owned IDs |
| Q3 | `players` | `id, full_name, first_name, last_name` | `id IN (Q2 player IDs) + academy_id eq` | Explicit academy_id re-scope on players |
| Q4 | `player_curriculum_states` | `player_id, current_level_id` | `academy_id eq + player_id IN (Q2 IDs)` | Double-scoped |
| Q5 | `curriculum_levels` | `id, display_name` | `id IN (Q4 level IDs)` | Global table — no academy_id needed |

**Early returns:** If no coached sessions (Q1 empty) or no attendance (Q2 empty) → honest empty-state fallbacks.

**Output:** Player count coached (60 days), session count per player (top 5), curriculum levels.
**Safety note:** Player pool is derived exclusively through coach-owned session IDs — other coaches' players cannot appear.

---

### `fetchCoachSessionContext(supabase, academyId, coachId, sessionId)`

Full context for a single session the authenticated coach owns.

**Ownership gate (Q1 must succeed or function returns fallback):**

```typescript
const { data: sessionRaw } = await supabase
  .from('sessions')
  .select(...)
  .eq('id', sessionId)        // specific session
  .eq('academy_id', academyId) // correct academy
  .eq('coach_id', coachId)    // authenticated user owns this session
  .maybeSingle()

if (!sessionRaw) {
  return makeFallbackSummary('coach_session_context', 'Session not found or you are not assigned...')
}
```

**Queries (4):**

| # | Table | Columns | Scope | Safety |
|---|---|---|---|---|
| Q1 (gate) | `sessions` | `id, name, scheduled_date, scheduled_time, status, duration_min, location, template_id` | `id + academy_id + coach_id = userId` | Triple-scoped ownership gate |
| Q2 | `session_blocks` | `id, name, type, duration_min, order_index` | `session_id = sessionId` (Q1-verified) | No academy_id — safe via Q1 gate |
| Q3 | `session_attendance` | `player_id, status` | `session_id = sessionId` (Q1-verified) | No academy_id — safe via Q1 gate |
| Q4 | `players` | `id, full_name, first_name, last_name` | `id IN (Q3 player IDs) + academy_id eq` | Explicit academy_id re-scope |

**Output:** Session status/date/location/duration, block list (names, first 3 shown), attendance breakdown with player names.
**Fallback on mismatch:** If Q1 returns null (wrong coach, wrong academy, wrong session), no further queries run.

---

## `fetchDonnaContext` Switch Cases Added

```typescript
// Sprint 865 — Coach contexts (userId verified non-null by guard above)
case 'coach_home_context':    return fetchCoachHomeContext(supabase, academyId, userId as string)
case 'coach_players_context': return fetchCoachPlayersContext(supabase, academyId, userId as string)
case 'coach_session_context': return fetchCoachSessionContext(supabase, academyId, userId as string, params?.sessionId)
// coach_wrap_up_context: Sprint 866 — falls to default until implemented
```

---

## Schema Verified (all columns confirmed in `database.types.ts`)

| Table | Columns used | academy_id? | Notes |
|---|---|---|---|
| `sessions` | `id, name, scheduled_date, scheduled_time, status, duration_min, location, template_id, coach_id` | ✅ | coach_id typed as `string` (Row) |
| `session_blocks` | `id, name, type, duration_min, order_index` | ❌ | No academy_id — scoped via session ID |
| `session_attendance` | `player_id, session_id, status` | ❌ | No academy_id — scoped via session ID |
| `players` | `id, full_name, first_name, last_name` | ✅ | full_name is `string \| null` in Row |
| `player_curriculum_states` | `player_id, current_level_id` | ✅ | |
| `curriculum_levels` | `id, display_name` | ❌ | Global table — no academy_id; queried by ID set |
| `proposed_actions` | `id, target_module, status` | ✅ | proposed_by_id typed as `string` |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — all read-only |
| Coach identity from server auth | ✅ — `userId` = `supabase.auth.getUser().user.id` |
| `params?.coachId` not used for ownership | ✅ — client-provided coachId ignored for coach-scoped data |
| Cross-coach session access blocked | ✅ — `coach_id = userId` in every session query |
| Player pool scoped via coach session IDs | ✅ — no global player query without session ID filter |
| players re-scoped by academy_id | ✅ — `.eq('academy_id', academyId)` after player ID filter |
| session_blocks/attendance scoped via Q1 gate | ✅ — Q1 failure → no subsequent queries run |
| No director-private notes | ✅ — no coach_notes, no session_notes, no player assessment content |
| No parent data | ✅ — no guardian, parent portal, or parent-facing fields fetched |
| No RLS changes | ✅ — pure read from existing RLS-protected tables |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Route Behavior (post-865)

| Route | contextType | Fetch function | Notes |
|---|---|---|---|
| `/coach` | `coach_home_context` | `fetchCoachHomeContext` | ✅ Sprint 865 |
| `/coach/players` | `coach_players_context` | `fetchCoachPlayersContext` | ✅ Sprint 865 |
| `/coach/sessions/<id>` | `coach_session_context` | `fetchCoachSessionContext` (ownership gate) | ✅ Sprint 865 |
| `/coach/sessions/<id>/wrap-up` | `coach_wrap_up_context` | Falls to `fetchAcademyOverview` | ⏳ Sprint 866 |

---

## Files Modified

### `src/app/director/_actions/donnaContextActions.ts`
1. `resolveAcademyId` — return type extended: added `userId: string | null`; returns `user.id`
2. `fetchDonnaContext` — destructures `userId`; adds coach identity guard; adds 3 switch cases
3. Added `fetchCoachHomeContext` (~80 lines, 2 queries)
4. Added `fetchCoachPlayersContext` (~130 lines, 5 queries, 2 early-return guards)
5. Added `fetchCoachSessionContext` (~120 lines, 4 queries, ownership gate guard)

---

## Files Created

### `docs/DONNA_COACH_CONTEXT_FETCH_FUNCTIONS_865.md`
This file.

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `donnaContextTypes.ts` | Updated in Sprint 862 — all context types already exist |
| `DonnaAssistantButton.tsx` | Updated in Sprint 862 — already passes `role` |
| `donnaPageContextEngine.ts` | Updated in Sprint 862 — coach capability maps already added |
| `deriveContextRequest` | Updated in Sprint 862 — coach route matching already works |
| `fetchSessionDetailContext` | Sprint 863 — untouched |
| `fetchSessionContext` | Sprint 864 — untouched |
| SQL / RLS / migrations / seed / env | Unchanged |
| `coach_wrap_up_context` | Deferred to Sprint 866 as planned |

---

## Projected Score Improvements

| Surface | Pre-865 | Post-865 | Change |
|---|---|---|---|
| Coach Session (`/coach/sessions/<id>`) | 1/10 (academy_overview fallback) | **7/10** (ownership-gated session context) | +6 |
| Coach Home (`/coach`) | 1/10 (academy_overview fallback) | **6/10** (own sessions + review queue) | +5 |
| Coach Players (`/coach/players`) | 1/10 (academy_overview fallback) | **6/10** (player pool from own sessions) | +5 |
| Coach Wrap-Up (`/coach/sessions/<id>/wrap-up`) | 1/10 | 1/10 (Sprint 866) | 0 |

---

## Known Limitations (post-865)

| Limitation | Impact | Resolution |
|---|---|---|
| No wrap-up context for coach | `/coach/sessions/<id>/wrap-up` still gets academy_overview | Sprint 866 |
| Player priorities not shown | Coach players list has no priority signals | Future sprint — requires rawDb priority query |
| No attendance rate % for coach players | Roster size not fetched separately | Acceptable for V1 |
| `coach_wrap_up_context` in identity guard | Guard covers it already — no runtime risk | Sprint 866 adds the fetch function |

---

## Recommended Sprint 866 — DONNA Coach Wrap-Up Context V1

Implement `fetchCoachWrapUpContext(supabase, academyId, coachId, sessionId)`.

Architecture is identical to `fetchCoachSessionContext` (same Q1 ownership gate, same blocks/attendance queries), with one addition: Q5 queries `proposed_actions` for any existing wrap-up submission for this session+coach, to pre-populate the wrap-up form state in DONNA's context. The coach can see: what session they're wrapping, who attended, what blocks were planned, and whether a wrap-up was already submitted.

**Data allowed for Sprint 866:**
- Same Q1–Q4 as coach_session_context
- Q5: `proposed_actions` WHERE `academy_id = academyId AND target_object_id = sessionId AND proposed_by_id = coachId AND target_module = 'session_wrap_up_v1'` — latest only

**Not allowed in Sprint 866:** Auto-submitting wrap-up, reading director review notes, reading other coaches' wrap-ups.
