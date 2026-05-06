# Session Actuals Normalized Schema Plan

**Status:** Plan only — no migration applied.
**Date:** 2026-05-06
**Sprint:** 96

This document describes the schema required to replace the current `sessions.session_notes`
text-blob approach with a normalized, queryable session actuals model that can power the
Director diff view, the parent summary, and future AI suggestions.

Do not apply any migration from this document without explicit sprint approval and a STOP checkpoint.

---

## Current state

Session actuals are written to `sessions.session_notes` as a structured text block
by `applyWrapUpDraftAction`. Block completion status is stored in localStorage (not DB).
Exercise completion and notes exist in `session_block_exercises.completed` / `.notes`.
There is no parent-safe summary table, no attendance delta, and no source-template version
capture at session time.

---

## Target: normalized tables

### `session_actuals`

One row per completed/wrapped session. Captures the top-level session outcome.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `academy_id` | uuid FK | RLS anchor |
| `session_id` | uuid FK | sessions.id |
| `source_template_id` | uuid \| null | templates.id at generation time |
| `source_template_version` | text \| null | Snapshot label (e.g. "v2 2026-05-06") |
| `coach_id` | uuid FK | profiles.id |
| `scheduled_date` | date | |
| `actual_start_time` | timestamptz \| null | When status flipped to in_progress |
| `actual_end_time` | timestamptz \| null | When status flipped to completed |
| `total_exercises_planned` | int | Count from session_block_exercises at session time |
| `total_exercises_completed` | int | Done + modified |
| `total_exercises_skipped` | int | |
| `overall_status` | text | completed / partial / cancelled |
| `coach_raw_notes` | text \| null | Full text from wrap-up survey |
| `changes_note` | text \| null | What changed from plan |
| `next_focus` | text \| null | Coach's next priority |
| `group_note` | text \| null | Coach's group observation |
| `director_reviewed_at` | timestamptz \| null | When director approved the wrap-up |
| `director_reviewer_id` | uuid \| null | profiles.id |
| `is_visible_to_parents` | bool | Default false — explicit director publish only |
| `is_visible_to_players` | bool | Default false |
| `created_at` | timestamptz | |

### `session_actual_blocks`

One row per block in the session, capturing what actually happened vs the plan.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `academy_id` | uuid FK | RLS anchor |
| `session_actual_id` | uuid FK | session_actuals.id |
| `session_block_id` | uuid FK | session_blocks.id |
| `planned_block_name` | text | Snapshot at session time |
| `planned_duration_min` | int \| null | |
| `planned_type` | text | |
| `actual_status` | text | completed / skipped / modified / unknown |
| `coach_note` | text \| null | Block-level note from wrap-up |
| `order_index` | int | |

### `session_actual_exercises`

One row per exercise in the session, capturing completion and any coach note.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `academy_id` | uuid FK | RLS anchor |
| `session_actual_id` | uuid FK | session_actuals.id |
| `session_actual_block_id` | uuid FK | session_actual_blocks.id |
| `session_block_exercise_id` | uuid FK | session_block_exercises.id |
| `exercise_id` | uuid FK | exercises.id |
| `exercise_name` | text | Snapshot at session time |
| `exercise_category` | text | |
| `planned_duration_min` | int \| null | |
| `actual_status` | text | done / skipped / modified / unknown |
| `coach_note` | text \| null | |
| `order_index` | int | |

### `session_actual_attendance`

Normalized attendance snapshot — different from session_attendance which is live.
session_actual_attendance is the director-confirmed final record.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `academy_id` | uuid FK | RLS anchor |
| `session_actual_id` | uuid FK | session_actuals.id |
| `player_id` | uuid FK | players.id |
| `status` | text | present / absent / late / excused |
| `exception_note` | text \| null | Unrostered attendees, excused notes |

---

## Coach notes capture

Currently coach notes are captured in three places:
1. `sessions.session_notes` — free-text, set by `applyWrapUpDraftAction`
2. `session_block_exercises.notes` — per-exercise note with `[Skipped]`/`[Modified]` prefix
3. `voice_notes` — raw session recap

In the normalized schema:
- Block-level notes → `session_actual_blocks.coach_note`
- Exercise-level notes → `session_actual_exercises.coach_note`
- Full session narrative → `session_actuals.coach_raw_notes`

---

## Planned vs Actual diff

The diff is always derived as:
```
planned = session_blocks + session_block_exercises (at generation time snapshot)
actual  = session_actual_blocks + session_actual_exercises
```

The director-facing `PlannedVsActualDiffPanel` reads from `session_actual_*` tables once
they exist. Until migration is applied, the panel reads from `session_block_exercises` directly
(current Sprint 95 approach).

---

## Audit trail

All writes to `session_actuals` and child tables must write a corresponding row to `audit_logs`
with `action = 'session_actuals_created'` (or `_updated`). This is the current contract from
`AI_BACKEND_RULES.md` rule #6.

---

## Parent and player visibility flags

`session_actuals.is_visible_to_parents` and `is_visible_to_players` default to `false`.
The director must explicitly publish a session summary to parents/players.
No RLS policy may expose these records before the director publishes.

Enforcement model:
- RLS: `is_visible_to_parents = true` for parent role SELECT
- RLS: `is_visible_to_players = true` for player role SELECT
- Application: director publish action sets flags + writes audit log

Coach notes (`coach_raw_notes`, `changes_note`, block and exercise notes) must NEVER
appear in parent or player views. A separate `parent_summary` field (plain text, director-written
or AI-drafted for director approval) handles parent communication.

---

## AI suggestion readiness

The normalized actuals model enables:
1. Aggregate exercise completion rates per block type per player/group
2. Pattern detection: which exercises are consistently skipped/modified
3. Attendance trend per player
4. Coach override frequency (how often does the coach deviate from the template)
5. Load tracking: actual time on court vs planned time

These signals power Sprint 99 AI readiness audit targets.

---

## Migration plan (do not apply without sprint approval)

```
Migration 059: session_actuals table + RLS
Migration 060: session_actual_blocks + RLS
Migration 061: session_actual_exercises + RLS
Migration 062: session_actual_attendance + RLS
Migration 063: applyWrapUpDraftAction extension to write normalized actuals
```

Each migration must:
- Include `academy_id` FK on every table
- Enable RLS before any data is inserted
- Define SELECT/INSERT/UPDATE/DELETE policies scoped to `auth_academy_id()` + `auth_is_staff()`
- Parent/player SELECT policies gated on `is_visible_to_*` flags

---

## RLS policy pattern

```sql
-- Staff can manage their academy's session actuals
CREATE POLICY "Staff see session actuals"
  ON session_actuals FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff insert session actuals"
  ON session_actuals FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());

-- Parents can read published actuals (when director enables)
CREATE POLICY "Parents see published session summaries"
  ON session_actuals FOR SELECT
  USING (
    academy_id = auth_academy_id()
    AND is_visible_to_parents = true
    AND auth.role() = 'authenticated'
    -- Additional: parent must have a guardian link to a player in the session
  );
```

---

## Recommended next steps

1. STOP — get explicit sprint approval before creating any migration.
2. Apply migrations 059–062 in order.
3. Regenerate `database.types.ts` via `supabase gen types typescript`.
4. Update `applyWrapUpDraftAction` to write normalized actuals in addition to `session_notes`.
5. Update `PlannedVsActualDiffPanel` to read from `session_actual_*` tables instead of `session_block_exercises`.
6. Add director publish action to set `is_visible_to_parents` / `is_visible_to_players`.
