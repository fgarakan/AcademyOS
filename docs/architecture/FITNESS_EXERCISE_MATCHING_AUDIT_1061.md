# Fitness Exercise Matching Audit — Sprint 1061

**Date:** 2026-05-31
**Sprint:** 1061
**Status:** Root cause identified and fixed

---

## Problem statement

A Coordination block in the Fitness Template Builder was being populated with speed/agility exercises:
- Acceleration Sprint
- Butt Kicks
- Agility Ladder drills

These are semantically wrong for a Coordination block. The bug eroded trust in the Populate Blocks button.

---

## Two exercise population paths

The Fitness Builder has two paths that assign exercises to blocks:

| Path | Trigger | File | Uses scoring? |
|---|---|---|---|
| **Add Block** | Director adds a single block | `fitnessTemplateActions.ts:addFitnessBlockAction` | Yes — `getDefaultExercisesForFitnessBlock()` |
| **Populate Blocks** | "Populate Blocks with Exercises" button | `populateFitnessBlocksAction.ts` | **No (was broken)** |

---

## Root cause

### The DB type collapse

`fitnessBlockTypes.ts` maps all fitness sub-types to DB enum values:

```ts
const DB_BLOCK_TYPE_MAP: Record<FitnessBlockType, string> = {
  movement:          'movement',
  agility:           'fitness',   // ← same DB type
  speed:             'fitness',   // ← same DB type
  plyometrics:       'fitness',   // ← same DB type
  strength:          'fitness',   // ← same DB type
  coordination:      'fitness',   // ← same DB type
  mobility:          'movement',
  recovery_cool_down: 'cool_down',
}
```

Five distinct block types all have `type = 'fitness'` in the database.

### The broken populate action

`populateFitnessBlocksAction.ts` was using `block.type` (the DB value) to look up matching exercise categories:

```ts
const BLOCK_TO_EXERCISE_CATEGORY: Record<string, string[]> = {
  fitness: ['fitness'],  // ← ALL fitness sub-types resolve here
}

const categories = BLOCK_TO_EXERCISE_CATEGORY[block.type] ?? []
```

For any block with `type = 'fitness'`, this returned all exercises with `category = 'fitness'` — regardless of whether the block was Coordination, Speed, Agility, Strength, or Plyometrics.

Those exercises were then sorted **alphabetically** and selected to fill the duration budget:
- "Acceleration Sprint" (A) — speed exercise
- "Agility Ladder" (A) — agility exercise
- "Butt Kicks" (B) — movement/warmup exercise

...all appeared in a Coordination block because they come first alphabetically.

### The scoring system that existed but wasn't wired

`fitnessExerciseMatching.ts` already contained:
- `MATCH_KEYWORDS` — per-block-type keyword sets for name/subcategory/tag matching
- `CATEGORY_MATCH` — per-block-type preferred exercise categories
- `scoreExercise()` — scores each exercise against a block type
- `getDefaultExercisesForFitnessBlock()` — returns top-N exercises for a given fitness block type

This was called correctly in `addFitnessBlockAction` but **never called in `populateFitnessBlocksAction`**.

---

## Fix applied in Sprint 1061

`populateFitnessBlocksAction.ts` was updated to:

1. Import `inferFitnessBlockType` from `fitnessBlockTypes.ts`
2. Import `getDefaultExercisesForFitnessBlock` and `ExerciseCandidate` from `fitnessExerciseMatching.ts`
3. For each block: call `inferFitnessBlockType(block.name)` to detect if it's a fitness sub-type block
4. If detected: score all exercises via `getDefaultExercisesForFitnessBlock(inferredType, allCandidates, N)` and fill duration budget from the scored order
5. If not detected: fall back to existing category-map approach (unchanged for warm_up, technical, etc.)

### What changes

- **Coordination blocks** → exercises matching 'coordination', 'rhythm', 'balance', 'hand-eye', 'reaction ball', 'visual tracking' keywords appear first
- **Speed blocks** → exercises matching 'speed', 'sprint', 'acceleration', 'burst' keywords appear first
- **Agility blocks** → exercises matching 'agility', 'ladder', 'cone', 'change of direction', 'reaction' keywords appear first
- **Other fitness sub-types** → same improvement

### What does NOT change

- Non-fitness blocks (warm_up, technical, tactical, cool_down) — unmodified
- Existing template exercises — never removed or replaced
- Schema — no migrations
- The Add Block path — already correct, unchanged
- FitnessExercisePicker/FitnessExerciseSwitcher — already correct, unchanged

---

## Secondary issue (deferred to Sprint 1063)

Even with the fix, `fitnessExerciseMatching.ts` has category overlap:

```ts
const CATEGORY_MATCH: Record<FitnessBlockType, string[]> = {
  coordination: ['fitness', 'movement'],  // too broad — any fitness exercise scores 2
  speed:        ['fitness', 'movement'],  // same
  agility:      ['movement', 'fitness'],  // same
}
```

Any exercise with `category = 'fitness'` scores at least 2 for coordination, speed, and agility. With a `> 0` threshold in `matchExerciseToFitnessBlock`, this causes the FitnessExercisePicker to show ALL fitness exercises as "matches" for coordination.

Sprint 1063 will tighten the category match and scoring threshold for each block type.

---

## Keyword analysis

### Coordination keywords (current)
`'coordination', 'rhythm', 'balance', 'proprioception', 'hand-eye', 'reaction ball', 'juggle', 'tennis', 'visual', 'tracking'`

**Issue:** `'tennis'` matches too broadly — "Tennis-specific agility circuit" would score for coordination. Deferred to Sprint 1063.

### Speed keywords (current)
`'speed', 'sprint', 'acceleration', 'short sprint', 'burst', 'linear speed', 'fly', 'fly-in', 'court sprint', 'max velocity'`

**Issue:** `'fly'` is too short — could match exercise names containing "fly" incidentally. Low risk with current library. Noted for Sprint 1063.

### Agility keywords overlap with coordination
`'react', 'reaction'` appears in agility; `'reaction ball'` in coordination. Currently no conflict since the phrase 'reaction ball' is specific. Safe as-is.

---

## Impact assessment

| Block type | Before fix | After fix |
|---|---|---|
| Coordination | Speed/agility exercises (A-first alphabetical) | Coordination-matched exercises (rhythm, balance, hand-eye) |
| Speed | Same pool as Coordination | Speed-matched exercises (sprint, acceleration) |
| Agility | Same pool as Coordination | Agility-matched exercises (ladder, cone, change-of-direction) |
| Strength | Same pool | Strength-matched exercises (squat, plank, core) |
| Plyometrics | Same pool | Plyometrics-matched exercises (jump, bound, explosive) |
| Movement | Correct — was already separate DB type | Unchanged |
| Mobility | Was using 'movement' DB type — correct exercises | Unchanged |
| Recovery/Cool Down | Correct — was 'cool_down' DB type | Unchanged |

---

## Files changed

| File | Change |
|---|---|
| `src/app/director/fitness/templates/[templateId]/populateFitnessBlocksAction.ts` | Use scoring-based matching for fitness sub-type blocks |

## Files NOT changed

| File | Reason |
|---|---|
| `src/lib/fitness/fitnessExerciseMatching.ts` | Scoring logic was already correct — only the caller was broken |
| `src/lib/fitness/fitnessBlockTypes.ts` | DB type map unchanged — required by DB schema |
| `fitnessTemplateActions.ts` | Add Block path already correct |
| All other fitness files | Unchanged |
