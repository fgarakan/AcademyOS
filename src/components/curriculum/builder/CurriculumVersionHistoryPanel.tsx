import { GitBranch, CheckCircle2, Clock, Archive, Layers } from 'lucide-react'

export interface CurriculumVersion {
  id: string
  version_name: string
  status: 'active' | 'archived' | 'draft'
  created_at: string
  activated_at?: string | null
  notes?: string | null
  changeCount?: number
}

interface Props {
  versions: CurriculumVersion[]
  levelName?: string
}

const STATUS_CONFIG: Record<CurriculumVersion['status'], {
  label: string
  color: string
  bg: string
  border: string
  Icon: typeof Clock
}> = {
  active:   { label: 'Active',   color: 'text-status-green',  bg: 'bg-status-green/[0.04]',  border: 'border-status-green/20', Icon: CheckCircle2 },
  draft:    { label: 'Draft',    color: 'text-status-orange', bg: 'bg-status-orange/[0.04]', border: 'border-status-orange/20', Icon: GitBranch },
  archived: { label: 'Archived', color: 'text-text-muted',    bg: 'bg-surface-raised',       border: 'border-border',           Icon: Archive },
}

export function CurriculumVersionHistoryPanel({ versions, levelName }: Props) {
  if (versions.length === 0) {
    return (
      <div className="rounded-2xl border border-border border-dashed p-6 text-center space-y-2">
        <GitBranch className="w-5 h-5 text-text-muted mx-auto" />
        <p className="text-[12px] text-text-secondary font-semibold">No version history recorded</p>
        <p className="text-[11px] text-text-muted leading-relaxed">
          When curriculum changes are applied to {levelName ?? 'this level'}, version snapshots will appear here.
        </p>
      </div>
    )
  }

  const activeVersion = versions.find(v => v.status === 'active')
  const otherVersions = versions.filter(v => v.status !== 'active')

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
        {versions.length} version{versions.length !== 1 ? 's' : ''}{levelName ? ` — ${levelName}` : ''}
      </p>

      {/* Active version — highlighted */}
      {activeVersion && (
        <div className={`rounded-2xl border ${STATUS_CONFIG.active.border} ${STATUS_CONFIG.active.bg} px-4 py-4 space-y-2`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
              <p className="text-[12px] font-semibold text-text-primary">{activeVersion.version_name}</p>
            </div>
            <span className="text-[10px] font-semibold text-status-green px-2 py-0.5 rounded-full bg-status-green/10 border border-status-green/20">
              Current version
            </span>
          </div>
          {activeVersion.notes && (
            <p className="text-[11px] text-text-muted leading-relaxed pl-6">{activeVersion.notes}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 pl-6">
            {activeVersion.activated_at && (
              <span className="text-[10px] text-text-muted">
                Active since {new Date(activeVersion.activated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {activeVersion.changeCount !== undefined && (
              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                <Layers className="w-3 h-3" />
                {activeVersion.changeCount} change{activeVersion.changeCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Older versions */}
      {otherVersions.length > 0 && (
        <div className="space-y-1.5">
          {activeVersion && (
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold pt-1">Earlier versions</p>
          )}
          {otherVersions.map(v => {
            const cfg = STATUS_CONFIG[v.status]
            return (
              <div key={v.id} className={`rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3 flex items-start gap-3`}>
                <cfg.Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-text-secondary">{v.version_name}</p>
                    <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  {v.notes && <p className="text-[11px] text-text-muted mt-0.5">{v.notes}</p>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-[10px] text-text-muted">
                      {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {v.changeCount !== undefined && (
                      <span className="text-[10px] text-text-muted">{v.changeCount} change{v.changeCount !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
