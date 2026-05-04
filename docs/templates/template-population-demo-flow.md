# Template Population + Curriculum Connection — Demo Flow

**Sprint block:** 251–260  
**Date:** 2026-05-04  
**Status:** Complete

---

## What was built

This sprint block adds the full template population and curriculum connection layer to Academy OS:

| Feature | File(s) | Sprint |
|---|---|---|
| Architecture audit | `docs/templates/template-population-architecture-audit.md` | 251 |
| Exercise library diagnostic + auto-populate wiring | fitness template page + action | 252 |
| Manual exercise picker (Add Exercise to block) | `FitnessExercisePicker.tsx` | 253 |
| Exercise recommendation engine | `fitnessExerciseRecommendations.ts` | 254 |
| Curriculum template link model | `curriculumTemplateLinks.ts` | 255 |
| Class template detail page + curriculum picker | `class-templates/[templateId]/page.tsx` | 256 |
| Block recommendation engine | `curriculumBlockRecommendations.ts` | 257 |
| Template source traceability | `templateSourceTraceability.ts` | 258 |
| Curriculum coach cues in session generation | `generate-session-actions.ts` | 259 |
| QA and demo documentation | this file | 260 |

---

## Demo path: Fitness Template

1. **Navigate** to `/director/fitness/templates`
2. **Open** any fitness template with `fitness_template:true` tag
3. **Observe** the "Auto-Populate Exercises" card — shows library count or "empty" warning
4. **If blocks exist:** click "Populate Blocks with Exercises" — exercises matched by category are inserted
5. **Observe** each block now shows exercises with duration
6. **Within a block** — click "Add Exercise" (dashed button at block bottom) — opens `FitnessExercisePicker`
7. **In the picker** — best-category matches appear first; search by name/category
8. **Select + confirm** — exercise added to block, page reloads
9. **Switch an existing exercise** — click "Switch" on any exercise row — opens `FitnessExerciseSwitcher`
10. **Curriculum Level** — use the "Curriculum Context" card to assign a level

---

## Demo path: Class Template

1. **Navigate** to `/director/class-templates`
2. **Observe** — list rows now link to `/director/class-templates/[id]` (Sprint 256 fix)
3. **Open** any class template
4. **Observe** — template metadata (track, duration, blocks, exercises)
5. **Curriculum Context card** — dropdown shows all 15 curriculum levels grouped by stage
6. **Select** a level (e.g. "Orange 2 — Intermediate") and click Save
7. **Observe** — badge appears showing the selected level

---

## Demo path: Session Generation with Curriculum Cues

1. **Navigate** to a fitness or class template with a curriculum level assigned
2. **Generate a session** via the GenerateSessionPanel
3. **Navigate** to the created session
4. **Observe session_notes** — should begin with:
   ```
   [Curriculum: Orange 2 — Intermediate]
   [Academy Version: ...]
   [Coach Cues: <4 coach language cues from curriculum_content_items>]
   ```

---

## Library utilities (available to future sprints)

### `src/lib/templates/fitnessExerciseRecommendations.ts`
- `rankExercisesForBlock(blockType, exercises)` — scored + reasoned suggestions
- `getBlockRecommendations(blockType, budgetMin, exercises, excludeIds)` — budget-aware

### `src/lib/templates/curriculumTemplateLinks.ts`
- `getCurriculumLevelForTemplate(templateId, academyId, supabase)` — resolves level
- `getCurriculumContentForLevel(levelId, supabase, sections?)` — fetches content items
- `getTemplateCurriculumContext(templateId, academyId, supabase)` — full context
- `formatCurriculumContextText(level, contentItems)` — embeddable notes text

### `src/lib/templates/curriculumBlockRecommendations.ts`
- `getRecommendedBlocksForStage(stage, totalSessionMin)` — block sequence by stage
- `getRecommendedBlocksForFitnessPhase(phase, totalSessionMin)` — same by fitness phase

### `src/lib/templates/templateSourceTraceability.ts`
- `parseTemplateTags(tags)` — extracts origin, import batch, airtable ID, template type
- `buildTemplateSourceInfo(...)` — full source info struct
- `formatTemplateOriginBadge(origin)` — display label
- `formatTemplateSourceDescription(info)` — full description for UI

---

## Known gaps and follow-up work

| Gap | Notes |
|---|---|
| `database.types.ts` not regenerated | `curriculum_level_id` and `curriculum_content_items` not in generated types; all curriculum queries use `rawDb = supabase as any` |
| Class template block editing | Detail page shows read-only blocks; no block/exercise editor for class templates (fitness templates have the full builder) |
| Recommendation engine not surfaced in UI | `fitnessExerciseRecommendations.ts` and `curriculumBlockRecommendations.ts` are built but not yet connected to any UI component |
| Template source badges not displayed | `templateSourceTraceability.ts` utility is ready but not rendered in template list or detail views |
| Session notes format is text-only | Curriculum cues are embedded as `[Coach Cues: ...]` text; no structured `curriculum_source_id` on session_blocks table |

---

## Validation results — Sprint 260

```
npx tsc --noEmit       → CLEAN (0 errors)
qa-curriculum-seed-migration.mjs → 38/38 passed
qa-command-parser.mjs  → 24/24 passed
audit-curriculum-product-language.mjs → PASS
qa-voice-intake-structure.mjs → 15/15 passed
```
