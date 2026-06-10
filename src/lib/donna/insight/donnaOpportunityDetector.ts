// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
// Opportunity detector: identifies positive signals in academy memory.
// DONNA should surface what is working — not only what is missing.
//
// Output: hidden opportunities with evidence, confidence, suggested action.

import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'
import type { MemoryLearningReport } from '../learning/donnaAcademyLearningTypes'
import type { HiddenOpportunity, EvidenceStrength } from './donnaInsightTypes'
import {
  scoreEvidenceStrength,
  scoreOpportunityConfidence,
} from './donnaInsightConfidenceEngine'

// ── Builder ───────────────────────────────────────────────────────────────────

function makeOpportunity(
  headline:        string,
  observation:     string,
  evidence:        string[],
  evidenceStrength: EvidenceStrength,
  signalCount:     number,
  totalMemories:   number,
  suggestedAction: string,
  limitations:     string[],
): HiddenOpportunity | null {
  const confidence = scoreOpportunityConfidence(signalCount, totalMemories)
  if (confidence === 'insufficient_data') return null

  return {
    id: `opp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    headline,
    observation,
    evidence,
    evidenceStrength,
    confidence,
    suggestedAction,
    limitations,
  }
}

// ── Advancement momentum ──────────────────────────────────────────────────────

function detectAdvancementMomentum(
  report:  MemoryLearningReport,
  memories: AcademyMemory[],
  total:   number,
): HiddenOpportunity | null {
  const cluster = report.patterns.find(p => p.patternType === 'promotion_cluster')
  if (!cluster) return null

  const promotionCount  = memories.filter(m => m.sourceType === 'promotion_decision').length
  const assessmentCount = memories.filter(m => m.sourceType === 'assessment_result').length

  // Only flag as opportunity if assessment coverage is reasonable (not a blocker)
  if (assessmentCount > 0 && promotionCount <= assessmentCount * 2) {
    const strength = scoreEvidenceStrength(cluster.sourceMemoryIds.length, total)
    return makeOpportunity(
      'Academy advancement momentum',
      `${promotionCount} players advanced recently — the academy is actively progressing students.`,
      [
        `${promotionCount} promotion records in memory`,
        `${assessmentCount} assessment records present`,
        'Advancement velocity suggests the curriculum pipeline is functioning.',
      ],
      strength,
      cluster.frequency,
      total,
      'Reinforce the conditions that enabled this advancement period — coach behaviors, curriculum readiness, assessment cadence.',
      [
        'Promotion volume is an observation, not a quality measure.',
        'Outcome quality for each promoted player cannot be confirmed from memory counts.',
      ],
    )
  }

  return null
}

// ── Enrollment growth ─────────────────────────────────────────────────────────

function detectEnrollmentGrowth(
  report:   MemoryLearningReport,
  memories: AcademyMemory[],
  total:    number,
): HiddenOpportunity | null {
  const velocity = report.patterns.find(p => p.patternType === 'placement_velocity')
  if (!velocity) return null

  const placementCount = memories.filter(m => m.sourceType === 'placement_decision').length
  const coachCount     = memories.filter(m => m.sourceType === 'coach_assignment').length

  // Only flag if coach assignments are keeping up (no placement issue blind spot)
  if (coachCount >= placementCount) {
    const strength = scoreEvidenceStrength(velocity.sourceMemoryIds.length, total)
    return makeOpportunity(
      'Active enrollment growth with coach coverage',
      `${placementCount} players placed with ${coachCount} coach assignments — onboarding is scaling.`,
      [
        `${placementCount} placement decisions`,
        `${coachCount} coach assignments`,
        'High placement velocity with matching coach assignments indicates healthy onboarding capacity.',
      ],
      strength,
      velocity.frequency,
      total,
      'Document what is making the current onboarding period successful — intake process, coach readiness, placement criteria.',
      ['Onboarding quality cannot be assessed from volume alone.'],
    )
  }

  return null
}

// ── High DONNA-director alignment ─────────────────────────────────────────────

function detectHighAlignment(
  report:   MemoryLearningReport,
  memories: AcademyMemory[],
  total:    number,
): HiddenOpportunity | null {
  if (total < 8) return null

  const overrideCount = memories.filter(m => m.sourceType === 'director_override').length
  const overrideRatio = overrideCount / total

  // No override_frequency pattern + low override ratio = alignment opportunity
  const overridePattern = report.patterns.find(p => p.patternType === 'override_frequency')
  if (overridePattern) return null  // Override pattern detected — not a strength
  if (overrideRatio >= 0.15) return null  // >15% overrides — not notable alignment

  const strength = scoreEvidenceStrength(total - overrideCount, total)
  return makeOpportunity(
    'High DONNA–director alignment',
    `Only ${overrideCount} of ${total} decisions required DONNA proposal modification — strong alignment.`,
    [
      `${total} total decisions`,
      `${overrideCount} director overrides (${Math.round(overrideRatio * 100)}%)`,
      'High acceptance rate suggests DONNA proposals are matching director priorities.',
    ],
    strength,
    total - overrideCount,
    total,
    'Capture the current director priorities as reviewer notes so alignment can be maintained as context evolves.',
    [
      'High acceptance rate reflects proposal-direction alignment, not proposal quality.',
      'Alignment can shift as priorities change — it should be monitored, not assumed.',
    ],
  )
}

// ── Strong assessment discipline ──────────────────────────────────────────────

function detectAssessmentDiscipline(
  memories: AcademyMemory[],
  total:    number,
): HiddenOpportunity | null {
  if (total < 8) return null

  const assessmentCount = memories.filter(m => m.sourceType === 'assessment_result').length
  const assessmentRatio = assessmentCount / total

  if (assessmentRatio < 0.15) return null  // Not high enough to be notable

  const strength = scoreEvidenceStrength(assessmentCount, total)
  return makeOpportunity(
    'Strong assessment discipline',
    `${assessmentCount} assessment records account for ${Math.round(assessmentRatio * 100)}% of loaded memory.`,
    [
      `${assessmentCount} assessment records`,
      `${total} total decision records`,
      'High assessment frequency provides a strong evidence base for curriculum and promotion decisions.',
    ],
    strength,
    assessmentCount,
    total,
    'Use the strong assessment foundation to ensure each assessment feeds directly into player promotion and curriculum decisions.',
    ['Assessment frequency does not confirm assessment quality or consistency.'],
  )
}

// ── Active parent communication ───────────────────────────────────────────────

function detectActiveParentCommunication(
  memories: AcademyMemory[],
  total:    number,
): HiddenOpportunity | null {
  if (total < 8) return null

  const parentCount = memories.filter(m => m.sourceType === 'parent_update').length
  const ratio       = parentCount / total

  if (ratio < 0.20) return null  // Require >20% to flag as a strength

  const strength = scoreEvidenceStrength(parentCount, total)
  return makeOpportunity(
    'Active parent communication culture',
    `Parent updates account for ${Math.round(ratio * 100)}% of recorded decisions — above average communication frequency.`,
    [
      `${parentCount} parent update records`,
      `${total} total records`,
      'Regular parent communication is associated with higher family confidence and retention.',
    ],
    strength,
    parentCount,
    total,
    'Identify the communication patterns that are working well and codify them as a standard practice.',
    ['Parent update frequency does not confirm parent satisfaction or message quality.'],
  )
}

// ── Main detector ─────────────────────────────────────────────────────────────

export function detectHiddenOpportunities(
  memories: AcademyMemory[],
  report:   MemoryLearningReport,
): HiddenOpportunity[] {
  const total   = memories.length
  const results: HiddenOpportunity[] = []
  const push = (o: HiddenOpportunity | null) => { if (o) results.push(o) }

  push(detectAdvancementMomentum(report, memories, total))
  push(detectEnrollmentGrowth(report, memories, total))
  push(detectHighAlignment(report, memories, total))
  push(detectAssessmentDiscipline(memories, total))
  push(detectActiveParentCommunication(memories, total))

  // Enforce max 3 (low cognitive load rule)
  return results.slice(0, 3)
}
