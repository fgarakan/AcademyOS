# Class Template Builder Completion V1
**Date:** 2026-05-29
**Sprint:** 963

---

## Problems Addressed

The class template builder had four cognitive load issues before this sprint:

### 1. No at-a-glance status on the detail page

A director landing on a class template detail page saw the header and immediately entered the 5-step stepper at Step 1. There was no summary showing: How many blocks does this template have? How many have content? Which curriculum level is assigned? Where should I start?

### 2. No DONNA focus target on the page header

The page header (`<div class="flex items-start justify-between">`) had no `data-donna-focus-id`, preventing DONNA from highlighting "which template you are editing."

### 3. Step 2 (Class Structure) lacked block purpose copy and V2 explanation

Step 3 (Build Blocks) showed `blockPurposeCopy()` — plain-language descriptions of what each block section is for. Step 2 did not. Directors viewing Step 2 saw a block list with names and content counts but no explanation of what "Tactical Decisions" or "Mental Focus" means in a session.

Additionally, Step 2 had no explanation of what directors CAN edit (curriculum content within blocks) vs. what is V2 (adding, removing, or reordering the block sections themselves). The distinction between template default order and live session runtime adjustments was not documented in the UI.

### 4. Missing DONNA focus targets in Steps 2, 3, and 5

Steps 2, 3, and 5 of the stepper were missing `data-donna-focus-id` attributes for the block list, the primary content editing area, and the lesson plan draft panel. DONNA could not guide directors to these areas.

---

## Files Changed

| File | Change |
|---|---|
| `src/app/director/class-templates/[templateId]/page.tsx` | Added `class-template-header` focus ID; added Template Readiness card |
| `src/app/director/class-templates/[templateId]/ClassTemplateBuilderStepper.tsx` | Added focus IDs to Steps 2, 3, 5; added purpose copy and V2 note to Step 2 |

---

## UX Changes Made

### Template Readiness card (`page.tsx`)

A compact status card now appears above the stepper, server-rendered using data already loaded by the page component — no new queries:

| Field | Source |
|---|---|
| Blocks | `blockList.length` |
| Activities | `totalCurriculumItems` (already computed) |
| Curriculum Level | `currentLevelName` or "Not set" in orange |
| Duration | `template.total_duration_min` |
| Recommended Step | Derived: no level → Step 1; has content → Step 5; else Step 3 |

The "Recommended" chip shows a DONNA Sparkles icon and the step number + name. Directors immediately know where to focus.

### DONNA focus ID on page header

`data-donna-focus-id="class-template-header"` added to the page header div. DONNA can now highlight "which template you are editing."

### Step 2 — Class Structure improvements

Two new elements added above the block list:

1. **Explanatory note (updated)**: "Go to Build Blocks (Step 3) to add drills, games, and coaching cues."

2. **V2 boundary note**: "Block sections and order (Warm-Up, Skill Foundation, etc.) reflect the template's default structure. Adding, removing, or reordering these sections is available in a future update. The default order here is separate from any live session runtime adjustments coaches make on court."

3. **Block purpose copy**: Each block in Step 2 now shows the `blockPurposeCopy()` text below the duration. Hidden on mobile (`hidden sm:block`) to keep cards compact.

4. **`data-donna-focus-id="class-template-block-list"`** on the block list wrapper div.

### Step 3 — Build Blocks focus target

A wrapper div with `data-donna-focus-id="class-template-primary-action"` now surrounds the Step 3 content. DONNA can highlight "where to add content."

### Step 5 — Review + Apply focus target

`data-donna-focus-id="class-template-review-draft"` added as a wrapper div around `LessonPlanDraftPanel`. DONNA can highlight "the lesson plan draft area."

---

## Block / Content Editing Behavior

**What can be edited (unchanged):**
- Curriculum content within blocks — `addBlockContentAction` adds curriculum items; `removeBlockContentAction` removes them. These are direct DB mutations to `curriculum_class_template_blocks`, not routed through `proposed_actions`. This pre-existing behavior is preserved exactly.
- Curriculum level assignment via `ClassTemplateCurriculumSelector` → `setCurriculumLevelAction`.
- Lesson plan draft via `LessonPlanDraftPanel` → `generateLessonPlanDraftAction` / `applyLessonPlanDraftAction`.

**What cannot be edited (V2):**
- Adding new block sections to a template.
- Removing existing block sections from a template.
- Reordering block sections.
- Renaming a block section.
- Changing a block's duration from the builder UI.

These would require either direct mutation of `template_blocks` records or new `proposed_actions` action types — neither is implemented in Sprint 963.

---

## Template Default Order vs. Session Runtime Order

The V2 boundary note in Step 2 explicitly states: "The default order here is separate from any live session runtime adjustments coaches make on court."

- `order_index` in `template_blocks` defines the template's default block sequence.
- Session runtime adjustments (if any) are session-level overrides, not template-level changes.
- Sprint 963 makes zero changes to either layer. No conflation is introduced.

---

## DONNA Guidance / Highlight Support

Five total `data-donna-focus-id` attributes now exist in the class template builder:

| Target ID | Location | Purpose |
|---|---|---|
| `class-template-header` | Page header div | DONNA can highlight "which template you are editing" |
| `template-level-picker` | Step 1 curriculum level card | DONNA can highlight "assign a curriculum level" (pre-existing) |
| `class-template-block-list` | Step 2 block list wrapper | DONNA can highlight "your block structure" |
| `class-template-primary-action` | Step 3 content editing wrapper | DONNA can highlight "where to add activities" |
| `template-blocks-section` | Step 3 inner div | Pre-existing target (preserved) |
| `class-template-review-draft` | Step 5 lesson plan wrapper | DONNA can highlight "the draft lesson plan" |
| `template-generate-session` | Step 5 generate session button | Pre-existing target (preserved) |
| `template-stepper` | Main stepper wrapper | Pre-existing target (preserved) |

---

## No-Migration Guarantee

- No database schema changes.
- No new tables, columns, or indexes.
- No `proposed_actions` records created.
- No audit log writes.
- No new `proposed_actions` action types.

---

## No-Direct-Mutation Guarantee (Sprint 963)

Sprint 963 adds only display elements and DONNA focus targets. The existing direct mutations (`addBlockContentAction`, `removeBlockContentAction`, `setCurriculumLevelAction`) are unchanged and not newly invoked by any Sprint 963 code.

---

## V2 Improvements

1. **Block section add/remove** — Add a "Propose block section change" control that routes to `proposed_actions` with a new `template_block_structure_change` action type.
2. **Block section reorder** — Drag-to-reorder for `template_blocks.order_index`.
3. **Block duration edit** — Inline edit of `template_blocks.duration_min`.
4. **Block rename** — Inline edit of `template_blocks.name`.
5. **Mobile purpose copy** — Currently hidden on small screens (`hidden sm:block`); V2 can show on a tap/expand interaction.
6. **Recommended step auto-navigation** — When the readiness card shows "Recommended: Step 3", clicking it navigates the stepper to Step 3 (requires lifting `activeStep` state out of the stepper).
