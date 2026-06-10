// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
// Contradiction detector: identifies potential conflicts between observed behaviors.
// Input: AcademyMemory[] + MemoryLearningReport
//
// Rules:
//   - Never accuse. Never assume intent. Never claim certainty.
//   - All output uses "may indicate", "appears to conflict", "potential tension".
//   - Every contradiction has an explicit limitations disclosure.

import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type { MemoryLearningReport, PatternType } from '../learning/donnaAcademyLearningTypes'
import type { Contradiction, InsightConfidence, EvidenceStrength } from './donnaInsightTypes'
import {
  scoreEvidenceStrength,
  scoreContradictionConfidence,
} from './donnaInsightConfidenceEngine'

// ── Builder ───────────────────────────────────────────────────────────────────

function makeContradiction(
  headline:          string,
  observedBehavior:  string,
  conflictingSignal: string,
  evidence:          string[],
  evidenceStrength:  EvidenceStrength,
  confidence:        InsightConfidence,
  suggestedReview:   string,
  limitations:       string[],
): Contradiction {
  return {
    id: `contra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    headline,
    observedBehavior,
    conflictingSignal,
    evidence,
    evidenceStrength,
    confidence,
    suggestedReview,
    limitations,
  }
}

// ── Rapid promotion + assessment gap ─────────────────────────────────────────

function detectPromotionAssessmentConflict(
  report:   MemoryLearningReport,
  memories: AcademyMemory[],
  total:    number,
): Contradiction | null {
  const promotionCluster = report.patterns.find(p => p.patternType === 'promotion_cluster')
  const assessmentGap    = report.patterns.find(p => p.patternType === 'assessment_gap')
  if (!promotionCluster || !assessmentGap) return null

  const promotionCount  = memories.filter(m => m.sourceType === 'promotion_decision').length
  const assessmentCount = memories.filter(m => m.sourceType === 'assessment_result').length

  const confidence = scoreContradictionConfidence(
    promotionCluster.frequency,
    assessmentGap.frequency,
    total,
  )
  if (confidence === 'insufficient_data') return null

  const strength = scoreEvidenceStrength(
    promotionCluster.sourceMemoryIds.length + assessmentGap.sourceMemoryIds.length,
    total,
  )

  return makeContradiction(
    'Rapid advancement with limited assessment records',
    `${promotionCount} promotions detected in a recent window`,
    `Only ${assessmentCount} assessment records exist in the same memory window`,
    [
      `${promotionCluster.frequency} recent promotions detected`,
      `Assessment records account for a low fraction of total decisions`,
      'A high promotion-to-assessment ratio may indicate assessments are not being formally recorded.',
    ],
    strength,
    confidence,
    'Review whether each recent promotion was preceded by a recorded formal assessment.',
    [
      'Assessment records may exist outside the loaded window.',
      'This is a count observation — not a confirmation that assessments did not occur.',
      'No accusation is made about promotion quality.',
    ],
  )
}

// ── Rejection repeat + same pattern recurring ─────────────────────────────────

function detectRejectionPatternConflict(
  report:   MemoryLearningReport,
  memories: AcademyMemory[],
  total:    number,
): Contradiction | null {
  const rejectionPattern = report.patterns.find(p => p.patternType === 'rejection_repeat')
  if (!rejectionPattern) return null

  // Check if any recurring pattern exists alongside rejections (indicating the issue isn't resolving)
  const recurringPatterns = report.patterns.filter(p =>
    p.patternType !== 'rejection_repeat' && p.confidence !== 'insufficient',
  )
  if (recurringPatterns.length === 0) return null

  const confidence = scoreContradictionConfidence(
    rejectionPattern.frequency,
    recurringPatterns.length,
    total,
  )
  if (confidence === 'insufficient_data') return null

  const strength = scoreEvidenceStrength(rejectionPattern.sourceMemoryIds.length, total)

  const examplePattern = recurringPatterns[0]
  return makeContradiction(
    'Repeated rejections alongside recurring patterns',
    `${rejectionPattern.frequency} proposed actions have been rejected`,
    `${recurringPatterns.length} recurring pattern${recurringPatterns.length !== 1 ? 's' : ''} still detected (e.g., ${examplePattern.headline})`,
    [
      `${rejectionPattern.frequency} rejection records in memory`,
      `Ongoing pattern: ${examplePattern.observation}`,
      'Rejecting proposals may not be resolving the underlying patterns that generate them.',
    ],
    strength,
    confidence,
    'Review whether the rejected proposals addressed the root signal, or whether the signal remains unresolved.',
    [
      'Rejection does not imply a wrong proposal — context or timing may have been incorrect.',
      'Recurring patterns may have independent causes from the rejected proposals.',
    ],
  )
}

// ── Curriculum change + no parent updates ─────────────────────────────────────

function detectCurriculumParentGapConflict(
  report:   MemoryLearningReport,
  _memories: AcademyMemory[],
  total:    number,
): Contradiction | null {
  const curriculumBurst = report.patterns.find(p => p.patternType === 'curriculum_change_burst')
  const parentGap       = report.patterns.find(p => p.patternType === 'parent_update_gap')
  if (!curriculumBurst || !parentGap) return null

  const confidence = scoreContradictionConfidence(
    curriculumBurst.frequency,
    parentGap.frequency,
    total,
  )
  if (confidence === 'insufficient_data') return null

  const strength = scoreEvidenceStrength(
    curriculumBurst.sourceMemoryIds.length + parentGap.sourceMemoryIds.length,
    total,
  )

  return makeContradiction(
    'Curriculum changes occurring without corresponding parent communication',
    `${curriculumBurst.frequency} curriculum changes detected in a short window`,
    'Parent communication volume is low relative to total decisions',
    [
      `${curriculumBurst.frequency} curriculum change records`,
      'Parent updates account for a small fraction of total decision records',
      'Families may be unaware of curriculum changes that affect their players.',
    ],
    strength,
    confidence,
    'Verify that families of affected players received updates corresponding to recent curriculum changes.',
    [
      'Curriculum changes may affect groups rather than individuals — communication scope may differ.',
      'Parent communication may be occurring outside the recorded system.',
    ],
  )
}

// ── Override frequency + promotion cluster ────────────────────────────────────

function detectOverridePromotionConflict(
  report:   MemoryLearningReport,
  memories: AcademyMemory[],
  total:    number,
): Contradiction | null {
  const overridePattern   = report.patterns.find(p => p.patternType === 'override_frequency')
  const promotionCluster  = report.patterns.find(p => p.patternType === 'promotion_cluster')
  if (!overridePattern || !promotionCluster) return null

  const overrideMemories   = memories.filter(m => m.sourceType === 'director_override')
  const promotionMemories  = memories.filter(m => m.sourceType === 'promotion_decision')

  const confidence = scoreContradictionConfidence(
    overridePattern.frequency,
    promotionCluster.frequency,
    total,
  )
  if (confidence === 'insufficient_data') return null

  const strength = scoreEvidenceStrength(
    overrideMemories.length + promotionMemories.length,
    total,
  )

  return makeContradiction(
    'Frequent DONNA overrides alongside high promotion activity',
    `${overridePattern.frequency} DONNA proposals modified before approval`,
    `${promotionCluster.frequency} recent promotions — some may have been based on modified proposals`,
    [
      `${overrideMemories.length} override records`,
      `${promotionMemories.length} promotion records`,
      'If promotion proposals are frequently modified, the evidence basis for those promotions may differ from what DONNA originally assessed.',
    ],
    strength,
    confidence,
    'Review which promotions were based on modified DONNA proposals and whether the modifications changed the evidence justification.',
    [
      'Override + promotion co-occurrence is an observation, not a quality judgement.',
      "Director modifications may have added context that strengthened the promotion case.",
    ],
  )
}

// ── Main detector ─────────────────────────────────────────────────────────────

export function detectContradictions(
  memories: AcademyMemory[],
  report:   MemoryLearningReport,
): Contradiction[] {
  const total   = memories.length
  const results: Contradiction[] = []
  const push = (c: Contradiction | null) => { if (c) results.push(c) }

  push(detectPromotionAssessmentConflict(report, memories, total))
  push(detectRejectionPatternConflict(report, memories, total))
  push(detectCurriculumParentGapConflict(report, memories, total))
  push(detectOverridePromotionConflict(report, memories, total))

  return results
}
