# DONNA Insight Engine QA
**Sprint:** 920 | **Date:** 2026-05-29
**Method:** Static code analysis

---

## 1. Insight Types Covered

| Type | Source Signal | Confidence Logic |
|---|---|---|
| `repeated_player_issue` | attentionItems count per playerId | high ≥3 flags, medium ≥2 |
| `review_queue_buildup` | pendingReviews count | high ≥10, medium ≥5 |
| `advancement_eligible_waiting` | advancementEligibleCount > 0 | medium |
| `curriculum_coverage_gap` | curriculumTemplateCoverageGapCount > 0 | high ≥3 gaps, medium otherwise |
| `assessment_coverage_gap` | assessmentCoverageGapCount > 0 | medium |
| `wrap_up_coverage_low` | missingWrapUps/todaySessions ratio ≥0.5 | high ≥0.75 ratio, medium otherwise |
| `stall_detected` | playerProgressStalls.length > 0 | medium |

---

## 2. Safety Checks

| Check | Result |
|---|---|
| Raw player IDs exposed in insights? | No — insights use labels (playerName) not IDs |
| Raw coach notes exposed? | No — only structured signals from ctx |
| Official mutations triggered? | No — insights are read-only |
| Insights marked as requiring approval? | Yes — repeated player issue, advancement eligible, stall detected |
| Confidence is honest? | Yes — each type has specific threshold logic |
| Semantic memory used as authority? | No — DB-backed signals from ctx only |
| DONNA claims certainty from insufficient data? | No — fallback returns empty list, not invented signals |

---

## 3. Surface Location

Insights rendered in `DonnaInsightSection` component, wired to `/director/donna` left column (below academy risks, above next best actions).

---

## 4. TypeScript

```
npx tsc --noEmit → clean (0 errors)
```
