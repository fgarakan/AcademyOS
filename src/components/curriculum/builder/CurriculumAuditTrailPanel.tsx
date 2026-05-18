import { Clock, CheckCircle2, XCircle, GitBranch, AlertCircle } from 'lucide-react'

interface AuditEntry {
  id: string
  action: string
  actor: string
  timestamp: string
  outcome: 'approved' | 'rejected' | 'applied' | 'proposed'
  detail?: string
}

interface Props {
  entries: AuditEntry[]
  levelName: string
}

const OUTCOME_CONFIG: Record<AuditEntry['outcome'], { Icon: typeof Clock; color: string; label: string }> = {
  proposed: { Icon: GitBranch, color: 'text-text-muted',     label: 'Proposed' },
  approved: { Icon: CheckCircle2, color: 'text-status-green', label: 'Approved' },
  rejected: { Icon: XCircle,     color: 'text-status-red',   label: 'Rejected' },
  applied:  { Icon: CheckCircle2, color: 'text-lime',         label: 'Applied' },
}

export function CurriculumAuditTrailPanel({ entries, levelName }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border border-dashed p-5 text-center space-y-2">
        <Clock className="w-5 h-5 text-text-muted mx-auto" />
        <p className="text-[12px] text-text-secondary">No audit trail for {levelName}.</p>
        <p className="text-[11px] text-text-muted">Changes approved via the Review Queue will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-text-muted" />
        <p className="text-[10px] text-text-muted">Showing last {entries.length} curriculum actions for this level.</p>
      </div>

      <div className="space-y-1">
        {entries.map(entry => {
          const cfg = OUTCOME_CONFIG[entry.outcome]
          return (
            <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3">
              <cfg.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-text-primary">{entry.action}</p>
                {entry.detail && <p className="text-[11px] text-text-muted mt-0.5">{entry.detail}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-[10px] text-text-muted">{entry.actor}</span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
