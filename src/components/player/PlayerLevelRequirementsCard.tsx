import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { formatDate } from '@/lib/utils'

const DOMAIN_BADGE: Record<string, string> = {
  Technical:         'text-sky-400   border-sky-400/30   bg-sky-400/5',
  Tactical:          'text-indigo-400 border-indigo-400/30 bg-indigo-400/5',
  Movement:          'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  Competition:       'text-orange-400 border-orange-400/30 bg-orange-400/5',
  Mentality:         'text-purple-400 border-purple-400/30 bg-purple-400/5',
  'Fitness Support': 'text-lime border-lime/30 bg-lime/5',
  Fitness:           'text-lime border-lime/30 bg-lime/5',
  Recovery:          'text-blue-400 border-blue-400/30 bg-blue-400/5',
  Lifestyle:         'text-pink-400 border-pink-400/30 bg-pink-400/5',
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  not_started:            { label: 'Not started',  classes: 'text-text-muted bg-surface-raised border-border' },
  observing:              { label: 'Observing',     classes: 'text-status-blue bg-status-blue/5 border-status-blue/20' },
  evidence_threshold_met: { label: 'Evidence met',  classes: 'text-lime bg-lime/5 border-lime/20' },
  confirmed:              { label: 'Confirmed',     classes: 'text-status-green bg-status-green/5 border-status-green/20' },
  waived:                 { label: 'Waived',        classes: 'text-status-orange bg-status-orange/5 border-status-orange/20' },
  blocked:                { label: 'Blocked',       classes: 'text-status-red bg-status-red/5 border-status-red/20' },
}

const TERMINAL_STATUSES = new Set(['confirmed', 'waived', 'blocked'])

interface GateRow {
  id: string
  domain: string
  criterion: string
  gate_type: string
  threshold: string
  evaluator: string
  cadence: string
  evidence_window: string | null
  sort_order: number
}

export interface GateStatusRow {
  status: string
  evidence_count: number
  last_evidence_at: string | null
}

interface Props {
  gates: GateRow[]
  currentLevelName: string | null
  nextLevelName: string | null
  hasCurriculumState: boolean
  gateActions?: Record<string, ReactNode>
  gateStatuses?: Record<string, GateStatusRow>
  confirmActions?: Record<string, ReactNode>
}

function GateStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: 'text-text-muted bg-surface-raised border-border' }
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

// Only parses thresholds that explicitly refer to observation count — e.g. "3 observations",
// "needs 3 observations", "3 coach observations". Returns null for performance standards
// ("7/10 rallies", "80% consistency"), coach-discretion criteria, and any threshold that
// does not contain the word "observation".
function parseObservationThreshold(threshold: string): number | null {
  if (!threshold) return null
  if (!threshold.toLowerCase().includes('observation')) return null
  const match = threshold.match(/\b(\d+)\b/)
  if (!match) return null
  const n = parseInt(match[1], 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function PlayerLevelRequirementsCard({
  gates,
  currentLevelName,
  nextLevelName,
  hasCurriculumState,
  gateActions,
  gateStatuses,
  confirmActions,
}: Props) {
  if (!hasCurriculumState) {
    return (
      <Card>
        <CardHeader>
          <p className="label-xs">Requirements to Advance</p>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-[11px] text-text-muted">
            Assign a curriculum level to see advancement requirements.
          </p>
        </CardContent>
      </Card>
    )
  }

  const gatesByDomain = gates.reduce<Record<string, GateRow[]>>((acc, g) => {
    acc[g.domain] = acc[g.domain] ?? []
    acc[g.domain].push(g)
    return acc
  }, {})

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="label-xs">Requirements to Advance</p>
            {nextLevelName && (
              <p className="text-[10px] text-text-muted mt-0.5">
                Gate criteria to exit <span className="text-text-secondary">{currentLevelName}</span> → <span className="text-lime">{nextLevelName}</span>
              </p>
            )}
          </div>
          <span className="text-[10px] font-mono text-text-muted shrink-0">{gates.length} gates</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {gates.length === 0 && (
          <p className="text-[11px] text-text-muted py-2">
            No gates defined for this level. Check the curriculum explorer for details.
          </p>
        )}

        {Object.entries(gatesByDomain).map(([domain, domainGates]) => (
          <div key={domain}>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold mb-1.5 ${
                DOMAIN_BADGE[domain] ?? 'text-text-muted border-border bg-surface-raised'
              }`}
            >
              {domain}
              <span className="opacity-60 font-mono">{domainGates.length}</span>
            </span>

            <div className="space-y-1.5">
              {domainGates.map(g => {
                const gs = gateStatuses?.[g.id]
                const parsedTarget = parseObservationThreshold(g.threshold)
                const isTerminal = TERMINAL_STATUSES.has(gs?.status ?? '')
                const thresholdMayBeMet =
                  parsedTarget !== null &&
                  (gs?.evidence_count ?? 0) >= parsedTarget &&
                  !isTerminal

                return (
                  <div
                    key={g.id}
                    className="px-3 py-2 rounded-lg border border-border bg-surface-raised"
                  >
                    <p className="text-[11px] text-text-secondary leading-snug">{g.criterion}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {g.threshold && (
                        <span className="text-[9px] text-text-muted">
                          Target: <span className="text-lime font-mono">{g.threshold}</span>
                        </span>
                      )}
                      {g.evaluator && (
                        <span className="text-[9px] text-text-muted">
                          Eval: <span className="text-text-secondary">{g.evaluator}</span>
                        </span>
                      )}
                      {g.evidence_window && (
                        <span className="text-[9px] text-text-muted">
                          Window: <span className="text-text-secondary">{g.evidence_window}</span>
                        </span>
                      )}
                    </div>

                    {/* Evidence status row */}
                    {gs ? (
                      <div className="mt-2 pt-2 border-t border-border space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <GateStatusBadge status={gs.status} />
                          {parsedTarget !== null ? (
                            <span className="text-[10px] text-text-muted font-mono">
                              {gs.evidence_count} / {parsedTarget} obs
                            </span>
                          ) : (
                            <span className="text-[10px] text-text-muted">
                              {gs.evidence_count} observation{gs.evidence_count !== 1 ? 's' : ''}
                            </span>
                          )}
                          {gs.last_evidence_at && (
                            <span className="text-[10px] text-text-muted">
                              · Last: {formatDate(gs.last_evidence_at)}
                            </span>
                          )}
                        </div>

                        {/* Observation-based readiness hint — only shown when count meets the parsed target */}
                        {thresholdMayBeMet && (
                          <div className="px-2.5 py-1.5 rounded-lg bg-lime/5 border border-lime/20 space-y-0.5">
                            <p className="text-[10px] text-lime font-medium">Evidence count target may be met</p>
                            <p className="text-[10px] text-text-muted">Director confirmation still required</p>
                          </div>
                        )}

                        {/* Ambiguous threshold — performance criteria cannot be auto-evaluated */}
                        {parsedTarget === null && !isTerminal && gs.evidence_count > 0 && (
                          <p className="text-[10px] text-text-muted italic">Review criteria manually</p>
                        )}

                        {confirmActions?.[g.id]}
                      </div>
                    ) : (
                      <p className="text-[10px] text-text-muted italic mt-2">
                        No evidence recorded yet. Record an observation when you see this skill in training.
                      </p>
                    )}

                    {gateActions?.[g.id]}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      </CardContent>
    </Card>
  )
}
