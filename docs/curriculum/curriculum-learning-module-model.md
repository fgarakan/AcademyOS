# Curriculum Learning Module Model

**Sprint:** 219
**Date:** 2026-05-03
**Status:** V1 — model defined. No DB persistence yet. Preview via pure helper.

---

## Purpose

The seeded curriculum (levels, gates, drills, coach language) contains everything needed to build structured **learning modules** for players, parents, and coaches. This doc defines the module structure and how it is derived deterministically from existing data.

Learning modules are **not stored in the database yet**. They are generated on-demand from:
- `curriculum_levels`
- `curriculum_gates`
- `curriculum_drills`
- `curriculum_coach_language`

No AI, no external calls, no writes.

---

## Module structure

Each module covers one **curriculum level × domain** combination.

| Field | Source | Notes |
|---|---|---|
| `module_id` | `{level_id}_{domain}` | Deterministic composite key |
| `level_id` | `curriculum_levels.id` | FK |
| `level_name` | `curriculum_levels.display_name` | e.g. "Orange 2" |
| `level_stage` | `curriculum_levels.stage` | e.g. "orange_development" |
| `domain` | `curriculum_coach_language.domain` | One of 8 domains |
| `title` | `{level_name} — {domain}: {current_focus}` | Auto-derived |
| `player_goal` | `curriculum_coach_language.current_focus` | Player-facing |
| `why_it_matters` | Derived from `doing_well` | Player-facing, positive framing |
| `key_idea` | `curriculum_coach_language.working_on` | Player-facing |
| `watch_for` | First gate `criterion` + `threshold` for this level+domain | Player-facing |
| `try_this` | First drill `name` + `objective` for this level+domain | Player-facing |
| `mini_challenge` | `curriculum_coach_language.next_step` | Player-facing, mission-based |
| `reflection_question` | Domain-specific template (8 templates) | Player-facing |
| `parent_support_tip` | Domain-specific template (8 templates) | Parent-safe tone |
| `related_gate_ids` | All gates for this level+domain | Reference list |
| `related_drill_ids` | All drills for this level+domain | Reference list |
| `source_labels` | `['curriculum coach language', ...]` | Provenance |
| `safety_note` | null (no personal data) | Safety metadata |

---

## Domains

Modules are generated for each domain where `curriculum_coach_language` has an entry:

| Domain | Player focus |
|---|---|
| Technical | Stroke mechanics, grip, swing patterns |
| Tactical | Decision-making, court positioning, patterns |
| Movement | Footwork, balance, recovery, split step |
| Competition | Match play, pressure situations, resilience |
| Mentality | Focus, confidence, growth mindset |
| Fitness | Physical conditioning, endurance, strength |
| Recovery | Rest, hydration, injury prevention |
| Lifestyle | Sleep, nutrition, routine |

---

## Language rules

### Player-facing
- Mission-based: "Your mission is to..." not "You must improve..."
- Encouraging: no deficit language, no comparisons to teammates
- Action-oriented: "Try this...", "Notice when...", "This week..."
- Age-appropriate simplicity for junior players

### Parent-facing
- No raw assessment scores or rankings
- No internal coaching notes
- No deficit language ("struggling", "weak", "behind")
- Focus: what to ask, how to support, what to say after practice
- Always end with encouragement or forward-looking framing

---

## Helper location

```
src/lib/curriculum/learningModules.ts
```

Exports:
- `type LearningModuleDomain` — 8 domain values
- `type CurriculumLearningModule` — full module shape
- `type LearningModulePreviewInput` — input shape for batch generation
- `type LearningModuleSingleInput` — input shape for single module
- `buildLearningModulePreviews(input)` — generates all modules from curriculum data
- `buildModuleForLevelDomain(input)` — builds one module for a specific level+domain
- `getLearningModuleSafetyNote(role)` — returns role-appropriate safety note text

---

## Generation rules

- A module is only generated if `curriculum_coach_language` has an entry for that level+domain.
- If no gate exists for a level+domain: `watch_for` falls back to a generic coaching prompt.
- If no drill exists for a level+domain: `try_this` falls back to a generic prompt.
- All fallbacks use safe, encouraging language — never "no data found".

---

## What this model is NOT

- Not AI-personalized content
- Not stored in the database (yet)
- Not visible to players or parents yet (director preview only in Sprint 220)
- Not a replacement for direct coach communication

---

## Future work

- Sprint 220: Director-facing UI preview at `/director/curriculum/learning`
- Sprint 226: Player Q&A integration — `mini_challenge` and `reflection_question` surface in player mission answers
- Future: Persist modules to DB with versioning and academy overrides
- Future: Role-gated player/parent access when portals are built
