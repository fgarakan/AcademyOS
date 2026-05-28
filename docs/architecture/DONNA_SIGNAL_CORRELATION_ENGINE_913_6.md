# DONNA Cross-Signal Correlation Engine
**Sprint:** 913.6
**Date:** 2026-05-28
**File:** `src/lib/donna/donnaSignalCorrelationEngine.ts`

---

## Purpose

Detects relationships between signals that cannot be expressed by any single ranked priority. Where the attention ranking engine says "this signal matters", the correlation engine says "these two signals are connected — together they suggest something different."

## Six Correlation Rules

| Rule ID | Signals correlated | Correlation type | Confidence |
|---|---|---|---|
| `player_stalled_and_risk_flagged` | `playerProgressStalls` × `attentionItems` | Same player name | High |
| `level_stalled_and_assessment_gap` | `playerProgressStalls.currentLevelDisplayName` × `assessmentCoverageGaps.levelDisplayName` | Same level name | Medium |
| `level_double_gap_template_and_assessment` | `curriculumTemplateCoverageGaps.levelDisplayName` × `assessmentCoverageGaps.levelDisplayName` | Same level name | High |
| `stale_queue_with_high_impact` | `pendingReviews` + `oldestPendingReviewAgeDays` × `highRiskPlayerCount` / `attendanceExceptions` | Count-based | Medium |
| `advancement_without_assessment_evidence` | `advancementEligibleCount` × `eligibleWithoutAssessmentEvidence` | Count-based | High |
| `foundation_not_ready` | `onboardingReadinessLevel` × `!hasPlayers && !hasCoaches` | Count-based | Medium |

## String Match Design

Rules 1–3 use case-insensitive + trimmed string matching via a `norm(s)` helper. This reduces false negatives from minor formatting differences in level display names.

Guards: Rules 1–3 are gated on their respective `contextAvailable` flags before attempting string matching.

## Sorting

`high severity → high confidence → stable id (localeCompare)`

## Fields Used / Excluded

| Field | Used? | Notes |
|---|---|---|
| `playerProgressStalls[*].playerName` | ✅ | Matched against attentionItems |
| `playerProgressStalls[*].currentLevelDisplayName` | ✅ | Matched against assessmentCoverageGaps |
| `playerProgressStalls[*].daysAtCurrentLevel` | ✅ | In evidence text |
| `attentionItems[*].playerName` | ✅ | Matched against stalls |
| `attentionItems[*].reason` | ✅ | Aggregate-safe ("3 concern observations") |
| `attentionItems[*].risk` | ✅ | Determines severity |
| `assessmentCoverageGaps[*].levelDisplayName` | ✅ | Matched against stalls and template gaps |
| `curriculumTemplateCoverageGaps[*].levelDisplayName` | ✅ | Matched against assessment gaps |
| `curriculumTemplateCoverageGaps[*].playerCountAtLevel` | ✅ | In evidence text |
| `playerId` / `levelId` / `currentLevelId` | ❌ | Raw UUIDs — never used |
| Raw coach note text | ❌ | Not in ctx as raw text |
| `academyRisks` | ❌ | Not used — overlaps with ranked priorities |

## Hedging Language

Correlations use "may" and "suggests" to avoid unsupported causal claims:
- "may be linked to observable concern patterns"
- "may lack evidence"
- "suggests the stall may be partly due to"

## Director Brief Integration

The top correlation (limit=1) is shown as a "Connected insight:" line in `buildDirectorBriefSummary`, placed after "Recommended:" and before the safety note. Omitted when no correlations exist.

## Part 4 Deferred

`buildDashboardPriorityResponse` was NOT updated. The sprint allowed deferral when "matching is too complex." Mapping top priority to top correlation by category/href would require a cross-engine lookup that adds complexity without clear benefit at current scale. The brief already surfaces the connected insight.
