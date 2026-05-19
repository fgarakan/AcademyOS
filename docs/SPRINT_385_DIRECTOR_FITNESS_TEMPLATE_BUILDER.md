# Sprint 385 — Director Fitness Template Builder V1

**Date:** 2026-05-19
**Branch:** main

Route state before sprint: `/director/fitness/templates/new` was a minimal 4-field form (name, type chips, description, duration). It called `createFitnessTemplateAction` and redirected to the detail page. No block builder, no DONNA card, no DNA connection, no draft-first language.

## Backend Save

Full backend save via `createFitnessTemplateWithBlocksAction`. Pattern mirrors Sprint 384's class template action. Tags: `['fitness_template:true', 'template_type:${type}', 'source:builder_v1', 'status:draft']`. `track: 'fitness'` preserved (required for fitness template identification). Blocks stored in `template_blocks` with notes JSON: `{ coach_cue, tennis_transfer_note }`.

## Fitness Block Catalog (11 blocks)

| Label | DB block_type |
|---|---|
| Movement Prep | movement |
| Speed | fitness |
| Agility | fitness |
| Coordination | fitness |
| Strength Basics | fitness |
| Mobility | movement |
| Recovery | cool_down |
| Tennis Transfer | fitness |
| Conditioning | fitness |
| Balance | fitness |
| Footwork | movement |

`FitnessBlockType` lib (8 types) used for DB type mapping. Sprint's 11 blocks cover the existing 8 plus Tennis Transfer, Conditioning, and Balance.

## Standard Structure Suggestions

Deterministic by template type (no AI call). E.g. Standard: Movement Prep · Agility · Speed · Strength Basics · Tennis Transfer · Recovery. Pre-Tournament: lighter load with more coordination and footwork.

## DNA Connection

Reads `settings.academy_dna.player_development.development_priorities` server-side. Development priority pills shown in DONNA card. Best-effort try/catch — static card rendered on failure.

## Files Changed

| File | Change |
|---|---|
| `src/app/director/fitness/templates/new/page.tsx` | Rewritten: async, DNA read, updated header |
| `src/app/director/fitness/templates/new/NewFitnessTemplateForm.tsx` | Full rewrite: DONNA card, template type chips, 11-block catalog, duration indicator, coach preview, draft notice |
| `src/app/director/fitness/createFitnessTemplateWithBlocksAction.ts` | Created: atomic template + blocks creation |

TypeScript clean.
