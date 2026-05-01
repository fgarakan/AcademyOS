import type { RequirementProgressRow } from './PlayerRequirementProgressReadOnly'

const DOMAIN_ORDER = ['skill', 'competition', 'fitness'] as const

const DOMAIN_LABELS: Record<string, string> = {
  skill:       'Skill Path',
  competition: 'Competition Path',
  fitness:     'Fitness Path',
}

const LABEL_COLORS: Record<string, string> = {
  'Not Configured':            'text-text-muted',
  'Not Started':               'text-text-muted',
  'Building Foundation':       'text-status-blue',
  'Developing':                'text-status-blue',
  'Strong Progress':           'text-status-orange',
  'Nearly Ready':              'text-status-orange',
  'Ready for Director Review': 'text-lime',
}

function computeReadinessLabel(rows: RequirementProgressRow[]): string {
  if (rows.length === 0) return 'Not Configured'
  const required = rows.filter(r => r.is_required)
  if (required.length === 0) return 'Not Configured'

  const metCount       = required.filter(r => r.status === 'met').length
  const blockedCount   = required.filter(r => r.status === 'blocked').length
  const evNeededCount  = required.filter(r => r.status === 'evidence_needed').length
  const totalEvidence  = rows.reduce((sum, r) => sum + r.evidence_count, 0)
  const pct            = metCount / required.length

  if (metCount === 0 && totalEvidence === 0) return 'Not Started'
  if (pct < 0.25) return 'Building Foundation'
  if (pct < 0.50) return 'Developing'
  if (pct < 0.75) return 'Strong Progress'
  if (pct < 0.90) return blockedCount === 0 ? 'Nearly Ready' : 'Strong Progress'
  return (blockedCount === 0 && evNeededCount === 0) ? 'Ready for Director Review' : 'Nearly Ready'
}

function computeExplanation(rows: RequirementProgressRow[], label: string): string {
  if (label === 'Not Configured') return 'No requirement rows are configured for this player yet.'

  const required         = rows.filter(r => r.is_required)
  const total            = required.length
  const metCount         = required.filter(r => r.status === 'met').length
  const inProgressCount  = required.filter(r => r.status === 'in_progress').length
  const blockedCount     = required.filter(r => r.status === 'blocked').length
  const evNeededCount    = required.filter(r => r.status === 'evidence_needed').length
  const totalEvidence    = rows.reduce((sum, r) => sum + r.evidence_count, 0)

  const domainData = DOMAIN_ORDER.map(key => {
    const req = required.filter(r => r.requirement_domain_key === key)
    if (req.length === 0) return null
    const met = req.filter(r => r.status === 'met').length
    return { label: DOMAIN_LABELS[key] ?? key, pct: met / req.length }
  }).filter((d): d is { label: string; pct: number } => d !== null)

  const strong = domainData.filter(d => d.pct >= 0.75).map(d => d.label)
  const weak   = domainData.filter(d => d.pct < 0.25).map(d => d.label)

  switch (label) {
    case 'Not Started':
      return 'Most requirements have not started yet. Continue collecting evidence and confirming progress.'
    case 'Building Foundation':
      if (totalEvidence > 0 && metCount === 0) {
        return 'The player has evidence in multiple domains, but several requirements still need staff confirmation.'
      }
      if (inProgressCount > 0) {
        return `${inProgressCount} requirement${inProgressCount !== 1 ? 's are' : ' is'} in progress. Continue gathering evidence and confirming with coaching staff.`
      }
      return 'Early-stage progress. Continue collecting evidence and confirming requirement statuses.'
    case 'Developing':
      if (weak.length > 0) {
        return `${weak.join(' and ')} still need${weak.length === 1 ? 's' : ''} more evidence. ${metCount} of ${total} required items confirmed.`
      }
      return `${metCount} of ${total} required items are met. Continue building evidence across all domains.`
    case 'Strong Progress':
      if (strong.length > 0 && weak.length > 0) {
        return `The player has strong progress in ${strong.join(' and ')}, but ${weak.join(' and ')} still need${weak.length === 1 ? 's' : ''} evidence.`
      }
      if (blockedCount > 0) {
        return `${metCount} of ${total} required items are met, but ${blockedCount} requirement${blockedCount !== 1 ? 's are' : ' is'} blocked and need${blockedCount !== 1 ? '' : 's'} attention.`
      }
      return `${metCount} of ${total} required items are met. Strong progress across all domains.`
    case 'Nearly Ready':
      if (evNeededCount > 0) {
        return `${metCount} of ${total} required items are met. ${evNeededCount} still need${evNeededCount !== 1 ? '' : 's'} evidence before they can be confirmed.`
      }
      return `Most required items are met (${metCount} of ${total}). A small number still need confirmation or evidence.`
    case 'Ready for Director Review':
      return 'Most required items are met. Director review may be appropriate, but no level change happens automatically.'
    default:
      return `${metCount} of ${total} required items are confirmed.`
  }
}

interface DomainStats {
  key: string
  label: string
  total: number
  met: number
  inProgress: number
  evidenceNeeded: number
  blocked: number
  notStarted: number
  evidence: number
}

function computeDomainStats(rows: RequirementProgressRow[]): DomainStats[] {
  const results: DomainStats[] = []
  for (const key of DOMAIN_ORDER) {
    const domain = rows.filter(r => r.requirement_domain_key === key)
    if (domain.length === 0) continue
    results.push({
      key,
      label:          DOMAIN_LABELS[key] ?? key,
      total:          domain.length,
      met:            domain.filter(r => r.status === 'met').length,
      inProgress:     domain.filter(r => r.status === 'in_progress').length,
      evidenceNeeded: domain.filter(r => r.status === 'evidence_needed').length,
      blocked:        domain.filter(r => r.status === 'blocked').length,
      notStarted:     domain.filter(r => r.status === 'not_started').length,
      evidence:       domain.reduce((sum, r) => sum + r.evidence_count, 0),
    })
  }
  return results
}

interface Props {
  rows: RequirementProgressRow[]
  currentLevelName: string | null
}

export function LevelReadinessSummary({ rows, currentLevelName }: Props) {
  if (rows.length === 0) return null

  const label       = computeReadinessLabel(rows)
  const explanation = computeExplanation(rows, label)
  const labelColor  = LABEL_COLORS[label] ?? 'text-text-muted'
  const domains     = computeDomainStats(rows)

  const total         = rows.length
  const met           = rows.filter(r => r.status === 'met').length
  const inProgress    = rows.filter(r => r.status === 'in_progress').length
  const evNeeded      = rows.filter(r => r.status === 'evidence_needed').length
  const blocked       = rows.filter(r => r.status === 'blocked').length
  const waived        = rows.filter(r => r.status === 'waived').length
  const notStarted    = rows.filter(r => r.status === 'not_started').length
  const totalEvidence = rows.reduce((sum, r) => sum + r.evidence_count, 0)

  const overallItems = [
    { label: 'Total requirements',  value: total,         color: 'text-text-primary' },
    { label: 'Met',                 value: met,           color: 'text-lime' },
    { label: 'In Progress',         value: inProgress,    color: 'text-status-blue' },
    { label: 'Evidence Needed',     value: evNeeded,      color: 'text-status-orange' },
    { label: 'Blocked',             value: blocked,       color: 'text-status-red' },
    { label: 'Not Started',         value: notStarted,    color: 'text-text-muted' },
    { label: 'Waived',              value: waived,        color: 'text-text-muted' },
    { label: 'Total evidence links',value: totalEvidence, color: 'text-text-secondary' },
  ]

  return (
    <div className="bg-surface border border-border rounded p-4 space-y-4">

      {/* Header row: title + level name + readiness label */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">
            Level Readiness Summary
          </p>
          {currentLevelName && (
            <p className="text-xs text-text-secondary">{currentLevelName}</p>
          )}
        </div>
        <span className={`text-sm font-medium font-mono shrink-0 ${labelColor}`}>
          {label}
        </span>
      </div>

      {/* Top guardrail */}
      <p className="text-[11px] text-text-muted leading-relaxed border-l-2 border-border pl-3">
        Internal readiness signal only. This does not move the player up, change levels, or publish anything to parents.
      </p>

      {/* Deterministic explanation */}
      <p className="text-xs text-text-secondary leading-relaxed">{explanation}</p>

      {/* Overall counts */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Overall</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {overallItems.map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted">{item.label}</span>
              <span className={`text-xs font-mono font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Domain breakdown */}
      {domains.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Domain Breakdown</p>
          <div className="space-y-2">
            {domains.map(d => {
              const domainItems = [
                { label: 'Total',           value: d.total,          color: 'text-text-secondary' },
                { label: 'Met',             value: d.met,            color: 'text-lime' },
                { label: 'In Progress',     value: d.inProgress,     color: 'text-status-blue' },
                { label: 'Evidence Needed', value: d.evidenceNeeded, color: 'text-status-orange' },
                { label: 'Blocked',         value: d.blocked,        color: 'text-status-red' },
                { label: 'Not Started',     value: d.notStarted,     color: 'text-text-muted' },
                { label: 'Evidence links',  value: d.evidence,       color: 'text-text-secondary' },
              ]
              return (
                <div key={d.key} className="bg-surface-raised border border-border rounded p-3 space-y-1.5">
                  <p className="text-[11px] font-medium text-text-primary">{d.label}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {domainItems.map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-[10px] text-text-muted">{item.label}</span>
                        <span className={`text-[11px] font-mono font-bold ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer guardrails */}
      <div className="pt-2 border-t border-border space-y-0.5">
        {[
          'This summary is internal.',
          'It is based on requirement status and evidence counts.',
          'It does not automatically move the player up.',
          'Promotion requires a future director-approved level movement workflow.',
        ].map(line => (
          <p key={line} className="text-[10px] text-text-muted">{line}</p>
        ))}
      </div>

    </div>
  )
}
