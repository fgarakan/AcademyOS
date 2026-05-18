import { GitBranch, CheckCircle2, Clock } from 'lucide-react'

interface CurriculumVersion {
  id: string
  version_name: string
  status: 'active' | 'archived' | 'draft'
  created_at: string
  activated_at?: string | null
  notes?: string | null
}

interface Props {
  versions: CurriculumVersion[]
}

const STATUS_CONFIG = {
  active:   { label: 'Active',   color: 'text-status-green', Icon: CheckCircle2 },
  archived: { label: 'Archived', color: 'text-text-muted',   Icon: Clock },
  draft:    { label: 'Draft',    color: 'text-status-orange', Icon: GitBranch },
}

export function CurriculumVersionHistoryPanel({ versions }: Props) {
  if (versions.length === 0) {
    return (
      <div className="rounded-xl border border-border border-dashed p-5 text-center space-y-2">
        <GitBranch className="w-5 h-5 text-text-muted mx-auto" />
        <p className="text-[12px] text-text-secondary">No curriculum versions on file.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
        {versions.length} version{versions.length !== 1 ? 's' : ''}
      </p>
      {versions.map(v => {
        const cfg = STATUS_CONFIG[v.status]
        return (
          <div key={v.id} className="rounded-xl border border-border bg-surface-raised px-4 py-3 flex items-start gap-3">
            <cfg.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-text-primary">{v.version_name}</p>
              {v.notes && <p className="text-[11px] text-text-muted mt-0.5">{v.notes}</p>}
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-text-muted">
                  Created {new Date(v.created_at).toLocaleDateString()}
                </span>
                {v.activated_at && (
                  <span className="text-[10px] text-text-muted">
                    Activated {new Date(v.activated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
