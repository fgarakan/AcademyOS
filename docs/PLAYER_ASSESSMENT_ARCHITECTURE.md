# Player Assessment Architecture

**Sprint:** 574 — New Player Onboarding Assessment Architecture V1
**Date:** 2026-05-21

---

## Overview

The assessment and placement system provides a structured framework for evaluating
new and existing players across four domains. All outputs are **draft recommendations**
requiring director review and approval before any placement becomes official.

No DB writes are made from assessment UI components. Official placement writes
only occur via `finalize_player_placement()` after director approval in the
full placement workflow.

---

## Files

| File | Purpose |
|---|---|
| `src/lib/assessments/index.ts` | Core types, event model, `computeWeightedScore`, `makeEmptyDraft` |
| `src/lib/assessments/skillRubric.ts` | Skill & Technique rubric — 5 bands, rubric items, scoring |
| `src/lib/assessments/competitionRubric.ts` | Competition Readiness rubric — 5 bands |
| `src/lib/assessments/fitnessRubric.ts` | Physical Capability rubric — non-medical language |
| `src/lib/assessments/mentalPerformanceRubric.ts` | Mental Performance rubric — observable markers |
| `src/lib/assessments/voiceStructuring.ts` | DONNA voice-to-assessment draft structuring (no AI API) |
| `src/lib/assessments/placementRecommendation.ts` | Weighted score → stage recommendation engine |
| `src/lib/assessments/reviewModel.ts` | Director review/approval types and helpers |
| `src/lib/assessments/cadence.ts` | Assessment cadence rules and reminder model |
| `src/app/director/curriculum/_components/NewPlayerAssessmentPanel.tsx` | Assessment entry UI (director-only) |
| `src/app/director/curriculum/_components/AssessmentReviewPanel.tsx` | Review/approval UI shell (director-only) |

---

## Assessment domains

| Domain | Weight | Focus |
|---|---|---|
| Skill & Technique | 40% | Strokes, footwork, rally consistency |
| Competition Readiness | 25% | Match experience, scoring, tactics |
| Physical Capability | 20% | On-court movement, endurance, recovery |
| Mental Performance | 15% | Error response, pressure, routines |

Weights are defaults. Director can adjust in the full placement workflow.

---

## Assessment event types

| Type | Trigger |
|---|---|
| `new_player_intake` | First assessment for any new player |
| `quarterly_review` | Scheduled ongoing assessment |
| `promotion_gate` | Assessment at curriculum level advancement |
| `coach_initiated` | Coach requests unscheduled review |
| `director_initiated` | Director requests review |

---

## Scoring bands (all domains)

Each domain uses 5 bands (1–10 scale):

| Score | Band | Indicative Stage |
|---|---|---|
| 1–2 | Foundation / Emerging / Building basics | Red |
| 3–4 | Developing | Orange 1–2 |
| 5–6 | Applying / Solid | Orange 3 – Green 1 |
| 7–8 | Performing / Consistent | Green 2–3 |
| 9–10 | Advanced / High capability | Yellow / High Performance |

---

## Cadence rules

| Stage | Frequency | Warn at |
|---|---|---|
| Red Foundation | Every 26 weeks | 21 days before |
| Orange / Green | Every 13 weeks | 14 days before |
| Yellow Competitive | Every 13 weeks | 14 days before |
| High Performance | Every 8 weeks | 7 days before |

---

## Safety constraints

- No medical or clinical language anywhere in rubric or UI
- No parent/player data exposed in this phase
- No official player placement writes — all assessment outputs are draft
- Director approval required before any placement is activated
- DONNA voice structuring uses pattern matching only — no external AI API

---

## Migration requirement (deferred)

The `assessments` table already exists (Sprint 005 migration). The Phase 3
assessment model types are compatible with the existing DB schema fields.

To connect the UI to the DB, a future sprint must:
1. Wire `NewPlayerAssessmentPanel` submit to `createAssessment()` in `src/lib/backend/assessments.ts`
2. Wire `AssessmentReviewPanel` confirm to the `placement_recommendations` table insert
3. Wire cadence checks to a Supabase query for `last_assessed_at` per player
