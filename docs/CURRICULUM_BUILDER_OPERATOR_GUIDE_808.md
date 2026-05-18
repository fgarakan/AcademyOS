# Sprint 808 — Curriculum Builder Operator Guide V1

**Date:** 2026-05-18
**Sprint:** 808

---

## Purpose

Guide for the platform operator (or technical academy administrator) for managing the curriculum builder in production.

---

## Data architecture

The curriculum builder reads from these tables:

| Table | Content | Built by |
|-------|---------|---------|
| `curriculum_levels` | The 15 levels with display_name, stage, order | Migration 036 |
| `curriculum_versions` | Active curriculum version metadata | Migration 036 |
| `assessment_gates` | Gate criteria per level | Migration 036 |
| `exercise_library` | Drills with level range, domain, objective | Migration 006 |
| `coach_language` | Coaching cues and language per level | Migration 036 |
| `competition_track` | Competition context per level | Migration 036 |
| `fitness_guidance` | Fitness guidance per level | Migration 036 |
| `volume_guidance` | Weekly volume targets per level | Migration 036 |

All reads go through `getCurriculumExplorerData()` in `src/lib/backend/curriculumExplorer.ts`.

## Key function

```typescript
// src/lib/backend/curriculumExplorer.ts
getCurriculumExplorerData(supabase: SupabaseClient): Promise<CurriculumExplorerData>
```

Returns all curriculum data for the director's academy. The `tablesAvailable` boolean tells the UI whether the core tables exist — if false, empty states are shown everywhere.

## Troubleshooting

### Builder shows "Curriculum data not yet available"

Cause: `tablesAvailable` is false — the curriculum tables either don't exist or are empty.

Fix:
1. Check `SELECT COUNT(*) FROM curriculum_levels` — should return 15 rows
2. Check `SELECT COUNT(*) FROM curriculum_versions WHERE status = 'active'` — should return 1
3. If tables don't exist, run migrations 036 and 037 in order

### Level detail shows no drills

Cause: `exercise_library` rows have `level_min_id` pointing to a different level ID.

Fix: Check the level UUIDs in `curriculum_levels` and verify `exercise_library.level_min_id` references are correct.

### DONNA context panel shows "No drills defined yet"

Cause: No drills with `level_min_id = [this level's ID]` exist in `exercise_library`.

Fix: Insert drill records or use the DONNA draft flow (V2) to create proposals.

## Adding curriculum data manually (V1 interim)

Until DONNA drafts are wired to `proposed_actions`, new drills and gates must be inserted directly via Supabase Studio or an admin migration. Any direct insert must:
1. Use the correct `level_id` / `level_min_id`
2. Follow the schema structure in `src/lib/supabase/database.types.ts`
3. Not bypass RLS (insert as the director's user_id)
4. Write a record to `audit_logs` manually

## Seeding curriculum data

See migration `037_curriculum_seed.sql` for the initial seed data format. To re-seed a specific level, delete its rows from the relevant tables and re-run the INSERT statements from the seed file.
