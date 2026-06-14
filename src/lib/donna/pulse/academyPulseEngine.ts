// Sprint 2381–2410 — DONNA Daily Brief + Academy Pulse V1
// Academy Pulse Engine: derives a director-facing pulse from existing operation outputs.
// Pure TypeScript — no DB, no React, no side effects.
//
// Inputs:  AcademySituationAssessment + DirectorOperatingBrief + OperatingAttentionReport
// Outputs: AcademyPulse { pulseStatus, pulseSummary, topDrivers, confidence, dataInsufficient }
//
// Design rules:
//   - Purely derivational — no new data, no new queries
//   - If data is insufficient, says so explicitly — never fabricates a pulse
//   - topDrivers: max 3, sorted by severity (critical → high → medium)

import type { AcademySituationAssessment, DirectorOperatingBrief, SituationDomain } from '../operations/operatingPartnerOutputContract'
import type { OperatingAttentionReport } from '../operations/academyAttentionEngine'

// ── Types ──────────────────────────────────────────────────────────────────────

export type PulseStatus = 'excellent' | 'stable' | 'needs_attention' | 'critical'

export interface PulseDriver {
  domain:   SituationDomain
  headline: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface AcademyPulse {
  pulseStatus:      PulseStatus
  pulseSummary:     string
  topDrivers:       PulseDriver[]
  confidence:       'high' | 'medium' | 'low'
  dataInsufficient: boolean
}

// ── Status derivation ─────────────────────────────────────────────────────────

function derivePulseStatus(situation: AcademySituationAssessment): PulseStatus {
  if (situation.situationType === 'opportunity_to_double_down') return 'excellent'
  if (situation.severity === 'critical') return 'critical'
  if (situation.severity === 'high')    return 'needs_attention'
  return 'stable'
}

// ── Director-language summary ─────────────────────────────────────────────────

function buildPulseSummary(
  pulseStatus: PulseStatus,
  situation:   AcademySituationAssessment,
): string {
  if (pulseStatus === 'excellent') return 'There is strong momentum to build on today.'
  if (pulseStatus === 'critical')  return 'The academy needs your immediate attention.'

  if (pulseStatus === 'needs_attention') {
    const t = situation.situationType
    if (t === 'player_progression_bottleneck') return 'Player progression is blocked and needs action today.'
    if (t === 'coach_execution_gap')           return 'Coaching gaps are accumulating — follow-up needed.'
    if (t === 'curriculum_gap')                return 'Curriculum gaps are limiting player development.'
    if (t === 'parent_retention_risk')         return 'Parent retention risk is elevated — outreach needed.'
    if (t === 'assessment_debt')               return 'Assessment debt is accumulating across the academy.'
    if (t === 'communication_gap')             return 'The approval queue needs clearing before more can progress.'
    return 'A few things need your attention today.'
  }

  // stable
  const t = situation.situationType
  if (t === 'business_capacity_issue') return 'Business capacity requires monitoring this week.'
  if (t === 'philosophy_drift')        return 'The academy is gently drifting from its stated identity.'
  return 'The academy is running steadily.'
}

// ── Top drivers ───────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function buildTopDrivers(attentionReport: OperatingAttentionReport): PulseDriver[] {
  return attentionReport.signals
    .filter(s => s.dataAvailable && s.severity !== 'low')
    .sort((a, b) => (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0))
    .slice(0, 3)
    .map(s => ({
      domain:   s.domain,
      headline: s.headline,
      severity: s.severity as PulseDriver['severity'],
    }))
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function buildAcademyPulse(
  situation:       AcademySituationAssessment,
  brief:           DirectorOperatingBrief,
  attentionReport: OperatingAttentionReport,
): AcademyPulse {
  // Insufficient data: situation is unclear AND brief is not complete AND provisional
  const dataInsufficient =
    situation.situationType === 'unclear_cause_requires_review' &&
    !brief.isComplete &&
    brief.confidence === 'provisional'

  if (dataInsufficient) {
    return {
      pulseStatus:      'stable',
      pulseSummary:     'Academy Pulse is limited because setup data is incomplete.',
      topDrivers:       [],
      confidence:       'low',
      dataInsufficient: true,
    }
  }

  const pulseStatus  = derivePulseStatus(situation)
  const pulseSummary = buildPulseSummary(pulseStatus, situation)
  const topDrivers   = buildTopDrivers(attentionReport)

  const confidence: AcademyPulse['confidence'] =
    brief.confidence === 'reliable' ? 'high' :
    brief.priorities.length > 0    ? 'medium' :
                                     'low'

  return {
    pulseStatus,
    pulseSummary,
    topDrivers,
    confidence,
    dataInsufficient: false,
  }
}

// ── Pulse label helpers (for UI rendering) ────────────────────────────────────

export const PULSE_LABELS: Record<PulseStatus, string> = {
  excellent:       'Excellent',
  stable:          'Stable',
  needs_attention: 'Needs Attention',
  critical:        'Critical',
}

export const PULSE_DOT_CLASS: Record<PulseStatus, string> = {
  excellent:       'bg-lime',
  stable:          'bg-status-green',
  needs_attention: 'bg-status-orange',
  critical:        'bg-status-red',
}

export const PULSE_TEXT_CLASS: Record<PulseStatus, string> = {
  excellent:       'text-lime',
  stable:          'text-status-green',
  needs_attention: 'text-status-orange',
  critical:        'text-status-red',
}
