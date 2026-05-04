# Exercise Library — Data Resolution

**Sprint:** 263
**Date:** 2026-05-04
**Status:** Resolved — exercises confirmed in DB, UI diagnostics in place

---

## Canonical exercise table

**Table:** `exercises`

**Primary columns used by fitness template builder:**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `academy_id` | UUID | Academy scope — all queries filter by this |
| `name` | TEXT | Display name |
| `category` | exercise_category | Enum: `technical \| tactical \| movement \| fitness \| competition \| mental \| warm_up \| cool_down` |
| `subcategory` | TEXT | Free text (age ranges in Airtable data, e.g. "8-10") |
| `duration_min` | INTEGER | Typical duration |
| `is_active` | BOOLEAN | `true` = visible to builder. Only `true` rows shown. |
| `tags` | TEXT[] | e.g. `['agility', 'difficulty:medium', 'import_batch:airtable_exercise_library_2026_04_29']` |

**`is_active` is the only visibility flag.** There is no `is_approved`, `is_archived`, or `status` column.

---

## Data condition (confirmed 2026-05-04)

**Total exercises in DB for academy `00000000-0000-0000-0000-000000000001`:** 83

| Source | Count | Notes |
|---|---|---|
| Seed data (migration 024) | 14 | Tennis-skill exercises. 4 have fitness-relevant categories. |
| Airtable import | 69 | All 69 successfully inserted. All `is_active = true`. |
| **Total** | **83** | All exercises have `is_active = true`. |

**Category breakdown (all 83 exercises):**

| Category | Count | Fitness block relevance |
|---|---|---|
| `fitness` | ~35 | Agility + speed + strength from Airtable (normalized from 3 source categories) |
| `movement` | ~21 | Movement exercises from Airtable + 1 seed |
| `technical` | ~13 | Tennis drills (seed + Airtable). Not matched by fitness block types. |
| `cool_down` | ~8 | Recovery exercises from Airtable + 1 seed |
| `tactical` | 3 | Seed only. Not matched by fitness block types. |
| `warm_up` | 1 | Seed only. Matched by `movement` fitness block. |
| `competition` | 2 | Seed only. Not matched by fitness block types. |

**Airtable-imported exercises by original category:**
- `agility` → normalized to DB `fitness` (10 exercises)
- `speed` → normalized to DB `fitness` (12 exercises)
- `strength` → normalized to DB `fitness` (13 exercises)
- `movement` → DB `movement` (20 exercises)
- `technical` → DB `technical` (8 exercises)
- `recovery` → normalized to DB `cool_down` (7 exercises — but only 1 had Status = "Approved")

---

## Import/source status

**Import script:** `data/airtable-import/import-exercises.js`

**CSV:** `data/airtable-import/Exercise Library-Grid view.csv`

**Status:** Import complete. Confirmed 2026-05-04 live check found 83 existing exercises.

**Import idempotency:** The script deduplicates by name + academy_id before inserting. Running it again inserts 0 rows. Safe to re-run.

**Batch tag:** All imported exercises tagged with `import_batch:airtable_exercise_library_2026_04_29`

**Rollback SQL** (Supabase SQL editor — removes imported exercises, preserves seed data):
```sql
DELETE FROM exercises
WHERE academy_id = '00000000-0000-0000-0000-000000000001'
  AND 'import_batch:airtable_exercise_library_2026_04_29' = ANY(tags);
```

**To re-run the import** (if exercises are deleted and need restoration):
```bash
cd data/airtable-import
SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node import-exercises.js --live --confirm-live-import
```

---

## Active/inactive status

All 83 exercises are `is_active = true`. The import script maps `Status = "Approved"` from the Airtable CSV to `is_active = true`. All 70 Airtable rows had `Status = "Approved"`.

---

## RLS condition

**Policy:** `exercises` requires both conditions for SELECT:
1. `academy_id = auth_academy_id()` — user's `profiles.academy_id` must match exercise's `academy_id`
2. `auth_is_staff()` — user must have an active `academy_memberships` row with role `academy_director`, `head_coach`, or `coach`

**Known gap:** If `auth_is_staff()` returns false (e.g. the logged-in user is not an active staff member, or their `profiles.academy_id` doesn't match `00000000-0000-0000-0000-000000000001`), the exercise query returns an empty array — not an error. The Sprint 262 total-count diagnostic also returns 0 in this case, making RLS-empty indistinguishable from truly-empty via the UI.

---

## Why exercises were previously invisible in the builder

**Root cause chain:**

1. **Sprint 251 (Architecture Audit):** Determined the exercise import was a dry run only — no data inserted. The audit was correct at that time.

2. **Pre-Sprint 261 (Import run):** The live import was executed (commit `ff8f834` in the sprint history). 69 exercises inserted for academy `00000000-0000-0000-0000-000000000001`.

3. **Sprint 262 (Diagnostics):** The exercise library query was silently discarding errors. Added `libraryError` capture, total-count diagnostic query, and a 3-state client banner distinguishing: no exercises, exercises inactive, query error.

4. **Sprint 263 (This sprint):** Live check confirmed 83 exercises in DB, all `is_active = true`. The exercises are correctly present. If the fitness template builder shows empty library for a logged-in director, the cause is RLS (the director's profile academy_id does not match the demo academy, or they lack an active `academy_memberships` row).

---

## Fix applied (Sprint 263)

**Code changes:**

1. `src/app/director/fitness/templates/[templateId]/page.tsx` — Exercise count shown as a lime badge when library has exercises. Empty state shows total vs active count for clear diagnostics.

2. `src/app/director/fitness/templates/[templateId]/FitnessExercisePicker.tsx` — Added count row showing "X exercises · Y block matches" and "Clear search" button when search is active. "No exercises found" message now distinguishes search-filtered vs no data.

**Data change:** No migration. No schema change. The live import was confirmed complete.

---

## Remaining actions

| Action | When | Notes |
|---|---|---|
| Regenerate `database.types.ts` | After confirming migration 045 in live DB | Enables typed `curriculum_level_id` + `curriculum_content_items` |
| Test with logged-in director | Manual QA | Confirm `auth_is_staff()` returns true and 83 exercises are visible |
| Class template block editor | Future sprint | Class templates are read-only. No block/exercise editor built. |

---

## Safe future import/activation plan

**To add more exercises:**
1. Add rows to `data/airtable-import/Exercise Library-Grid view.csv` with Status = "Approved"
2. Run dry-run: `cd data/airtable-import && node import-exercises.js`
3. Verify dry-run report in `data/airtable-import/reports/exercise-import-dry-run-report.json`
4. Run live import: `SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node import-exercises.js --live --confirm-live-import`

**To activate inactive exercises:**
Set `is_active = true` directly in the Supabase dashboard for the exercises table, or update the import script to change the `Status` mapping.

**There is no director-facing activation UI.** Activating exercises requires direct DB access (Supabase dashboard) or updating the import source CSV.
