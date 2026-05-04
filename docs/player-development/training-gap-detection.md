# Training Gap Detection

**Sprint:** 232
**Last updated:** 2026-05-03
**Status:** V1 — heuristic detection from load and attendance data

---

## What is a training gap?

A training gap is a detectable mismatch between a player's recent training exposure
and what their current curriculum level requires for meaningful progress.

Training gaps are distinct from knowledge gaps:
- **Training gaps** = insufficient or imbalanced practice time, attendance issues, load problems
- **Knowledge gaps** = insufficient understanding of concepts, curriculum, tactics, or rules

Both gap types feed into `IndividualDevelopmentPlan.training_gaps` and are consumed by
`buildIndividualDevelopmentPlan()`.

---

## Helper location

```
src/lib/gaps/trainingGapDetection.ts
```

Export: `detectTrainingGaps(input: TrainingGapInput): IdpTrainingGap[]`

Pure helper — no DB calls, no AI, no writes, no side effects.

---

## Input sources

The caller is responsible for fetching these from the database and passing them in.

| Input field | Source table | Notes |
|---|---|---|
| `sessions_7d` | `player_load_aggregation.sessions_7d` | Total sessions in last 7 days |
| `sessions_28d` | `player_load_aggregation.sessions_28d` | Total sessions in last 28 days |
| `duration_28d_min` | `player_load_aggregation.duration_28d_min` | Total training minutes in 28 days |
| `skill_sessions_28d` | `player_load_aggregation.skill_sessions_28d` | Skill-type sessions in 28 days |
| `fitness_sessions_28d` | `player_load_aggregation.fitness_sessions_28d` | Fitness-type sessions in 28 days |
| `competition_sessions_28d` | `player_load_aggregation.competition_sessions_28d` | Competition sessions in 28 days |
| `overload_flag` | `player_load_aggregation.overload_flag` | True if load exceeds safe threshold |
| `fatigue_risk_score` | `player_load_aggregation.fatigue_risk_score` | 0.0–1.0 fatigue probability |
| `fatigue_risk_label` | `player_load_aggregation.fatigue_risk_label` | Human-readable risk label |
| `load_trend_7d` | `player_load_aggregation.load_trend_7d` | 'increasing' / 'stable' / 'declining' |
| `absences_7d` | `player_load_aggregation.absences_7d` | Absence count in 7 days |
| `current_level` | `curriculum_levels.display_name` | Player's current curriculum level |
| `current_stage` | `curriculum_levels.stage` | e.g. 'orange_development', 'performance' |
| `open_gate_count` | Count of `curriculum_gates` with `is_active = true` | Used in staleness check |

If all load fields are null (no `player_load_aggregation` row exists), returns a single
`insufficient_data` gap — never throws or crashes.

---

## Gap types

| gap_type | Domain | Description |
|---|---|---|
| `insufficient_data` | null | No load data available — cannot assess gaps |
| `overload_risk` | Fitness | Load is flagged or fatigue score is elevated |
| `low_session_frequency` | null | Sessions_7d is 0 or 1 |
| `high_absence_rate` | null | Absences_7d >= 2 |
| `domain_imbalance` | Fitness or Competition | Zero sessions of a required type in 28 days |
| `undertraining` | null | Total training duration < 120 min in 28 days |
| `load_declining` | null | load_trend_7d = 'declining' with no other gaps |
| `gate_evidence_exposure` | null | Many open gates + low session count |

---

## Severity thresholds

| Severity | Trigger |
|---|---|
| `high` | `overload_flag = true` · `sessions_7d = 0` · `absences_7d >= 3` |
| `medium` | `fatigue_risk_score >= 0.6` · `sessions_7d = 1` · `absences_7d = 2` · no fitness in 28d at performance stage · `duration_28d_min < 120` · `gate_evidence_exposure` |
| `low` | No competition sessions in 28d · domain imbalance at non-performance stage · `load_declining` |
| `insufficient_data` | All numeric load fields are null |

Gaps are sorted: `high` → `medium` → `low` → `insufficient_data`.

---

## Role visibility

| Role | What they see |
|---|---|
| Director | All gaps + `role_note` (operational, specific) |
| Coach | All gaps + `role_note` |
| Player | No training gap list — gaps inform `coach_watch_fors` indirectly |
| Parent | No training gap list — parent view is gap-free |

Training gaps are NEVER exposed directly to player or parent views.
They surface only in director and coach views via the IDP role view builder.

---

## Safety rules

1. Never expose `role_note` content to player or parent — it is internal operational language.
2. Never describe a player as "lazy", "unmotivated", "behind" — use neutral operational terms.
3. `insufficient_data` is a valid result — do not fabricate gaps when data is absent.
4. All gap descriptions must be factual and observation-based, not evaluative.
5. No product/tool names in any gap text (no Swinget, The Angle, etc.).

---

## Next steps

- Sprint 233: Knowledge gap detection (`src/lib/gaps/knowledgeGapDetection.ts`)
- Sprint 234: Role-specific gap guidance (`src/lib/gaps/roleSpecificGapGuidance.ts`)
- Sprint 238: Wire gap detection into player profile IDP panel + demo
