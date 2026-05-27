# Sprint 864 — DONNA Session List Context Depth V1

**Date:** 2026-05-27
**Sprint:** 864
**Type:** Implementation — Server Action fetch function deepened
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 858–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Scope

Deepens the existing `fetchSessionContext` function in `donnaContextActions.ts`.

**Route targeted:** `/director/sessions` and `/director/sessions/new` — context type `session_context` (unchanged)

**Not implemented in this sprint (by design):**
- Coach context fetch functions — Sprint 865
- Coach wrap-up context — Sprint 866
- Class template detail context — Sprint 867
- Focus target DOM attributes — Sprint 868
- `fetchSessionDetailContext` — untouched (Sprint 863)

---

## Pre-864 State

`fetchSessionContext` ran **1 query** and returned a shallow summary:
- Sessions list: `id, name, scheduled_date, status, template_id, group_id`
- No coach names
- No today's session highlight
- No attendance data
- No lesson plan block coverage
- No wrap-up gap detection
- **Sprint 860 audit score: 4/10**

---

## Post-864 State

`fetchSessionContext` runs **up to 5 sequential queries** and returns an actionable summary:

| # | Table | Columns | Scope | Safety |
|---|---|---|---|---|
| Q1 (enhanced) | `sessions` | `id, name, scheduled_date, scheduled_time, status, template_id, group_id, coach_id` | `academy_id eq` | Primary academy anchor |
| Q2 (new) | `profiles` | `id, full_name, first_name` | `id IN (unique coach IDs from Q1)` | Coach IDs sourced from Q1 — academy-verified |
| Q3 (new) | `session_attendance` | `session_id, status` | `session_id IN (past-7-day IDs from Q1)` | No `academy_id` column — scoped via Q1 session IDs |
| Q4 (new) | `session_blocks` | `session_id` | `session_id IN (upcoming session IDs from Q1)` | No `academy_id` column — scoped via Q1 session IDs |
| Q5 (new) | `proposed_actions` | `target_object_id` | `academy_id eq + target_module eq + target_object_id IN (recent completed IDs from Q1)` | Double-scoped: academy_id + Q1 session IDs |

### Query windowing (performance mitigation)

| Query | Window | Reason |
|---|---|---|
| Q3 — attendance | Past 7 days | Attendance only meaningful for recent sessions |
| Q4 — blocks | Upcoming sessions only (scheduled_date >= today) | Block gaps only actionable for sessions not yet run |
| Q5 — wrap-ups | Past 14 days completed sessions | Older wrap-up gaps are history, not action items |

---

## Schema Audit Results

All tables and columns verified against `src/lib/supabase/database.types.ts` before implementation:

| Column | Table | In types? | Notes |
|---|---|---|---|
| `coach_id` | `sessions` | ✅ `string` (Row type non-null, treated as nullable in code) | Follows existing `fetchSessionDetailContext` pattern |
| `scheduled_time` | `sessions` | ✅ `string \| null` | Added to Q1 for today's session label |
| `full_name`, `first_name` | `profiles` | ✅ | Used in Sprint 863 too |
| `session_id`, `status` | `session_attendance` | ✅ | No `academy_id` — scoped via session IDs |
| `session_id` | `session_blocks` | ✅ | No `academy_id` — scoped via session IDs |
| `target_object_id`, `target_module`, `academy_id` | `proposed_actions` | ✅ | `target_object_id` is `string \| null` |

---

## `DonnaContextSummary` Output Shape (post-864)

| Field | Content |
|---|---|
| `contextType` | `'session_context'` (unchanged) |
| `title` | `'Sessions'` (unchanged) |
| `summary` | Total count + this week + completed + today's count (if any) |
| `keyFacts` | Total/week/upcoming/completed/planned; Today's sessions with time + coach name; Upcoming without coach; Upcoming with no blocks; Recent sessions with attendance; Recently completed missing wrap-up; Sessions without template/group |
| `openQuestions` | Sessions missing template (manual creation?); Completed sessions with no wrap-up |
| `suggestedNextSteps` | "Review today's N sessions"; "Assign coaches to N upcoming sessions"; "Check N completed sessions missing wrap-ups"; "Add lesson plan blocks to N upcoming sessions" |
| `dataUsed` | Conditional based on data presence: sessions + profiles (coach names) + session_attendance + session_blocks + proposed_actions |
| `missingData` | No sessions; Template link gaps; Block gaps; Wrap-up gaps |
| `safetyNotes` | Read-only; session_attendance + session_blocks scoping note |
| `recommendationInputsAvailable` | session_count, session_statuses, completed_sessions, coach_names, attendance_data, lesson_plan_coverage |

---

## Missing/Omitted Schema Areas

| Item | Why omitted |
|---|---|
| Group names | `sessions.group_id` fetched but no `groups` table query added — group names would require another query; counts suffice for this sprint |
| Template names | `sessions.template_id` fetched but template name lookup not added — same rationale as group names |
| Block completion counts | `session_blocks.actual_status` not fetched — Q4 only checks presence (block count > 0), not completion; detailed block state is in session_detail context |
| Player names from attendance | Not fetched — `session_context` is a list view; player-level attendance detail belongs in `session_detail` context |
| Attendance rate % | Could be computed from Q3 data; omitted because roster size is not fetched (would need another query) |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ — 5 read-only queries, no inserts/updates/deletes/upserts |
| `sessions` academy_id scoped | ✅ — Q1 `.eq('academy_id', academyId)` |
| `session_attendance` scoping | ✅ — scoped via Q1 session IDs; no academy_id column on table |
| `session_blocks` scoping | ✅ — scoped via Q1 session IDs; no academy_id column on table |
| `proposed_actions` academy_id scoped | ✅ — Q5 `.eq('academy_id', academyId)` |
| No parent/player data exposure | ✅ — player names not fetched; only session-level counts |
| No cross-academy data | ✅ — all queries anchored to Q1 academy-verified session IDs |
| No coach note content | ✅ — only coach names from profiles |
| Fallback if sessions empty | ✅ — graceful empty state; all queries guarded with `if (ids.length > 0)` |
| TypeScript clean | ✅ — `npx tsc --noEmit` exit 0 |

---

## Route Behavior (post-864)

| Pathname | contextType | Fetch function | Notes |
|---|---|---|---|
| `/director/sessions` | `session_context` | `fetchSessionContext` (deepened) | ✅ Sprint 864 target |
| `/director/sessions/new` | `session_context` | `fetchSessionContext` (deepened) | ✅ Consistent with pre-864 |
| `/director/sessions/<uuid>` | `session_detail` | `fetchSessionDetailContext` (Sprint 863) | ✅ Unchanged |

---

## Files Modified

### `src/app/director/_actions/donnaContextActions.ts`
- `fetchSessionContext` replaced: 1 query → 5 queries
- Added Q2 (coach names), Q3 (attendance), Q4 (session_blocks), Q5 (wrap-up status)
- Enhanced Q1 select: added `coach_id`, `scheduled_time`
- Rebuilt `keyFacts`, `openQuestions`, `suggestedNextSteps`, `summary`, `dataUsed`, `safetyNotes`
- Switched from typed `supabase` call to `rawDb` for Q1 (consistent with deepened function pattern)
- All queries sequential (per AI_BACKEND_RULES.md rule 5)

---

## Files Created

### `docs/DONNA_SESSION_LIST_CONTEXT_DEPTH_864.md`
This file.

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `fetchSessionDetailContext` | Untouched — Sprint 863 work |
| `donnaContextTypes.ts` | Already updated in Sprint 862 |
| `DonnaAssistantButton.tsx` | Already updated in Sprint 862 |
| `donnaPageContextEngine.ts` | Already updated in Sprint 862 |
| All other switch cases | Untouched — no regression |
| SQL / RLS / migrations / seed / env | Unchanged |

---

## Projected Sessions Page Score

| Dimension | Pre-864 | Post-864 |
|---|---|---|
| Context type assignment | ✅ Correct (session_context) | ✅ Unchanged |
| DB query depth | 1 query — list only | 5 queries — list + coaches + attendance + blocks + wrap-ups |
| Coach visibility | ❌ None | ✅ Coach names on today's sessions |
| Today's session highlight | ❌ None | ✅ Name + time + coach |
| Readiness signals | ❌ None | ✅ No coach, no blocks, no wrap-up |
| Attendance data | ❌ None | ✅ Sessions with attendance recorded (7d window) |
| Wrap-up gap detection | ❌ None | ✅ Completed sessions missing wrap-up (14d window) |
| **Estimated score** | **4/10** | **7/10** |

---

## Known Limitations (post-864)

| Limitation | Impact | Resolution |
|---|---|---|
| Q3/Q4/Q5 windowed | Gaps older than 7/7/14 days not surfaced | Intentional — actionability decays with age |
| Group/template names not resolved | Context mentions counts, not names | Future sprint can add if needed |
| `rawDb` used throughout | Type safety reduced for Q1 | Intentional — consistent with project pattern for complex selects |
| Attendance rate % not computed | Roster size not fetched | Would need a separate players-in-group query |
