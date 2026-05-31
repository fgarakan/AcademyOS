# QA + Director Usability Test — Sprint 1070 — Builder Live QA

**Date:** 2026-05-31
**Sprint:** 1070
**Covers:** Sprints 1061–1070 (full Builder Intelligence + Guided Collapse UX block)

---

## A — Exercise Matching (Sprints 1061–1063)

- [ ] A1: Click "Populate Blocks with Exercises" on a fitness template with a Coordination block. Coordination block receives Ball Juggling / Reaction Ball / Jump Rope exercises — NOT Acceleration Sprint, Butt Kicks, or Agility Ladder drills.
- [ ] A2: Speed block receives sprint/acceleration exercises after populate.
- [ ] A3: Agility block receives cone/ladder/change-of-direction exercises after populate.
- [ ] A4: Open FitnessExercisePicker for a Coordination block — "suggested" section shows coordination exercises at top, not speed/agility exercises.
- [ ] A5: Populate does not remove existing exercises. Blocks that already have exercises show `skippedExisting > 0`.

---

## B — Fitness Builder Collapse (Sprint 1065)

- [ ] B1: Open fitness template builder. On Step 3 (Blocks), blocks are collapsed by default. Only first block is expanded.
- [ ] B2: Click a collapsed block header — it expands. Previously expanded block collapses.
- [ ] B3: Collapsed block shows: step number · completion indicator · block name (colored) · intent hint · duration · exercise count · "+ Add" button · chevron.
- [ ] B4: "Expand All" button appears when template has ≥2 blocks. Clicking it expands all blocks.
- [ ] B5: With Expand All active, clicking a block header switches to single-block mode.

---

## C — Advanced Controls (Sprint 1067)

- [ ] C1: On a fitness block in expanded state — reorder (↑↓) and delete (🗑) buttons are NOT immediately visible.
- [ ] C2: Click "⋯" (MoreHorizontal) button — advanced controls panel appears with Move up, Move down, and "Remove block" button.
- [ ] C3: Reorder still works correctly when used from the advanced panel.
- [ ] C4: Observation (💬) button is always visible in primary controls row.

---

## D — Fitness Builder Step Labels (Sprint 1065)

- [ ] D1: Stepper nav shows: 1 Goal · 2 Group · 3 Blocks · 4 Load Check · 5 Publish.
- [ ] D2: BottomNav next labels match: Goal→Group, Group→Blocks, Blocks→Load Check, Load Check→Publish.

---

## E — Load Check Step (Sprint 1068)

- [ ] E1: With Red Ball level assigned and a Speed/Plyometrics/Strength block: red "Review Load" flag appears in Step 4.
- [ ] E2: With Orange Ball level and Plyometrics block: orange "Caution" flag appears.
- [ ] E3: Template with no Recovery / Cool Down block shows missing recovery warning.
- [ ] E4: Template with appropriate blocks for level shows "Load OK" badge (green) per block.
- [ ] E5: Level load guidance (Load Guidance + Watch For) appears in Step 4 when a level is assigned.

---

## F — Class Builder Collapse + Step Labels (Sprint 1066)

- [ ] F1: Class builder stepper shows: 1 Class Goal · 2 Level · 3 Session Flow · 4 Coach Notes · 5 Publish.
- [ ] F2: Step 2 "Level" contains the CurriculumLevelSelector (not Step 1).
- [ ] F3: Step 2 "Level" also shows block structure overview below the level selector.
- [ ] F4: Step 3 "Session Flow" shows blocks collapsed by default. First block auto-expanded.
- [ ] F5: "Expand All / Collapse All" button appears with ≥2 blocks.
- [ ] F6: Collapsed block shows: step# · completion · block name · purpose hint · duration · activity count · chevron.
- [ ] F7: Expanding a block shows BlockContentPickerCard.

---

## G — Class Builder Coach Notes Step (Sprint 1069)

- [ ] G1: Step 4 "Coach Notes" shows "Session Flow Check" card at the top.
- [ ] G2: Template with all blocks populated AND with coaching cues → green "Ready to publish" message.
- [ ] G3: Template with empty blocks → orange flag identifying which blocks are empty.
- [ ] G4: Template with blocks but no cues → grey flag per block.
- [ ] G5: Session preview and drill detail section retained below the check.

---

## H — Regression

- [ ] H1: Saving a fitness template (block notes, curriculum level) still works.
- [ ] H2: Generating a session from Step 5 of the Fitness Builder still works.
- [ ] H3: Generating a session from Step 5 of the Class Builder still works.
- [ ] H4: Adding content to a class template block (BlockContentPickerCard) still works.
- [ ] H5: DONNA opens correctly on both builder pages (donnaPageContextRegistry still wired).
- [ ] H6: `npx tsc --noEmit` passes with zero errors.

---

## Director usability score target

Before this block: builders felt like dense database editors. Blocks all expanded, controls cluttered, steps named for implementation not director intent.

After this block:
- Exercise matching: Coordination blocks show coordination exercises. Trust restored.
- Collapse: One block at a time. Director focused.
- Steps: Goal → Group → Blocks → Load Check → Publish. Director intent language.
- Advanced controls: Reorder/delete hidden. Primary action obvious.
- Load check: Director sees risks before publishing.

**Target pass rate for this QA: 90%+ (≥31 of 35 checks passing).**
