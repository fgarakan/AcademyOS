# DONNA Curriculum Impact Map

**Sprint:** 461 — Curriculum Ripple Architecture Audit V1
**Date:** 2026-05-16
**Purpose:** Maps how DONNA surfaces curriculum change impacts across academy modules. Defines what DONNA can answer, what she previews, and what she defers.

---

## DONNA's Role in Curriculum Ripple

DONNA does not apply curriculum changes. She:

1. **Identifies** when a curriculum change is being considered
2. **Estimates** what would be affected if the change were applied
3. **Surfaces** the preview to the director for review
4. **Routes** the director-approved change through the standard review queue
5. **Reports** on curriculum health and coverage in the weekly COO brief

DONNA always uses the phrase: *"If this change were applied..."* — never *"This change will..."*

---

## Capability Tiers

### Tier A — DONNA Can Surface Now (no schema changes)

These impacts can be computed from existing DB data.

| Curriculum Impact | DONNA Query | Output |
|---|---|---|
| **Players at a level** | `COUNT(player_curriculum_states) WHERE current_level_id = ?` | "12 players are currently at Orange 1" |
| **Players with unmet gates** | `player_gate_status WHERE status NOT IN ('confirmed', 'evidence_threshold_met')` | "7 players have at least one open gate" |
| **Templates linked to level** | `templates WHERE curriculum_level_id = ?` | "3 session templates link to this level" |
| **Coach observations referencing level** | `coach_observations` with level context | "14 observations from this level in the last 30 days" |
| **Parent drafts linked to level** | `parent_updates` with level context | "2 parent drafts mention this level" |
| **Time-in-level median** | `NOW() - player_curriculum_states.enrolled_at` grouped by level | "Median time in Orange 1 is 47 days" |
| **Advancement eligibility** | `player_curriculum_states.advancement_eligible` | "4 of 12 players are currently advancement-eligible" |

---

### Tier B — DONNA Can Surface with Data Disclaimers

These require existing schema but depend on data density.

| Curriculum Impact | Data Dependency | Caveat |
|---|---|---|
| **Curriculum coverage by group** | `curriculum_class_template_blocks` (migration 062 pending) | "Based on X sessions where curriculum context was recorded" |
| **Drill usage frequency** | `session_block_exercises` + RLS migration 056 pending | "Based on X sessions with exercise data" |
| **Gate evidence completion rate** | `player_gate_status` + migrations 041–060 | "Gate evidence tracking is partially applied — results may be incomplete" |
| **Parent language coverage** | `parent_updates` drafts (not sent_at) | "Based on drafts created, not communications sent" |
| **Player mission completion** | No current tracking table | "Mission engagement data is not yet tracked" |

---

### Tier C — DONNA Defers and Explains

DONNA cannot compute these honestly without schema changes. She states what is missing.

| Curriculum Impact | Blocker | DONNA Response |
|---|---|---|
| **Curriculum effectiveness score** | `curriculum_levels.expected_duration_days` not in schema | "I can't score curriculum effectiveness yet — expected duration per level hasn't been defined." |
| **Session plan vs curriculum alignment** | `session_blocks.actual_status` not persisted (Sprint 48 gap) | "Session actuals aren't tracked in the database yet — I can only compare planned, not executed." |
| **Coach brief adoption** | No coach brief read/acknowledgment tracking | "I can generate coach briefs but can't confirm whether coaches have read them." |
| **Parent language reach** | No send infrastructure; `sent_at` always null | "Parent drafts exist but no communications have been sent yet — I can't measure reach." |

---

## DONNA Intent → Curriculum Impact Triggers

When a director asks DONNA about curriculum, these intents trigger impact surfacing:

| Director Question | Intent Triggered | DONNA Response Type |
|---|---|---|
| "What level has the most players stuck?" | `curriculum_bottleneck` | Level with most `enrolled_at > 90d` and `advancement_eligible = false` |
| "What would happen if I removed the consistency gate?" | `curriculum_ripple_preview` | Count of players whose gate status would change |
| "Which players would be affected by a change to Orange 1?" | `curriculum_player_impact` | List of players at that level with gate/readiness summary |
| "Which templates use Orange 1?" | `curriculum_template_impact` | List of templates linked to `curriculum_level_id` |
| "What does the coach need to know if we change this drill?" | `curriculum_coach_brief_impact` | Updated coach brief focus lines for affected sessions |
| "What would I tell parents about this change?" | `curriculum_parent_language` | Parent-safe draft preview (not sent) |
| "What are the risks of adding a new gate?" | `curriculum_change_risk` | Count of players who would immediately fail the new gate |
| "Why is curriculum coverage low?" | `curriculum_coverage_analysis` | List of undercovered requirements + groups with gaps |

---

## DONNA Curriculum Ripple Response Structure

When surfacing a curriculum change impact, DONNA follows this template:

```
What would change:
  [object type] — [count or name]

Players affected:
  [n] players at [level] would be impacted

Templates affected:
  [n] session templates link to this level/drill

Coach brief impact:
  [1–2 lines on what coaches would need to adjust]

Parent/player language:
  [Safe summary of language changes — "not sent"]

Readiness impact:
  [n] players currently advancement-eligible at this level
  [n] players whose advancement eligibility would change

Risk note:
  [One line on the primary risk — e.g., "Removing this gate would make 4 players immediately advancement-eligible."]

This is a preview. Nothing changes until you approve.
```

---

## DONNA Safety Rules for Curriculum Responses

1. **Never apply a curriculum change from a DONNA response.** All curriculum DONNA outputs are previews routed to the review queue as `proposed_actions`.
2. **Never present a curriculum impact as certain.** Always use "would affect" / "estimated" / "preview only."
3. **Never surface player-identifiable data to coaches without director approval.**
4. **Never generate parent/player language for publication.** Always label as "draft — not sent."
5. **Never move a player level as part of curriculum impact preview.** Level moves require explicit `CurriculumLevelPickerCard` director action.
6. **Always show the count alongside the percentage.** (e.g., "8 of 12 players" not just "67%")
7. **Always label the data tier.** If a KPI is Tier B or C, DONNA includes a caveat.

---

## DONNA Weekly COO Report — Curriculum Section

The weekly COO report includes a curriculum section with these signals:

| Signal | Source | Status |
|---|---|---|
| Players at each level | `player_curriculum_states` GROUP BY level | Tier A |
| Advancement-eligible by level | `player_curriculum_states.advancement_eligible` | Tier A |
| Open gates by level | `player_gate_status WHERE status = 'observing'` | Tier B |
| Median time in level | `enrolled_at` duration | Tier A |
| Templates without curriculum level | `templates WHERE curriculum_level_id IS NULL` | Tier A |
| Groups without curriculum assignment | `groups WHERE curriculum_level_id IS NULL` | Tier A |
| Curriculum coverage estimate | Requires migration 062 | Tier C — deferred |

---

## Relationship to Sprint Block

| Sprint | Curriculum Ripple Capability Added |
|---|---|
| 461 (this) | Architecture definition + DONNA impact map |
| 462 | Scope model (today / group / level / academy / global) |
| 463 | Impact preview shell (UI) |
| 464 | Override draft shell (review queue routing) |
| 465 | Readiness recalculation preview |
| 466 | Parent/player language preview |
| 467 | Template and coach brief impact preview |
| 468 | Regression and audit |

---

## Status

This document is the reference for DONNA's curriculum intelligence behavior in Sprints 461–468.
No DB changes. No code changes. Preview-only architecture.
