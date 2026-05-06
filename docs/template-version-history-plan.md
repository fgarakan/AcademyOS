# Template Version History Plan

**Status:** Plan only — no migration applied.
**Date:** 2026-05-06
**Sprint:** 98

The `templates` table has `created_at` and `updated_at` columns but no version history.
Every save to `updateFitnessTemplateMetaAction` or block/exercise mutations overwrites
the current state with no change log.

This document defines what version history would look like and what is needed to enable it.

---

## Current state

| Data point | Where it lives |
|---|---|
| Template created | `templates.created_at` |
| Template last modified | `templates.updated_at` |
| Who created it | `templates.created_by` |
| Block added/removed | No audit trail |
| Exercise added/removed | No audit trail |
| Name/description changed | No audit trail |

---

## What version history enables

1. Director can see "this template looked like X on 2026-04-01"
2. Sessions can reference the template version at generation time
3. AI can compare "template before" vs "template after" coach feedback cycles
4. Duplicate actions preserve the source version label

---

## Proposed schema

### `template_versions`

Immutable snapshot of a template's metadata at a point in time.
Created when the director clicks "Save Template" or when a session is generated.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `academy_id` | uuid FK | RLS anchor |
| `template_id` | uuid FK | templates.id |
| `version_label` | text | e.g. "v3" or "2026-05-06" |
| `name` | text | Snapshot of templates.name |
| `description` | text \| null | |
| `total_duration_min` | int \| null | |
| `tags` | text[] | |
| `block_count` | int | At snapshot time |
| `exercise_count` | int | At snapshot time |
| `created_by` | uuid FK | profiles.id |
| `created_at` | timestamptz | |
| `trigger` | text | 'save' / 'session_generated' / 'duplicate' |
| `notes` | text \| null | Director note for this version |

### `template_version_blocks`

Snapshot of `template_blocks` at version creation time.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `version_id` | uuid FK | template_versions.id |
| `block_name` | text | |
| `block_type` | text | |
| `duration_min` | int \| null | |
| `order_index` | int | |
| `exercise_count` | int | Exercises in this block at snapshot time |

---

## How version numbers work

- First save → v1
- Each subsequent `updateFitnessTemplateMetaAction` → increment version counter
- `duplicateFitnessTemplateAction` → new template starts at v1

The version label is stored as `v{N}` (string). The version counter is derived from
`SELECT COUNT(*) FROM template_versions WHERE template_id = $1`.

---

## Session generation integration

When `generateSessionFromTemplateAction` runs, it should write the current template
`version_label` to `sessions.session_notes` (already done with name) and ideally to
a `sessions.source_template_version` column (requires migration).

This ensures the planned-vs-actual diff can say "Session was generated from Template X v3."

---

## Migration plan (do not apply without sprint approval)

```
Migration 064: template_versions table + RLS
Migration 065: template_version_blocks table + RLS
Migration 066: Add sessions.source_template_version column
Migration 067: Update updateFitnessTemplateMetaAction to create version snapshot on save
Migration 068: Update generateSessionFromTemplateAction to record version label
```

---

## RLS pattern

```sql
CREATE POLICY "Staff see template versions"
  ON template_versions FOR SELECT
  USING (academy_id = auth_academy_id() AND auth_is_staff());

CREATE POLICY "Staff insert template versions"
  ON template_versions FOR INSERT
  WITH CHECK (academy_id = auth_academy_id() AND auth_is_staff());
```

Version rows are immutable once written — no UPDATE or DELETE policies needed.

---

## UI — what "Template History" shows

On the fitness template detail page, a "Version History" section would show:

```
v3 — 2026-05-06 — Saved by Brian          → 7 blocks · 21 exercises
v2 — 2026-04-20 — Session generated        → 6 blocks · 18 exercises
v1 — 2026-04-10 — Created by Brian         → 5 blocks · 15 exercises
```

Each row links to the version snapshot detail (read-only).
No rollback in V1 — history is informational only.

---

## Current placeholder

The fitness template detail page shows an internal notice:
"Template version history is not yet enabled. Apply migration 064 to activate."

This prevents confusion about why the feature isn't there and signals what's needed.

---

## Recommended next steps

1. STOP — get explicit sprint approval before creating any migration.
2. Apply migrations 064–066.
3. Regenerate `database.types.ts`.
4. Update `updateFitnessTemplateMetaAction` to create a version snapshot on save.
5. Update `generateSessionFromTemplateAction` to record version label.
6. Add version history display to fitness template detail page.
