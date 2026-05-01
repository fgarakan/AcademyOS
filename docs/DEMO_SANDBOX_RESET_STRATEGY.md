# Demo Sandbox Reset Strategy

**Sprint:** 112
**Date:** 2026-05-01

---

## Tagging Strategy

**No database migration required.** Demo records are isolated by a strict `[DEMO]` prefix
in the primary name field of each table. The prefix is always uppercase and bracket-formatted
to avoid accidental collision with real record names.

| Table | Tag Field | Pattern | Example |
|---|---|---|---|
| `players` | `first_name` | Starts with `[DEMO]` | `[DEMO] Mia` |
| `groups` | `name` | Starts with `[DEMO]` | `[DEMO] Orange 2 Sample Group` |
| `templates` | `name` | Starts with `[DEMO]` | `[DEMO] Orange 2 Direction + Return Start` |
| `sessions` | `name` | Starts with `[DEMO]` | `[DEMO] Orange 2 Adaptive Session` |
| `academy_curriculum_versions` | `name` | Starts with `[DEMO]` | `[DEMO] Dabul Academy Curriculum` |

Child records (blocks, memberships, dev summaries, priorities, suggestions) are identified by
their parent's ID — they do not need their own tag.

---

## Reset / Delete Order

Delete in this exact order to avoid FK violations. All deletes are scoped to `academy_id`.

### Step 1 — Session Adjustment Suggestions

```sql
DELETE FROM session_adjustment_suggestions
WHERE session_id IN (
  SELECT id FROM sessions
  WHERE academy_id = :academyId
  AND name ILIKE '[DEMO]%'
)
```

Why first: references `sessions(id)`. Must be deleted before sessions.

### Step 2 — Sessions (cascades session_blocks)

```sql
DELETE FROM sessions
WHERE academy_id = :academyId
AND name ILIKE '[DEMO]%'
```

`session_blocks` ON DELETE CASCADE — blocks deleted automatically.

### Step 3 — Templates (cascades template_blocks)

```sql
DELETE FROM templates
WHERE academy_id = :academyId
AND name ILIKE '[DEMO]%'
```

`template_blocks` ON DELETE CASCADE — blocks deleted automatically.

### Step 4 — Players (cascades memberships, priorities, dev summaries, curriculum states)

```sql
DELETE FROM players
WHERE academy_id = :academyId
AND first_name ILIKE '[DEMO]%'
```

ON DELETE CASCADE covers:
- `group_memberships` (player_id FK CASCADE)
- `player_priorities` (player_id FK CASCADE)
- `player_development_summary` (player_id FK CASCADE)
- `player_curriculum_states` (player_id FK CASCADE)

### Step 5 — Groups

```sql
DELETE FROM groups
WHERE academy_id = :academyId
AND name ILIKE '[DEMO]%'
```

Memberships already cleared by player cascade. Groups without members delete cleanly.

### Step 6 — Academy Curriculum Versions (cascades overrides)

```sql
DELETE FROM academy_curriculum_versions
WHERE academy_id = :academyId
AND name ILIKE '[DEMO]%'
```

`academy_curriculum_overrides` ON DELETE CASCADE — overrides deleted automatically.

---

## Safety Guarantees

| Risk | Protection |
|---|---|
| Deleting real players | DELETE WHERE `first_name ILIKE '[DEMO]%'` — real names never start with `[DEMO]` |
| Deleting real sessions | DELETE WHERE `name ILIKE '[DEMO]%'` — real session names never start with `[DEMO]` |
| Deleting wrong academy's data | Every query scoped with `AND academy_id = :academyId` |
| Accidental broad delete | `ILIKE '[DEMO]%'` is a narrow, specific prefix filter |
| Real player records mutated | Demo seed never touches rows without `[DEMO]` prefix |
| Unconfirmed delete | UI requires explicit confirmation checkbox before delete action runs |

---

## Confirmation Requirements

The UI must show a checkbox before any delete:

> "I understand this only deletes records labeled as demo/sample data. Real player records will not be affected."

The delete server action receives `confirmed: true` as an explicit parameter. If false, action returns error.

---

## Idempotent Seed

The seed action checks for existing demo records before inserting:
- If demo group already exists: skip group creation, use existing ID
- If demo player already exists: skip that player
- If demo template already exists: skip template creation
- If demo session already exists: skip session creation

This means `createOrResetDemoSandboxAction` can be called multiple times safely.
For a full reset: call `resetDemoSandboxAction` (delete all) then `createOrResetDemoSandboxAction` (re-seed).

---

## Audit Trail

Every reset/delete writes an `audit_logs` entry:

```json
{
  "action": "demo_sandbox_reset",
  "actor_id": "<user_profile_id>",
  "academy_id": "<academy_id>",
  "metadata": {
    "deleted_sessions": 1,
    "deleted_templates": 1,
    "deleted_players": 6,
    "deleted_groups": 1,
    "deleted_curriculum_versions": 1
  }
}
```

---

## What the Reset Does NOT Do

- Does not delete any record without `[DEMO]` prefix in the tag field
- Does not touch real player records
- Does not touch real group records
- Does not touch real session records
- Does not touch real templates
- Does not modify global curriculum
- Does not send any communications
- Does not create any parent/guardian data
