// Mega Sprint 1655–1684 — DONNA Insight & Perspective Shift Engine V1
// Confidence engine: scores InsightConfidence and EvidenceStrength independently.
// Never overstates. Never fabricates. Both dimensions must be disclosed.

import type { InsightConfidence, EvidenceStrength } from './donnaInsightTypes'
import type { LearningConfidence } from '../learning/donnaAcademyLearningTypes'

// ── Thresholds ────────────────────────────────────────────────────────────────

const STRONG_SOURCE_COUNT  = 5
const STRONG_TOTAL_COUNT   = 15
const MODERATE_SOURCE_COUNT = 3
const MODERATE_TOTAL_COUNT  = 8
const MIN_TOTAL_FOR_ANY     = 5
const MEDIUM_FREQUENCY      = 5
const LOW_FREQUENCY         = 3

// ── Evidence strength ─────────────────────────────────────────────────────────

export function scoreEvidenceStrength(
  sourceMemoryCount: number,
  totalMemories:     number,
): EvidenceStrength {
  if (sourceMemoryCount >= STRONG_SOURCE_COUNT || totalMemories >= STRONG_TOTAL_COUNT)   return 'strong'
  if (sourceMemoryCount >= MODERATE_SOURCE_COUNT || totalMemories >= MODERATE_TOTAL_COUNT) return 'moderate'
  return 'weak'
}

// ── Insight confidence ────────────────────────────────────────────────────────

export function scoreInsightConfidence(
  frequency:           number,
  corroborationCount:  number,  // number of other signals pointing the same way
  totalMemories:       number,
): InsightConfidence {
  if (totalMemories < MIN_TOTAL_FOR_ANY)  return 'insufficient_data'
  if (frequency >= MEDIUM_FREQUENCY && corroborationCount >= 2 && totalMemories >= 10) return 'medium'
  if (frequency >= LOW_FREQUENCY)         return 'low'
  return 'insufficient_data'
}

export function scoreBlindSpotConfidence(
  frequency:     number,
  totalMemories: number,
): InsightConfidence {
  if (totalMemories < MIN_TOTAL_FOR_ANY) return 'insufficient_data'
  if (frequency >= MEDIUM_FREQUENCY && totalMemories >= 10) return 'medium'
  if (frequency >= LOW_FREQUENCY) return 'low'
  return 'insufficient_data'
}

export function scoreContradictionConfidence(
  patternACount: number,
  patternBCount: number,
  totalMemories: number,
): InsightConfidence {
  if (totalMemories < MIN_TOTAL_FOR_ANY)              return 'insufficient_data'
  if (patternACount < 2 || patternBCount < 2)         return 'insufficient_data'
  if (patternACount >= 3 && patternBCount >= 3)       return 'low'
  return 'insufficient_data'
}

export function scoreOpportunityConfidence(
  signalCount:   number,
  totalMemories: number,
): InsightConfidence {
  if (totalMemories < MIN_TOTAL_FOR_ANY) return 'insufficient_data'
  if (signalCount >= 5)  return 'medium'
  if (signalCount >= 3)  return 'low'
  return 'insufficient_data'
}

// ── Learning confidence bridge ────────────────────────────────────────────────
// Converts Sprint 1625 LearningConfidence to InsightConfidence.
// Note: 'insufficient' → 'insufficient_data' (naming differs by design).

export function fromLearningConfidence(lc: LearningConfidence): InsightConfidence {
  if (lc === 'insufficient') return 'insufficient_data'
  return lc as InsightConfidence
}

// ── Report confidence ─────────────────────────────────────────────────────────

export function scoreReportInsightConfidence(
  totalMemories:    number,
  insightCount:     number,
  opportunityCount: number,
): InsightConfidence {
  if (totalMemories < MIN_TOTAL_FOR_ANY)  return 'insufficient_data'
  if (insightCount === 0)                 return 'insufficient_data'
  if (totalMemories >= STRONG_TOTAL_COUNT && insightCount >= 3) return 'medium'
  return 'low'
}

// ── Limitations builder ────────────────────────────────────────────────────────

export function buildInsightLimitations(
  totalMemories:    number,
  insightCount:     number,
  opportunityCount: number,
): string[] {
  const limitations: string[] = []

  limitations.push('All insights are observation-based — no causation is inferred.')
  limitations.push('Confidence and evidence strength are scored independently and must not be conflated.')

  if (totalMemories < MIN_TOTAL_FOR_ANY) {
    limitations.push(
      `Only ${totalMemories} memory record${totalMemories !== 1 ? 's' : ''} loaded — ` +
      'insight detection requires at least 5 records.',
    )
  }

  if (insightCount === 0) {
    limitations.push('No insights detected — insufficient signal volume in current memory.')
  }

  if (opportunityCount === 0) {
    limitations.push('No opportunities detected — positive signal density is below threshold.')
  }

  limitations.push('Insights reflect the loaded memory window only — long-term patterns may not be detectable.')
  limitations.push('Investigation outcomes are not yet recorded — V2 will close the feedback loop.')

  return limitations
}

// ── Evidence strength disclosure ──────────────────────────────────────────────

export function buildEvidenceStrengthDisclosure(
  strength:    EvidenceStrength,
  confidence:  InsightConfidence,
): string {
  if (strength === 'strong' && (confidence === 'high' || confidence === 'medium')) {
    return 'Strong evidence and medium-to-high confidence. This pattern is well-supported.'
  }
  if (strength === 'strong' && confidence === 'low') {
    return 'Strong evidence volume but low confidence — the data is abundant but mixed or noisy.'
  }
  if (strength === 'moderate' && confidence === 'medium') {
    return 'Moderate evidence with medium confidence. Pattern is emerging but not yet fully established.'
  }
  if (strength === 'weak' && confidence === 'low') {
    return 'Weak evidence and low confidence — early signal only. Treat with significant caution.'
  }
  if (strength === 'weak') {
    return 'Weak evidence — sparse data. Do not act on this insight without further investigation.'
  }
  return `Evidence: ${strength}. Confidence: ${confidence}.`
}
