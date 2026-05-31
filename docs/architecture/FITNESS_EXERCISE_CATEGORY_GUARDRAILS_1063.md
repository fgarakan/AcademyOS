# Fitness Exercise Category Guardrails — Sprint 1063

**Date:** 2026-05-31
**Sprint:** 1063
**Status:** Implemented

---

## Problem

After Sprint 1061 fixed the populate action to use scoring, a secondary issue remained:
`CATEGORY_MATCH['coordination'] = ['fitness', 'movement']` gave ANY exercise with `category = 'fitness'`
a base score of 2 for the coordination block — even speed/agility exercises like Acceleration Sprint
or Butt Kicks. With the `> 0` match threshold, these exercises still appeared in the picker's
"suggested" section and could backfill coordination blocks when the duration budget wasn't fully filled.

---

## Root cause chain (secondary issue)

1. The DB stores speed, agility, and strength exercises all as `category = 'fitness'`
2. `CATEGORY_MATCH['coordination'] = ['fitness', 'movement']` meant coordination gave a +2 base to all fitness exercises
3. `matchExerciseToFitnessBlock` threshold was `> 0` — a score of 2 (category-only) qualified as a "match"
4. Result: all fitness exercises showed as "suggested" in the coordination picker

---

## Changes made in Sprint 1063

### 1. `CATEGORY_MATCH` — tightened coordination

**Before:**
```ts
coordination: ['fitness', 'movement'],
```

**After:**
```ts
coordination: ['movement'],
```

Coordination exercises in the DB (Ball Juggling, Reaction Ball Catch, etc.) have `category = 'movement'`.
Speed/agility exercises (Acceleration Sprint, Butt Kicks, etc.) have `category = 'fitness'`.
Removing 'fitness' from coordination's category match means these exercises no longer get a base score
for coordination — they can only qualify via keyword matches.

Also tightened other categories to be more precise:
- `agility`: was `['movement', 'fitness']` → `['fitness']` only
- `speed`: was `['fitness', 'movement']` → `['fitness']` only
- `plyometrics`: unchanged (`['fitness']`)
- `strength`: unchanged (`['fitness']`)
- `mobility`: was `['movement', 'fitness']` → `['movement']` only
- `recovery_cool_down`: was `['cool_down', 'fitness']` → `['cool_down']` only

### 2. `MATCH_KEYWORDS['coordination']` — more specific

**Removed:** `'tennis'` — too broad, matched exercise names like "Tennis-specific agility circuit"

**Added:** `'catch'`, `'toss'`, `'dribble'`, `'juggling'`, `'hand eye'`, `'bilateral'`

These cover actual coordination exercises in the library:
- "Catch and Toss Ladder" → 'catch', 'toss'
- "Racket Dribbling" → 'dribble'
- "Ball Juggling – Two Hands" → 'juggling', 'juggle'
- "Jump Rope – Coordination" → 'coordination'

### 3. `MATCH_KEYWORDS['speed']` — removed ambiguous 'fly'

`'fly'` and `'fly-in'` were removed from speed keywords. The shortness of 'fly' risked false matches
on exercise names like "Footwork + Ball Toss" (if a future exercise were named with "fly"). Also added
`'first step'` and `'quickness'` which are more specific speed markers.

### 4. `MATCH_KEYWORDS['strength']` — added specific terms

Added `'rdl'`, `'deadlift'`, `'pull-up'`, `'pull up'` to catch exercises like "Single Leg RDL"
and "Pull-up or lat pulldown" from the High Performance library.

### 5. `MATCH_KEYWORDS['recovery_cool_down']` — removed `'stretch'` conflict

`'stretch'` was also a mobility keyword, creating a conflict where stretch exercises could show
in both mobility and recovery blocks. Recovery now uses `'static'`, `'foam'`, `'debrief'`, `'rpe'`.

`'mobility'` keywords now include `'stretch'`, `'foam roll'`, and `'90/90'` for better
hip/shoulder mobility exercise matching.

### 6. MIN_MATCH_SCORE constant raised from `> 0` to `>= 3`

```ts
const MIN_MATCH_SCORE = 3
```

A score of 2 = category-only match. A score of 3 = at least one keyword match.
Both `getDefaultExercisesForFitnessBlock` and `matchExerciseToFitnessBlock` now use this threshold.

---

## Before / after scoring for key exercises

### "Butt Kicks" (category='fitness', tags=['speed', 'difficulty:low'])

| Block type | Before score | After score | Qualifies? |
|---|---|---|---|
| coordination | 2 (category) | 0 (no keywords, no 'movement' cat) | ❌ (was ✅) |
| speed | 3 (tag 'speed' + category) | 3 (tag 'speed' + category) | ✅ |
| movement | 3 ('butt kick' keyword) | 3 ('butt kick' keyword) | ✅ |

### "Acceleration Sprint" (category='fitness', tags=['speed', 'difficulty:high'])

| Block type | Before score | After score | Qualifies? |
|---|---|---|---|
| coordination | 2 (category) | 0 | ❌ (was ✅) |
| speed | 9 (keywords + category + tag) | 9 | ✅ |

### "Agility Ladder – In-Out" (category='fitness', tags=['speed', 'difficulty:medium'])

| Block type | Before score | After score | Qualifies? |
|---|---|---|---|
| coordination | 2 (category) | 0 | ❌ (was ✅) |
| agility | 6 (keywords + category) | 6 | ✅ |
| speed | 3 (tag + category) | 3 | ✅ |

### "Ball Juggling – Two Hands" (category='movement', tags=['difficulty:low'])

| Block type | Before score | After score | Qualifies? |
|---|---|---|---|
| coordination | 5 ('juggle' + category) | 5 ('juggling' + 'juggle' + category) | ✅ |
| movement | 2 (category only) | 2 | ❌ (below threshold — correct) |

### "Reaction Ball Drill" (category='fitness', tags=['agility', 'difficulty:high'])

| Block type | Before score | After score | Qualifies? |
|---|---|---|---|
| coordination | 5 ('reaction ball' keyword + category) | 3 ('reaction ball' keyword only) | ✅ |
| agility | 9 (keywords + category + tag) | 9 | ✅ |

### "Jump Rope – Coordination" (category='movement', tags=['difficulty:low'])

| Block type | Before score | After score | Qualifies? |
|---|---|---|---|
| coordination | 5 ('coordination' + category) | 5 | ✅ |

---

## Coordination block expected output (after Sprints 1061 + 1063)

With the 83-exercise library for demo academy, a Coordination block should populate with:
1. Ball Juggling – One Hand (score 5+: 'juggling' keyword + 'movement' category)
2. Ball Juggling – Two Hands (score 5+: same)
3. Jump Rope – Coordination (score 5+: 'coordination' keyword + 'movement' category)
4. Reaction Ball Catch (score 5+: 'reaction ball' keyword + 'movement' category)

Speed/agility exercises (Acceleration Sprint, Agility Ladder) score 0 for coordination → excluded.
Butt Kicks scores 0 → excluded.

---

## Picker behavior change

In `FitnessExercisePicker` and `FitnessExerciseSwitcher`:
- Before: all fitness exercises showed as "suggested" for coordination (score >= 2)
- After: only genuinely coordination-relevant exercises show in the "suggested" section (score >= 3)
- Speed/agility exercises move to the "Other Exercises" section when adding to a coordination block

---

## Files changed

| File | Change |
|---|---|
| `src/lib/fitness/fitnessExerciseMatching.ts` | CATEGORY_MATCH tightened, coordination keywords refined, MIN_MATCH_SCORE = 3 |

## Files NOT changed

| File | Reason |
|---|---|
| `src/lib/fitness/fitnessBlockTypes.ts` | Block type definitions unchanged |
| `src/app/director/fitness/templates/[templateId]/populateFitnessBlocksAction.ts` | Fixed in Sprint 1061 |
| FitnessExercisePicker / FitnessExerciseSwitcher | Use `matchExerciseToFitnessBlock` — benefit automatically |
| fitnessTemplateActions.ts | Uses `getDefaultExercisesForFitnessBlock` — benefits automatically |
| All schema/migrations | No changes |
