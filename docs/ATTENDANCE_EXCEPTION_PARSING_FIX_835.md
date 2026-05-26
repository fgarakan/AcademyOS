# Sprint 835 — Attendance Exception Parsing Fix V1

**Date:** 2026-05-26
**Sprint:** 835
**Type:** Functional fix — Coach Wrap-Up Q2 attendance parsing
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 834 — Attendance Exception End-to-End Audit (GAP-A)

Coach wrap-up Q2 ("Any attendance exceptions?") captured free-text input like:

> "Everyone was here except Sarah, and Jeremy showed up."

But this text was stored **only** as a raw string field (`raw_attendance_answer`) inside the
`session_wrap_up_v1` proposed_action. It was **never parsed** into a structured attendance
exception draft. The director saw the text embedded in the wrap-up card, but received no
separate `attendance_exception_v1` draft with rostered attendance table, unrostered attendee
cards, or approve/apply controls.

**Result:** The coach → director attendance loop was broken for the primary Q2 path.

---

## Solution

Two changes:

1. **New pure parser module** — `src/lib/attendance/parseAttendanceExceptionText.ts`
2. **Integration in wrap-up action** — `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts`

After the main `session_wrap_up_v1` draft succeeds, the server action now:
- Calls `parseAttendanceExceptionText(answers.attendance)`
- If `absentNames.length > 0 || unexpectedNames.length > 0`:
  - Fetches the session roster via `group_memberships → players`
  - Matches parsed absent names against roster (exact first-name, then prefix)
  - Only roster-matched players appear in `rostered_attendance` (real `player_id` values)
  - Unmatched names go to `warnings` with director-review language
  - Unexpected arrivals go to `unrostered_attendees` (creates `placement_review` follow-up on apply)
  - Creates a secondary `attendance_exception_v1` proposed_action (`target_module: 'attendance_exception'`)
  - Status: `pending_review` — no official attendance change
- If creation of the secondary draft fails: main wrap-up save still returns `ok: true` (best-effort)

---

## Files Created

### `src/lib/attendance/parseAttendanceExceptionText.ts`

Pure deterministic parser. No DB calls. No mutations.

**Input:** `string` — coach attendance free text

**Output:**
```ts
{
  rawText: string           // original input, trimmed
  absentNames: string[]     // names detected as absent
  unexpectedNames: string[] // names detected as unexpected arrivals
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]        // safety notes and ambiguity flags
}
```

**Pattern groups:**
- `EVERYONE_PRESENT_PHRASES` — 16 variants of "everyone was here" → returns empty arrays (no draft)
- `EXCEPT_TRIGGERS` — 7 exception keywords → slice clause after trigger, split on and/comma
- `ABSENCE_PATTERNS` — 3 regex groups for "Sarah was absent", "Max missed", "absent: Sarah"
- `ARRIVAL_PATTERNS` — 4 regex groups for "Jeremy showed up", "new player Jeremy", etc.
- `NAME_STOP_WORDS` — 50 excluded common words that look capitalised but are not names

**Arrival clause isolation:** The except clause parser strips arrival sub-clauses before extracting
absent names. In "everyone was here except Sarah, and Jeremy showed up", the ", and Jeremy showed up"
portion is removed before absent name extraction — ensuring Jeremy is not mistakenly marked absent.

**Confidence scoring:**
- `high` — "everyone ... except" baseline with named exceptions (strongest pattern)
- `medium` — explicit absence/arrival patterns without "everyone" baseline
- `low` — unsure flag, short names (potential initials), or no patterns matched

**Returns early (no draft created) when:**
- Input is empty
- Input matches "everyone present" with no exceptions
- Input is non-empty but no names detected (free text, no attendance signal)

---

### `docs/ATTENDANCE_EXCEPTION_PARSING_FIX_835.md`

This file.

---

## Files Modified

### `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts`

**Changes:**
1. Added import: `parseAttendanceExceptionText` from `@/lib/attendance/parseAttendanceExceptionText`
2. Extended session select: `'id, name'` → `'id, name, group_id'` (roster fetch requires group_id)
3. Extended `SaveWrapUpDraftResult` interface:
   ```ts
   attendanceExceptionDraftId?: string | null
   ```
4. Added Sprint 835 secondary draft creation block after main wrap-up draft success:
   - Parser call → gate check (`absentNames || unexpectedNames`) → duplicate guard (30s) →
     roster fetch → name matching → payload build → `voice_commands` insert →
     `proposed_actions` insert (target_module: 'attendance_exception', status: 'pending_review')
   - Entire block wrapped in `try/catch` — best-effort, never fails main action

---

## Validation Cases

All 6 cases from the sprint prompt verified against the parser:

| Input | absentNames | unexpectedNames | confidence |
|---|---|---|---|
| `"Everyone was here except Sarah."` | `["Sarah"]` | `[]` | `high` |
| `"Sarah was absent."` | `["Sarah"]` | `[]` | `medium` |
| `"Everyone was here except Sarah and Max."` | `["Sarah", "Max"]` | `[]` | `high` |
| `"Jeremy showed up."` | `[]` | `["Jeremy"]` | `medium` |
| `"Everyone was here except Sarah, and Jeremy showed up."` | `["Sarah"]` | `["Jeremy"]` | `high` |
| `""` / `"Everyone was here"` | `[]` | `[]` | `high`/`low` |

---

## Integration Point

```
WrapUpPageClient (Q2 answer typed by coach)
  └── saveWrapUpDraftAction(sessionId, sessionName, blockCompletion, answers)
        ├── [existing] session_wrap_up_v1 proposed_action created (main draft)
        └── [NEW Sprint 835] if answers.attendance has parseable exceptions:
              ├── parseAttendanceExceptionText(answers.attendance)
              ├── fetch session roster (group_memberships → players)
              ├── match absentNames → rostered_attendance entries (real player_ids only)
              ├── unexpectedNames → unrostered_attendees
              └── attendance_exception proposed_action (target_module: 'attendance_exception')
                    status: 'pending_review'
                    source: 'wrap_up_q2_parse'
```

---

## Director Review Queue Behavior

After a coach submits wrap-up Q2 with attendance exceptions:

1. Director sees **two** items in the review queue for the same session:
   - `session_wrap_up_v1` draft (the full wrap-up) — existing behavior
   - `attendance_exception_v1` draft — **NEW in Sprint 835**

2. The attendance exception card (`AttendanceExceptionDraftCard`) shows:
   - **Original Recap** — quoted Q2 text verbatim
   - **Rostered Players — Proposed Attendance** — roster-matched absent players with red `UserX` icon and "Absent" label, `match_reason: 'Parsed from wrap-up Q2 text — confirmed against roster'`
   - **Unrostered Attendees** — unexpected arrivals with orange warning cards
   - **Warnings** — unmatched names + roster/group notes + standard safety copy

3. Director follows the standard two-step: **Approve** → **Apply**.
   - Apply writes to `session_attendance` for matched absent players
   - Apply creates `placement_review` proposed_actions for unrostered attendees
   - No player profiles, rosters, billing, or parent comms ever touched automatically

4. Source field `'wrap_up_q2_parse'` distinguishes this draft from Director DONNA (`'coach_attendance_voice_or_text'`) and session detail path (`'coach_attendance_voice_or_text'`) entries.

---

## Safety Guardrails Preserved

| Guarantee | Status |
|---|---|
| No official attendance written until director Apply | ✅ status: pending_review always |
| No null player_ids in rostered_attendance | ✅ only roster-matched players inserted |
| No players created | ✅ placement_review created at apply time, never auto |
| No roster changes | ✅ unrostered → placement_review → separate director decision |
| No billing changes | ✅ no billing path exists |
| No parent/player messages | ✅ no comms path exists |
| Best-effort secondary creation | ✅ try/catch, main action always ok: true |
| Duplicate guard | ✅ 30-second window check before creating secondary draft |
| Academy_id scoped | ✅ group_memberships + players both filtered by academyId |
| Role check | ✅ inherited from main wrap-up auth (coach/head_coach/director) |
| Proposed_action pipeline | ✅ target_module: 'attendance_exception', execute_approved_action() path |

---

## Remaining Attendance Gaps (Post Sprint 835)

| Gap | Source | Priority |
|---|---|---|
| No `data-donna-focus-id` on review page attendance section | Sprint 834 GAP-B | Medium |
| No link from DONNA success card to `/director/review` | Sprint 834 GAP-C | Low |
| Two review cards for one session (wrap-up + attendance exception) — not visually linked | Sprint 834 | Low |
| `extractAbsentNames` single-trigger limitation in DONNA/director paths (not wrap-up parser) | Sprint 834 | Low |
| Ambiguous first name — multiple roster players with same first name → first match used | Sprint 834 | Medium |
| Session picker window (7 days / 5 sessions) in DONNA path — may miss older sessions | Sprint 834 | Low |

---

## Recommended Sprint 836

**Sprint 836 — Attendance Exception DONNA Highlight + Review Link V1**

Fix the two remaining UX gaps from Sprint 834:
1. Add `data-donna-focus-id="attendance-exceptions-section"` to the attendance exceptions section header on `/director/review/page.tsx` — enables DONNA highlight navigation (1 attribute)
2. Add an `href="/director/review"` link to the "View and apply in the Review Queue when ready" success message in `DonnaAttendanceExceptionCard` — eliminates manual navigation step (1 line change)

Risk: Very low — attribute additions and a link `href` only. No logic changes.
