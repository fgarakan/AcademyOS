// Mega Sprint 2801–2830 — DONNA Academy Operating Intelligence V1
// RecommendationTrace: explainability layer for every DONNA recommendation.
//
// Every recommendation produced by the dnaRecommendationEngine must carry a
// RecommendationTrace. This makes DONNA auditable and answerable to:
//   "Why did DONNA recommend this?"
//   "How does this align with our academy DNA?"
//   "What data signals drove this recommendation?"
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Trace is computed deterministically from signals + context.
//   - All fields are human-readable strings — ready to display in DONNA explanations.

// ── Types ─────────────────────────────────────────────────────────────────────

export type TraceRiskLevel = 'critical' | 'high' | 'medium' | 'low'
export type TraceConfidence = 'high' | 'medium' | 'low'

export interface DataSignal {
  signal:    string   // e.g. "2 players stalled for 120+ days"
  source:    string   // e.g. "player_curriculum_states"
  strength:  'strong' | 'moderate' | 'weak'
}

export interface RecommendationTrace {
  /** What data signals triggered this recommendation */
  dataSignals: DataSignal[]
  /** Which DNA model tendency drove the priority level */
  academyDNAInfluence: string
  /** Which operating model standard is relevant */
  operatingModelInfluence: string
  /** How confident DONNA is in this recommendation */
  confidence: TraceConfidence
  /** One-paragraph rationale a director can read */
  rationale: string
  /** The specific next action suggested */
  suggestedAction: string
  /** Risk of ignoring this recommendation */
  riskIfIgnored: string
  /** Severity level */
  riskLevel: TraceRiskLevel
}

// ── Builder ───────────────────────────────────────────────────────────────────

export interface BuildTraceInput {
  dataSignals:              DataSignal[]
  academyDNAInfluence:     string
  operatingModelInfluence: string
  rationale:               string
  suggestedAction:         string
  riskIfIgnored:           string
  riskLevel:               TraceRiskLevel
}

export function buildRecommendationTrace(input: BuildTraceInput): RecommendationTrace {
  const confidence: TraceConfidence =
    input.dataSignals.filter(s => s.strength === 'strong').length >= 2 ? 'high'
    : input.dataSignals.filter(s => s.strength !== 'weak').length >= 1 ? 'medium'
    : 'low'

  return {
    dataSignals:              input.dataSignals,
    academyDNAInfluence:      input.academyDNAInfluence,
    operatingModelInfluence:  input.operatingModelInfluence,
    confidence,
    rationale:                input.rationale,
    suggestedAction:          input.suggestedAction,
    riskIfIgnored:            input.riskIfIgnored,
    riskLevel:                input.riskLevel,
  }
}
