# Audit Log Strategy

> Part of the Trust Stack — see `trust-stack.md` for the root doctrine.
> Layer 4: Audit log records.

This document defines the audit logging contract for AcademyOS. Every meaningful mutation must produce an audit log entry. The audit log is the system of record for reconstructing what happened, to whom, and who authorized it.

---

## Core Principle

The audit log must make every state change explainable from the log record alone, without reading application code. A log entry that cannot be understood without source code context is insufficient.

---

## What Must Be Logged

### Always (non-negotiable)

| Event | Trigger |
|---|---|
| Player created | `INSERT INTO players` |
| Player activated | `finalize_player_placement()` executes |
| Player level change | `players.current_level_id` updated |
| Player deactivated | `players.is_active` set to false |
| Priority created / updated / deleted | Any write to `player_priorities` |
| Development summary created / updated | Any write to `player_development_summary` |
| Proposed action created | DONNA or user creates a proposed_action |
| Proposed action approved | Status changes to `approved` |
| Proposed action rejected | Status changes to `rejected` |
| Proposed action executed | `execute_approved_action()` completes |
| Session created | `INSERT INTO sessions` |
| Session finalized | Session status set to complete |
| Guardian linked to player | `INSERT INTO player_guardians` |
| Guardian unlinked from player | `DELETE FROM player_guardians` |
| Data export triggered | Any export operation |
| Role change | `profiles.role` updated |
| Feature flag toggled | Any kill switch or flag change |

### Where Applicable

| Event | Trigger |
|---|---|
| Voice session started | `INSERT INTO voice_sessions` |
| Voice transcript structured | Anthropic structuring call completes |
| AI call made | Any call to Anthropic, OpenAI |
| Template published | Template status → active |
| Template archived | Template status → archived |
| Curriculum override applied | `INSERT INTO academy_curriculum_overrides` |

### Never Log

- Raw voice audio content (never stored)
- Passwords or auth tokens (Supabase manages these)
- Guardian email or phone in the `payload_after` field
- Full AI prompt/response content (log metadata only)
- Read-only queries (SELECT operations do not produce audit rows)

---

## `audit_logs` Row Schema

Every audit log row must contain:

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Row identifier |
| `academy_id` | uuid | Scoped to one academy |
| `actor_id` | uuid (nullable) | `profiles.id` of the human who triggered the action; null for system events |
| `actor_role` | text | Role at time of action (`academy_director`, `head_coach`, etc.) |
| `entity_type` | text | The table or domain object affected (e.g., `player`, `proposed_action`) |
| `entity_id` | uuid | The specific row affected |
| `action` | text | What happened (e.g., `created`, `approved`, `level_changed`, `executed`) |
| `payload_before` | jsonb (nullable) | Snapshot of relevant fields before the change |
| `payload_after` | jsonb (nullable) | Snapshot of relevant fields after the change |
| `source` | text | `user`, `donna`, `system`, `cron` |
| `proposed_action_id` | uuid (nullable) | The `proposed_actions.id` that authorized this change, if applicable |
| `ip_address` | text (nullable) | Request IP for security audit; omit from player/parent-visible logs |
| `created_at` | timestamptz | Server timestamp, never client-supplied |

---

## Payload Guidelines

The `payload_before` and `payload_after` fields contain only the fields relevant to the change — not full row dumps. This keeps log entries readable and avoids storing PII fields unnecessarily.

Examples:

**Player level change:**
```json
{
  "payload_before": { "current_level_id": "uuid-old-level", "level_label": "Yellow Development" },
  "payload_after": { "current_level_id": "uuid-new-level", "level_label": "Orange Development" }
}
```

**Priority update:**
```json
{
  "payload_before": { "title": "Footwork consistency", "priority_rank": 2, "urgency": "medium" },
  "payload_after": { "title": "Footwork consistency", "priority_rank": 1, "urgency": "high" }
}
```

**Proposed action executed:**
```json
{
  "payload_before": { "status": "approved" },
  "payload_after": { "status": "executed", "executed_at": "2026-05-21T14:32:00Z" },
  "action_type": "update_player_priority",
  "proposed_action_id": "uuid-of-proposed-action"
}
```

Never put in payloads:
- Guardian email, phone, or contact info
- Full AI prompt or response text
- Password hashes or tokens

---

## Append-Only Guarantee

`audit_logs` is append-only. No application code may UPDATE or DELETE rows. This is enforced by:

1. RLS policy: no UPDATE or DELETE permissions for any application role
2. PostgreSQL trigger (planned): a trigger that rejects any UPDATE/DELETE DML on the table
3. Application convention: no `audit_logs` update/delete path exists in any server action

The only exception: a database administrator may correct catastrophically erroneous entries (e.g., due to a bug that logged incorrect data), and this operation itself must be logged in an out-of-band ops log.

---

## Querying the Audit Log

Standard query pattern for reconstructing an entity's history:

```sql
SELECT *
FROM audit_logs
WHERE academy_id = $1
  AND entity_type = $2
  AND entity_id = $3
ORDER BY created_at ASC;
```

For DONNA-sourced changes:
```sql
WHERE source = 'donna'
  AND academy_id = $1
ORDER BY created_at DESC;
```

For approval trail of a specific proposed action:
```sql
WHERE proposed_action_id = $1
ORDER BY created_at ASC;
```

---

## Current State (as of Sprint 400 audit)

The following events currently produce audit log rows: _(partial — Sprint 400 audit finding)_
- Proposed action creation, approval, rejection, execution

The following events do not yet produce audit log rows (gaps to close in Sprint 401+):
- Player creation and activation
- Player level changes
- Priority CRUD
- Development summary CRUD
- Guardian link/unlink
- Feature flag changes
- AI call completions
- Data exports

These gaps are documented in `docs/SCALABILITY_COST_CONTROL_AUDIT.md` and are tracked in the Sprint 401 observability roadmap.

---

## Implementation Pattern

For server actions that perform mutations, the audit log write follows this pattern:

```ts
// Inside a server action — after the mutation succeeds
await db.from('audit_logs').insert({
  academy_id: session.academyId,
  actor_id: session.profileId,
  actor_role: session.role,
  entity_type: 'player',
  entity_id: playerId,
  action: 'level_changed',
  payload_before: { current_level_id: previousLevelId, level_label: previousLabel },
  payload_after: { current_level_id: newLevelId, level_label: newLabel },
  source: 'user',
  proposed_action_id: proposedActionId ?? null,
})
```

The audit log write must happen in the same database transaction as the mutation, or in a follow-up write that is retried on failure. A mutation that succeeds but produces no audit log entry is an incomplete operation.

---

## Director-Visible Audit Log

In a future sprint, Directors will have access to a filtered audit log view in the UI showing:
- The last 30 days of changes to players, priorities, and session data
- A "DONNA activity" feed showing all proposed actions and their approval outcomes
- A "team activity" feed showing all coach-authored changes

This view must not include L3 data (guardian PII) and must not be queryable across academy boundaries.
