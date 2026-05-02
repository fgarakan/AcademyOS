# Fitness Exercise Matching Engine

**Sprint:** 159  
**Date:** 2026-05-02  
**File:** `src/lib/fitness/fitnessExerciseMatching.ts`

---

## Overview

The fitness exercise matching engine deterministically selects appropriate exercises from the academy's exercise library for each fitness block type. It does not use AI, does not insert records automatically, and does not modify the exercise library.

---

## How It Works

### Scoring Algorithm

Each exercise in the library is scored against a target fitness block type using two signals:

1. **Category match** — Exercise `category` field (DB enum: `technical | tactical | movement | fitness | competition | mental | warm_up | cool_down`) compared against a preferred category list per block type. Category match adds +2 to score.

2. **Keyword match** — Exercise `name`, `subcategory`, and `tags` fields are compared against a keyword set for the block type. Each keyword match adds +3 (name), +2 (subcategory), or +1 (tags).

Exercises with score = 0 are excluded. Remaining exercises are sorted by score descending, then alphabetically by name for ties. The top N (default: 3) are returned.

This is deterministic — given the same exercise library and block type, the result is always the same.

---

## Block → Keyword Mappings

| Block Type | Primary Categories | Keywords (partial list) |
|---|---|---|
| Movement | movement, warm_up | dynamic, warm, footwork, lateral, shuffle, high knee, carioca |
| Agility | movement, fitness | agility, ladder, cone, change of direction, react, t-drill |
| Speed | fitness, movement | speed, sprint, acceleration, burst, fly, court sprint |
| Plyometrics | fitness | plyometric, jump, bound, hop, box jump, medicine ball, explosive |
| Strength | fitness | strength, bodyweight, core, plank, push, squat, lunge, glute |
| Coordination | fitness, movement | coordination, rhythm, balance, reaction ball, hand-eye, juggle |
| Mobility | movement, fitness | mobility, hip flexor, shoulder, thoracic, ankle, hamstring |
| Recovery / Cool Down | cool_down, fitness | cool, stretch, static, breathing, recovery, foam, roll |

---

## Fallback Exercises

If no exercises in the library match a block type (score = 0), `getFallbackFitnessExercises(blockType)` returns display-only placeholder names. These are:

- Marked `isFallback: true`
- **Never inserted into the DB automatically**
- Shown as display placeholders to indicate what kind of exercises belong in the block
- The action layer (`addFitnessBlockAction`) only inserts real library exercises. If no matches exist, the block is created empty.

---

## Exported Functions

| Function | Description |
|---|---|
| `getDefaultExercisesForFitnessBlock(blockType, exercises, count)` | Returns up to `count` best-matching real exercises. |
| `matchExerciseToFitnessBlock(exercise, blockType)` | Returns true if exercise has score > 0 for block type. |
| `getFallbackFitnessExercises(blockType)` | Returns display-only placeholder exercises (never inserted to DB). |
| `getExercisesForFitnessBlock(blockType, exercises, count)` | Real matches first; pads with fallbacks if real < count. |
| `normalizeFitnessExerciseCategory(value)` | Normalizes free-text or legacy category strings to DB enum values. |

---

## Category Normalization

`normalizeFitnessExerciseCategory(value)` maps common free-text or legacy variations to the standard DB `exercise_category` enum:

| Input | Output |
|---|---|
| "warm up", "warm-up" | "warm_up" |
| "cool down", "cool-down", "cooldown" | "cool_down" |
| "physical", "conditioning" | "fitness" |
| "technique" | "technical" |
| "tactics" | "tactical" |
| "psychological" | "mental" |
| "competitive" | "competition" |

Used when importing or processing exercises from external sources before inserting into the DB.

---

## Guardrails

- Engine is pure TypeScript — no DB access, no side effects.
- Fallback exercises are display-only placeholders.
- No random selection — results are deterministic.
- No AI interpretation.
- Exercise library is never mutated by matching or swapping.

---

## Future Use

- **Voice command integration:** When a coach says "Add a Speed block," the engine pre-selects exercises for director review before any DB write.
- **Readiness/load adjustment:** When player readiness flags are integrated, the engine can downrank high-intensity exercises for recovery days.
- **Fitness gap detection:** Exercise gap analysis (`src/lib/fitness/gapLogic.ts`) will use the same scoring logic to identify under-represented block types in a player's recent training history.
