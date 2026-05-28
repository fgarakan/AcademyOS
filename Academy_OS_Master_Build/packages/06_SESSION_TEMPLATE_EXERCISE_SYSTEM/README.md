# Package 06 — Session / Template / Exercise System
**Status:** Draft v1.0

## Locked rule
Template default order ≠ session runtime order.
Changing a session block NEVER changes the parent template.

## Contents

| File | Purpose |
|---|---|
| `SESSION_TEMPLATE_EXERCISE_SPEC.md` | Full spec: exercise library, template builder, session creation and editing, load management |

## Core objects (defined in DB Package 02)
- `exercises` table
- `templates` + `template_blocks` + `template_block_exercises`
- `sessions` + `session_blocks` + `session_block_exercises`
- `session_attendance`
- `v_session_load` view (0011_views_reporting.sql)
