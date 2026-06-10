// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
// Blind spot detector: identifies what the director may not be seeing.
// Input: AcademyMemory[] + MemoryLearningReport (Sprint 1625)
// Pure observation. No accusation. No causation. No certainty language.

import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type { MemoryLearningReport } from '../learning/donnaAcademyLearningTypes'
import type { BlindSpot, BlindSpotCategory, InsightConfidence, EvidenceStrength } from './donnaInsightTypes'
import {
  scoreEvidenceStrength,
  scoreBlindSpotConfidence,
} from './donnaInsightConfidenceEngine'

// ── Builder ───────────────────────────────────────────────────────────────────

function makeBlindSpot(
  category:               BlindSpotCategory,
  headline:               string,
  evidence:               string[],
  evidenceStrength:       EvidenceStrength,
  confidence:             InsightConfidence,
  suggestedInvestigation: string,
  limitations:            string[],
): BlindSpot {
  return {
    id: `blind-${category}-${Date.now()}`,
    category,
    headline,
    evidence,
    evidenceStrength,
    confidence,
    suggestedInvestigation,
    limitations,
  }
}

// ── Missing assessment ─────────────────────────────────────────────────────────

function detectMissingAssessment(report: MemoryLearningReport, total: number): BlindSpot | null {
  const pattern = report.patterns.find(p => p.patternType === 'assessment_gap')
  if (!pattern) return null

  const strength    = scoreEvidenceStrength(pattern.sourceMemoryIds.length, total)
  const confidence  = scoreBlindSpotConfidence(pattern.frequency, total)
  if (confidence === 'insufficient_data') return null

  return makeBlindSpot(
    'missing_assessment',
    'Assessment records are underrepresented in current memory',
    [
      ...pattern.evidence,
      'Promotions and curriculum changes may be occurring without formal assessment records.',
    ],
    strength,
    confidence,
    'Review which players have not had a formal assessment in the current memory window.',
    [
      'Assessment gap is detected by ratio — not by individual player review dates.',
      'Assessments may exist outside the loaded memory window.',
    ],
  )
}

// ── Parent communication gap ──────────────────────────────────────────────────

function detectParentGap(report: MemoryLearningReport, total: number): BlindSpot | null {
  const pattern = report.patterns.find(p => p.patternType === 'parent_update_gap')
  if (!pattern) return null

  const strength   = scoreEvidenceStrength(pattern.sourceMemoryIds.length, total)
  const confidence = scoreBlindSpotConfidence(pattern.frequency, total)
  if (confidence === 'insufficient_data') return null

  return makeBlindSpot(
    'parent_communication_gap',
    'Low parent communication relative to academy activity level',
    [
      ...pattern.evidence,
      'Families may not be receiving updates that match the pace of academy decisions.',
    ],
    strength,
    confidence,
    'Identify families with significant player changes that have not received a corresponding parent update.',
    [
      'Parent communication gap is a count ratio — not a per-family review.',
      'Communication via other channels (direct messages, calls) is not captured here.',
    ],
  )
}

// ── Ignored recommendation ────────────────────────────────────────────────────

function detectIgnoredRecommendation(report: MemoryLearningReport, total: number): BlindSpot | null {
  const pattern = report.patterns.find(p => p.patternType === 'override_frequency')
  if (!pattern) return null
  if (pattern.confidence === 'insufficient') return null

  const strength   = scoreEvidenceStrength(pattern.sourceMemoryIds.length, total)
  const confidence = scoreBlindSpotConfidence(pattern.frequency, total)
  if (confidence === 'insufficient_data') return null

  return makeBlindSpot(
    'ignored_recommendation',
    `${pattern.frequency} DONNA proposals modified — may indicate systematic reasoning gap`,
    [
      ...pattern.evidence,
      "Frequent modification may mean DONNA's context does not fully capture director reasoning.",
    ],
    strength,
    confidence,
    'Review the overridden proposals: is there a shared theme in what gets changed?',
    [
      "Override frequency does not imply the proposals were wrong — they are being used as a starting point.",
      'No judgement is made about the quality or intent of overrides.',
    ],
  )
}

// ── Coach overload ────────────────────────────────────────────────────────────

function detectCoachOverload(
  report:  MemoryLearningReport,
  _memories: AcademyMemory[],
  total:   number,
): BlindSpot | null {
  const pattern = report.patterns.find(p => p.patternType === 'coach_assignment_churn')
  if (!pattern) return null

  const strength   = scoreEvidenceStrength(pattern.sourceMemoryIds.length, total)
  const confidence = scoreBlindSpotConfidence(pattern.frequency, total)
  if (confidence === 'insufficient_data') return null

  return makeBlindSpot(
    'coach_overload',
    'Multiple coach assignment changes may indicate relationship instability',
    [
      ...pattern.evidence,
      'Frequent reassignment may create gaps in coach–player relationship continuity.',
    ],
    strength,
    confidence,
    'Review which players have had more than one coach change and whether each has a confirmed primary coach.',
    [
      'Coach assignment churn detection cannot distinguish planned restructuring from reactive reassignment.',
    ],
  )
}

// ── Promotion blocker ─────────────────────────────────────────────────────────

function detectPromotionBlocker(
  report:   MemoryLearningReport,
  memories: AcademyMemory[],
  total:    number,
): BlindSpot | null {
  const promotionCluster = report.patterns.find(p => p.patternType === 'promotion_cluster')
  if (!promotionCluster) return null

  const assessmentCount = memories.filter(m => m.sourceType === 'assessment_result').length
  const promotionCount  = memories.filter(m => m.sourceType === 'promotion_decision').length
  if (promotionCount <= assessmentCount) return null

  const strength = scoreEvidenceStrength(promotionCluster.sourceMemoryIds.length, total)

  return makeBlindSpot(
    'promotion_blocker',
    `${promotionCount} promotions but only ${assessmentCount} assessment records in memory`,
    [
      `${promotionCount} promotion decisions loaded`,
      `${assessmentCount} assessment records loaded`,
      'The ratio may indicate promotions are occurring ahead of formal assessments.',
    ],
    strength,
    'low',
    'Review whether each recent promotion has a corresponding formal assessment record in the system.',
    [
      'Assessment records may exist outside the loaded memory window.',
      'Ratio mismatch does not confirm that any specific promotion lacked assessment.',
    ],
  )
}

// ── Placement issue ────────────────────────────────────────────────────────────

function detectPlacementIssue(
  report:   MemoryLearningReport,
  memories: AcademyMemory[],
  total:    number,
): BlindSpot | null {
  const velocityPattern = report.patterns.find(p => p.patternType === 'placement_velocity')
  if (!velocityPattern) return null

  const coachCount     = memories.filter(m => m.sourceType === 'coach_assignment').length
  const placementCount = memories.filter(m => m.sourceType === 'placement_decision').length
  if (coachCount >= placementCount) return null

  const strength = scoreEvidenceStrength(velocityPattern.sourceMemoryIds.length, total)

  return makeBlindSpot(
    'placement_issue',
    `${placementCount} placements but only ${coachCount} coach assignment records`,
    [
      `${placementCount} placement decisions loaded`,
      `${coachCount} coach assignment records loaded`,
      'Recently placed players may not yet have confirmed coach assignments.',
    ],
    strength,
    'low',
    'Verify that each recently placed player has a confirmed primary coach assignment.',
    [
      'Coach assignments may exist outside the loaded memory window.',
      'This is a count comparison — not a per-player audit.',
    ],
  )
}

// ── Unresolved bottleneck ─────────────────────────────────────────────────────

function detectUnresolvedBottleneck(report: MemoryLearningReport, total: number): BlindSpot | null {
  const highPriorityRecs = report.recommendations.filter(r => r.priority === 'high')
  if (highPriorityRecs.length < 2) return null
  if (total < 5) return null

  const strength: EvidenceStrength = highPriorityRecs.length >= 3 ? 'moderate' : 'weak'

  return makeBlindSpot(
    'unresolved_bottleneck',
    `${highPriorityRecs.length} high-priority learning recommendations detected`,
    [
      ...highPriorityRecs.slice(0, 2).map(r => `High priority: ${r.action}`),
      'Repeated pattern signals without visible resolution may indicate persistent operational gaps.',
    ],
    strength,
    'low',
    'Review the high-priority recommendations from the learning report and determine if any have been actioned.',
    [
      'Recommendation presence does not confirm a bottleneck — action may have occurred outside the recorded window.',
      'V1 cannot detect whether a recommendation was acted upon.',
    ],
  )
}

// ── Main detector ─────────────────────────────────────────────────────────────

export function detectBlindSpots(
  memories: AcademyMemory[],
  report:   MemoryLearningReport,
): BlindSpot[] {
  const total   = memories.length
  const results: BlindSpot[] = []
  const push = (b: BlindSpot | null) => { if (b) results.push(b) }

  push(detectMissingAssessment(report, total))
  push(detectParentGap(report, total))
  push(detectIgnoredRecommendation(report, total))
  push(detectCoachOverload(report, memories, total))
  push(detectPromotionBlocker(report, memories, total))
  push(detectPlacementIssue(report, memories, total))
  push(detectUnresolvedBottleneck(report, total))

  return results
}
