# Knowledge Gap Detection

**Sprint:** 233
**Last updated:** 2026-05-03
**Status:** V1 — heuristic detection from curriculum and gate data

---

## What is a knowledge gap?

A knowledge gap is a detectable mismatch between what a player needs to understand
at their current curriculum level and the coaching guidance, drill coverage, or
conceptual exposure currently available to support that understanding.

Knowledge gaps are distinct from training gaps:
- **Training gaps** = insufficient or imbalanced practice time, attendance, load problems
- **Knowledge gaps** = missing curriculum cues, conceptual blind spots, gate domain clustering,
  no drills to practice, no learning module alignment

Both gap types feed into `IndividualDevelopmentPlan.knowledge_gaps` and are consumed by
`buildIndividualDevelopmentPlan()`.

---

## Helper location

```
src/lib/gaps/knowledgeGapDetection.ts
```

Export: `detectKnowledgeGaps(input: KnowledgeGapInput): IdpKnowledgeGap[]`

Pure helper — no DB calls, no AI, no writes, no side effects.

---

## Input sources

The caller is responsible for fetching these from the database and passing them in.

| Input field | Source | Notes |
|---|---|---|
| `current_level` | `curriculum_levels.display_name` | Player's current level name |
| `current_stage` | `curriculum_levels.stage` | e.g. 'orange_development', 'performance' |
| `open_gates` | `curriculum_gates` (active, from_level_id = current) | Array of `{ domain, criterion }` |
| `has_coach_language` | `curriculum_coach_language` row exists for level | Boolean |
| `coach_language_domains` | `curriculum_coach_language.domain` | Domains with coaching cues |
| `available_drill_count` | Count of `curriculum_drills` where `level_min_id = current` | Integer |
| `available_module_domains` | Domains for which a learning module can be generated | string[] |

If `current_level` is null (no curriculum assignment), returns a single `no_curriculum_level` gap.
If all context is absent, returns `insufficient_data`.

---

## Gap types

| gap_type | Domain | Description |
|---|---|---|
| `no_curriculum_level` | null | Player has no curriculum level assigned — baseline knowledge unknown |
| `insufficient_data` | null | Level assigned but no gates, coach language, or drills — cannot assess |
| `no_coach_language` | null | No curriculum coach language exists for this level |
| `no_drills_available` | null | Zero curriculum drills mapped to this level |
| `domain_gap_cluster` | (clustered domain) | ≥ 70% of open gates concentrated in one domain |
| `many_open_gates` | null | 5+ open gates — broad knowledge coverage gap |
| `no_module_domain_match` | null | No learning module domain aligns with current gate domains |

---

## Severity thresholds

| Severity | Trigger |
|---|---|
| `high` | `no_curriculum_level` |
| `medium` | `no_coach_language` · `no_drills_available` · `domain_gap_cluster` |
| `low` | `many_open_gates` · `no_module_domain_match` |
| `insufficient_data` | No gates + no coach language + no drills |

Gaps are sorted: `high` → `medium` → `low` → `insufficient_data`.

---

## Domain → learning module mapping

Gate domains are mapped to `LearningModuleDomain` for `suggested_module_domain`.

| Gate domain (raw) | Mapped LearningModuleDomain |
|---|---|
| Technical / Technique | Technical |
| Tactical / Tactics | Tactical |
| Movement / Footwork | Movement |
| Competition / Match | Competition |
| Mentality / Mental | Mentality |
| Fitness / Conditioning | Fitness |
| Recovery / Rest | Recovery |
| Lifestyle | Lifestyle |
| (anything else) | Technical (default) |

Mapping is case-insensitive partial match.

---

## Role visibility

| Role | What they see |
|---|---|
| Director | All knowledge gaps + `role_note` + `suggested_module_domain` |
| Coach | All knowledge gaps + `role_note` + `suggested_module_domain` |
| Player | No knowledge gap list — gaps inform `what_to_understand` indirectly |
| Parent | No knowledge gap list — parent view is gap-free |

Knowledge gaps are NEVER exposed directly to player or parent views.

---

## Safety rules

1. Never expose `role_note` content to player or parent — it is internal operational language.
2. Never describe a player as "confused", "slow", "unable to understand" — use neutral terms.
3. `insufficient_data` is a valid result — do not fabricate gaps when data is absent.
4. `suggested_module_domain` is informational only — no module is automatically assigned.
5. No product/tool names in any gap text.
6. Gap descriptions reference curriculum/domain concepts, never the player's character.

---

## Next steps

- Sprint 234: Role-specific gap guidance (`src/lib/gaps/roleSpecificGapGuidance.ts`)
- Sprint 238: Wire gap detection into player profile IDP panel + demo
