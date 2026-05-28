# PROPOSED ACTIONS SYSTEM
**Package:** 03 — Voice-First Architecture
**Version:** 1.0 | **Status:** Draft

---

## Core Rule

> Proposed actions are the ONLY way voice commands change data.
> No voice input ever directly writes to core tables.

A proposed action is a **pending intent** stored in the database.
It describes what the system would do — but does nothing until a human approves it.

---

## Lifecycle

```
created (pending_review)
  ├─ clarification_needed → [user responds] → pending_review
  ├─ rejected             → terminal
  ├─ expired              → terminal (24-hour window elapsed)
  └─ approved / modified
       └─ executed
            ├─ success  → terminal
            └─ failed   → terminal (with error log)
```

Status field: `proposed_actions.status`

---

## Database Tables

### `proposed_actions`

| Field | Purpose |
|---|---|
| `action_type` | What kind of action (enum) |
| `action_label` | Human-readable summary sentence |
| `proposed_payload` | Exact payload that will be executed |
| `risk_level` | `low` / `medium` / `high` |
| `risk_notes` | Reasons for that risk level |
| `affected_count` | How many objects will be created/changed |
| `status` | Current state in lifecycle |
| `modified_payload` | Director's edited version (if modified) |
| `expires_at` | 24 hours after creation — actions expire if not reviewed |

### `action_execution_logs`

One record per execution attempt. Records:
- What objects were created (`objects_created[]`)
- What objects were modified (`objects_modified[]`)
- Result payload
- Error message on failure
- Execution timestamp

---

## Risk Classification

Risk is auto-assigned when the proposed action is created.

| Level | Criteria | UI Treatment |
|---|---|---|
| `low` | Creates a single new object; no modification to existing records | Green indicator |
| `medium` | Modifies 1–5 existing records | Amber indicator |
| `high` | Modifies 6+ existing records; touches placement; mass intensity change; player group move | Red warning banner |

High-risk actions require the director to explicitly confirm.

**Examples:**

| Action | Risk |
|---|---|
| Create session for one group | low |
| Schedule a reassessment | low |
| Generate parent update | low |
| Modify session intensity | medium |
| Move a player to a new group | medium |
| Reduce intensity for all sessions next week | high |
| Finalize player placement | high |

---

## Review UI Requirements

The approval interface must always show:

```
┌──────────────────────────────────────────────┐
│  PROPOSED ACTION                              │
│  ──────────────────────────────────────────  │
│  Action:   Create session for Orange Dev.     │
│            Monday May 4, 2026 · 90 min        │
│                                               │
│  Template: Green Technical Block              │
│  Coach:    Marco Santos                       │
│  Intensity: Fitness ↓ (2/5 — lighter)         │
│                                               │
│  Affects:  8 players                          │
│  Risk:     ⬤ LOW                              │
│                                               │
│  Original command:                            │
│  "Make Thursday lighter for the oranges"      │
│                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ APPROVE  │ │   EDIT   │ │  REJECT  │     │
│  └──────────┘ └──────────┘ └──────────┘     │
└──────────────────────────────────────────────┘
```

Required elements:
1. **Action label** — human-readable description of what will happen
2. **Key payload fields** — shown in readable form, not raw JSON
3. **Affected object count** — how many records will change
4. **Risk level** — with color indicator
5. **Original command** — exact text the user entered
6. **Expiry countdown** — if action expires within 2 hours
7. **Approve / Edit / Reject** — three explicit choices

### Edit flow

When a director clicks "Edit":
- The payload fields become editable inputs
- Changed fields are highlighted
- Save creates `modified_payload` (original preserved)
- Status → `modified` on save
- Execution uses `modified_payload`

### Reject flow

- Rejection reason is required (free text or predefined)
- Status → `rejected`
- Rejection reason stored in `proposed_actions.rejection_reason`
- Audit log written

---

## Execution

After approval (status = `approved` or `modified`), the director clicks "Execute" or
execution happens automatically on approval (configurable per academy in settings).

The function `execute_approved_action(action_id, executor_id)` is called.

**It will refuse to execute if:**
- `status` is not `approved` or `modified`
- `expires_at` has passed
- Required objects no longer exist (e.g., group was deleted)

**On success:**
- Core objects created/modified
- `action_execution_logs` row written
- `audit_logs` row written
- Proposed action status → `executed`

**On failure:**
- Nothing changes in core tables (transaction rolled back)
- `action_execution_logs` row written with `status = 'failed'`
- Error message returned to UI
- Director sees "Action failed — no data was changed"

---

## Expiry

Proposed actions expire 24 hours after creation.

If a director tries to approve an expired action:
- Error shown: "This action has expired and can no longer be executed."
- Option offered: "Re-issue command" (sends user back to voice input)

Expired actions are marked `expired` by:
- The `execute_approved_action()` function on attempt
- A nightly cleanup job (flag all `pending_review` with `expires_at < NOW()`)

---

## Access Control

| Role | Can create | Can view | Can approve/reject |
|---|---|---|---|
| `academy_director` | Yes (via voice) | All in academy | Yes |
| `head_coach` | Yes (via voice) | All in academy | Yes |
| `coach` | Yes (via voice) | Their own only | No |
| `player` | No | No | No |
| `parent` | No | No | No |

Coaches can issue voice commands that create proposed actions, but cannot approve them.
Approval always requires `academy_director` or `head_coach`.

---

## Notification Pattern

When a new proposed action is created by a coach:
1. Director and head coaches receive an in-app notification
2. Badge count in top nav increases
3. Action appears in "Pending Actions" panel on director dashboard

When an action expires unreviewed:
1. Notification to the coach who issued the command
2. Action removed from active queue

---

## V1 Implementation Note

In V1, voice commands are typed input. The proposed action system is fully implemented.
The only difference from V2 is that `input_method = 'typed'` and there is no audio file.

The approval UI, execution function, and audit trail are all identical between V1 and V2.
This is intentional — the architecture is correct from day one, even before real audio
recording is added.
