# Fitness / Class Template Separation Audit

**Sprint:** 136
**Date:** 2026-05-01
**Status:** Audit complete — implementation plan below

---

## Current State

### Route: `/director/fitness/templates`

**File:** `src/app/director/fitness/templates/page.tsx`

- Queries the `templates` table with only `academy_id` filter — no track or fitness-specific filter.
- Displays ALL templates: imported Airtable program templates (which are class/session templates) alongside any fitness-specific templates.
- Page header says "Fitness Templates" but subtitle reads "Imported program templates" — acknowledging the mismatch.
- Page is effectively a generic template list with a fitness label.

### Route: `/director/fitness/templates/[templateId]`

**File:** `src/app/director/fitness/templates/[templateId]/page.tsx`

- Shows a single template with blocks and exercises.
- Has a "Curriculum Intelligence" section — links templates to curriculum levels.
- Has a "GenerateSessionPanel" — generates sessions from templates.
- Has `PopulateFitnessBlocksButton` and `PopulateCurriculumBlocksButton`.
- Template editor supports block/exercise reorder and duration edits.
- This is clearly a class/session template editor with fitness add-ons bolted on, not a Fitness OS builder.

### Database Schema

**`templates` table:**
- `track`: `skill | competition | fitness | combined` — can distinguish fitness vs class templates
- `tags`: `string[]` — can hold `fitness_template:true` tag
- `name`, `description`, `total_duration_min`, `is_active`, `is_default`
- No dedicated `template_type` column for fitness-specific types (Standard, Pre-Tournament, etc.)

**`template_blocks` table:**
- `type`: `block_type` enum = `warm_up | technical | tactical | movement | fitness | competition | mental | cool_down | free`
- Fitness-specific block types (agility, speed, plyometrics, strength, coordination, mobility) do NOT exist in the enum
- `name`: string — can store fitness block display name (e.g. "Agility")
- `notes`: string | null — can store block-level observations
- `duration_min`, `order_index`, `intensity`

**`template_block_exercises` table:**
- `block_id`, `exercise_id`, `order_index`, `duration_min`, `notes`

**`exercises` table:**
- `category`: `exercise_category` enum = `technical | tactical | movement | fitness | competition | mental | warm_up | cool_down`
- `subcategory`: string | null — free text subcategory
- `tags`: string[] | null — can encode fitness sub-type keywords
- `name`, `description`, `coaching_points`

**`coach_observations` table:**
- Has required `player_id` and `coach_id` — NOT suitable for template-level observations without a migration.

---

## Why the Current Fitness Screen Is Conceptually Wrong

The fitness templates screen is a **class/session template viewer** with a fitness label, not a Fitness OS builder:

1. It shows imported Airtable program templates — which represent class session plans, not standalone fitness training protocols.
2. The template detail page has session generation (GenerateSessionPanel) and curriculum level linking — both class/session concepts.
3. There is no fitness-specific block builder with movement, agility, speed, plyometrics, strength, coordination, mobility, recovery blocks.
4. Fitness templates as a product concept should exist independently of sessions — they define training protocols that feed into session planning, not the session structure itself.

---

## What Should Move Under Class Templates

- All imported Airtable templates (tagged `import_batch:*` or `airtable_id:*`)
- Templates with `track = 'skill' | 'competition' | 'combined'` or no track
- Templates that serve as session blueprints (used with GenerateSessionPanel)
- Templates with curriculum level assignments

**Route:** `/director/class-templates`
**Data filter:** Templates where `track != 'fitness'` OR without `fitness_template:true` tag

---

## What Should Stay Under Fitness OS

- Templates specifically created as fitness training protocols
- Templates with `track = 'fitness'` AND `tags` containing `fitness_template:true`
- Fitness blocks: movement, agility, speed, plyometrics, strength, coordination, mobility, recovery
- Voice observations about training blocks
- Future: player fitness load tracking, readiness flags, at-home recommendations

**Route:** `/director/fitness/templates`
**Data filter:** Templates where `tags` contains `fitness_template:true`

---

## Safest Route Structure

```
/director/class-templates          — NEW: read-only class/session template list
/director/fitness/templates        — MODIFIED: Fitness OS only (fitness_template:true tag filter)
/director/fitness/templates/[id]   — MODIFIED: Fitness block builder UI
```

The existing `/director/fitness/templates` route is preserved so no sidebar links break. Its content is scoped to fitness templates only. Imported class templates become accessible via the new `/director/class-templates` route.

---

## Data Risks

| Risk | Mitigation |
|---|---|
| Imported templates disappear from fitness page | Filter ADDS fitness tag filter — imports visible at class-templates route |
| Existing fitness blocks lose block type display | Map DB `block_type` to fitness display labels via fitnessBlockTypes.ts |
| Template observations break coach_observations FK | Store observations in `template_blocks.notes` — no new table needed |
| New fitness block types (agility, speed) not in DB enum | Store fitness sub-type in block `name` field; DB `type` uses closest enum value |

---

## Recommended Table Usage

| Use | Table | Field strategy |
|---|---|---|
| Fitness templates | `templates` | `track = 'fitness'`, `tags ⊃ fitness_template:true` |
| Class templates | `templates` | All others (no fitness tag) |
| Fitness blocks | `template_blocks` | `name` = fitness type label, `type` = closest DB enum |
| Fitness exercises | `template_block_exercises` | Existing join table, no changes |
| Block observations | `template_blocks.notes` | Free text observation storage |
| Template type (Standard, Pre-Tournament…) | `templates.tags` | Tag `template_type:standard`, etc. |

---

## Migration Needed?

**No.** All changes work within the existing schema:
- Fitness templates identified by `tags` array containing `fitness_template:true`
- Template type stored as `tags` entry (e.g. `template_type:pre_tournament`)
- Fitness block sub-type stored in `template_blocks.name`
- Block observations stored in `template_blocks.notes`

A migration would only be needed if:
1. We add new `block_type` enum values (not required — name-based approach works)
2. We create a `fitness_observations` table (not required — notes field works)
3. We add a `template_category` column to `templates` (not required — tags work)

---

## Implementation Plan for Sprints 137–145

| Sprint | Task |
|---|---|
| 137 | Route + nav separation. Add Class Templates route. Update sidebar. Scope Fitness page to fitness_template:true. |
| 138 | Fitness block taxonomy. `src/lib/fitness/fitnessBlockTypes.ts`. Docs. |
| 139 | Exercise matching. `src/lib/fitness/fitnessExerciseMatching.ts`. Map fitness blocks to exercises. |
| 140 | Server actions. Create/add/remove/reorder blocks and exercises. Use existing tables. |
| 141 | Fitness OS list page rewrite. Premium Fitness OS command page. |
| 142 | Fitness template detail / block builder. Full builder UI. |
| 143 | Exercise switcher modal. Swap exercise within a block. |
| 144 | Voice observation drafts. Capture observations as block notes. |
| 145 | QA doc, demo script, CHANGELOG, TypeScript check. |
