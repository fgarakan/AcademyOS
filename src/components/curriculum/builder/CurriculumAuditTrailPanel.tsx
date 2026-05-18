import { Clock, CheckCircle2, XCircle, GitBranch, Play, Info } from 'lucide-react'

export interface AuditEntry {
  id: string
  action: string
  actor: string
  actorRole?: string
  timestamp: string
  outcome: 'approved' | 'rejected' | 'applied' | 'proposed'
  changeType?: string
  detail?: string
}

interface Props {
  entries: AuditEntry[]
  levelName: string
}

const OUTCOME_CONFIG: Record<AuditEntry['outcome'], {
  Icon: typeof Clock
  color: string
  bg: string
  border: string
  label: string
}> = {
  proposed: { Icon: GitBranch, color: 'text-text-muted',     bg: 'bg-surface',           border: 'border-border',             label: 'Proposed' },
  approved: { Icon: CheckCircle2, color: 'text-status-green', bg: 'bg-status-green/[0.04]', border: 'border-status-green/20',  label: 'Approved' },
  rejected: { Icon: XCircle,     color: 'text-status-red',   bg: 'bg-status-red/[0.04]',   border: 'border-status-red/20',    label: 'Rejected' },
  applied:  { Icon: Play,        color: 'text-lime',          bg: 'bg-lime/[0.04]',         border: 'border-lime/20',          label: 'Applied' },
}

function formatRelativeDate(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRole(role?: string): string {
  if (!role) return ''
  return role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function CurriculumAuditTrailPanel({ entries, levelName }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-border border-dashed p-6 text-center space-y-2">
        <Clock className="w-5 h-5 text-text-muted mx-auto" />
        <p className="text-[12px] text-text-secondary font-semibold">No changes recorded for {levelName}</p>
        <p className="text-[11px] text-text-muted">
          Approved curriculum changes appear here as an audit trail.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-text-muted" />
        <p className="text-[10px] text-text-muted">
          Showing {entries.length} change{entries.length !== 1 ? 's' : ''} for {levelName} — most recent first.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {entries.map((entry, idx) => {
          const cfg = OUTCOME_CONFIG[entry.outcome]
          const isLast = idx === entries.length - 1

          return (
            <div key={entry.id} className="flex gap-3">
              {/* Timeline spine */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${cfg.border} ${cfg.bg}`}>
                  <cfg.Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>
                {!isLast && <div className="w-px flex-1 bg-border min-h-[12px]" />}
              </div>

              {/* Entry content */}
              <div className={`flex-1 min-w-0 pb-4 ${isLast ? '' : ''}`}>
                <div className={`rounded-xl border ${cfg.border} ${cfg.bg} px-3 py-2.5 space-y-1`}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-[12px] font-semibold text-text-primary leading-snug">{entry.action}</p>
                    <span className={`text-[10px] font-semibold shrink-0 ${cfg.color}`}>{cfg.label}</span>
                  </div>

                  {entry.detail && (
                    <p className="text-[11px] text-text-muted leading-relaxed">{entry.detail}</p>
                  )}

                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-[10px] text-text-muted">
                      {entry.actor}{entry.actorRole ? ` · ${formatRole(entry.actorRole)}` : ''}
                    </span>
                    <span className="text-[10px] text-text-muted" title={new Date(entry.timestamp).toLocaleString()}>
                      {formatRelativeDate(entry.timestamp)}
                    </span>
                    {entry.changeType && (
                      <span className="text-[10px] text-text-muted capitalize">
                        {entry.changeType.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
