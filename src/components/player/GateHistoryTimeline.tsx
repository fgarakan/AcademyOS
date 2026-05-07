import { Card, CardHeader, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export interface GateAuditEntry {
  id: string
  action: string
  actor_id: string | null
  actor_display_name: string
  created_at: string
  payload: Record<string, unknown> | null
}

interface GateInfo {
  id: string
  criterion: string
}

interface Props {
  entries: GateAuditEntry[]
  levelGates: GateInfo[]
}

function entryLabel(action: string, payload: Record<string, unknown> | null): string {
  if (action === 'gate_status.director_decision') {
    const s = payload?.new_status as string | undefined
    if (s === 'confirmed') return 'Gate confirmed'
    if (s === 'waived') return 'Gate waived'
    return 'Gate decision'
  }
  if (action === 'gate_status.evidence_recorded') return 'Evidence recorded'
  return action
}

function entryBadgeClasses(action: string, payload: Record<string, unknown> | null): string {
  if (action === 'gate_status.director_decision') {
    const s = payload?.new_status as string | undefined
    if (s === 'waived') return 'text-status-orange bg-status-orange/5 border-status-orange/20'
    return 'text-status-green bg-status-green/5 border-status-green/20'
  }
  if (action === 'gate_status.evidence_recorded') {
    return 'text-status-blue bg-status-blue/5 border-status-blue/20'
  }
  return 'text-text-muted bg-surface-raised border-border'
}

export function GateHistoryTimeline({ entries, levelGates }: Props) {
  const gateById = new Map(levelGates.map(g => [g.id, g]))

  return (
    <Card>
      <CardHeader>
        <p className="label-xs">Recent Gate Activity</p>
        <p className="text-[10px] text-text-muted mt-0.5">
          Internal audit trail — director and head coach only.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {entries.length === 0 ? (
          <p className="text-[11px] text-text-muted italic py-2">
            No gate activity yet. Record evidence from a gate to start the history.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => {
              const p = entry.payload
              const gateId = (p?.gate_id as string | undefined) ?? null
              const gate = gateId ? gateById.get(gateId) : null

              // Criterion teaser — prefer payload snapshot (frozen at event time), fall back to current gate name
              const criterionRaw = (p?.gate_criterion as string | undefined) ?? gate?.criterion ?? null
              const criterionTeaser = criterionRaw
                ? criterionRaw.slice(0, 70) + (criterionRaw.length > 70 ? '…' : '')
                : null

              const isEvidence = entry.action === 'gate_status.evidence_recorded'
              const isDecision = entry.action === 'gate_status.director_decision'

              const evidenceCountAfter = isEvidence
                ? (p?.evidence_count_after as number | undefined) ?? null
                : null

              const evidenceText = isEvidence
                ? (p?.evidence_text as string | undefined) ?? null
                : null
              const evidenceTextTruncated = evidenceText
                ? evidenceText.slice(0, 80) + (evidenceText.length > 80 ? '…' : '')
                : null

              const newStatus = isDecision ? (p?.new_status as string | undefined) ?? null : null
              const oldStatus = isDecision ? (p?.old_status as string | undefined) ?? null : null
              const waiverReasonPresent = isDecision && !!(p?.waiver_reason_present)

              return (
                <div
                  key={entry.id}
                  className="px-3 py-2.5 rounded-lg border border-border bg-surface-raised space-y-1.5"
                >
                  {/* Header row: badge + timestamp */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${entryBadgeClasses(entry.action, entry.payload)}`}
                    >
                      {entryLabel(entry.action, entry.payload)}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono shrink-0">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>

                  {/* Gate criterion teaser */}
                  {criterionTeaser && (
                    <p className="text-[10px] text-text-secondary leading-snug">{criterionTeaser}</p>
                  )}

                  {/* Actor + event-specific detail */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[10px] text-text-muted">
                      By <span className="text-text-secondary">{entry.actor_display_name}</span>
                    </span>

                    {isEvidence && evidenceCountAfter !== null && (
                      <span className="text-[10px] text-text-muted">
                        · <span className="text-lime font-mono">{evidenceCountAfter}</span> obs total
                      </span>
                    )}

                    {isDecision && oldStatus && newStatus && (
                      <span className="text-[10px] text-text-muted font-mono">
                        · {oldStatus} → <span className="text-status-green">{newStatus}</span>
                      </span>
                    )}

                    {waiverReasonPresent && (
                      <span className="text-[10px] text-status-orange">
                        · Waiver reason on record
                      </span>
                    )}
                  </div>

                  {/* Evidence text — truncated, labeled Internal */}
                  {evidenceTextTruncated && (
                    <p className="text-[10px] text-text-muted leading-snug">
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-text-muted/50 mr-1">
                        [Internal]
                      </span>
                      {evidenceTextTruncated}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
