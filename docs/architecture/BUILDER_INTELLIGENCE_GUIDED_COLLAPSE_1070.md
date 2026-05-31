# Builder Intelligence + Guided Collapse UX Block — Final QA Report

**Date:** 2026-05-31
**Sprints:** 1061–1070
**Status:** All 10 sprints complete and pushed

---

## What was built

### Exercise matching (Sprints 1061–1063)

**Problem:** Coordination blocks received speed/agility exercises (Acceleration Sprint, Butt Kicks, Agility Ladder).

**Root cause:** `populateFitnessBlocksAction` used DB block type (`fitness`) for all 5 fitness sub-types, selecting exercises alphabetically from the same pool.

**Fixes:**
1. Sprint 1061: `populateFitnessBlocksAction` now calls `inferFitnessBlockType(block.name)` + `getDefaultExercisesForFitnessBlock()` — exercises ranked by semantic score for each block type.
2. Sprint 1063: `CATEGORY_MATCH['coordination']` changed from `['fitness', 'movement']` → `['movement']`. `MIN_MATCH_SCORE` raised from `> 0` to `>= 3`. Coordination keywords refined (removed `'tennis'`, added `'catch'`, `'toss'`, `'dribble'`, `'juggling'`).

**Expected Coordination block result:** Ball Juggling – One Hand, Ball Juggling – Two Hands, Jump Rope – Coordination, Reaction Ball Catch.
**Excluded:** Acceleration Sprint, Butt Kicks, Agility Ladder drills.

---

### Shared builder components (Sprint 1064)

- `src/components/builder/CollapsibleBlockRow.tsx` — reusable collapsed block row (name, duration, count, completion, intent hint, quick action, chevron)
- `src/components/builder/BuilderStepperNav.tsx` — shared `BuilderStepperNav` + `BuilderBottomNav`
- `src/components/builder/index.ts` — barrel export

---

### Fitness Builder guided track + collapse (Sprints 1065, 1067, 1068)

**Step renames:**
| Before | After |
|---|---|
| Development Focus | Goal |
| Training Goal | Group |
| Physical Blocks | Blocks |
| Tennis Transfer | Load Check |
| Review + Save | Publish |

**Collapse UX:**
- `expandedBlockId` state — one block open at a time
- `expandAll` state — all blocks open (toggle button shown with ≥2 blocks)
- First block auto-expanded on mount
- `CollapsibleBlockRow` used as outer container per block
- Collapsed row shows: step# · completion · name · intent · duration · count · "+ Add" quick action · chevron

**Advanced controls:**
- Reorder (↑↓) and Delete (🗑) hidden behind "⋯" button in expanded view
- Observation button and duration always visible

**Load Check step:**
- Load flags: `LOAD_REDUCE` for Red Ball (speed/plyometrics/strength) and `LOAD_CAUTION` for Orange Ball
- Missing recovery block warning
- Level-based load guidance + "Watch For" from `LEVEL_DEV_CONTEXT`
- Per-block Load OK / Caution / Review Load badge

---

### Class Builder guided track + collapse (Sprints 1066, 1069)

**Step renames:**
| Before | After |
|---|---|
| Class Identity | Class Goal |
| Class Structure | Level |
| Build Blocks | Session Flow |
| Coach Preview | Coach Notes |
| Review + Apply | Publish |

**Step restructuring:**
- CurriculumLevelSelector moved from Step 1 to dedicated Step 2 "Level"
- Step 2 "Level" also shows block structure overview
- Old `Step2Structure` removed

**Collapse UX (Session Flow step):**
- Same one-block-at-a-time pattern as Fitness Builder
- `CollapsibleBlockRow` per block
- "Expand All / Collapse All" toggle

**Coach Notes step:**
- Session flow check: empty blocks flagged, blocks without cues flagged
- "Ready to publish" green state when all clear
- TemplateSessionPreviewCard retained

---

## Director usability test — golden path

### Fitness Builder golden path

1. Navigate to `/director/fitness/templates` → open any fitness template
2. **Step 1 (Goal):** Assign curriculum level → see development priorities appear
3. **Step 2 (Group):** Review template name/duration/training type → edit if needed
4. **Step 3 (Blocks):**
   - All blocks collapsed by default — first block auto-expanded
   - Click block header to expand/collapse
   - Verify Coordination block shows coordination exercises (not speed/agility)
   - Click "Populate Blocks with Exercises" — verify each block type gets semantically correct exercises
   - Click "⋯" on a block to see reorder/delete controls
5. **Step 4 (Load Check):**
   - Verify load flags shown if Red Ball level + speed/plyometrics blocks
   - Verify missing recovery block warning shown if applicable
   - Review tennis transfer copy per block
6. **Step 5 (Publish):**
   - Review block sequence
   - Generate session

### Class Builder golden path

1. Navigate to `/director/class-templates` → open any class template
2. **Step 1 (Class Goal):** Confirm template name and description
3. **Step 2 (Level):** Assign curriculum level → block overview shows below
4. **Step 3 (Session Flow):**
   - All blocks collapsed by default
   - Click block to expand → add/remove activities via BlockContentPickerCard
   - "Expand All" opens all blocks simultaneously
5. **Step 4 (Coach Notes):**
   - Session Flow Check shows green or flags missing cues
   - Coach Notes section shows drill details per block
6. **Step 5 (Publish):** Review + generate session

---

## Regression checks

- [ ] Template saving still works (block content, notes, exercises)
- [ ] Remove exercise still works
- [ ] Switch exercise still works
- [ ] Add exercise via picker still works
- [ ] FitnessExercisePicker "suggested" section now shows coordination exercises for coordination blocks
- [ ] FitnessExerciseSwitcher still functions
- [ ] Generate Session still works from Step 5 of both builders
- [ ] DONNA context data-donna-focus-id attrs still present
- [ ] No TypeScript errors

---

## Files changed in Sprints 1061–1070

| File | Sprint | Change |
|---|---|---|
| `populateFitnessBlocksAction.ts` | 1061 | Use scoring for fitness block type matching |
| `fitnessExerciseMatching.ts` | 1063 | Tighten CATEGORY_MATCH, MIN_MATCH_SCORE = 3 |
| `components/builder/CollapsibleBlockRow.tsx` | 1064 | New shared component |
| `components/builder/BuilderStepperNav.tsx` | 1064 | New shared component |
| `components/builder/index.ts` | 1064 | New barrel export |
| `FitnessTemplateBuilderClient.tsx` | 1065, 1067 | Collapse + advanced controls |
| `FitnessBuilderStepper.tsx` | 1065, 1068 | Step renames + load check |
| `ClassTemplateBuilderStepper.tsx` | 1066, 1069 | Step renames + collapse + flow check |
| Docs × 8 | 1061–1069 | Architecture + QA docs per sprint |
| `docs/CHANGELOG.md` | All | Updated per sprint |

---

## TypeScript

Clean across all 10 sprints. No new backend dependencies. No schema changes.
