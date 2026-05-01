# Fitness Exposure Tracking Plan

**Status:** Foundation built in Sprint 46. Full implementation deferred pending schema decision.
**Last updated:** 2026-05-01

---

## What exposure tracking means

Exposure tracking answers: "What fitness work was a player planned to receive, and what did they actually receive?"

It bridges:
- **Planned exposure** — the exercises in a template block a player's group is scheduled for
- **Actual exposure** — the exercises in sessions the player attended

When a player misses a session (attendance exception), they miss planned exposure. The gap between planned and actual exposure informs at-home fitness recommendations.

---

## Current data model (Sprint 46 foundation)

### Planned exposure is already trackable via:

| Table | Key fields | What it records |
|---|---|---|
| `templates` | `id`, `track`, `level_id` | The master plan |
| `template_blocks` | `template_id`, `type`, `duration_min` | Blocks in the plan |
| `template_block_exercises` | `block_id`, `exercise_id`, `duration_min` | Exercises in each block |

### Actual exposure is trackable via:

| Table | Key fields | What it records |
|---|---|---|
| `sessions` | `template_id`, `group_id`, `scheduled_date` | Session sourced from template |
| `session_blocks` | `session_id`, `type`, `duration_min` | Blocks in the session |
| `session_block_exercises` | `block_id`, `exercise_id`, `completed`, `duration_min` | Per-exercise completion |
| `session_attendance` | `session_id`, `player_id`, `status` | Whether the player was there |

### Gap = planned exposure where player was absent

```
missed_exposure = 
  sessions where:
    session.group_id contains player
    AND session_attendance.player_id = player AND status = 'absent'
  → session_blocks for those sessions
  → session_block_exercises for those blocks
  → categorize by exercise.category (fitness, movement, etc.)
```

---

## What is NOT yet implemented

### Player-level exposure aggregation

There is no `player_fitness_exposure` table. To compute exposure gaps, you currently need to:
1. Fetch sessions for the player's group
2. Cross-reference with session_attendance for that player
3. Aggregate session_block_exercises by category

This is a multi-query computation, not a pre-aggregated view.

### Schema change needed for efficient exposure queries

To make gap detection fast and audit-friendly, a future migration should add:

```sql
-- Player fitness exposure summary (aggregated, not raw)
CREATE TABLE player_fitness_exposure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES academies(id),
  player_id uuid NOT NULL REFERENCES players(id),
  session_id uuid REFERENCES sessions(id),
  template_block_id uuid REFERENCES template_blocks(id),
  exercise_id uuid REFERENCES exercises(id),
  exposure_type text NOT NULL, -- 'planned' | 'completed' | 'missed'
  duration_min integer,
  exercise_category text,
  recorded_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);
```

This migration is NOT included in Sprint 46. It requires:
- RLS policy design
- Decision on whether to backfill historical sessions
- Confirmation that session_block_exercises.completed is reliably populated

---

## Sprint 47 will implement

The deterministic gap logic plan (no DB mutation):
- Reading the current schema to compute exposure gaps
- Categorizing missed exposure by fitness domain
- Feeding this into at-home recommendation drafts

---

## Usage notes for the current implementation

The `populateFitnessTemplateBlocksAction` (Sprint 46) adds exercises to `template_block_exercises`. This is the **planned exposure** data point. When this template is used to generate a session, the session inherits these exercises as `session_block_exercises`.

If a player attends the session, `session_block_exercises.completed = true` records actual exposure.
If a player is absent (captured via attendance_exception draft), the gap is implicit.
