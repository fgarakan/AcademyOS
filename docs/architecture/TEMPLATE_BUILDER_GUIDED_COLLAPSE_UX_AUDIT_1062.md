# Template Builder Guided Collapse UX Audit — Sprint 1062

**Date:** 2026-05-31
**Sprint:** 1062
**Status:** Audit complete — implementation deferred to Sprints 1065–1066

---

## Current state: Fitness Builder

**Entry point:** `/director/fitness/templates/[templateId]` (fitness templates only)
**Component tree:**
```
FitnessBuilderStepper (5 steps)
  Step 3: FitnessTemplateBuilderClient
    → [blocks.map] FitnessBlockCard (always expanded)
      → [exercises.map] ExerciseRow (always expanded)
```

**Current 5-step track:**
| Step | Current label | Goal label | Match? |
|---|---|---|---|
| 1 | Development Focus | Goal | Partial — level-based, not goal-based |
| 2 | Training Goal | Group | Mismatch — shows meta editor, not group selector |
| 3 | Physical Blocks | Blocks | ✅ Close |
| 4 | Tennis Transfer | Load Check | Mismatch — transfer copy, not load risk flags |
| 5 | Review + Save | Publish | ✅ Close |

**UX gaps in Fitness Builder:**

| Gap | Severity | Where |
|---|---|---|
| All blocks expanded on Step 3 — no collapse | High | FitnessTemplateBuilderClient |
| No block summary row (name + duration + exercise count + completion + intent) | High | FitnessBlockCard |
| No "Expand All / Collapse All" control | Medium | FitnessTemplateBuilderClient |
| Reorder (↑↓) and delete (🗑) buttons always visible — not advanced | Medium | FitnessBlockCard header |
| Observation/notes shown immediately when present — not collapsible | Medium | FitnessBlockCard content |
| Exercise rows show category badge + duration + switch + remove — no "details" collapse | Medium | ExerciseRow |
| No DONNA guidance chips per step | Low | All steps |
| Step 2 "Training Goal" shows template meta editor — not a goal picker | Low | FitnessBuilderStepper Step2 |

---

## Current state: Class Builder

**Entry point:** `/director/class-templates/[templateId]`
**Component tree:**
```
ClassTemplateBuilderStepper (5 steps)
  Step 1: Class Identity (includes CurriculumLevelSelector)
  Step 2: Class Structure (block overview, read-only)
  Step 3: Build Blocks
    → [blockList.map] BlockContentPickerCard (always expanded)
  Step 4: Coach Preview (all drill details expanded)
  Step 5: Review + Apply
```

**Current 5-step track vs goal track:**
| Step | Current label | Goal label | Match? |
|---|---|---|---|
| 1 | Class Identity | Class Goal | Partial — goal embedded but level also here |
| 2 | Class Structure | Level | Mismatch — level is in Step 1; Step 2 is block overview |
| 3 | Build Blocks | Session Flow | Partial — blocks are built here but not called "flow" |
| 4 | Coach Preview | Coach Notes | Mismatch — preview, not notes/cues |
| 5 | Review + Apply | Publish | ✅ Close |

**UX gaps in Class Builder:**

| Gap | Severity | Where |
|---|---|---|
| All blocks expanded on Step 3 — no collapse | High | ClassTemplateBuilderStepper Step 3 |
| No block summary row | High | Step 3 block list |
| Curriculum level selector embedded in Step 1 — not a dedicated Level step | Medium | Step1Identity component |
| Step 4 "Coach Preview" shows all drill/game details fully expanded — very dense | Medium | Step4CoachPreview |
| No "Expand All / Collapse All" control in Step 3 | Medium | Step3BuildBlocks |
| No DONNA guidance chips per step | Low | All steps |
| No dedicated "Coach Notes" step for adding coaching guidance | Low | Step 4 only shows preview |

---

## Shared UX gaps (both builders)

1. **Blocks expanded by default** — a director editing a 7-block fitness template sees all 7 blocks fully open simultaneously. Cognitive load is high before they've even oriented.

2. **No collapsed block summary row** — the goal requires: `block name · duration · count · completion · intent · quick action`. Neither builder has this collapsed row format.

3. **Advanced controls mixed with primary UI** — reorder arrows, delete buttons, and block-level notes controls are visible at all times in the primary view. These are secondary actions that should be in a disclosure or context menu.

4. **One active block, not enforced** — expanding/collapsing is sequential work; the director should expand one block, do the work, then move to the next. Current UX makes all blocks simultaneously demanding attention.

5. **DONNA guidance not inline** — both builders have `data-donna-focus-id` attributes for DONNA context but no inline guidance copy per step that would tell the director what the current step is asking of them beyond the banner text.

---

## Proposed changes for Sprints 1065–1066

### Sprint 1065 — Fitness Builder Guided Track + Collapse

**File:** `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx`

Changes:
1. Add `expandedBlockId: string | null` state (one block open at a time)
2. Each `FitnessBlockCard` gets `isExpanded: boolean` and `onToggle: () => void`
3. **Collapsed state** shows: block name (accented) · duration · exercise count · completion badge · intent short · chevron icon · quick action (Add Exercise)
4. **Expanded state** shows current full content
5. Auto-expand first block on mount
6. Add "Expand All" button when ≥2 blocks exist

**File:** `src/app/director/fitness/templates/[templateId]/FitnessBuilderStepper.tsx` (Step name corrections)

Changes:
1. Step 1: "Development Focus" → "Goal" — short, imperative
2. Step 2: "Training Goal" → keep the meta editor but rename to "Group" or embed group context
3. Step 3: "Physical Blocks" → "Blocks"
4. Step 4: "Tennis Transfer" → "Load Check" — add load risk flag display
5. Step 5: "Review + Save" → "Publish"

**Collapsed block summary row format:**
```
[●] Coordination · 10min · 3 exercises · ✓ complete · Rhythm & hand-eye · [+ Add] [›]
```
- Left: completion indicator (●/○)
- Block name (accented by type)
- Duration
- Exercise count + completion state
- Intent tag (1-2 words)
- Quick action: "Add Exercise" or "0 exercises — Add"
- Right: chevron to expand

### Sprint 1066 — Class Builder Guided Track + Collapse

**File:** `src/app/director/class-templates/[templateId]/ClassTemplateBuilderStepper.tsx`

Step name corrections:
1. Step 1: "Class Identity" → "Class Goal"
2. Step 2: Rename "Class Structure" → dedicate to "Level" — move CurriculumLevelSelector here, move block overview to Step 3 header
3. Step 3: "Build Blocks" → "Session Flow"
4. Step 4: "Coach Preview" → "Coach Notes" — pivot to notes-first, preview secondary
5. Step 5: "Review + Apply" → "Publish"

Block collapse for Step 3:
- Same one-open pattern as fitness builder
- Collapsed row: `block type · duration · item count · completion · purpose hint · [Add Content] [›]`
- Auto-expand first empty block

Step 4 restructuring:
- Add a dedicated coach notes field per block (currently not available)
- Coach preview becomes a secondary panel (collapsed by default)
- OR: keep preview as-is but collapse each block's detail section

---

## What must NOT change

- Block IDs, template IDs, block types, exercise assignment logic — all data structures intact
- Saving, auto-populate, switch exercise, remove exercise — all actions unchanged
- DONNA donnaPageContextRegistry attributes — `data-donna-focus-id` attrs preserved
- Session generation (Step 5) — unchanged
- The populate blocks action (just fixed in Sprint 1061) — unchanged

---

## Rollout priority

| Sprint | Target | Primary change |
|---|---|---|
| 1063 | Exercise matching | Tighter score thresholds for coordination |
| 1064 | Shared component | `CollapsibleBlockRow` component + `BuilderStepper` shared nav |
| 1065 | Fitness Builder | Collapse UX + step renames + load check step |
| 1066 | Class Builder | Collapse UX + step renames + level step split |
| 1067 | Both | Advanced controls behind disclosure |

---

## Files to read before implementing 1065/1066

| File | Why |
|---|---|
| `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx` | Block list + FitnessBlockCard — add collapse state here |
| `src/app/director/fitness/templates/[templateId]/FitnessBuilderStepper.tsx` | Step labels + step content — rename + restructure |
| `src/app/director/class-templates/[templateId]/ClassTemplateBuilderStepper.tsx` | Full class builder — collapse + step renames |
| `src/components/ui/index.ts` | Check for existing collapse/disclosure components |
| `src/app/director/fitness/templates/[templateId]/fitnessBuilderTypes.ts` | FitnessBlock type interface |

---

## TypeScript implications

- `FitnessBlockCard` will need new props: `isExpanded: boolean`, `onToggle: () => void`
- `FitnessTemplateBuilderClient` will need `expandedBlockId` state
- No backend or schema changes
- All changes are display-layer only
