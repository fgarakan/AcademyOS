# Sprint 838 — Session Detail Attendance Ambiguous Name Fix V1

**Date:** 2026-05-26
**Sprint:** 838
**Type:** Safety fix — duplicate first-name matching in session detail attendance exception path
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 837 — Remaining gap: `attendanceExceptionDraftAction.ts`

Sprint 837 fixed ambiguous first-name matching in the coach wrap-up Q2 path
(`saveWrapUpDraftAction.ts`). The session detail path (`attendanceExceptionDraftAction.ts`)
used the same first-match `matchToRoster()` function and had the same silent-first-pick flaw.

When a coach typed "Everyone was here except Sarah" on the session detail page and two players
named Sarah Kim and Sarah Lopez were on the roster, `matchToRoster()` silently returned Sarah
Kim (first roster entry). Sarah Kim was marked absent, Sarah Lopez was marked present, with no
director warning that the match was ambiguous.

---

## Solution

Three changes to `src/app/director/sessions/[sessionId]/attendanceExceptionDraftAction.ts`:

### 1. Added `AmbiguousAttendanceName` interface + extended `AttendanceExceptionPayload`

```ts
export interface AmbiguousAttendanceName {
  mentioned_name: string
  candidate_players: Array<{ player_id: string; player_name: string }>
  reason: string
}

export interface AttendanceExceptionPayload {
  ...
  ambiguous_attendance_names?: AmbiguousAttendanceName[]  // Sprint 838 — optional
  ...
}
```

The `ambiguous_attendance_names` field is optional and omitted from payloads where there are
no ambiguous names. Existing records created before Sprint 838 render unchanged.

The apply action (`applyApprovedAttendanceExceptionAction`) reads only `rostered_attendance`
and `unrostered_attendees` — `ambiguous_attendance_names` is safely ignored at apply time.

### 2. Added `matchAllNamesToRoster()` function

Same three-tier logic as Sprint 837:

| Tier | Logic | Notes |
|---|---|---|
| 1 | Exact full-name match | Always unambiguous for that full name |
| 2 | Exact first-name match | May return multiple players |
| 3 | Prefix match (≥3 chars) | Fallback, may also return multiple players |

Kept `matchToRoster()` (first-match) for `detectUnrosteredNames()` — only needs to know
whether ANY roster player matches an arrival name. No ambiguity concern there.

### 3. Updated absent-name matching loop in `parseAttendance()`

```
candidates.length === 1  →  absentPlayerIds.add()  (safe — existing behavior)
candidates.length >  1  →  ambiguousNames.push() + warnings  (NEW — Sprint 838)
candidates.length === 0  →  unmatchedAbsentNames.push() + warnings  (existing behavior)
```

Ambiguous names are not added to `absentPlayerIds`, so they fall through to `present`
(if "everyone" baseline) or `unknown` in the `roster.map()` step — the correct behavior:
the director sees both Sarahs with their baseline status and the "Ambiguous Names" card
tells them which name they need to resolve manually.

---

## Structural Note: How This Differs from Sprint 837

Sprint 837 (`saveWrapUpDraftAction.ts`) built `rostered_attendance` as a sparse list — only
absent-matched players were included.

This file (`attendanceExceptionDraftAction.ts`) builds `rostered_attendance` as a full roster
map — **every** roster player is included with `absent`, `present`, or `unknown` status.
Ambiguous names simply don't enter `absentPlayerIds`, so they fall through to `present`/
`unknown` in the map. The `ambiguous_attendance_names` section explains the gap.

---

## Review Card

`AttendanceExceptionDraftCard.tsx` already renders `ambiguous_attendance_names` from Sprint 837.
The card uses a local `AttendanceExceptionPayloadWithAmbiguity` type that extends
`AttendanceExceptionPayload`. Adding `ambiguous_attendance_names?` to the base type makes the
extension redundant for this field, but TypeScript resolves the intersection cleanly (same
optional field, structurally identical types). **No card changes needed.**

---

## Files Created

### `docs/SESSION_DETAIL_ATTENDANCE_AMBIGUOUS_NAME_FIX_838.md`

This file.

---

## Files Modified

### `src/app/director/sessions/[sessionId]/attendanceExceptionDraftAction.ts`

1. Added `AmbiguousAttendanceName` interface (exported)
2. Added optional `ambiguous_attendance_names?: AmbiguousAttendanceName[]` to `AttendanceExceptionPayload`
3. Added `matchAllNamesToRoster()` — all-candidates lookup function
4. Retained `matchToRoster()` — first-match, still used for `detectUnrosteredNames`
5. Added `ambiguousNames` array to `parseAttendance()` absent-name loop
6. Updated loop: 1 candidate → safe, >1 → ambiguous, 0 → unmatched warning
7. Added `ambiguous_attendance_names` to return payload (omitted when empty)

---

## Validation Examples

### "Except Sarah" — only Sarah Kim on roster

```
absentPlayerIds = { 'sarah-kim-id' }
rostered_attendance = [
  { player_id: 'sarah-kim-id', proposed_status: 'absent', match_reason: 'Mentioned after "except"' },
  ... (other players: present/unknown)
]
ambiguous_attendance_names: (omitted)
```

### "Except Sarah" — Sarah Kim and Sarah Lopez on roster, "everyone" baseline

```
absentPlayerIds = {}   (neither added)
rostered_attendance = [
  { player_id: 'sarah-kim-id', proposed_status: 'present', match_reason: '"Everyone" baseline detected' },
  { player_id: 'sarah-lopez-id', proposed_status: 'present', match_reason: '"Everyone" baseline detected' },
  ... (other players: present)
]
ambiguous_attendance_names = [{
  mentioned_name: 'Sarah',
  candidate_players: [
    { player_id: 'sarah-kim-id', player_name: 'Sarah Kim' },
    { player_id: 'sarah-lopez-id', player_name: 'Sarah Lopez' }
  ],
  reason: '"Sarah" matches 2 rostered players — director must confirm which player was absent.'
}]
warnings = [..., '"Sarah" matched 2 rostered players (Sarah Kim, Sarah Lopez) — director must confirm...']
```

### "Except Sarah Kim" — Sarah Kim and Sarah Lopez on roster

```
absentPlayerIds = { 'sarah-kim-id' }   (exact full-name match — tier 1, always unambiguous)
rostered_attendance = [
  { player_id: 'sarah-kim-id', proposed_status: 'absent', match_reason: 'Mentioned after "except"' },
  { player_id: 'sarah-lopez-id', proposed_status: 'present', match_reason: '"Everyone" baseline detected' },
  ...
]
ambiguous_attendance_names: (omitted)
```

---

## Apply Action Audit

`applyApprovedAttendanceExceptionAction` iterates:
- `payload.rostered_attendance` → writes to `session_attendance` (skips `unknown`)
- `payload.unrostered_attendees` → creates placement_review follow-ups

It does **not** read `ambiguous_attendance_names`. Field is display-only. No modification needed.

---

## Safety Guardrails Preserved

| Guarantee | Status |
|---|---|
| No official attendance written until director Apply | ✅ always pending_review |
| No null player_ids in rostered_attendance | ✅ ambiguous names never enter absentPlayerIds |
| No players created | ✅ placement_review at apply time only |
| No roster changes | ✅ unrostered → placement_review → separate director decision |
| No billing changes | ✅ no billing path |
| No parent/player messages | ✅ no comms path |
| Apply action unaffected | ✅ only reads rostered_attendance + unrostered_attendees |
| Existing payloads backward-compatible | ✅ ambiguous_attendance_names is optional |
| Schema unchanged | ✅ no migrations |

---

## Remaining Attendance Gaps (Post Sprint 838)

| Gap | Source | Priority |
|---|---|---|
| Two review cards for one session (wrap-up + attendance exception) not visually linked | Sprint 834 | Low |
| `extractAbsentNames` single-trigger limitation in session detail parser (`break` on first trigger found) | Sprint 834 | Low |
| Session picker window (7 days / 5 sessions) in DONNA path may miss older sessions | Sprint 834 | Low |

---

## Recommended Sprint 839

**Sprint 839 — Attendance Exception End-to-End Audit V2**

With Sprints 835–838 now complete (parsing, DONNA highlight/link, ambiguous name resolution for
both paths), run a fresh end-to-end audit of the full attendance exception loop to score it
against the Sprint 834 gaps and confirm which ones are resolved. Produces an updated score and
a prioritised list of remaining gaps to guide the next build cycle.

Risk: Zero — audit-only, no code changes.
