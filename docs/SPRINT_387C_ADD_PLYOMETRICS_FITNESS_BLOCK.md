# Sprint 387C — Add Plyometrics Selectable Fitness Block V1

**Date:** 2026-05-20
**Sprint:** 387C
**Status:** Complete

---

## Purpose

Sprint 387B audit confirmed that plyometrics is fully defined in the fitness type system (`fitnessBlockTypes.ts`, `fitnessExerciseMatching.ts`, `fitnessExerciseRecommendations.ts`, `fitnessExerciseAutoPopulate.ts`) but missing from the `FITNESS_BLOCK_CATALOG` in `NewFitnessTemplateForm.tsx`. This sprint adds the single missing catalog entry and wires it into the relevant standard structures.

---

## What changed

### `src/app/director/fitness/templates/new/NewFitnessTemplateForm.tsx`

Added one entry to `FITNESS_BLOCK_CATALOG` after `agility`:

```ts
{
  id: 'plyometrics',   dbType: 'fitness',   label: 'Plyometrics',
  intent: 'Jumps, bounds, lateral bounds, and elastic power development.',
  defaultMin: 10, colorClass: 'bg-status-orange/8 border-status-orange/25',
  badgeClass: 'bg-status-orange/15 text-status-orange border-status-orange/30',
},
```

Updated `STANDARD_STRUCTURES` for three template types:

| Type | Before | After |
|---|---|---|
| `standard` | `movement_prep, agility, speed, strength, tennis_transfer, recovery` | `movement_prep, agility, plyometrics, speed, strength, tennis_transfer, recovery` |
| `high_intensity` | `movement_prep, speed, agility, conditioning, strength, recovery` | `movement_prep, speed, agility, plyometrics, conditioning, strength, recovery` |
| `assessment` | `movement_prep, speed, agility, strength, balance, recovery` | `movement_prep, speed, agility, plyometrics, strength, balance, recovery` |

`low_load`, `recovery`, and `post_tournament` structures unchanged — plyometrics is not appropriate for those template types.

---

## DB safety

`dbType: 'fitness'` is a valid value in the `block_type` DB enum. `safeDbBlockType()` in `createFitnessTemplateWithBlocksAction.ts` also coerces unknown types to `'fitness'` as a final backstop. No migration required.

---

## No other files changed

The exercise matching, fallbacks, auto-populate, and FitnessBuilderStepper already handle plyometrics. This sprint is purely additive: one catalog entry, three structure updates.

---

## TypeScript

Clean. `npx tsc --noEmit` passes with no errors.

---

## Files changed

**Modified:**
- `src/app/director/fitness/templates/new/NewFitnessTemplateForm.tsx` — plyometrics catalog entry added; standard, high_intensity, assessment structures updated
- `docs/CHANGELOG.md` — dated entry added

**Created:**
- `docs/SPRINT_387C_ADD_PLYOMETRICS_FITNESS_BLOCK.md` — this document
