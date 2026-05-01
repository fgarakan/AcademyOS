# Curriculum Content Engine QA V1

**Sprint:** 60
**Date:** 2026-05-01

---

## Purpose

QA checklist for the curriculum content engine built in Sprints 51–60. Use before any demo.

---

## Schema QA

| Check | Expected | Status |
|---|---|---|
| `curriculum_content_items` table exists | Yes — migration 045 | To verify after migration run |
| `curriculum_content_requirement_mappings` table exists | Yes — migration 045 | To verify after migration run |
| `templates.curriculum_level_id` column exists | Yes — migration 045 adds it | To verify after migration run |
| Orange 1 content items seeded (9 rows) | Yes — migration 046 | To verify after migration run |
| Orange 2 content items seeded (10 rows) | Yes — migration 046 | To verify after migration run |
| Orange 3 content items seeded (10 rows) | Yes — migration 046 | To verify after migration run |
| Content-to-requirement mappings seeded | Yes — migration 047 | To verify after migration run |
| RLS enabled on both new tables | Yes — migration 045 | To verify after migration run |
| Global content readable without academy_id | Yes — policy requires `auth.uid() IS NOT NULL AND academy_id IS NULL` | To verify |

---

## TypeScript QA

Run `npx tsc --noEmit` and confirm clean.

Known acceptable patterns in new files:
- `rawDb = supabase as any` — intentional, for columns not in database.types.ts
- New optional props (`hasCurriculumLevel`) typed correctly on client components

---

## Feature QA — Manual Walkthrough

### Step 1: Curriculum levels exist

1. Navigate to Supabase or run query:
   ```sql
   SELECT id, display_name, stage FROM curriculum_levels
   WHERE stage = 'orange_development' ORDER BY sort_order;
   ```
2. Expect 3 rows: Orange 1 — Rally, Orange 2 — Direction, Orange 3 — Construction.

### Step 2: Requirements exist for Orange Ball

1. Run:
   ```sql
   SELECT ctr.title, crd.key as domain
   FROM curriculum_track_requirements ctr
   JOIN curriculum_requirement_domains crd ON crd.id = ctr.requirement_domain_id
   JOIN curriculum_levels cl ON cl.id = ctr.curriculum_level_id
   WHERE cl.stage = 'orange_development' AND ctr.academy_id IS NULL
   ORDER BY cl.sort_order, crd.key, ctr.display_order;
   ```
2. Expect 32 rows total (10 + 11 + 11).

### Step 3: Content pack seeded

1. Run:
   ```sql
   SELECT content_type, count(*) FROM curriculum_content_items
   WHERE academy_id IS NULL
   GROUP BY content_type ORDER BY content_type;
   ```
2. Expect ~29 rows across drill, skill, game, assessment types.

### Step 4: Content-to-requirement mappings seeded

1. Run:
   ```sql
   SELECT mapping_type, count(*) FROM curriculum_content_requirement_mappings
   GROUP BY mapping_type;
   ```
2. Expect develops, assesses, reinforces rows — roughly 40–60 total mappings.

### Step 5: Template curriculum level selector

1. Navigate to `/director/fitness/templates/[any-template-id]`.
2. Confirm `Curriculum Focus` card renders with dropdown.
3. Select `Orange 1 — Rally`.
4. Click `Save`.
5. Confirm save confirmation message appears.
6. Reload page — confirm Orange 1 — Rally is still selected.

### Step 6: Curriculum-aware block population

1. On the same template page, confirm the `Populate from Curriculum` button is now enabled.
2. Ensure the template has at least one block with empty notes.
3. Click `Populate from Curriculum`.
4. Confirm the result card shows blocks updated > 0.
5. Click `Show block detail` — confirm each populated block lists items found.
6. Navigate to the template editor — confirm block notes contain `[Curriculum: Orange 1 — Rally]` text.

### Step 7: Generated session preserves curriculum context

1. On the template page, use `Generate Session` to create a session.
2. Navigate to the generated session at `/director/sessions/[sessionId]`.
3. Confirm session notes include `[Curriculum: Orange 1 — Rally]` prefix.
4. Confirm session blocks show curriculum notes in block note areas.

### Step 8: Curriculum context panel on session page

1. On the session page, confirm `CURRICULUM FOCUS` section renders.
2. Shows level name: `Orange 1 — Rally`.
3. Shows stage: `orange development`.
4. Explanation note about block notes is visible.

### Step 9: Player profile requirements

1. Navigate to any player in `/director/players/[playerId]`.
2. Confirm requirement progress is visible with Orange Ball requirements.
3. Confirm evidence links can be viewed.
4. (Sprint 51–50 feature — not changed in this batch.)

### Step 10: System ready for more levels

1. Confirm that navigating to a template and selecting a non-Orange level (e.g., Red 1) produces a "no content found" message in population results.
2. This is expected — Red Ball content pack is the next content sprint.

---

## Known Limitations (Accepted for V1)

| Limitation | Impact | Plan |
|---|---|---|
| Curriculum content populates block notes, not exercise rows | Block editor shows notes, not individual drill items | Add `curriculum_content_item_id` FK to `template_block_exercises` in a future migration |
| `database.types.ts` not regenerated | `rawDb` casts required for `curriculum_level_id` access | Regenerate after migrations run |
| Content seeded for Orange Ball only | Red/Green/Yellow levels produce no content | Add content packs in future sprints |
| No force-refresh on population | Director must clear notes manually to re-populate | Add force option to the action |

---

## Git Status Expected (Before Commit)

Files to stage for this batch:

```
docs/CURRICULUM_CONTENT_MODEL_AUDIT.md
docs/CURRICULUM_CONTENT_SCHEMA_PLAN.md
docs/ORANGE_BALL_CURRICULUM_CONTENT_PACK.md
docs/CURRICULUM_TEMPLATE_POPULATION_LIMITATIONS.md
docs/CURRICULUM_CONTENT_ENGINE_QA.md
docs/BRIAN_CURRICULUM_DEMO_SCRIPT.md
docs/CHANGELOG.md
supabase/migrations/045_curriculum_content_library.sql
supabase/migrations/046_orange_ball_content_pack.sql
supabase/migrations/047_content_requirement_mappings_seed.sql
src/lib/actions/curriculumContentPopulation.ts
src/app/director/fitness/templates/[templateId]/PopulateCurriculumBlocksButton.tsx
src/app/director/fitness/templates/[templateId]/CurriculumLevelSelector.tsx
src/app/director/fitness/templates/[templateId]/setCurriculumLevelAction.ts
src/app/director/fitness/templates/[templateId]/page.tsx
src/app/director/fitness/templates/[templateId]/generate-session-actions.ts
src/app/director/sessions/[sessionId]/page.tsx
```
