# Curriculum Template Population — Known Limitations V1

**Sprint:** 57
**Date:** 2026-05-01

---

## Current Approach

Sprint 56 introduced `populateTemplateBlocksFromCurriculumAction`, which populates `template_blocks.notes` with structured curriculum content (drills, games, cues, success criteria) based on the template's selected `curriculum_level_id`.

Sprint 57 added the `CurriculumLevelSelector` component to the template detail page, allowing directors to tag a template with its curriculum level.

---

## Known Limitation 1 — Curriculum Content Does Not Appear as Exercise Rows

**Problem:** `template_block_exercises` requires an `exercise_id` FK from the `exercises` table. Curriculum content items are stored in `curriculum_content_items`, a separate table. There is no FK path from `template_block_exercises` to `curriculum_content_items`.

**Impact:** Curriculum population writes content into `template_blocks.notes` rather than inserting individual drill/game rows into `template_block_exercises`. The template editor and session view show block notes correctly, but individual content items do not appear as separate exercise rows.

**Planned fix:** Add a nullable `curriculum_content_item_id UUID REFERENCES curriculum_content_items(id)` column to `template_block_exercises`. When set, this allows curriculum content to appear as proper exercise rows in the template editor. This requires a migration and is deferred to a future sprint.

---

## Known Limitation 2 — curriculum_level_id Not in database.types.ts

**Problem:** `templates.curriculum_level_id` was added in migration 045. The `database.types.ts` file has not been regenerated yet.

**Impact:** Code accessing `curriculum_level_id` must use `rawDb = supabase as any`. This is the established pattern for all post-migration-040 columns.

**Fix:** Regenerate `database.types.ts` after running all migrations: `supabase gen types typescript --local > src/lib/supabase/database.types.ts`.

---

## Known Limitation 3 — Population Overwrites Are Blocked

**By design:** The curriculum population action skips blocks that already have non-empty notes. This prevents overwriting coach-authored notes.

**Limitation:** A director who wants to refresh curriculum notes after changing the curriculum level must manually clear block notes first.

**Planned fix:** Add a "force refresh" option to the populate action that clears and rewrites notes regardless of existing content.

---

## Known Limitation 4 — Content Not Yet Available for All Levels

**Problem:** Only Orange 1, 2, and 3 have content items seeded (migration 046). Red Foundation, Green Performance, Yellow Competitive, and High Performance levels return empty content results.

**Impact:** Population for non-Orange templates produces no notes and returns a "no content found" message.

**Fix:** Add content packs for other levels in future sprints (Red Ball Pack, Green Ball Pack, etc.).

---

## Recommended Next Steps

1. Add `curriculum_content_item_id` column to `template_block_exercises` to allow proper drill/game row insertion.
2. Regenerate `database.types.ts` after running all migrations.
3. Add a "force refresh" option to the curriculum population action.
4. Seed Red, Green, Yellow, and High Performance content packs.
5. Add content filtering by pathway (skill/competition/fitness) aligned to the template's `track` field.
