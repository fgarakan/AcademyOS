# DONNA Coverage Gap Intelligence
**Sprint:** 913.3
**Date:** 2026-05-28
**Updates:** `src/lib/donna/donnaAttentionRankingEngine.ts`

---

## New Signals Added

| Signal ID | Category | Base score | Multiplier | Cap | Context guard |
|---|---|---|---|---|---|
| `player_progress_stalls` | `player_development` | 62 | +3/stall | 78 | `playerProgressStallContextAvailable` |
| `assessment_coverage_gaps` | `curriculum` | 58 | +2/gap | 72 | `assessmentContextAvailable` |
| `curriculum_template_coverage_gaps` | `curriculum` | 56 | +2/gap | 70 | `templateCoverageContextAvailable` |

## Context Fields Used

| Signal | Primary field | Guard field | Enrichment field |
|---|---|---|---|
| `player_progress_stalls` | `playerProgressStallCount` | `playerProgressStallContextAvailable` | — |
| `assessment_coverage_gaps` | `assessmentCoverageGapCount` | `assessmentContextAvailable` | `eligibleWithoutAssessmentEvidence` |
| `curriculum_template_coverage_gaps` | `curriculumTemplateCoverageGapCount` | `templateCoverageContextAvailable` | — |

All signals are read-only. All use pre-computed data from `loadDirectorDonnaContext`. No new DB queries.

## Context Guard Rationale

Each new signal is gated on its `contextAvailable` flag:
- When the underlying detection engine ran with incomplete data, the guard is `false` even if the count is > 0
- This prevents the ranking engine from generating false-positive priorities when data quality is uncertain
- If guard = false and count > 0, the signal is silently omitted (no error)

## Updated Ranking Order (Full)

| Rank position | Signal | Score range |
|---|---|---|
| Highest | Missing wrap-ups | 80–95 |
| | High-risk players | 75–90 |
| | Attendance exceptions | 70–85 |
| | Stale queue (≥14d) | 75 |
| | Stale queue (7–13d) | 65 |
| | **Player progress stalls** (NEW) | 62–78 |
| | Pending reviews | 60–75 |
| | **Assessment coverage gaps** (NEW) | 58–72 |
| | **Template coverage gaps** (NEW) | 56–70 |
| | Medium-risk players | 55–65 |
| | Advancement eligible | 50–60 |
| | Curriculum drafts | 40–55 |
| | Onboarding not started | 45 |
| | Curriculum gaps | 35–50 |
| Lowest | Onboarding partial | 30 |

## Why Coverage Gaps Matter More Than Curriculum Drafts

- **Assessment coverage gaps** (58–72) rank above **curriculum drafts** (40–55) because they directly block level movement decisions. A director cannot justify advancement without assessment evidence.
- **Template coverage gaps** (56–70) rank above curriculum drafts because they affect ongoing coach delivery, not just future curriculum changes.
- **Player stalls** (62–78) rank above assessment and template gaps because stalled players represent an active student development problem, not just a planning gap.
