# Sprint 837 — Attendance Exception Ambiguous Name Resolution V1

**Date:** 2026-05-26
**Sprint:** 837
**Type:** Safety fix — duplicate first-name matching in wrap-up Q2 attendance parsing
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 835 — `saveWrapUpDraftAction.ts` `matchNameToRoster` function

When two rostered players share a first name (e.g. Sarah Kim and Sarah Lopez), and a coach
writes "Everyone was here except Sarah", the Sprint 835 matcher silently returned the **first**
roster match. Sarah Kim would be marked absent regardless of which Sarah the coach meant.

This is unsafe for real academy use. Attendance changes require unambiguous player identity.

---

## Solution

Two changes, no backend mutations, no schema changes:

### 1. `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts`

**Added `matchAllNamesToRoster()`** — returns every roster entry that matches the mentioned
name. Match priority stops at the first tier that yields any result:

| Tier | Logic | Notes |
|---|---|---|
| 1 | Exact full-name match (`p.fullName.toLowerCase() === lower`) | Always unambiguous for that full name |
| 2 | Exact first-name match (`p.firstName.toLowerCase() === lower`) | May return multiple players |
| 3 | Prefix match (≥3 chars, fallback only) | May also return multiple players |

**Kept `matchNameToRoster()`** — the existing first-match function, still used for
`unexpectedNames` detection (no ambiguity concern there: we just need to know whether
ANY roster player matches, not which specific one).

**Updated absent-name matching loop:**

```
candidates.length === 1  →  safe, add to rostered_attendance (existing behavior)
candidates.length >  1  →  ambiguous, add to ambiguous_attendance_names + warnings (NEW)
candidates.length === 0  →  unmatched, add to warnings (existing behavior)
```

**Added `ambiguous_attendance_names` to `attendancePayload`** (optional, omitted when empty):

```ts
ambiguous_attendance_names?: Array<{
  mentioned_name: string
  candidate_players: Array<{ player_id: string; player_name: string }>
  reason: string
}>
```

This field is purely informational. The apply action
(`applyApprovedAttendanceExceptionAction`) reads only `rostered_attendance` and
`unrostered_attendees` — it never processes `ambiguous_attendance_names`. Ambiguous names
are display-only, confirmed safe by audit.

### 2. `src/app/director/review/AttendanceExceptionDraftCard.tsx`

**Added local type extension** `AttendanceExceptionPayloadWithAmbiguity`:

- Extends `AttendanceExceptionPayload` with optional `ambiguous_attendance_names`
- Avoids modifying `attendanceExceptionDraftAction.ts` (not in sprint scope; covers a
  different source path: `'coach_attendance_voice_or_text'`)

**Added "Ambiguous Names — Director Confirmation Required" section** between the rostered
attendance table and the unrostered attendees section. Renders only when
`ambiguous_attendance_names` exists and is non-empty.

Each ambiguous entry shows:
- Mentioned name (quoted)
- Reason string (e.g. `"Sarah" matches 2 rostered players — director must confirm…`)
- Candidate player names (bulleted list with real `player_id` keys)
- Section footer: "Director must confirm the correct player manually before any attendance is applied."

---

## Match Priority Specification

| Case | Input | Roster | Result |
|---|---|---|---|
| Exact full name | "Sarah Kim" | Sarah Kim, Sarah Lopez | ✅ `rostered_attendance` — Sarah Kim |
| Unique first name | "Sarah" | Sarah Kim only | ✅ `rostered_attendance` — Sarah Kim |
| Duplicate first name | "Sarah" | Sarah Kim, Sarah Lopez | ⚠️ `ambiguous_attendance_names` — both candidates |
| No match | "Sarah" | No Sarah on roster | ⚠️ `warnings` — unmatched |
| Prefix match (unique) | "Sar" | Sarah Kim only | ✅ `rostered_attendance` — Sarah Kim |
| Prefix match (duplicate) | "Sar" | Sarah Kim, Sarah Lopez | ⚠️ `ambiguous_attendance_names` — both candidates |

---

## Validation Examples

### "Everyone was here except Sarah." — 1 Sarah on roster (Sarah Kim)

```
rostered_attendance: [{ player_id: 'abc', player_name: 'Sarah Kim', proposed_status: 'absent' }]
ambiguous_attendance_names: (omitted)
```

### "Everyone was here except Sarah." — 2 Sarahs on roster (Sarah Kim, Sarah Lopez)

```
rostered_attendance: []
ambiguous_attendance_names: [{
  mentioned_name: 'Sarah',
  candidate_players: [
    { player_id: 'abc', player_name: 'Sarah Kim' },
    { player_id: 'def', player_name: 'Sarah Lopez' }
  ],
  reason: '"Sarah" matches 2 rostered players — director must confirm which player was absent.'
}]
warnings: [..., '"Sarah" matched 2 rostered players (Sarah Kim, Sarah Lopez) — director must confirm…']
```

### "Everyone was here except Sarah Kim." — both Sarahs on roster

```
rostered_attendance: [{ player_id: 'abc', player_name: 'Sarah Kim', proposed_status: 'absent' }]
ambiguous_attendance_names: (omitted)
```
*(Full-name match is tier-1 — always unambiguous)*

---

## Apply Action Audit

`applyApprovedAttendanceExceptionAction` in `src/app/director/review/actions.ts`:

- Reads `payload.rostered_attendance` → verifies each `player_id` against `players` table
- Reads `payload.unrostered_attendees` → creates placement_review follow-ups
- Does **not** read `ambiguous_attendance_names`

**Conclusion:** Adding `ambiguous_attendance_names` to the payload is 100% safe. Apply is
unaware of this field. No modification to apply action needed.

---

## Files Created

### `docs/ATTENDANCE_EXCEPTION_AMBIGUOUS_NAME_RESOLUTION_837.md`

This file.

---

## Files Modified

### `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts`

1. Added `matchAllNamesToRoster()` — collects all matching roster entries
2. Retained `matchNameToRoster()` — still used for `unexpectedNames` (first-match OK there)
3. Added `AmbiguousNameEntry` interface inside the Sprint 835 try block
4. Updated absent-name loop: 1 candidate → safe, >1 → ambiguous, 0 → warning
5. Added `ambiguous_attendance_names` to `attendancePayload` (omitted when empty)

### `src/app/director/review/AttendanceExceptionDraftCard.tsx`

1. Added `AmbiguousAttendanceName` interface
2. Added `AttendanceExceptionPayloadWithAmbiguity` type extension
3. Updated `payload` extraction to use extended type
4. Added `ambiguousNames` constant from payload
5. Added "Ambiguous Names" render section between rostered and unrostered sections

---

## Safety Guardrails Preserved

| Guarantee | Status |
|---|---|
| No official attendance written until director Apply | ✅ ambiguous names never reach rostered_attendance |
| No null player_ids in rostered_attendance | ✅ only unique-match players inserted |
| No players created | ✅ placement_review created at apply time, never auto |
| No roster changes | ✅ unrostered → placement_review → separate director decision |
| No billing changes | ✅ no billing path exists |
| No parent/player messages | ✅ no comms path exists |
| Apply action unaffected | ✅ apply reads rostered_attendance and unrostered_attendees only |
| Best-effort secondary creation | ✅ try/catch from Sprint 835 unchanged |
| Existing payloads backward-compatible | ✅ ambiguous_attendance_names is optional |
| Schema unchanged | ✅ no migrations |

---

## Name Matching Rules Summary

| Rule | Behavior |
|---|---|
| Exact full-name match | ✅ Always safe — 1 unique match |
| Unique first-name match | ✅ Safe — exactly 1 player with that first name |
| Duplicate first-name match | ⚠️ Ambiguous — goes to director warning, NOT rostered_attendance |
| No match | ⚠️ Unmatched — goes to warnings |
| Prefix match (unique result) | ✅ Safe |
| Prefix match (multiple results) | ⚠️ Ambiguous |

---

## Remaining Attendance Gaps (Post Sprint 837)

| Gap | Source | Priority |
|---|---|---|
| `attendanceExceptionDraftAction.ts` (`coach_attendance_voice_or_text` path) still uses first-match `matchToRoster()` — same ambiguity risk on session detail page | Sprint 837 | Medium |
| Two review cards for one session (wrap-up + attendance exception) — not visually linked | Sprint 834 | Low |
| `extractAbsentNames` single-trigger limitation in DONNA/director paths | Sprint 834 | Low |
| Session picker window (7 days / 5 sessions) in DONNA path — may miss older sessions | Sprint 834 | Low |

---

## Recommended Sprint 838

**Sprint 838 — Attendance Exception Session Detail Ambiguous Name Fix V1**

Apply the same `matchAllNamesToRoster` pattern to `attendanceExceptionDraftAction.ts`
(`createAttendanceExceptionDraftAction`) — the session detail path. This closes the remaining
ambiguity gap for attendance exceptions created directly from the session page (as opposed to
from the coach wrap-up Q2 path fixed in this sprint).

Risk: Low — same pattern as Sprint 837; no schema changes.
