# Fitness OS Template Builder — QA Tests

**Sprint:** 165 (originally Sprint 145, updated for Sprint 156-165 batch)
**Date:** 2026-05-02

---

## Test List

### 1. Class templates are no longer conceptually mixed with Fitness templates

- Navigate to `/director/fitness/templates`.
- Confirm the page header reads "FITNESS OS / Fitness Templates".
- Confirm only templates with `fitness_template:true` tag are shown.
- Confirm imported Airtable templates (which have `import_batch:*` tags but no `fitness_template:true`) do NOT appear here.

**Pass:** Fitness-only templates listed. Legacy imports absent or absent until tagged.

---

### 2. Fitness Templates route clearly shows Fitness OS language

- Page eyebrow reads: **FITNESS OS**
- Page title reads: **Fitness Templates**
- Subtitle describes: movement, agility, speed, strength, coordination, recovery blocks.

**Pass:** Page copy is Fitness OS specific. No "class template" or "imported program" language.

---

### 3. New fitness template can be created

- Click "New Fitness Template".
- Fill in name (required), select template type, add optional description and duration.
- Submit form.
- Confirm redirect to the new template detail page.
- Confirm the new template appears in the list with `Fitness OS` and the chosen type label.

**Pass:** Template created with `track = 'fitness'` and `fitness_template:true` tag. Redirects to builder.

---

### 4. Fitness block can be added

- Open a fitness template detail page.
- Click "Add Fitness Block".
- Select a block type (e.g. Movement, Agility).
- Confirm the block appears in the block list.
- Confirm the block has the correct type label and development intent description.

**Pass:** Block added, shown in builder UI.

---

### 5. Block types are fitness-specific

- Available block types in the "Add Block" panel:
  - Movement
  - Agility
  - Speed
  - Plyometrics
  - Strength
  - Coordination
  - Mobility
  - Recovery / Cool Down
- No "Technical", "Tactical", "Mental", "Competition" (class template types) appear here.

**Pass:** Only fitness block types listed.

---

### 6. Adding a block auto-populates 3 matching exercises when available

- Add an Agility block to a fitness template.
- If the exercise library has exercises with agility-matching category/name/subcategory:
  - Confirm up to 3 exercises appear automatically.
- If no exercises match:
  - Block appears with 0 exercises (no fallback exercises inserted into DB).

**Pass:** Matching exercises inserted. Non-matching blocks left empty (not populated with fakes).

---

### 7. Exercise can be added

- (Future sprint: explicit Add Exercise to Block UI beyond auto-populate)
- Current V1: exercises are added via auto-populate when block is created.

**Note:** Manual exercise addition via explicit "Add Exercise" button is planned for a follow-up sprint.

---

### 8. Exercise can be removed

- On a block with exercises, click the X button on an exercise row.
- Confirm the exercise row disappears from the block.
- Confirm the exercise still exists in the exercise library (verify by navigating elsewhere).

**Pass:** Exercise removed from `template_block_exercises`. Exercise library untouched.

---

### 9. Exercise can be swapped

- Click "Switch" on an exercise row.
- The FitnessExerciseSwitcher modal opens.
- Matching exercises for the block type appear first (labeled "Match").
- Search narrows the list.
- Select a replacement and click "Confirm Switch".
- Confirm the original exercise is replaced in the block.
- Confirm the exercise library item is unchanged.

**Pass:** `template_block_exercises.exercise_id` updated. Library item unchanged.

---

### 10. Exercise library is not mutated by swaps

- After swapping, navigate to the exercises list.
- Confirm the original exercise still exists with its original name and category.
- Confirm no duplicate entries were created.

**Pass:** Exercise library fully intact.

---

### 11. Block notes can be edited

- Click the MessageSquare icon on a block card.
- Observation panel opens.
- Type a note, click "Save Observation".
- Confirm the note appears below the block header with "Observation" label.

**Pass:** `template_blocks.notes` updated. Observation displayed.

---

### 12. Voice/text observation can be captured

- Click the observation button on a block.
- Use the VoiceTextInput component to speak or type an observation.
- Confirm text is populated in the textarea.
- Save the observation.
- Confirm it is persisted.

**Pass:** VoiceTextInput works (text fallback always available). Observation saved.

---

### 13. Observation does not mutate player record

- Add any observation to a block.
- Navigate to any player profile.
- Confirm no changes to player data, signals, priorities, or recommendations.

**Pass:** Observations are stored only in `template_blocks.notes`. No player record touched.

---

### 14. Observation does not send communication

- Add any observation to a block.
- Confirm no emails, push notifications, SMS, or Slack messages are triggered.
- Confirm no entries in `parent_updates` or `proposed_actions` with communication intent.

**Pass:** Observation update writes only to `template_blocks`. No communication pipeline triggered.

---

### 15. Class templates remain available under the correct section

- Navigate to `/director/class-templates`.
- Confirm imported Airtable templates appear here.
- Confirm they are linked to the existing template detail route.
- Confirm the sidebar shows "Class Templates" under Foundation.

**Pass:** Class templates accessible. No data deleted or hidden.

---

### 16. TypeScript passes

```bash
npx tsc --noEmit
```

**Pass:** Zero errors in sprint-touched files.

---

### 17. `isFitnessBlockType` correctly validates values

```ts
isFitnessBlockType('movement')          // true
isFitnessBlockType('recovery_cool_down') // true
isFitnessBlockType('technical')          // false (class block type)
isFitnessBlockType('')                   // false
isFitnessBlockType(42)                   // false
```

**Pass:** Function correctly narrows to `FitnessBlockType` union.

---

### 18. `normalizeFitnessExerciseCategory` maps legacy values correctly

```ts
normalizeFitnessExerciseCategory('warm up')       // 'warm_up'
normalizeFitnessExerciseCategory('cool-down')     // 'cool_down'
normalizeFitnessExerciseCategory('conditioning')  // 'fitness'
normalizeFitnessExerciseCategory('movement')      // 'movement'
normalizeFitnessExerciseCategory('technique')     // 'technical'
```

**Pass:** Normalized values match DB `exercise_category` enum values.
