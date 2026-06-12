// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// Academy Situation Banner: always-visible top strip powered by AcademySituationAssessment.
// This is the "Academy Weather" — the Director always knows what situation the academy is in.

import type { AcademySituationAssessment, SituationSeverity, SituationType } from '@/lib/donna/operations/operatingPartnerOutputContract'

interface Props {
  situation:   AcademySituationAssessment
  generatedAt: string
}

const SITUATION_LABELS: Record<SituationType, string> = {
  player_progression_bottleneck: 'Player Progression Bottleneck',
  coach_execution_gap:           'Coach Execution Gap',
  curriculum_gap:                'Curriculum Gap',
  parent_retention_risk:         'Parent Retention Risk',
  business_capacity_issue:       'Business Capacity Issue',
  philosophy_drift:              'Philosophy Drift',
  opportunity_to_double_down:    'Opportunity To Double Down',
  assessment_debt:               'Assessment Debt',
  communication_gap:             'Communication Gap',
  unclear_cause_requires_review: 'Under Review — Gathering Data',
}

const SEVERITY_STYLES: Record<SituationSeverity, { dot: string; text: string; bg: string }> = {
  critical: { dot: 'bg-status-red',    text: 'text-status-red',    bg: 'bg-status-red/10 border-status-red/30' },
  high:     { dot: 'bg-status-orange', text: 'text-status-orange', bg: 'bg-status-orange/10 border-status-orange/30' },
  medium:   { dot: 'bg-status-blue',   text: 'text-status-blue',   bg: 'bg-status-blue/10 border-status-blue/30' },
  low:      { dot: 'bg-status-green',  text: 'text-status-green',  bg: 'bg-status-green/10 border-status-green/30' },
}

const OPPORTUNITY_STYLES = {
  dot: 'bg-lime', text: 'text-lime', bg: 'bg-lime/10 border-lime/30',
}

function relativeTime(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 2)   return 'just now'
  if (diffMin < 60)  return `${diffMin} minutes ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24)   return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
  return `${Math.floor(diffHr / 24)} day${Math.floor(diffHr / 24) > 1 ? 's' : ''} ago`
}

export function AcademySituationBanner({ situation, generatedAt }: Props) {
  const isOpportunity = situation.situationType === 'opportunity_to_double_down'
  const styles = isOpportunity ? OPPORTUNITY_STYLES : SEVERITY_STYLES[situation.severity]

  const confidencePct = Math.round(
    (situation.confidence === 'reliable' ? 0.87 : 0.62) * 100,
  )

  return (
    <div className={`rounded-xl border px-5 py-3 flex items-center gap-4 flex-wrap ${styles.bg}`}>
      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />

      {/* Situation label */}
      <span className={`text-sm font-semibold ${styles.text} flex-shrink-0`}>
        {SITUATION_LABELS[situation.situationType]}
      </span>

      {/* Divider */}
      <span className="text-border hidden sm:block">|</span>

      {/* Summary */}
      <span className="text-sm text-text-secondary flex-1 min-w-0 truncate">
        {situation.evidenceSummary}
      </span>

      {/* Meta */}
      <div className="flex items-center gap-3 ml-auto flex-shrink-0">
        <span className="label-xs text-text-muted">
          Confidence: {confidencePct}%
        </span>
        <span className="label-xs text-text-muted hidden md:block">
          Updated {relativeTime(generatedAt)}
        </span>
      </div>
    </div>
  )
}
