# DONNA Evidence Detail Intelligence
**Sprint:** 913.4
**Date:** 2026-05-28
**Updates:** `donnaAttentionRankingEngine.ts`, `directorDashboardDonnaAnswer.ts`

---

## Evidence Summarizer Helpers

Five private helper functions added to `donnaAttentionRankingEngine.ts`:

| Helper | Source array | Detail fields used | Fallback |
|---|---|---|---|
| `summarizePlayerStallEvidence` | `ctx.playerProgressStalls` | `playerName`, `currentLevelDisplayName`, `daysAtCurrentLevel` | Empty string |
| `summarizeAssessmentGapEvidence` | `ctx.assessmentCoverageGaps` | `levelDisplayName`, `gapType`, `daysSinceLastAssessment` | Empty string |
| `summarizeTemplateCoverageEvidence` | `ctx.curriculumTemplateCoverageGaps` | `levelDisplayName`, `playerCountAtLevel` (first 2 gaps) | Empty string |
| `summarizeCurriculumGapEvidence` | `ctx.curriculumGaps` | First string in array (trimmed to 70 chars) | Empty string |
| `summarizeAttentionItemEvidence` | `ctx.attentionItems` | `playerName`, `reason` (filtered by risk level) | Empty string |

All helpers: 1–2 examples max, return empty string when data unavailable, no fallback fabrication.

## Evidence Fields Used

| Field | Safe? | Why |
|---|---|---|
| `playerName` (attentionItems, playerProgressStalls) | ✅ | Director-visible in existing UI |
| `currentLevelDisplayName` (playerProgressStalls) | ✅ | Curriculum level name, not private |
| `daysAtCurrentLevel` (playerProgressStalls) | ✅ | Development duration signal |
| `levelDisplayName` (assessmentCoverageGaps) | ✅ | Curriculum level name |
| `gapType` (assessmentCoverageGaps) | ✅ | Category info |
| `daysSinceLastAssessment` (assessmentCoverageGaps) | ✅ | Assessment recency |
| `levelDisplayName` (curriculumTemplateCoverageGaps) | ✅ | Curriculum level name |
| `playerCountAtLevel` (curriculumTemplateCoverageGaps) | ✅ | Aggregate count |
| `reason` (attentionItems) | ✅ | Aggregate: "3 concern observations in last 30 days" |
| `curriculumGaps[0]` string | ✅ | Already formatted aggregate description |

## Evidence Fields Deliberately Excluded

| Field | Reason |
|---|---|
| `playerId` (any type) | Raw UUID — internal reference, not human-meaningful |
| `currentLevelId` (assessmentCoverageGaps) | Raw UUID |
| `levelId` (curriculumTemplateCoverageGaps) | Raw UUID |
| Raw coach note text | Not in directorCtx as raw text; attentionItems.reason is already aggregated |
| Parent-facing language | All text is director-only context |
| `assessmentCoverageGaps.href` | Not surfaced in evidence text — used in signal href |

## Signals Enriched

| Signal | Before | After |
|---|---|---|
| `high_risk_players` | "2 players with high-risk signals from recent observations." | "2 players with high-risk signals. including Jordan — 3 concern observations in last 30 days." |
| `medium_risk_players` | "1 player with medium-risk signals." | "1 player with medium-risk signals. including Alex — 2 absences in last 7 days." |
| `player_progress_stalls` | "3 player progress stall signals detected." | "3 player progress stall signals detected. including Jordan at Orange 2 for 126 days." |
| `assessment_coverage_gaps` | "2 assessment coverage gaps detected." | "2 assessment coverage gaps detected. including 1 player at Orange 2 with no assessment in 95 days." |
| `curriculum_template_coverage_gaps` | "2 levels with no template assigned." | "2 levels with no template. including Orange 2 (3 players) and Yellow 1 (2 players)." |
| `curriculum_gaps` | "2 structural gaps detected." | `"2 structural gaps detected. including: "Orange 2 — no drills defined (3 gates exist)"."` |

## Director Brief Update

`buildDirectorBriefSummary` now includes the enriched `evidence` text for the #1 ranked priority:

```
Here's your academy status (ranked by urgency):

1. 3 players may be stalled in development
2. 2 assessment coverage gaps flagged

Evidence: 3 player progress stall signals detected. including Jordan at Orange 2 for 126 days.
Best next step: Review the stalled player profiles...

Nothing is applied until you approve it.
```

Evidence is shown for the TOP item only — keeps the brief scannable while adding specific context.
