# Template Repository Read Layer
Sprint 974 — 2026-05-18

## Overview

`src/lib/templates/templateRepository.ts` is the server-side read layer for the templates subsystem. It provides typed, schema-safe query functions that can be called from Server Components and Server Actions without touching client-side demo data or causing runtime errors when draft migrations have not been applied.

All functions are read-only. No inserts, updates, or deletes.

---

## Functions Created

| Function | Purpose | Returns |
|---|---|---|
| `listTemplatesForAcademy(db, academyId, options)` | List templates for an academy, optionally filtered by type and status | `RepoListResult<TemplateRow>` |
| `getTemplateById(db, templateId, academyId)` | Fetch a single template scoped to academy | `RepoSingleResult<TemplateRow>` |
| `getTemplateBlocks(db, templateId)` | Fetch blocks for a template ordered by order_index | `RepoListResult<TemplateBlockRow>` |
| `getTemplateBlockExercises(db, templateId)` | Fetch exercises across all blocks for a template | `RepoListResult<TemplateBlockExerciseRow>` |
| `getTemplateReviewRequests(db, academyId, options)` | Fetch review requests — returns isSchemaMissing if migration not applied | `RepoListResult<TemplateReviewRequestRow>` |
| `getTemplateVersionHistory(db, templateId, academyId)` | Fetch version history — returns isSchemaMissing if migration not applied | `RepoListResult<TemplateVersionHistoryRow>` |

---

## Supabase Client Pattern Used

Functions accept a typed `SupabaseClient<Database>` (`DB`) passed from the caller. No internal client construction.

Callers pass the server client from `getSupabaseServer()` (`src/lib/supabase/server.ts`):

```typescript
import { getSupabaseServer } from '@/lib/supabase/server'
import { listTemplatesForAcademy } from '@/lib/templates/templateRepository'

const db = await getSupabaseServer()
const { data, error, isSchemaMissing } = await listTemplatesForAcademy(db, academyId)
```

All queries use `rawDb = db as any` internally. This is the established `rawDb` cast pattern from `src/lib/backend/director.ts` — applied only to query callsites that reference draft-migration columns or tables not yet in `database.types.ts`.

---

## Extended Type Strategy

`database.types.ts` reflects the pre-migration-067 schema. The draft migration columns are not in the generated types.

The repository defines extended interfaces (e.g. `TemplateRow extends TemplateBaseRow`) that add draft-migration columns as optional (`?`) fields. These fields will be populated once migration 067 is applied; before that they are simply absent from query results.

This means callers can safely access `template.status` and `template.template_type` after migration without code changes — they just won't be set before the migration runs.

---

## Fallback Behavior When Migrations Are Not Applied

Every function returns a `RepoListResult<T>` or `RepoSingleResult<T>` shape:

```typescript
{
  data: T[] | null       // empty or null on any error
  error: string | null   // human-readable error message
  isSchemaMissing: boolean  // true when PostgreSQL signals missing column/table
}
```

Schema-missing is detected by PostgreSQL error codes:
- `42P01` — relation does not exist (table not created yet)
- `42703` — undefined column (column not in schema yet)

When `isSchemaMissing: true`, callers should fall back to demo data or show a "schema not yet applied" notice rather than crashing.

Tables that may be absent before migration 067:
- `template_review_requests` — created in migration 067
- `template_version_history` — created in migration 067

Columns that may be absent before migration 067:
- `templates.status`, `templates.template_type`, `templates.curriculum_stage_key`, etc.
- `template_blocks.curriculum_connection`, `template_blocks.coach_watch_for`, etc.
- `template_block_exercises.exercise_label`, `template_block_exercises.coaching_cue`, etc.

`listTemplatesForAcademy` and `getTemplateById` will still return results if called without status/type filters, even before migration 067, because the base `templates` table exists and its base columns (`id`, `name`, `academy_id`, `total_duration_min`, etc.) are present. Only filtered calls using draft columns will hit the schema-missing path.

---

## How This Supports Sprints 975–981

| Sprint | Depends on Repository | Usage |
|---|---|---|
| 975 | `listTemplatesForAcademy` | Replace DEMO_CLASS_TEMPLATES / DEMO_FITNESS_TEMPLATES in library pages |
| 976 | `getTemplateById` + `getTemplateBlocks` | Replace mock template objects in detail pages |
| 977 | `getTemplateBlockExercises` | Wire exercise list into fitness detail page |
| 978 | `getTemplateReviewRequests` | Wire review queue into director review tab |
| 979 | `getTemplateVersionHistory` | Wire version history panel |
| 980 | `listTemplatesForAcademy` with status filter | Coverage map from real DB counts |
| 981 | All functions | End-to-end QA with live data |

Callers should always check `isSchemaMissing` and fall back gracefully. Until the director explicitly applies migration 067, demo data should remain the displayed source.

---

## Known Limitations

1. **Migrations not applied.** Migration 067 and 068 are draft-only. No live data exists for the extended columns or new tables. Repository functions return empty results / isSchemaMissing for those until the director applies the migrations.

2. **`database.types.ts` not regenerated.** The generated types still reflect the pre-067 schema. After migration 067 is applied, run `supabase gen types typescript` to regenerate and remove the `rawDb` casts.

3. **No insert/update functions here.** Template creation and mutation go through `template_review_requests` inserts (via a future server action in Sprint 978+) or through `execute_approved_action()` for voice-originated changes. This file is read-only by design.

4. **`getTemplateBlockExercises` uses two sequential queries.** First fetches block IDs for the template, then fetches exercises for those block IDs. This follows the backend rule to avoid parallel RLS surprises on relational data. For templates with many blocks this is acceptable; if performance becomes an issue after migration, consider a single `!inner` join query.

5. **No pagination cursor.** `listTemplatesForAcademy` uses a `limit` option but no cursor. Sufficient for V1 director template libraries (expected < 100 templates per academy). Add cursor-based pagination in Sprint 980+ if needed.
