// Sprint 1761 — DONNA Academy Learning Foundations V1
// Core types for the learning layer. Pure TypeScript. No DB calls. No mutations.
//
// V1 scope: decision tracking, recommendation acceptance, repeated patterns, playbook.
// V1 does NOT infer outcomes or causal relationships.
//
// OutcomeTrackingRecord and related types are scaffolded here so Outcome Learning
// (next sprint) can extend this foundation without restructuring the type layer.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import { buildDecisionTrackingSignals } from '@/lib/donna/learning/decisionTracking'
import { buildRecommendationLearningSignals } from '@/lib/donna/learning/recommendationLearning'
import { buildRepeatedPatternSignals } from '@/lib/donna/learning/repeatedPatternDetector'

// ─── Learning categories ──────────────────────────────────────────────────────

export type LearningCategory =
  | 'curriculum_learning'
  | 'progression_learning'
  | 'coach_learning'
  | 'assessment_learning'
  | 'retention_learning'
  | 'parent_communication_learning'
  | 'director_decision_learning'

export type LearningConfidence = 'high' | 'medium' | 'low' | 'insufficient'

// ─── Core learning signal ─────────────────────────────────────────────────────

export interface LearningSignal {
  id:                 string
  category:           LearningCategory
  title:              string
  summary:            string
  /** What the data shows — described with hedged language, no causal claims */
  observedPattern:    string
  supportingEvidence: string[]
  affectedPlayers:    string[]
  affectedLevels:     string[]
  /** IDs or labels of decisions that support this signal */
  relatedDecisions:   string[]
  recommendation:     string
  confidence:         LearningConfidence
  limitations:        string[]
  nextAction:         string
  destination:        string | null
}

// ─── Learning report ──────────────────────────────────────────────────────────

export interface AcademyLearningReport {
  generatedAt:     string
  signals:         LearningSignal[]
  topSignal:       LearningSignal | null
  signalCount:     number
  dataDepth:       LearningConfidence
  reportLimitations: string[]
}

// ─── Outcome tracking scaffold (for next sprint) ─────────────────────────────
//
// These types define the data structures that Outcome Learning V2 will populate.
// V1 does not fill these — they exist so the schema is stable before V2 builds on it.

/** Represents a trackable outcome observation linked to a past decision. */
export interface OutcomeTrackingRecord {
  /** ID of the original decision (proposed_action or curriculum draft) */
  decisionId:        string
  decisionLabel:     string
  decisionType:      string
  decisionStatus:    'approved' | 'rejected' | 'modified' | 'executed'
  decidedAt:         string
  /** Outcome observation window — how many days after the decision to look for signals */
  observationWindowDays: number
  /** Whether outcome data has been collected yet (always false in V1) */
  outcomeObserved:   boolean
  /** What was observed, if anything (null in V1) */
  outcomeDescription: string | null
  /** Confidence in the outcome observation (null in V1) */
  outcomeConfidence: LearningConfidence | null
}

/** Links a learning signal to future outcome tracking. */
export interface LearningSignalWithOutcome extends LearningSignal {
  /** Populated by Outcome Learning V2 */
  outcomeRecords:    OutcomeTrackingRecord[]
  /** True once V2 has populated outcome observations */
  outcomesAvailable: boolean
}

/** Summary of the academy's decision→outcome learning state. */
export interface OutcomeLearningReadiness {
  /** How many recent decisions are available for outcome tracking */
  decisionsAvailableForTracking: number
  /** Days until enough history for meaningful outcome learning (rough estimate) */
  estimatedReadyInDays:          number | null
  /** Whether outcome learning can begin (requires >30 decisions with outcomes) */
  readyForOutcomeLearning:       boolean
  limitationNote:                string
}

/** Build the outcome learning readiness snapshot. Used by V2. */
export function buildOutcomeLearningReadiness(
  ctx: DirectorDonnaContext,
): OutcomeLearningReadiness {
  const n = ctx.recentDecisions.length
  const ready = n >= 30 && ctx.recentDecisionContextAvailable
  const daysEstimate = ready ? null : Math.max(0, (30 - n) * 7) // rough: 1 decision/week

  return {
    decisionsAvailableForTracking: n,
    estimatedReadyInDays:          ready ? null : daysEstimate,
    readyForOutcomeLearning:       ready,
    limitationNote: ready
      ? 'Sufficient decision history for outcome tracking.'
      : `Outcome learning requires more decision history. Currently ${n} of ~30 minimum decisions available. Continue approving/rejecting director decisions to build learning depth.`,
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

function buildReportLimitations(ctx: DirectorDonnaContext): string[] {
  const lims: string[] = [
    `Decision history is limited to the last ${ctx.recentDecisions.length} loaded decisions — long-term patterns are not yet detectable.`,
    'V1 learning observes patterns only — no outcome causality is inferred.',
  ]
  if (!ctx.recentDecisionContextAvailable) {
    lims.unshift('Recent decision data is unavailable — learning signals are minimal.')
  }
  return lims
}

export function buildAcademyLearningReport(ctx: DirectorDonnaContext): AcademyLearningReport {
  const signals: LearningSignal[] = [
    ...buildDecisionTrackingSignals(ctx),
    ...buildRecommendationLearningSignals(ctx),
    ...buildRepeatedPatternSignals(ctx),
  ]

  const topSignal = signals[0] ?? null

  const dataDepth: LearningConfidence =
    ctx.recentDecisions.length >= 10 ? 'medium' :
    ctx.recentDecisions.length >= 3  ? 'low'    : 'insufficient'

  return {
    generatedAt:      new Date().toISOString(),
    signals,
    topSignal,
    signalCount:      signals.length,
    dataDepth,
    reportLimitations: buildReportLimitations(ctx),
  }
}

export function formatLearningReportAsMessage(report: AcademyLearningReport): string {
  if (report.signals.length === 0 || report.dataDepth === 'insufficient') {
    return [
      '**Observed Pattern:**',
      'Not enough decision history yet to surface learning signals.',
      '',
      '**Confidence:** Insufficient',
      '',
      '**Evidence:**',
      `• ${report.reportLimitations[0]}`,
      '',
      '**Limitations:**',
      '• Learning requires a history of director decisions and review queue activity.',
      '',
      '**Recommended Next Action:**',
      'Continue approving, rejecting, and modifying DONNA recommendations — each decision builds the learning foundation.',
    ].join('\n')
  }

  const lines: string[] = []
  lines.push(`**Observed Pattern:**`)
  lines.push(`${report.signals.length} learning signal${report.signals.length !== 1 ? 's' : ''} detected from decision history.`)
  lines.push('')

  for (const sig of report.signals.slice(0, 3)) {
    lines.push(`**${sig.title}**`)
    lines.push(sig.observedPattern)
    if (sig.supportingEvidence.length > 0) {
      lines.push(`Evidence: ${sig.supportingEvidence.slice(0, 2).join(' · ')}`)
    }
    lines.push('')
  }

  if (report.topSignal) {
    lines.push(`**Recommended Next Action:** ${report.topSignal.nextAction}`)
  }

  lines.push('')
  lines.push(`**Confidence:** ${report.dataDepth === 'medium' ? 'Medium' : 'Low'}`)
  lines.push(`_Note: ${report.reportLimitations[0]}_`)

  return lines.join('\n')
}
