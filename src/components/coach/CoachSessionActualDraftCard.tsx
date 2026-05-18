import { CheckCircle, SkipForward, Edit, AlertTriangle, Calendar, Target } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

export type BlockDraftStatus = 'completed' | 'skipped' | 'modified'

export interface SessionActualBlockDraft {
  blockId: string
  blockName: string
  plannedDurationMin: number
  status: BlockDraftStatus
  note: string | null
}

export interface SessionActualDraft {
  draftId: string | null
  sessionId: string
  sessionName: string
  scheduledDate: string | null
  curriculumLevel: string | null
  templateName: string | null
  blocks: SessionActualBlockDraft[]
  overallNote: string | null
  nextFocus: string | null
  attendanceSummary: string | null
  submittedAt: string | null
  status: 'draft' | 'pending_review' | 'approved' | 'applied'
}

// ── Block status config ───────────────────────────────────────

const BLOCK_STATUS_CONFIG: Record<BlockDraftStatus, { label: string; icon: React.ReactNode; color: string }> = {
  completed: { label: 'Completed', icon: <CheckCircle className="w-3 h-3" />, color: 'text-status-green' },
  skipped:   { label: 'Skipped',   icon: <SkipForward className="w-3 h-3" />, color: 'text-text-muted' },
  modified:  { label: 'Modified',  icon: <Edit className="w-3 h-3" />,        color: 'text-status-orange' },
}

// ── Draft status pill ─────────────────────────────────────────

type DraftStatus = SessionActualDraft['status']

function DraftStatusPill({ status }: { status: DraftStatus }) {
  const config: Record<DraftStatus, { label: string; color: string }> = {
    draft:          { label: 'Local Draft',      color: 'text-text-muted border-border bg-surface-raised' },
    pending_review: { label: 'Pending Review',   color: 'text-status-orange border-status-orange/30 bg-status-orange/5' },
    approved:       { label: 'Approved',         color: 'text-status-green border-status-green/30 bg-status-green/5' },
    applied:        { label: 'Applied',          color: 'text-text-muted border-border bg-surface-raised' },
  }
  const { label, color } = config[status]
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  draft: SessionActualDraft
  showFullBlocks?: boolean
}

export function CoachSessionActualDraftCard({ draft, showFullBlocks = false }: Props) {
  const completedCount = draft.blocks.filter(b => b.status === 'completed').length
  const skippedCount   = draft.blocks.filter(b => b.status === 'skipped').length
  const modifiedCount  = draft.blocks.filter(b => b.status === 'modified').length
  const totalBlocks    = draft.blocks.length
  const hasIssues      = skippedCount > 0 || modifiedCount > 0

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Session Actual Draft</p>
          <p className="text-sm font-semibold text-text-primary truncate">{draft.sessionName}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {draft.scheduledDate && (
              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                <Calendar className="w-2.5 h-2.5" />
                {new Date(draft.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {draft.curriculumLevel && (
              <span className="text-[10px] text-lime">{draft.curriculumLevel}</span>
            )}
            {draft.templateName && (
              <span className="text-[10px] text-text-muted">Template: {draft.templateName}</span>
            )}
          </div>
        </div>
        <DraftStatusPill status={draft.status} />
      </div>

      {/* Block completion summary */}
      {totalBlocks > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-2">Planned vs Actual</p>
          <div className="flex gap-3 mb-2">
            <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-status-green/5 border border-status-green/20 min-w-[56px]">
              <p className="text-sm font-mono font-bold text-status-green">{completedCount}</p>
              <p className="text-[9px] text-text-muted">Done</p>
            </div>
            {modifiedCount > 0 && (
              <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-status-orange/5 border border-status-orange/20 min-w-[56px]">
                <p className="text-sm font-mono font-bold text-status-orange">{modifiedCount}</p>
                <p className="text-[9px] text-text-muted">Modified</p>
              </div>
            )}
            {skippedCount > 0 && (
              <div className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-surface-raised border border-border min-w-[56px]">
                <p className="text-sm font-mono font-bold text-text-muted">{skippedCount}</p>
                <p className="text-[9px] text-text-muted">Skipped</p>
              </div>
            )}
          </div>

          {/* Block list */}
          {(showFullBlocks || hasIssues) && (
            <div className="space-y-1.5">
              {draft.blocks.map(block => {
                if (!showFullBlocks && block.status === 'completed' && !block.note) return null
                const cfg = BLOCK_STATUS_CONFIG[block.status]
                return (
                  <div key={block.blockId} className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-text-primary truncate">{block.blockName}</p>
                        <span className="text-[9px] text-text-muted shrink-0">{block.plannedDurationMin}m</span>
                        <span className={`text-[9px] font-medium shrink-0 ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      {block.note && (
                        <p className="text-[10px] text-text-muted leading-snug mt-0.5">{block.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Overall note */}
      {draft.overallNote && (
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Session Overview</p>
          <p className="text-xs text-text-secondary leading-snug">{draft.overallNote}</p>
        </div>
      )}

      {/* Next focus */}
      {draft.nextFocus && (
        <div className="rounded-xl bg-surface-raised border border-border px-3 py-2 flex items-start gap-2">
          <Target className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] uppercase tracking-widest text-lime mb-0.5">Next Session Focus</p>
            <p className="text-xs text-text-secondary">{draft.nextFocus}</p>
          </div>
        </div>
      )}

      {/* Attendance */}
      {draft.attendanceSummary && (
        <p className="text-[10px] text-text-muted">{draft.attendanceSummary}</p>
      )}

      {/* Warnings */}
      {hasIssues && draft.status === 'pending_review' && (
        <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-status-orange/5 border border-status-orange/20">
          <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-secondary leading-snug">
            Session had skipped or modified blocks. Director will review before applying this to the session record.
          </p>
        </div>
      )}

      {/* Draft notice */}
      <p className="text-[9px] text-text-muted border-t border-border pt-2">
        Draft only — not applied to session records until director approves.
      </p>
    </div>
  )
}
