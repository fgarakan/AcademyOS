// Sprint 1741 — DONNA Academy Intelligence Engine V1
// Orchestrates all domain intelligence modules and produces a unified report.
// Pure TypeScript. No DB calls. No mutations.
// All analysis runs on already-loaded DirectorDonnaContext.
//
// Design rules:
//   - Only assert what the data actually shows.
//   - Always include confidence + limitations.
//   - Never hallucinate metrics or trends.
//   - No blame language for coaches or players.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import { buildProgressionObservations } from '@/lib/donna/intelligence/progressionIntelligence'
import { buildCurriculumBottleneckObservations } from '@/lib/donna/intelligence/curriculumBottleneckIntelligence'
import { buildCoachImpactObservations } from '@/lib/donna/intelligence/coachImpactIntelligence'
import { buildRetentionObservations } from '@/lib/donna/intelligence/retentionIntelligence'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ObservationCategory =
  | 'progression'
  | 'retention'
  | 'coach_impact'
  | 'curriculum_health'
  | 'assessment_health'
  | 'parent_communication'
  | 'academy_operations'

export type ObservationSeverity = 'critical' | 'warning' | 'info' | 'positive'

export type ObservationConfidence = 'high' | 'partial' | 'low'

export interface AcademyObservation {
  id:                string
  category:          ObservationCategory
  severity:          ObservationSeverity
  title:             string
  summary:           string
  /** Specific data points supporting the observation — shown to director */
  evidence:          string[]
  /** Player names relevant to this observation (empty if not applicable) */
  affectedPlayers:   string[]
  /** Level display names relevant to this observation */
  affectedLevels:    string[]
  /** Coach identifiers — may be empty when names are not loaded in context */
  affectedCoaches:   string[]
  recommendedAction: string
  /** Route to navigate to for director follow-up (null = no specific page) */
  destination:       string | null
  confidence:        ObservationConfidence
  /** Honest notes about data gaps that affect this observation */
  limitations:       string[]
}

export interface AcademyIntelligenceReport {
  generatedAt:          string
  observations:         AcademyObservation[]
  topObservation:       AcademyObservation | null
  criticalCount:        number
  warningCount:         number
  positiveCount:        number
  dataConfidence:       ObservationConfidence
  reportLimitations:    string[]
}

// ─── Severity ordering ─────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<ObservationSeverity, number> = {
  critical: 0,
  warning:  1,
  info:     2,
  positive: 3,
}

// ─── Report-level limitations (always shown) ───────────────────────────────────

function buildReportLimitations(ctx: DirectorDonnaContext): string[] {
  const lims: string[] = []
  const rosterSize = ctx.playerCurriculumStateSummaries.length
  if (rosterSize < ctx.playerCount) {
    lims.push(`Player analysis uses ${rosterSize} of ${ctx.playerCount} players — patterns shown may not represent the full academy.`)
  }
  if (!ctx.playerProgressStallContextAvailable) {
    lims.push('Player progress stall data is unavailable — stall signals may be incomplete.')
  }
  if (!ctx.assessmentContextAvailable) {
    lims.push('Assessment data is unavailable — assessment health signals are limited.')
  }
  if (ctx.coachCount > 0 && rosterSize === 0) {
    lims.push('No player curriculum state data loaded — progression analysis cannot run.')
  }
  return lims
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export function buildAcademyIntelligenceReport(
  ctx: DirectorDonnaContext,
): AcademyIntelligenceReport {
  const generatedAt = new Date().toISOString()

  const allObservations: AcademyObservation[] = [
    ...buildProgressionObservations(ctx),
    ...buildCurriculumBottleneckObservations(ctx),
    ...buildCoachImpactObservations(ctx),
    ...buildRetentionObservations(ctx),
  ]

  allObservations.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const criticalCount  = allObservations.filter(o => o.severity === 'critical').length
  const warningCount   = allObservations.filter(o => o.severity === 'warning').length
  const positiveCount  = allObservations.filter(o => o.severity === 'positive').length
  const topObservation = allObservations[0] ?? null

  const dataConfidence: ObservationConfidence =
    ctx.confidence === 'high'        ? 'high' :
    ctx.confidence === 'partial'     ? 'partial' : 'low'

  return {
    generatedAt,
    observations:      allObservations,
    topObservation,
    criticalCount,
    warningCount,
    positiveCount,
    dataConfidence,
    reportLimitations: buildReportLimitations(ctx),
  }
}

// ─── Format report as DONNA message ──────────────────────────────────────────

export function formatIntelligenceReportAsMessage(
  report: AcademyIntelligenceReport,
): string {
  if (report.observations.length === 0) {
    return "I don't have enough data to generate academy intelligence right now. Make sure players have curriculum states and coaches have submitted recent wrap-ups."
  }

  const lines: string[] = []

  if (report.criticalCount > 0) {
    lines.push(`**${report.criticalCount} critical signal${report.criticalCount !== 1 ? 's' : ''}** need your attention.`)
  }
  if (report.warningCount > 0) {
    lines.push(`**${report.warningCount} warning${report.warningCount !== 1 ? 's' : ''}** worth monitoring.`)
  }
  if (report.positiveCount > 0) {
    lines.push(`**${report.positiveCount} positive signal${report.positiveCount !== 1 ? 's' : ''}** in the data.`)
  }

  lines.push('')

  const top3 = report.observations.slice(0, 3)
  for (const obs of top3) {
    const prefix = obs.severity === 'critical' ? '🔴' : obs.severity === 'warning' ? '🟡' : obs.severity === 'positive' ? '🟢' : 'ℹ️'
    lines.push(`${prefix} **${obs.title}**`)
    lines.push(obs.summary)
    if (obs.evidence.length > 0) {
      lines.push(`Evidence: ${obs.evidence.slice(0, 2).join(' · ')}`)
    }
    lines.push('')
  }

  if (report.topObservation?.recommendedAction) {
    lines.push(`**Recommended first action:** ${report.topObservation.recommendedAction}`)
  }

  if (report.reportLimitations.length > 0) {
    lines.push('')
    lines.push(`_Data note: ${report.reportLimitations[0]}_`)
  }

  return lines.join('\n')
}
