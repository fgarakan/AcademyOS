# Fitness OS Block Taxonomy

**Sprint:** 138
**Date:** 2026-05-01

---

## Overview

Fitness OS uses a separate block taxonomy from class/session templates.
Class templates use DB `block_type` enum values (warm_up, technical, tactical, etc.).
Fitness blocks use fitness-specific sub-types defined in `src/lib/fitness/fitnessBlockTypes.ts`.

---

## Fitness Block Types

| Type | Display Label | DB `block_type` value | Default Duration | Intent |
|---|---|---|---|---|
| `movement` | Movement | `movement` | 10 min | Dynamic warm-up, movement prep, footwork patterns |
| `agility` | Agility | `fitness` | 15 min | Ladder, cone reaction, change of direction |
| `speed` | Speed | `fitness` | 12 min | Acceleration, sprint mechanics, short court sprints |
| `plyometrics` | Plyometrics | `fitness` | 10 min | Jumps, bounds, explosive movements |
| `strength` | Strength | `fitness` | 15 min | Bodyweight strength, core, lower-body control |
| `coordination` | Coordination | `fitness` | 10 min | Rhythm, balance, reaction, hand-eye |
| `mobility` | Mobility | `movement` | 8 min | Hip, shoulder, ankle mobility |
| `recovery_cool_down` | Recovery / Cool Down | `cool_down` | 10 min | Breathing, stretching, cool-down |

---

## How Fitness Block Type Is Stored

Because the `template_blocks.type` DB column uses the `block_type` enum (which does not include agility, speed, plyometrics, etc.), the fitness-specific block type is encoded in the `template_blocks.name` field.

- **`template_blocks.name`**: The fitness block display label (e.g. "Agility", "Speed", "Plyometrics")
- **`template_blocks.type`**: The closest DB enum value (see table above)

The `getFitnessBlockLabel()` and `inferFitnessBlockType()` functions handle the round-trip between the stored name and the typed `FitnessBlockType`.

---

## Default Template Block Order

For a new Standard fitness template, blocks are added in this order:

1. Movement
2. Agility
3. Speed
4. Strength
5. Coordination
6. Mobility
7. Recovery / Cool Down

This order can be overridden by the director when building a template.

---

## Fitness Template Types

Templates carry a `template_type` tag in `templates.tags`:

| Tag value | Display |
|---|---|
| `template_type:standard` | Standard |
| `template_type:pre_tournament` | Pre-Tournament |
| `template_type:post_tournament` | Post-Tournament |
| `template_type:high_intensity` | High-Intensity |
| `template_type:low_load` | Low-Load |
| `template_type:assessment` | Assessment |
| `template_type:recovery` | Recovery |

---

## How to Identify Fitness Templates

A fitness template has both:
1. `templates.track = 'fitness'`
2. `templates.tags ⊃ 'fitness_template:true'`

Class/session templates do NOT have the `fitness_template:true` tag.

---

## Important: Do Not Confuse With Curriculum Block Types

Curriculum blocks (for session planning) use the DB `block_type` enum directly.
Fitness blocks use this separate taxonomy.
Never modify `src/lib/actions/curriculum.ts` or the curriculum block logic to accommodate fitness block types.
