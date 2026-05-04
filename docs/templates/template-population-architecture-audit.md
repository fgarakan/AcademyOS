# Template Population Architecture Audit

**Sprint:** 251
**Date:** 2026-05-04
**Status:** Complete — no code changes in this sprint

---

## Summary

This document answers every architecture question for Sprints 252–260.
The primary failure is simple: **the exercise import was a dry run and no data was ever inserted**.
The code is largely correct; the data is missing.

---

## 1. Where are exercises stored?

**Table:** `exercises`

**Columns used by fitness template builder:**
- `id` — UUID
- `academy_id` — scoped to academy (mandatory)
- `name` — display name
- `category` — `exercise_category` enum (see below)
- `subcategory` — free text (age ranges in Airtable, e.g. "8-10")
- `duration_min` — typical exercise duration in minutes
- `min_duration_min`, `max_duration_min` — range
- `tags` — string array (e.g. `['agility', 'difficulty:medium']`)
- `equipment` — string array
- `is_active` — boolean flag; only `true` rows are shown
- `description`, `coaching_points`, `instructions` — content fields (not currently shown in builder)

**Enum `exercise_category` values:**
```
technical | tactical | movement | fitness | competition | mental | warm_up | cool_down
```

---

## 2. Which table is canonical for approved exercises?

`exercises` is the canonical table. There is no separate "approved exercises" table.

**The `is_active` flag = approved/visible.** The import script maps `Status === 'Approved'` from the Airtable CSV to `is_active = true`.

---

## 3. Are exercises academy-scoped or global?

**Academy-scoped.** Every row requires `academy_id`. The fitness template builder and all exercise queries filter `eq('academy_id', academyId)`. RLS enforces this.

---

## 4. What flags control visibility?

Only `is_active = true`. There is no `is_approved`, `is_archived`, or `status` flag in the database type.

The `populateFitnessTemplateBlocksAction` and `addFitnessBlockAction` both filter:
```ts
.eq('academy_id', academyId)
.eq('is_active', true)
```

---

## 5. Which route/component shows exercises?

- **Fitness template builder:** `/director/fitness/templates/[templateId]`
  - Page server component fetches exercise library: `exercises` table filtered by `academy_id` + `is_active`
  - Passes to `FitnessTemplateBuilderClient` as `exerciseLibrary` prop
  - `FitnessExerciseSwitcher` allows director to search and swap individual exercises
  - `PopulateFitnessBlocksButton` triggers bulk auto-population via `populateFitnessTemplateBlocksAction`
  - `addFitnessBlockAction` auto-populates up to 3 exercises when a block is added

- **Class template list:** `/director/class-templates` — shows template list only; no exercise picker

---

## 6. Which query currently populates the fitness exercise picker?

In `src/app/director/fitness/templates/[templateId]/page.tsx` (lines 143–157):
```ts
const { data: libraryData } = await supabase
  .from('exercises')
  .select('id, name, category, subcategory, duration_min, tags')
  .eq('academy_id', academyId)
  .eq('is_active', true)
  .order('name')
```

This query is correct. It returns an empty array because there are insufficient `is_active` exercises for the demo academy.

---

## 7. Why are fitness templates not populating exercises?

### Root cause: Exercise import was a dry run — NO DATA WAS INSERTED

`data/airtable-import/reports/exercise-import-dry-run-report.json` confirms:
```json
{
  "mode": "DRY_RUN",
  "no_write_confirmation": "NO DATA WAS INSERTED",
  "totals": {
    "total_data_rows": 107,
    "would_insert": 70,
    "skipped_invalid": 1,
    "skipped_blank": 25,
    "skipped_ghost": 11
  }
}
```

**70 validated Airtable exercises were never inserted.**

### What IS currently in the database (seed data only — 14 exercises):

| Name | Category |
|---|---|
| Cross-Court Forehand Rally | technical |
| Serve + 1 Pattern | tactical |
| Spider Drill | movement |
| Approach and Volley | technical |
| Backhand Cross-Court | technical |
| Point Play Under Pressure | competition |
| Dynamic Warm-Up | warm_up |
| Serve Mechanics Breakdown | technical |
| Footwork Ladder | fitness |
| Open vs. Closed Stance Decision | tactical |
| Recovery Yoga / Stretch | cool_down |
| Match Play (practice set) | competition |
| Tactical Pattern Drill | tactical |
| Baseline Consistency Challenge | technical |

These are tennis-skill exercises. Most fitness OS block types match against `fitness` and `movement` categories — the seed data only has 1 `fitness` exercise (Footwork Ladder) and 1 `movement` exercise (Spider Drill).

### Secondary issue: Category matching produces sparse results even with 14 exercises

The `fitnessExerciseMatching.ts` maps FitnessBlockType → exercise categories:

| FitnessBlockType | Matches exercise.category | Available seeded exercises |
|---|---|---|
| `movement` | `movement`, `warm_up` | Spider Drill, Dynamic Warm-Up → 2 |
| `agility` | `movement`, `fitness` | Spider Drill, Footwork Ladder → 2 |
| `speed` | `fitness`, `movement` | Footwork Ladder, Spider Drill → 2 |
| `plyometrics` | `fitness` | Footwork Ladder → 1 |
| `strength` | `fitness` | Footwork Ladder → 1 |
| `coordination` | `fitness`, `movement` | Footwork Ladder, Spider Drill → 2 |
| `mobility` | `movement`, `fitness` | Spider Drill, Footwork Ladder → 2 |
| `recovery_cool_down` | `cool_down`, `fitness` | Recovery Yoga, Footwork Ladder → 2 |

With the 70 Airtable exercises imported, the matching will work correctly:
- 10 agility exercises → all map to `fitness` category
- 12 speed exercises → all map to `fitness` category
- 13 strength exercises → all map to `fitness` category
- 20 movement exercises → map to `movement` category
- 7 recovery exercises → map to `cool_down` category
- 8 technical exercises → map to `technical` category (tennis drills, not used in fitness blocks)

---

## 8. Is the issue data, query, RLS, naming mismatch, missing relation, or UI filter?

**DATA ISSUE — primary cause.** The query, RLS, naming, and relations are all correct. Once exercises are imported, the system will populate.

**No RLS issue.** The exercise table is read by academy-scoped authenticated users. The existing queries pass `academy_id` correctly.

**No query bug.** The filter `is_active = true` is correct — all Airtable exercises with Status 'Approved' import as `is_active = true`.

**No type mismatch.** The category normalization in the import script maps to the correct `exercise_category` enum values.

---

## 9. Which tables represent fitness templates and blocks?

| Table | Role |
|---|---|
| `templates` | Master template row. Fitness templates tagged `fitness_template:true` in `tags`. |
| `template_blocks` | One row per block in a template. Type is `block_type` enum. |
| `template_block_exercises` | Join table: `block_id` + `exercise_id` + `order_index` + `duration_min` + `notes`. |

**Fitness template is identified by:** `tags ARRAY containing 'fitness_template:true'`

**Block type DB enum** (`block_type`):
```
warm_up | technical | tactical | movement | fitness | competition | mental | cool_down | free
```

**FitnessBlockType** (TypeScript, not DB) = separate taxonomy:
```
movement | agility | speed | plyometrics | strength | coordination | mobility | recovery_cool_down
```

These are stored in the block's `name` field, not the `type` field. The `type` field stores the closest DB enum value (see `DB_BLOCK_TYPE_MAP` in `fitnessBlockTypes.ts`):
- `agility` → DB `type: 'fitness'`
- `speed` → DB `type: 'fitness'`
- `plyometrics` → DB `type: 'fitness'`
- `strength` → DB `type: 'fitness'`
- `coordination` → DB `type: 'fitness'`
- `mobility` → DB `type: 'movement'`
- `recovery_cool_down` → DB `type: 'cool_down'`

---

## 10. Which tables represent class templates and blocks?

Same tables as fitness templates — differentiated by tag:

| Table | Role |
|---|---|
| `templates` | Class templates do NOT have `fitness_template:true` tag. |
| `template_blocks` | Same table. Block types: `warm_up`, `technical`, `tactical`, `movement`, `fitness`, `competition`, `mental`, `cool_down`, `free`. |
| `template_block_exercises` | Same table. Links class template blocks to exercises from exercise library. |

**templates also has:**
- `level_id` — references old `academy_levels` table (legacy, pre-curriculum system)
- `curriculum_level_id` — references new `curriculum_levels` table (added in migration 045, not in generated types)

These are two different columns. The code correctly uses `curriculum_level_id` for curriculum linking via `rawDb` cast.

---

## 11. Which curriculum tables should class templates pull from?

| Table | What it contains | Use in templates |
|---|---|---|
| `curriculum_levels` | 15 levels (Red Ball 1 → High Performance 3) | Assign a level to a template via `curriculum_level_id` |
| `curriculum_drills` | Individual drills with domain, objective, session_block, cues | Pull recommended drills for a block by level + domain |
| `curriculum_gates` | Advancement gates per level (domain, criterion, threshold) | Show what gates the session targets |
| `curriculum_coach_language` | Coach language per level/domain (doing_well, working_on, focus, next_step) | Coach cues in block notes |
| `curriculum_content_items` | Drills, games, skills, assessments per level (from migration 045) | `populateTemplateBlocksFromCurriculumAction` writes these into `template_blocks.notes` |
| `curriculum_games` | Games for competition blocks | Competition block content source |

**Note:** `curriculum_content_items` is NOT in `database.types.ts` (added in migration 045, types not regenerated). Must use `rawDb` cast to query it.

---

## 12. How does session generation currently work?

File: `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts`

Flow:
1. Verify template belongs to academy
2. Read `curriculum_level_id` from template (via rawDb)
3. Resolve curriculum level name (for session notes header)
4. Resolve academy curriculum version + overrides (for context header)
5. Validate coach is active academy member
6. Copy `template_blocks` → `session_blocks` (preserves `template_block_id`, `order_index`, `type`, `duration_min`, `intensity`, `notes`)
7. Copy `template_block_exercises` → `session_block_exercises` (preserves `exercise_id`, `order_index`, `duration_min`, `notes`)
8. Insert `sessions` row with `template_id` reference, `status = 'planned'`
9. Curriculum level name embedded in `session_notes` as text prefix: `[Curriculum: Orange 2]`

**Curriculum source links are NOT structured** — level name is text only in `session_notes`.
**Template block source reference** is preserved via `session_blocks.template_block_id`.

---

## 13. What exact files should be changed in Sprints 252–260?

### Sprint 252 — Fix fitness exercise library population
**Option A (data fix — no code change needed):**
- Run `node data/airtable-import/import-exercises.js --live --confirm-live-import`
- Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars
- Inserts 70 exercises for demo academy

**Option B (seed migration — if live import is not approved):**
- Create a new migration seeding the 70 exercises from the validated dry-run payload
- This is the correct approach for a reproducible dev environment
- **REQUIRES EXPLICIT MIGRATION APPROVAL before proceeding**

**Diagnostic improvement (safe code change):**
- Add exercise count display to fitness template builder so directors can see library size
- Files to modify: `src/app/director/fitness/templates/[templateId]/page.tsx`

### Sprint 253 — Exercise picker manual add
- Files to create: none needed (FitnessExerciseSwitcher already does switch; need "add" from library)
- Files to modify: `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx`
- New action: already exists — `addExerciseToFitnessBlockAction` in `fitnessTemplateActions.ts`
- Need: UI panel to add exercises from library to an empty block (complement to switch)

### Sprint 254 — Auto-populate suggestions
- Files to create: `src/lib/templates/fitnessExerciseRecommendations.ts`
- Files to modify: `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx`

### Sprint 255 — Class template curriculum link model
- Files to create: `docs/templates/class-template-curriculum-link-model.md`, `src/lib/templates/curriculumTemplateLinks.ts`
- **No migration needed** — `template_blocks.notes` can carry structured text; `curriculum_level_id` already on templates

### Sprint 256 — Class template curriculum picker
- Files to create: `src/app/director/class-templates/[templateId]/page.tsx` (CLASS TEMPLATE DETAIL PAGE — does not exist yet)
- Note: list links currently route to the fitness builder. Need separate class template detail page.

### Sprint 257 — Curriculum block recommendations
- Files to create: `src/lib/templates/curriculumBlockRecommendations.ts`
- Files to modify: class template builder (Sprint 256)

### Sprint 258 — Source traceability preview
- Files to modify: class template builder and fitness template builder UI

### Sprint 259 — Session generation inheritance
- Files to modify: `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` (limited — no schema change without migration approval)

### Sprint 260 — QA and demo loop
- Files to create: `docs/templates/template-population-demo-flow.md`
- Files to modify: docs

---

## 14. Schema gaps

| Gap | Impact | Migration needed? |
|---|---|---|
| `exercises` table has `transfer_level` (NOT NULL, no default value) | Import must supply a value; validated payloads use `'tennis'` default | No — import handles it |
| `templates.curriculum_level_id` not in `database.types.ts` | Must use `rawDb` cast for all queries | No new migration — column exists; types need regeneration |
| No `curriculum_source_id` or `curriculum_source_type` on `template_blocks` | Cannot store structured curriculum source links | **YES — migration needed** if Sprint 259 needs structured storage; text-in-notes is the workaround |
| `curriculum_content_items` not in `database.types.ts` | Must use `rawDb` cast | No new migration — table exists; types need regeneration |
| No class template detail/builder page | Directors cannot build/edit class templates in UI | No migration — UI work only |

---

## 15. What should not be changed yet

| File / Module | Reason |
|---|---|
| `src/lib/fitness/fitnessBlockTypes.ts` | Locked — do not change block type taxonomy |
| `src/lib/fitness/fitnessExerciseMatching.ts` | Stable — matching works once data is present |
| `supabase/migrations/*.sql` (applied) | Never modify applied migrations |
| `src/lib/backend/*.ts` | Locked — do not touch without explicit sprint naming the file |
| `src/lib/actions/proposed-action-validator.ts` | Locked |
| `src/lib/actions/curriculum.ts` | Locked |
| `data/airtable-import/reports/exercise-import-dry-run-report.json` | Unrelated dirty file — do not stage |
| `supabase/migrations/053_curriculum_seed.sql` | Unrelated dirty file — do not stage |
| `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` | Unrelated dirty file — do not stage |
| `index.html` | Unrelated dirty file — do not stage |
| Exercise import decision (live vs seed migration) | Do not proceed without explicit approval |

---

## 16. Current route map for templates

| Route | Status | Notes |
|---|---|---|
| `/director/fitness/templates` | Built | Lists fitness templates (tagged `fitness_template:true`) |
| `/director/fitness/templates/new` | Built | Create new fitness template |
| `/director/fitness/templates/[id]` | Built | Fitness template builder with block/exercise editor |
| `/director/class-templates` | Built — list only | Lists class/session templates (no `fitness_template:true` tag) |
| `/director/class-templates/[id]` | **NOT BUILT** | No detail/builder page for class templates |

---

## 17. Files audited (read-only)

- `docs/AI_BACKEND_RULES.md`
- `docs/CURRENT_BUILD_TARGET.md`
- `docs/LOCKED_MODULES.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/MODULE_BUILD_PROCESS.md`
- `src/lib/supabase/database.types.ts` (exercises, template_blocks, template_block_exercises, templates, enums)
- `src/app/director/fitness/fitnessTemplateActions.ts`
- `src/app/director/fitness/templates/[templateId]/page.tsx`
- `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx`
- `src/app/director/fitness/templates/[templateId]/fitnessBuilderTypes.ts`
- `src/app/director/fitness/templates/[templateId]/populateFitnessBlocksAction.ts`
- `src/app/director/fitness/templates/[templateId]/PopulateFitnessBlocksButton.tsx`
- `src/app/director/fitness/templates/[templateId]/PopulateCurriculumBlocksButton.tsx`
- `src/app/director/fitness/templates/[templateId]/FitnessExerciseSwitcher.tsx`
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts`
- `src/app/director/fitness/templates/[templateId]/GenerateSessionPanel.tsx`
- `src/app/director/fitness/templates/[templateId]/TemplateEditor.tsx`
- `src/app/director/fitness/templates/page.tsx`
- `src/app/director/class-templates/page.tsx`
- `src/lib/fitness/fitnessBlockTypes.ts`
- `src/lib/fitness/fitnessExerciseMatching.ts`
- `src/lib/actions/curriculumContentPopulation.ts`
- `supabase/migrations/024_seed_data.sql` (exercises + templates sections)
- `supabase/migrations/045_curriculum_content_library.sql` (curriculum_level_id addition)
- `data/airtable-import/import-exercises.js`
- `data/airtable-import/reports/exercise-import-dry-run-report.json`
- `data/airtable-import/Exercise Library-Grid view.csv`
