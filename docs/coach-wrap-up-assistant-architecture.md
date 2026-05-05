# Coach Wrap-Up Assistant — Architecture

**Last updated:** 2026-05-05
**Sprint:** 11

---

## Product goal

After every session, the coach should feel like they have a secretary.

They tap "Wrap Up Session." The assistant asks one short question at a time. The coach answers naturally — text or voice. The system turns those answers into structured drafts for director review.

The coach should never feel like they are filling out a form.

---

## Minimum recap checklist

The wrap-up collects:

| Step | Question | Drives |
|---|---|---|
| 1 | Was everyone here, or was anyone missing or added? | Attendance exceptions / drafts |
| 2 | Did you complete all the planned blocks? | Session actual draft |
| 3 | What changed or got skipped, and why? | Session actual draft |
| 4 | Who stood out — positively or negatively? | Player observations |
| 5 | Who needs specific attention next session? | Player observations / priorities |
| 6 | What should the focus be next time? | Session actual draft / director note |

---

## Data flow

```
Coach answers (client state)
  → Review summary (UI)
    → Explicit save (coach taps "Save Recap")
      ├── voice_notes: raw structured text (session-level recap, player_id = null)
      ├── proposed_actions (target_module = 'session_wrap_up_v1'): structured session actual draft
      ├── coach_observations: one per player note (is_private = true)
      └── proposed_actions (target_module = 'attendance_exception'): attendance drafts
```

---

## Storage options

### Raw wrap-up text → `voice_notes`
- Already used by `saveSessionRecapAction`
- `session_id`, `academy_id`, `author_id`, `raw_input`, `processing_status = 'pending'`
- Safe: no migration needed
- Used in Sprint 12 V1 save

### Session actual draft → `proposed_actions`
- `target_module = 'session_wrap_up_v1'`
- `target_object_id = session_id`
- `proposed_payload` = JSON with block completion, changes, next focus
- `status = 'pending_review'`
- Requires `voice_commands` FK record (same pattern as attendance exception draft)
- Safe: no migration needed

### Player observations → `coach_observations`
- One row per player note
- `is_private = true`, `session_id` linked
- Inserted directly, requires explicit coach save per player
- Safe: no migration needed

### Attendance exceptions → `proposed_actions`
- Same pattern as existing `createAttendanceExceptionDraftAction`
- `target_module = 'attendance_exception'`
- Reuse exact same action

---

## Approval model

| Output | Who approves | How |
|---|---|---|
| Wrap-up text | Director (implicit — it's a recap, not a record change) | View in review queue |
| Session actual draft | Director | Review queue → Approve / Modify |
| Player observations | Internal to coach and director only | `is_private = true` — not parent/player-facing |
| Attendance exceptions | Director | Review queue → Approve → `saveAttendanceAction` |

---

## Draft vs official record boundary

| Field | Draft state | Official state |
|---|---|---|
| Raw wrap-up text | `voice_notes.processing_status = 'pending'` | Stays as recap reference |
| Session actual | `proposed_actions.status = 'pending_review'` | Director approves → status = 'approved' |
| Player observation | Immediately stored in `coach_observations` (internal) | Already internal; parent/player visibility = never unless explicitly exposed |
| Attendance | `proposed_actions.status = 'pending_review'` | Director approves → `session_attendance` upsert |

---

## Role visibility

| Content | Coach | Director | Head Coach | Player | Parent |
|---|---|---|---|---|---|
| Wrap-up raw text | Write | Read (review queue) | Read | Never | Never |
| Session actual draft | Write | Read + Approve | Read + Approve | Never | Never |
| Player observations | Write (their own) | Read all | Read assigned | Never | Never |
| Attendance draft | Write | Read + Approve | Read + Approve | Never | Never |

---

## V1 build order (Sprints 12–15)

| Sprint | What gets built |
|---|---|
| 12 | Guided recap UI — one question at a time. Text answers. Save to `voice_notes`. |
| 13 | Session actual draft. Block completion checkboxes. Save to `proposed_actions`. |
| 14 | Player observation drafts. Player note rows from Q4/Q5. Save to `coach_observations`. |
| 15 | Attendance exception drafts from Q1. Explicit roster checkboxes or natural language parse. |

---

## Migration needs

**None required for V1.** All storage uses existing tables:
- `voice_notes` ✓ (existing)
- `proposed_actions` ✓ (existing, via `voice_commands` FK pattern)
- `coach_observations` ✓ (existing)
- `session_attendance` ✓ (for actual attendance updates after director approval)

---

## Technical implementation

- `CoachWrapUpDrawer.tsx` — full-screen client component, manages step state
- `saveWrapUpDraftAction.ts` — server action, saves to `proposed_actions`
- `saveWrapUpObservationsAction.ts` — server action, saves to `coach_observations`
- Reuses `saveSessionRecapAction` for raw text backup
- Reuses `createAttendanceExceptionDraftAction` pattern for attendance

---

## Key safety invariants

1. No attendance record is created automatically — coach confirms each player.
2. No player observation is parent/player-facing unless explicitly approved by director.
3. No session template is modified.
4. All wrap-up outputs are drafts in `proposed_actions` or internal-only in `coach_observations`.
5. Coach must explicitly tap "Save" — nothing is saved on step navigation.
