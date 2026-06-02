// Assessment Comparison Engine V1
//
// Compares two assessment score snapshots and produces a structured
// comparison result showing what improved, declined, or stayed the same.
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.
// Used by blueprintUpdateRecommendationEngine and DONNA development intelligence.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AssessmentSnapshot {
  id: string
  assessed_date: string
  technical_score: number | null
  tactical_score: number | null
  movement_score: number | null
  competition_score: number | null
  behavioral_score: number | null
  overall_score: number | null
  strengths: string[] | null
  weaknesses: string[] | null
  priorities: string[] | null
}

export type ScoreDomain = 'technical' | 'tactical' | 'movement' | 'competition' | 'behavioral' | 'overall'

export type ChangeLabel =
  | 'strong_improvement'   // delta > 1.5
  | 'improvement'          // delta 0.5 to 1.5
  | 'slight_improvement'   // delta 0.1 to 0.5
  | 'stable'               // delta -0.1 to 0.1
  | 'slight_decline'       // delta -0.5 to -0.1
  | 'decline'              // delta -1.5 to -0.5
  | 'strong_decline'       // delta < -1.5
  | 'no_data'              // one or both scores null

export interface ScoreDomainComparison {
  domain: ScoreDomain
  label: string            // human-readable domain name
  previousScore: number | null
  currentScore: number | null
  delta: number | null
  changeLabel: ChangeLabel
  /** True when this domain warrants focused attention (declining or still below threshold) */
  needsFocus: boolean
  /** True when this domain shows notable progress worth celebrating/noting */
  notableProgress: boolean
}

export interface AssessmentComparisonResult {
  previousAssessmentId: string
  currentAssessmentId: string
  previousDate: string
  currentDate: string
  daysBetween: number

  domains: ScoreDomainComparison[]

  // Summary counts
  improved: number
  declined: number
  stable: number
  noData: number

  // Derived flags
  /** True if overall score improved by more than 0.5 */
  overallImproved: boolean
  /** True if any domain declined by more than 1.0 — warrants attention */
  hasSignificantDecline: boolean
  /** True if overall score or 3+ domains improved — candidate for level review */
  readyForLevelReview: boolean
  /** True when enough time has passed AND sufficient data changed to warrant a blueprint update */
  blueprintUpdateRecommended: boolean

  /** Summary text suitable for DONNA to read */
  summaryText: string
}

// ── Score domain config ────────────────────────────────────────────────────────

const DOMAIN_CONFIG: Array<{ key: ScoreDomain; label: string; prevKey: keyof AssessmentSnapshot; currKey: keyof AssessmentSnapshot }> = [
  { key: 'technical',    label: 'Technical Skills',     prevKey: 'technical_score',    currKey: 'technical_score' },
  { key: 'tactical',     label: 'Tactical Awareness',   prevKey: 'tactical_score',     currKey: 'tactical_score' },
  { key: 'movement',     label: 'Movement & Fitness',   prevKey: 'movement_score',     currKey: 'movement_score' },
  { key: 'competition',  label: 'Competition Skills',   prevKey: 'competition_score',  currKey: 'competition_score' },
  { key: 'behavioral',   label: 'Mental Performance',   prevKey: 'behavioral_score',   currKey: 'behavioral_score' },
  { key: 'overall',      label: 'Overall',              prevKey: 'overall_score',      currKey: 'overall_score' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getChangeLabel(delta: number | null): ChangeLabel {
  if (delta === null) return 'no_data'
  if (delta > 1.5)    return 'strong_improvement'
  if (delta > 0.5)    return 'improvement'
  if (delta > 0.1)    return 'slight_improvement'
  if (delta >= -0.1)  return 'stable'
  if (delta >= -0.5)  return 'slight_decline'
  if (delta >= -1.5)  return 'decline'
  return 'strong_decline'
}

function changeLabelText(label: ChangeLabel, domain: string, prev: number | null, curr: number | null): string {
  if (label === 'no_data') return `${domain}: no data for comparison`
  const delta = curr !== null && prev !== null ? curr - prev : null
  const sign   = delta !== null ? (delta > 0 ? '+' : '') : ''
  const deltaStr = delta !== null ? `(${sign}${delta.toFixed(1)})` : ''
  switch (label) {
    case 'strong_improvement': return `${domain}: ${prev?.toFixed(1)} → ${curr?.toFixed(1)} ${deltaStr}, strong improvement`
    case 'improvement':        return `${domain}: ${prev?.toFixed(1)} → ${curr?.toFixed(1)} ${deltaStr}, improved`
    case 'slight_improvement': return `${domain}: ${prev?.toFixed(1)} → ${curr?.toFixed(1)} ${deltaStr}, slight improvement`
    case 'stable':             return `${domain}: ${curr?.toFixed(1)}, stable`
    case 'slight_decline':     return `${domain}: ${prev?.toFixed(1)} → ${curr?.toFixed(1)} ${deltaStr}, slight decline`
    case 'decline':            return `${domain}: ${prev?.toFixed(1)} → ${curr?.toFixed(1)} ${deltaStr}, declined`
    case 'strong_decline':     return `${domain}: ${prev?.toFixed(1)} → ${curr?.toFixed(1)} ${deltaStr}, significant decline`
    default:                   return `${domain}: no change`
  }
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1).getTime()
  const d2 = new Date(date2).getTime()
  return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24))
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Compare two assessment snapshots and produce a structured comparison result.
 * @param previous The earlier assessment
 * @param current The more recent assessment
 */
export function compareAssessments(
  previous: AssessmentSnapshot,
  current: AssessmentSnapshot,
): AssessmentComparisonResult {
  const domains: ScoreDomainComparison[] = DOMAIN_CONFIG.map(cfg => {
    const prev = previous[cfg.prevKey] as number | null
    const curr = current[cfg.currKey] as number | null
    const delta = prev !== null && curr !== null ? curr - prev : null
    const changeLabel = getChangeLabel(delta)

    const needsFocus = (
      changeLabel === 'decline' ||
      changeLabel === 'strong_decline' ||
      (curr !== null && curr < 5 && changeLabel !== 'strong_improvement')
    )

    const notableProgress = (
      changeLabel === 'strong_improvement' ||
      changeLabel === 'improvement' ||
      (changeLabel === 'slight_improvement' && curr !== null && curr >= 7)
    )

    return {
      domain:       cfg.key,
      label:        cfg.label,
      previousScore: prev,
      currentScore:  curr,
      delta,
      changeLabel,
      needsFocus,
      notableProgress,
    }
  })

  // Exclude 'overall' from counts (it's derived)
  const scoreDomains = domains.filter(d => d.domain !== 'overall')
  const improved  = scoreDomains.filter(d => ['strong_improvement', 'improvement', 'slight_improvement'].includes(d.changeLabel)).length
  const declined  = scoreDomains.filter(d => ['decline', 'strong_decline', 'slight_decline'].includes(d.changeLabel)).length
  const stable    = scoreDomains.filter(d => d.changeLabel === 'stable').length
  const noData    = scoreDomains.filter(d => d.changeLabel === 'no_data').length

  const overallDomain = domains.find(d => d.domain === 'overall')
  const overallImproved = (overallDomain?.delta ?? 0) > 0.5

  const hasSignificantDecline = scoreDomains.some(d =>
    d.domain !== 'overall' && (d.changeLabel === 'strong_decline' || d.changeLabel === 'decline')
  )

  // Level review candidate: overall improved OR 3+ domains improved
  const readyForLevelReview = overallImproved || improved >= 3

  // Blueprint update recommended if:
  //   - enough time has passed (14+ days) AND
  //   - something meaningful changed (2+ domains improved or any declined significantly)
  const days = daysBetween(previous.assessed_date, current.assessed_date)
  const blueprintUpdateRecommended = days >= 14 && (improved >= 2 || hasSignificantDecline)

  // Build summary text
  const lines: string[] = []
  scoreDomains.forEach(d => {
    if (d.changeLabel !== 'no_data') {
      lines.push(changeLabelText(d.changeLabel, d.label, d.previousScore, d.currentScore))
    }
  })

  const summaryLines = [
    `Assessment comparison (${days} days apart):`,
    ...lines,
    '',
    `Summary: ${improved} improved, ${declined} declined, ${stable} stable.`,
    readyForLevelReview ? 'Player may be ready for level review.' : '',
    hasSignificantDecline ? 'One or more domains show significant decline — review focus areas.' : '',
  ].filter(Boolean)

  return {
    previousAssessmentId: previous.id,
    currentAssessmentId:  current.id,
    previousDate:         previous.assessed_date,
    currentDate:          current.assessed_date,
    daysBetween:          days,
    domains,
    improved,
    declined,
    stable,
    noData,
    overallImproved,
    hasSignificantDecline,
    readyForLevelReview,
    blueprintUpdateRecommended,
    summaryText: summaryLines.join('\n'),
  }
}
