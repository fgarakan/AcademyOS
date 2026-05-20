# Sprint 387B — Fitness Category Database + Selectable Category Audit V1

**Date:** 2026-05-20
**Sprint:** 387B (Fitness Category Audit)
**Status:** Complete

---

## Purpose

Before adding Plyometrics to the AcademyOS fitness model, audit every layer where fitness block categories and exercise categories are defined — database enums, generated types, backend libs, frontend catalogs, and docs — to establish the safe implementation path.

---

## Database source of truth

### `block_type` enum (migration 006, generated in `database.types.ts`)

Used by: `template_blocks.type`, `session_blocks.type`

```
warm_up | technical | tactical | movement | fitness | competition | mental | cool_down | free
```

- `plyometrics` is NOT a value in this enum.
- `fitness` is the correct DB-safe mapping for plyometric fitness blocks.
- Adding `plyometrics` to this enum would require a migration (`ALTER TYPE block_type ADD VALUE 'plyometrics'`).

### `exercise_category` enum (migration 006, generated in `database.types.ts`)

Used by: `exercises.category`

```
technical | tactical | movement | fitness | competition | mental | warm_up | cool_down
```

- `plyometrics` is NOT a value in this enum.
- Exercises with plyometric content use `exercise_category = 'fitness'`.
- Adding `plyometrics` to this enum would require a migration.

### Conclusion: migration is NOT required to add Plyometrics

The backend was designed with a canonical `FitnessBlockType` taxonomy that is intentionally separate from the DB `block_type` enum. The mapping layer (`DB_BLOCK_TYPE_MAP` in `fitnessBlockTypes.ts`) converts rich frontend types down to the 9 valid DB enum values. This design means frontend block taxonomy can expand without migrations.

---

## Frontend source of truth: `src/lib/fitness/fitnessBlockTypes.ts`

**Plyometrics is ALREADY fully defined here.**

```ts
export type FitnessBlockType =
  | 'movement' | 'agility' | 'speed' | 'plyometrics'
  | 'strength' | 'coordination' | 'mobility' | 'recovery_cool_down'
```

Plyometrics definitions already present:

| Property | Value |
|---|---|
| `FitnessBlockType` value | `'plyometrics'` |
| DB mapping | `'fitness'` |
| Label | `'Plyometrics'` |
| Accent | `text-status-orange` |
| Border accent | `border-status-orange/20` |
| Default duration | `10 min` |
| Intent description | `'Jumps, bounds, explosive movement patterns'` |
| `inferFitnessBlockType` triggers | `'plyometric'`, `'jump'`, `'bound'`, `'explosive'` |

---

## Frontend source of truth: `src/lib/fitness/fitnessExerciseMatching.ts`

**Plyometrics matching already fully defined.**

- Match keywords: `plyometric`, `jump`, `bound`, `hop`, `box jump`, `depth jump`, `medicine ball`, `explosive`, `lateral bound`, `single leg jump`
- Category match: `['fitness']`
- Fallback exercises (display-only): `Box Jump`, `Lateral Bound`, `Explosive Med Ball Toss`

---

## Frontend source of truth: `src/lib/templates/fitnessExerciseRecommendations.ts`

Already references `plyometrics` with exercise recommendations.

---

## Frontend source of truth: `src/lib/templates/fitnessExerciseAutoPopulate.ts`

Already references `plyometrics` with auto-populate logic.

---

## Where plyometrics IS already shown to users

| File | Status |
|---|---|
| `src/app/director/fitness/templates/[templateId]/FitnessBuilderStepper.tsx` | Handles plyometrics blocks — tennis transfer description defined |
| `src/app/coach/sessions/[sessionId]/execute/ExecuteClient.tsx` | Renders plyometrics blocks with `text-yellow-400` styling |
| `src/app/director/templates/fitness/create/page.tsx` | Maps `'Plyometrics'` label to `'plyometrics'` FitnessBlockType |
| `src/app/director/templates/coach-preview/page.tsx` | Renders plyometrics with `text-status-red border-status-red/30 bg-status-red/8` |

---

## Where plyometrics is MISSING from the user interface

### `src/app/director/fitness/templates/new/NewFitnessTemplateForm.tsx`

This file contains its own `FITNESS_BLOCK_CATALOG` array (11 entries) that is separate from `src/lib/fitness/fitnessBlockTypes.ts`. The catalog is used by the new-template creation form at `/director/fitness/templates/new`.

**Current catalog entries:**
```
movement_prep, speed, agility, coordination, strength, mobility,
recovery, tennis_transfer, conditioning, balance, footwork
```

**Missing:** `plyometrics`

**Safe addition:** one catalog entry with `dbType: 'fitness'` — a valid DB enum value already in the `VALID_BLOCK_TYPES` set in `createFitnessTemplateWithBlocksAction.ts`.

---

## Current `template_blocks.type` values used by the catalog

From `createFitnessTemplateWithBlocksAction.ts`:

```ts
const VALID_BLOCK_TYPES = new Set<string>([
  'warm_up', 'technical', 'tactical', 'movement',
  'fitness', 'competition', 'mental', 'cool_down', 'free',
])

function safeDbBlockType(t: string): DbBlockType {
  return VALID_BLOCK_TYPES.has(t) ? (t as DbBlockType) : 'fitness'
}
```

Any `dbType` value not in the set falls back to `'fitness'`. Adding a plyometrics entry with `dbType: 'fitness'` is safe and guaranteed to persist correctly.

---

## Whether plyometrics already exists anywhere

- `src/lib/fitness/fitnessBlockTypes.ts` — YES, fully defined
- `src/lib/fitness/fitnessExerciseMatching.ts` — YES, matching and fallbacks defined
- `src/lib/templates/fitnessExerciseRecommendations.ts` — YES
- `src/lib/templates/fitnessExerciseAutoPopulate.ts` — YES
- `FitnessBuilderStepper.tsx` — YES
- `ExecuteClient.tsx` — YES
- `/director/templates/fitness/create/page.tsx` — YES
- `NewFitnessTemplateForm.tsx` `FITNESS_BLOCK_CATALOG` — **NO** (the gap)

---

## Whether adding Plyometrics requires migration

**No.** The `block_type` DB enum already includes `'fitness'` which is the correct mapping for plyometrics. A `plyometrics` DB enum value would add specificity but is not needed for the frontend catalog to work.

A future migration could add `plyometrics` as a first-class `block_type` value for richer analytics and filtering — but that is a Phase 4+ concern, not a prerequisite for the catalog addition.

---

## Risk level

**Low.**

- The only file to change is `NewFitnessTemplateForm.tsx`
- The `dbType` value is `'fitness'` — already valid in the DB enum
- If any unknown value leaked through, `safeDbBlockType()` silently coerces to `'fitness'` — no DB error possible
- No migrations, no schema changes, no new dependencies
- Plyometrics already has full backend support (matching, fallbacks, auto-populate)

---

## Safest implementation path

Add a single entry to `FITNESS_BLOCK_CATALOG` in `NewFitnessTemplateForm.tsx`:

```ts
{
  id: 'plyometrics',
  dbType: 'fitness',
  label: 'Plyometrics',
  intent: 'Jumps, bounds, lateral bounds, and elastic power development.',
  defaultMin: 10,
  colorClass: 'bg-status-orange/8 border-status-orange/25',
  badgeClass: 'bg-status-orange/15 text-status-orange border-status-orange/30',
},
```

Add to relevant `STANDARD_STRUCTURES`:
- `standard`: optionally after agility
- `high_intensity`: after speed or agility
- `assessment`: after agility or speed

Do NOT add to `low_load`, `recovery`, or `post_tournament` structures.

---

## Blocked/unblocked recommendation

**UNBLOCKED.** Sprint 387C (Add Plyometrics Fitness Block) is safe to execute immediately.

---

## Exact files to change if safe

**Sprint 387C:**
- `src/app/director/fitness/templates/new/NewFitnessTemplateForm.tsx`
  - Add `plyometrics` entry to `FITNESS_BLOCK_CATALOG`
  - Add `'plyometrics'` to `STANDARD_STRUCTURES.high_intensity` and `STANDARD_STRUCTURES.standard`
  - No other files need changes

**Optional future sprint (migration):**
- `supabase/migrations/XXX_add_plyometrics_block_type.sql`
  - `ALTER TYPE block_type ADD VALUE 'plyometrics';`
  - Regenerate `database.types.ts`
  - Update `DB_BLOCK_TYPE_MAP` in `fitnessBlockTypes.ts` to use `'plyometrics'` directly

---

## Taxonomy inconsistency note

The fitness system has two catalog definitions that have diverged:

**`src/lib/fitness/fitnessBlockTypes.ts`** (8 types):
`movement | agility | speed | plyometrics | strength | coordination | mobility | recovery_cool_down`

**`NewFitnessTemplateForm.tsx` `FITNESS_BLOCK_CATALOG`** (11 items):
`movement_prep | speed | agility | coordination | strength | mobility | recovery | tennis_transfer | conditioning | balance | footwork`

The form catalog has additional types (`tennis_transfer`, `conditioning`, `balance`, `footwork`) not in `fitnessBlockTypes.ts`. These are frontend-only labels — all map to `'fitness'` or `'movement'` DB type. Both catalogs are valid — they serve different UI contexts (template builder vs. exercise matching engine).

A future sprint should align these into a single canonical source, but that is a separate refactor with no urgent priority.
