# Approved Action Execution Coverage Plan

**Sprint:** 236
**Last updated:** 2026-05-04
**Status:** V1 — 11 of 15 action types covered after migration 054

---

## Purpose

`execute_approved_action()` is the only path to execute an approved voice action.
Nothing bypasses it — architecture red line.

This document maps every value in the `action_type` enum to:
- Current status (handled / not handled / excluded)
- The payload contract the voice pipeline must produce
- The tables the handler writes to
- Any constraints or edge cases

---

## Coverage summary

| action_type | Status after 054 | Tables written |
|---|---|---|
| `create_session` | ✅ Handled (009) | `sessions` |
| `cancel_session` | ✅ Handled (009) | `sessions` |
| `assign_group` | ✅ Handled (009) | `players` |
| `move_player_group` | ✅ Handled (009) | `group_memberships`, `players` |
| `schedule_reassessment` | ✅ Handled (009) | `players` |
| `modify_session` | ✅ Handled (054) | `sessions` |
| `create_template` | ✅ Handled (054) | `templates` |
| `modify_template` | ✅ Handled (054) | `templates` |
| `create_placement_assessment` | ✅ Handled (054) | `assessments`, `players` |
| `adjust_session_intensity` | ✅ Handled (054) | `session_blocks` |
| `flag_player` | ✅ Handled (054) | `player_progression` |
| `generate_parent_update` | ⏳ Deferred | No parent comms table yet |
| `create_player` | ⏳ Deferred | Too many required fields for voice payload |
| `create_exercise` | ⏳ Deferred | Exercise library schema needs separate sprint |
| `other` | 🚫 No handler | Catch-all — no execution semantics |

**After migration 054:** 11 of 15 types handled. 3 deferred. 1 excluded.

---

## Payload contracts (migration 054 additions)

### `modify_session`

```json
{
  "session_id": "<uuid>",
  "date": "2026-05-10",           // optional
  "duration_min": 90,              // optional
  "coach_id": "<uuid>",           // optional
  "template_id": "<uuid>"         // optional
}
```

All fields except `session_id` are optional. Omitted fields are not changed.
Scoped to `academy_id` — cannot modify sessions from other academies.

---

### `create_template`

```json
{
  "name": "Orange Ball Technical",
  "group_id": "<uuid>",           // optional
  "track": "development",         // optional — development_track enum
  "total_duration_min": 90,       // optional
  "description": "Focus on..."   // optional
}
```

`name` is required. All other fields optional.
Sets `voice_command_id` and `created_by` from execution context.

---

### `modify_template`

```json
{
  "template_id": "<uuid>",
  "name": "Updated Name",         // optional
  "description": "...",           // optional
  "track": "performance",         // optional
  "total_duration_min": 75        // optional
}
```

All fields except `template_id` optional. Omitted fields are not changed.

---

### `create_placement_assessment`

```json
{
  "player_id": "<uuid>",
  "assessed_date": "2026-05-10", // optional — defaults to CURRENT_DATE
  "notes": "Initial intake..."   // optional
}
```

Creates an `intake` assessment with `is_baseline = true`.
Scores are filled in during the session — the RPC creates the shell only.
Side effect: if player status is `pending_placement`, it advances to `placement_in_progress`.

---

### `adjust_session_intensity`

```json
{
  "session_id": "<uuid>",
  "intensity": 3
}
```

`intensity` must be an integer 1–5 (enforced by `session_blocks.intensity` constraint).
Updates ALL blocks in the session — not block-by-block.

---

### `flag_player`

```json
{
  "player_id": "<uuid>",
  "reason": "promotion candidate"  // optional — for audit only
}
```

Sets `player_progression.promotion_flagged_at = NOW()` and `promotion_flagged_by = executor`.
Does NOT change `players.status` — `player_status` enum has no 'flagged' value.
The flag is a soft signal for coach/director review, not a status transition.

---

## Deferred action types

### `generate_parent_update`

No destination table exists for parent communications yet.
When a parent communications draft queue is built (future sprint), this handler should:
- INSERT into the new `parent_communication_drafts` table
- Set status = `pending_director_review`
- Never send directly — always requires director approval

**Unblocked by:** Parent Communication Draft Queue sprint (after Sprint 238).

---

### `create_player`

The `players` table has multiple NOT NULL fields:
`academy_id`, `first_name`, `last_name`, `date_of_birth`, `join_date`.

Voice commands typically capture partial information ("add a new player named Alex").
A partial INSERT would violate NOT NULL constraints and risk creating orphan records.

**Recommendation:** Build a dedicated multi-step placement flow UI (Step 6 in CURRENT_BUILD_TARGET.md).
The voice command should produce a `create_player` draft that the director completes in the UI — not a direct DB insert.

**Unblocked by:** Placement Engine UI (Step 6).

---

### `create_exercise`

The exercise library schema (`exercises`, `exercise_library`) needs schema analysis before safe insertion from a voice payload. Exercise records have curriculum linkages and progression metadata.

**Unblocked by:** Curriculum Exercise Builder sprint (future).

---

### `other`

Catch-all type. Used when intent parsing cannot classify the command into a specific type.
No execution semantics. Remains in `ELSE → RAISE EXCEPTION` path by design.

---

## All cases write to audit_logs

Every successful execution — including all 054 additions — writes to `audit_logs`:

```
action: 'voice.action.executed'
target_type: v_action.target_module
payload: { action_type, result }
source_type: 'voice'
```

And to `action_execution_logs`:

```
status: 'success'
execution_result: <JSONB result>
objects_created: <UUIDs of any new rows>
```

Failed executions write to `action_execution_logs` with `status = 'failed'` and `error_message`.

---

## What is still needed before Voice Command Center (Step 9)

Per `CURRENT_BUILD_TARGET.md`, the Voice Command Center requires all action types to be handled.

Remaining blockers:
1. `generate_parent_update` — needs parent comms table
2. `create_player` — needs Placement Engine UI as the completion step
3. `create_exercise` — needs Curriculum Exercise Builder

These are not voice execution blockers for the core director workflow.
A pragmatic Voice Command Center can be built with the 11 handled types
and display a "not supported yet" message for the 3 deferred types.

See `docs/conversational-os/conversational-os-master-plan.md` for the full voice architecture.
