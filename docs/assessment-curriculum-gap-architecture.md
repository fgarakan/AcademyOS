# Assessment → Curriculum Requirement Link Architecture

**Sprint 24 — Architecture & Gap Audit**
**Date:** 2026-05-05
**Status:** Audit complete — see gap categories and recommended migration path below.

---

## Purpose

Map the connection between player assessments and curriculum requirements/gates.
Define where gaps exist and what schema work is needed to close them.

---

## Current Schema Map

### Assessment tables

| Table / View | Key fields | Notes |
|---|---|---|
| `assessments` | player_id, academy_id, type, technical_score, tactical_score, movement_score, competition_score, behavioral_score, overall_score, promotion_ready, is_baseline | Scores are aggregate domain scores (0–100 or custom). No per-requirement linkage. |
| `assessments.scores_detail` | JSON blob (unstructured) | Can hold arbitrary sub-scores per assessment. Schema not enforced. |
| `assessments.type` | assessment_type enum (intake, quarterly, reassessment, ad_hoc) | Used to filter baselines from progress assessments. |

### Curriculum requirement tables

| Table / View | Key fields | Notes |
|---|---|---|
| `curriculum_levels` | id, display_name, stage, level_number | The advancement ladder. |
| `v_curriculum_level_requirements` | level_id, min_assessment_score, min_domains_mastered, requires_final_assessment | Aggregate gate thresholds. Min score is overall, not domain-specific. |
| `v_player_requirement_progress_detail` | player_id, requirement_id, requirement_type, requirement_domain_key, status, progress_value | Per-requirement progress view (not a base table). |

### Evidence linkage tables

| Table | Key fields | Notes |
|---|---|---|
| `requirement_evidence_links` | requirement_id, player_requirement_progress_id, evidence_type, evidence_id, evidence_summary, confidence, weight, is_parent_safe | Links evidence items to requirement progress rows. evidence_type can be 'coach_observation', 'assessment', or other strings. |

---

## Gap Analysis — What Is Missing

### Gap 1: Assessment scores are not mapped to curriculum domains

**Current state:**
- `assessments.technical_score`, `tactical_score`, `movement_score` are aggregate numbers.
- `v_curriculum_level_requirements.min_assessment_score` is a single threshold for the overall score.
- There is no table that says "technical_score > 70 satisfies the forehand_technique requirement."

**Impact:**
- Cannot automatically flag whether an assessment score confirms or contradicts a curriculum requirement.
- Director must manually compare scores against requirements.
- Gap confidence stays at "possible" — cannot elevate to "confirmed" from assessment data alone.

**Recommended fix (future migration):**
```sql
CREATE TABLE assessment_requirement_criteria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_requirement_id uuid REFERENCES curriculum_requirements(id),
  assessment_domain text,  -- 'technical', 'tactical', 'movement', 'competition', 'behavioral', 'overall'
  min_score numeric,        -- threshold that satisfies this requirement
  comparison_operator text DEFAULT '>='  -- 'gte', 'lte', 'eq'
);
```

### Gap 2: No per-requirement assessment gate

**Current state:**
- The system knows "player needs a final assessment before advancement."
- The system does NOT know "forehand_depth requirement needs a technical assessment score > 65."

**Impact:**
- Cannot programmatically link an assessment result to a specific requirement gate.
- Evidence links must be created manually by directors.

### Gap 3: assessment scores_detail is unstructured JSON

**Current state:**
- `scores_detail` is a JSON blob — no enforced schema.
- Sub-scores (e.g., backhand, serve, footwork) may exist but are inconsistent across assessments.

**Impact:**
- Cannot reliably extract sub-domain scores for requirement matching.
- Any linkage based on scores_detail would be fragile.

### Gap 4: evidence_type 'assessment' link is not wired in UI

**Current state:**
- `requirement_evidence_links.evidence_type` supports 'assessment' as a value.
- The UI currently only creates links for 'coach_observation' type evidence.
- Assessment IDs are never written as evidence_id for requirement links in the current flow.

**Impact:**
- Assessment data exists but cannot feed requirement confirmation workflow.

---

## Gap Categories

These are the five gap categories the system should track and their current data foundation:

| Gap Category | Definition | Current detection | Data quality |
|---|---|---|---|
| **Exposure gap** | Player missed planned curriculum sessions | `session_attendance` + `session_blocks` | Derived (Sprint 21/22) — possible only |
| **Knowledge gap** | Player has not encountered curriculum concepts in coached language or drills | `detectKnowledgeGaps()` from coach_language/drill counts | Inferred — possible/needs_review |
| **Execution/Skill gap** | Player struggles with a specific curriculum skill per coach observation | `coach_observations` type + tags | Heuristic — possible/needs_review |
| **Fitness gap** | Player lacks fitness session exposure relative to curriculum stage | `player_load_aggregation` | Aggregate — possible |
| **Competition behavior gap** | Player misses competition behavior requirements (behavioral assessment below threshold) | `assessments.behavioral_score` vs level requirement | Possible — no automated link |

---

## Recommended Relationship Model

```
assessments
  └── assessment_requirement_criteria (future)
       └── curriculum_requirements
            └── player_requirement_progress
                 └── requirement_evidence_links
                      └── assessments (evidence_type = 'assessment')
```

The key missing piece is `assessment_requirement_criteria` — a mapping table that says which assessment domain score threshold satisfies which curriculum requirement.

---

## Approval Model

Gap confirmation should require explicit director action:
1. System flags: "Assessment score in domain X may satisfy/block requirement Y" (proposed_action)
2. Director reviews and confirms/rejects in review queue
3. If confirmed: creates `requirement_evidence_link` with evidence_type = 'assessment'
4. Status of `player_requirement_progress` updates via existing confirmation flow

This follows the existing voice → proposed_actions → director review → execute pattern.

---

## Player Gap Summary Connection

The `PlayerGapSummaryPanel` (Sprint 23) currently shows gap confidence as:
- `possible` — inferred from attendance/load data
- `needs_review` — elevated from severity or frequency
- `confirmed` — reserved for when assessment evidence is explicitly linked

Once `assessment_requirement_criteria` is built and assessment evidence is wired into `requirement_evidence_links`, gap confidence for specific requirements can be elevated to `confirmed` automatically after director review.

---

## Gap Class Connection

Knowledge gaps detected without a clear curriculum source (low coach language count, low drill count) should feed Gap Class:
- Gap Class = targeted learning module triggered by a knowledge gap
- Gap Class should reference specific curriculum requirements
- Assessment before/after Gap Class provides evidence for requirement progress

See `docs/gap-class-knowledge-check-architecture.md` (Sprint 25).

---

## Future Migration Requirements

| Migration | Purpose | Risk |
|---|---|---|
| `assessment_requirement_criteria` table | Map assessment domain scores to curriculum requirements | Low — additive only |
| Add `evidence_type = 'assessment'` UI to evidence link flow | Allow directors to link assessment results as evidence | Low — UI extension |
| Per-domain min score on `v_curriculum_level_requirements` | Replace single overall threshold with per-domain thresholds | Medium — view change |
| Enforce schema on `assessments.scores_detail` | Make sub-domain scores reliable | Medium — requires data migration |

---

## V1 Status

- Assessment data exists and is readable.
- Curriculum requirements and progression gates are built.
- Requirement evidence link infrastructure exists.
- The direct bridge between a score and a requirement is **not yet built**.
- V1 gap detection relies on heuristics only — no score-to-requirement linkage.
- Sprint 24 conclusion: assessment-curriculum gap architecture is documented; implementation requires a future migration sprint with explicit approval.
