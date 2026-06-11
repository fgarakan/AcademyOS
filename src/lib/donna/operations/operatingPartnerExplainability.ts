// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// Explainability: builds a structured explanation for each priority showing
// which evidence, reality signals, memory, and philosophy informed the recommendation.
//
// Designed to satisfy Guard #7 (Explainability Required):
// Every priority must be traceable to specific signals. No black-box outputs.

import type { OperatingPriority } from './operatingPartnerOutputContract'
import type { OperatingPartnerInputs } from './operatingPartnerInputContract'

// ── Explanation type ───────────────────────────────────────────────────────────

export interface PriorityExplanation {
  evidenceUsed:      string[]  // combined list of all signals that informed this
  realityUsed:       string[]  // player evidence / observed reality signals
  memoryUsed:        string[]  // decision history contributions
  philosophyUsed:    string[]  // academy DNA contributions
  confidence:        'reliable' | 'provisional'
  confidenceReason:  string
  missingData:       string[]
  tradeoffNarrative: string    // why this was ranked above deferred items
}

// ── Builder ────────────────────────────────────────────────────────────────────

export function buildPriorityExplanation(
  priority: OperatingPriority,
  inputs:   OperatingPartnerInputs,
): PriorityExplanation {
  const realityUsed    = buildRealitySignals(priority, inputs)
  const memoryUsed     = buildMemorySignals(inputs)
  const philosophyUsed = buildPhilosophySignals(priority, inputs)

  const evidenceUsed = [
    ...priority.evidenceUsed,
    ...realityUsed,
  ].filter((v, i, arr) => arr.indexOf(v) === i)

  const confidence = deriveConfidence(priority, inputs)
  const confidenceReason = buildConfidenceReason(priority, inputs, confidence)

  const tradeoffNarrative = buildTradeoffNarrative(priority, inputs)

  return {
    evidenceUsed,
    realityUsed,
    memoryUsed,
    philosophyUsed,
    confidence,
    confidenceReason,
    missingData: priority.missingData,
    tradeoffNarrative,
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function buildRealitySignals(
  priority: OperatingPriority,
  inputs:   OperatingPartnerInputs,
): string[] {
  const signals: string[] = []
  const ops = inputs.operations

  if (priority.domain === 'players' || priority.domain === 'cross_domain') {
    if (ops.players.dataAvailable && ops.players.stallCount > 0) {
      signals.push(`Player evidence: ${ops.players.stallCount} players stalled`)
    }
    if (ops.players.dataAvailable && ops.players.playersWithoutLevel > 0) {
      signals.push(`Player evidence: ${ops.players.playersWithoutLevel} players without level`)
    }
  }

  if (priority.domain === 'curriculum' || priority.domain === 'cross_domain') {
    if (ops.curriculum.dataAvailable && ops.curriculum.playerBackedBottleneckCount > 0) {
      signals.push(`Player evidence: ${ops.curriculum.playerBackedBottleneckCount} bottleneck(s) confirmed by evidence records`)
    }
  }

  if (priority.domain === 'coaches' || priority.domain === 'cross_domain') {
    if (ops.coaches.dataAvailable && ops.coaches.missingWrapUpCount > 0) {
      signals.push(`Operational evidence: ${ops.coaches.missingWrapUpCount} session recaps missing`)
    }
  }

  if (priority.domain === 'parents' || priority.domain === 'cross_domain') {
    if (ops.parents.dataAvailable && ops.parents.retentionRiskCount > 0) {
      signals.push(`Retention evidence: ${ops.parents.retentionRiskCount} at-risk families`)
    }
  }

  if (inputs.philosophy.overrides.length > 0) {
    const strong = inputs.philosophy.overrides.filter(o => o.evidenceStrength === 'STRONG')
    if (strong.length > 0) {
      signals.push(`Reality override: ${strong[0].observedReality}`)
    }
  }

  return signals
}

function buildMemorySignals(inputs: OperatingPartnerInputs): string[] {
  const { decisions } = inputs.philosophy
  if (decisions.totalDecisions === 0) return ['No decision history available (V1)']

  const signals: string[] = []
  if (decisions.overrideRate > 0.3) {
    signals.push(`Director override rate: ${Math.round(decisions.overrideRate * 100)}% — director has frequently corrected DONNA recommendations`)
  }
  if (decisions.topContentTypes.length > 0) {
    signals.push(`Most accepted content types: ${decisions.topContentTypes.join(', ')}`)
  }
  signals.push(`V1 memory: ${decisions.totalDecisions} accepted decision(s) recorded`)
  return signals
}

function buildPhilosophySignals(
  priority: OperatingPriority,
  inputs:   OperatingPartnerInputs,
): string[] {
  const signals: string[] = []
  const { preferences, drift, identity } = inputs.philosophy

  if (preferences.topPreferences.length > 0) {
    const top = preferences.topPreferences[0]
    if (top && priority.domain !== 'system') {
      signals.push(`Academy DNA preference: ${top.label} (score ${top.score})`)
    }
  }

  if (drift.driftDetected) {
    signals.push(`Philosophy drift (${drift.driftSeverity}) — deviation from stated identity`)
  }

  const relevantDimension = identity.dimensions.find(d => d.finalScore > 70)
  if (relevantDimension) {
    signals.push(`Identity dimension: ${relevantDimension.label} = ${relevantDimension.finalScore} (${relevantDimension.confidence})`)
  }

  return signals
}

function deriveConfidence(
  priority: OperatingPriority,
  inputs:   OperatingPartnerInputs,
): 'reliable' | 'provisional' {
  // Priority carries its own confidence. Downgrade if critical inputs are missing.
  if (inputs.missingCriticalInputs.length > 0) return 'provisional'
  return priority.confidence
}

function buildConfidenceReason(
  priority:   OperatingPriority,
  inputs:     OperatingPartnerInputs,
  confidence: 'reliable' | 'provisional',
): string {
  if (confidence === 'provisional') {
    if (inputs.missingCriticalInputs.length > 0) {
      return `Confidence reduced to provisional because critical data is missing: ${inputs.missingCriticalInputs.join(', ')}.`
    }
    return 'Confidence is provisional — underlying operational data is incomplete or this recommendation is inference-based.'
  }

  if (inputs.inputCompletenessScore >= 80) {
    return 'Confidence is reliable — all domains loaded with consistent signals.'
  }

  return `Confidence is reliable for this domain. Overall academy data completeness: ${inputs.inputCompletenessScore}/100.`
}

function buildTradeoffNarrative(
  priority: OperatingPriority,
  inputs:   OperatingPartnerInputs,
): string {
  const situationScore = inputs.inputCompletenessScore
  const urgencyMap: Record<string, string> = {
    immediate:  'requires action today',
    this_week:  'should be resolved this week',
    this_month: 'is a medium-term commitment',
  }

  return `"${priority.title}" ${urgencyMap[priority.urgency] ?? 'is a priority'} with ${priority.expectedImpact} expected impact. It was selected because it best aligns with the current situation and has the highest urgency×impact score given ${situationScore}% data completeness.`
}
