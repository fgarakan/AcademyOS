// Mega Sprint 2621–2650 — DONNA Operating Layer V1
// OperatingSignal — unified signal type produced by all academy watchers.
//
// Distinct from:
//   OperatingAttentionSignal (OperatingPartner layer, philosophy-fused)
//   DonnaAttentionPriority   (DirectorDonnaContext UI layer)
//   AcademySignal            (COO signal per category)
//
// OperatingSignal is the output contract of all watchers:
//   PlayerWatcher, CoachWatcher, ParentWatcher,
//   CurriculumWatcher, AssessmentWatcher, RecommendationWatcher, AttendanceWatcher.

// ── Core types ────────────────────────────────────────────────────────────────

export type OperatingSignalType =
  | 'risk'
  | 'opportunity'
  | 'attention'
  | 'escalation'
  | 'recommendation'

export type OperatingSignalSeverity  = 'critical' | 'high' | 'medium' | 'low'
export type OperatingSignalConfidence = 'high' | 'medium' | 'low'

export type OperatingSignalDomain =
  | 'players'
  | 'coaches'
  | 'parents'
  | 'curriculum'
  | 'assessments'
  | 'recommendations'
  | 'attendance'
  | 'academy'

export interface OperatingSignal {
  id:                 string
  type:               OperatingSignalType
  severity:           OperatingSignalSeverity
  confidence:         OperatingSignalConfidence
  domain:             OperatingSignalDomain
  title:              string
  reason:             string
  suggestedAction:    string
  targetEntityLabel:  string | null
  targetEntityRoute:  string | null
  ageDays:            number
  isEscalated:        boolean
  timestamp:          string
}

// ── Sort helper ────────────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<OperatingSignalSeverity, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
}

const TYPE_RANK: Record<OperatingSignalType, number> = {
  escalation:     5,
  risk:           4,
  attention:      3,
  recommendation: 2,
  opportunity:    1,
}

export function sortSignals(signals: OperatingSignal[]): OperatingSignal[] {
  return [...signals].sort((a, b) => {
    const typeA = TYPE_RANK[a.type]
    const typeB = TYPE_RANK[b.type]
    if (typeA !== typeB) return typeB - typeA
    const sevA = SEVERITY_RANK[a.severity]
    const sevB = SEVERITY_RANK[b.severity]
    if (sevA !== sevB) return sevB - sevA
    return b.ageDays - a.ageDays
  })
}

// ── Feed item type ─────────────────────────────────────────────────────────────
// Presentational wrapper for DonnaOperatingFeed UI

export interface OperatingFeedItem {
  signal:     OperatingSignal
  badgeLabel: string
  badgeCls:   string
  isNew:      boolean
}

export function buildFeedItems(signals: OperatingSignal[]): OperatingFeedItem[] {
  const badgeMap: Record<OperatingSignalType, { label: string; cls: string }> = {
    risk:           { label: 'Risk',           cls: 'text-status-red border-status-red/40 bg-status-red/10' },
    escalation:     { label: 'Escalated',      cls: 'text-status-red border-status-red/60 bg-status-red/20' },
    attention:      { label: 'Attention',      cls: 'text-status-orange border-status-orange/40 bg-status-orange/10' },
    recommendation: { label: 'Review',         cls: 'text-status-blue border-status-blue/40 bg-status-blue/10' },
    opportunity:    { label: 'Opportunity',    cls: 'text-status-green border-status-green/40 bg-status-green/10' },
  }

  return sortSignals(signals).slice(0, 10).map(signal => {
    const badge = badgeMap[signal.type]
    return {
      signal,
      badgeLabel: signal.isEscalated ? 'Escalated' : badge.label,
      badgeCls:   signal.isEscalated
        ? 'text-status-red border-status-red/60 bg-status-red/20'
        : badge.cls,
      isNew: signal.ageDays === 0,
    }
  })
}
