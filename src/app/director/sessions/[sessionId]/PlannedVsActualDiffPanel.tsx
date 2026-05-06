import { CheckCircle2, XCircle, Pencil, HelpCircle, ArrowRight, Info, Target, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import type { SessionActualDraftPayload, BlockCompletionDraft } from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'

interface PlannedBlock {
  id: string
  name: string
  duration_min: number | null
  type: string
}

interface SessionExerciseActual {
  id: string
  block_id: string
  exerciseName: string
  exerciseCategory: string
  completed: boolean
  notes: string | null
  duration_min: number | null
}

interface Props {
  plannedBlocks: PlannedBlock[]
  wrapUpPayload: SessionActualDraftPayload | null
  wrapUpStatus: string | null
  sessionExercises?: SessionExerciseActual[]
}

function BlockStatusIcon({ status }: { status: BlockCompletionDraft['status'] | 'unknown' }) {
  if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
  if (status === 'skipped') return <XCircle className="w-3.5 h-3.5 text-status-red shrink-0" />
  if (status === 'modified') return <Pencil className="w-3.5 h-3.5 text-status-orange shrink-0" />
  return <HelpCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />
}

function statusLabel(status: BlockCompletionDraft['status'] | 'unknown') {
  if (status === 'completed') return 'Completed'
  if (status === 'skipped') return 'Skipped'
  if (status === 'modified') return 'Modified'
  return 'Unknown — not in wrap-up'
}

function statusColor(status: BlockCompletionDraft['status'] | 'unknown') {
  if (status === 'completed') return 'text-status-green'
  if (status === 'skipped') return 'text-status-red'
  if (status === 'modified') return 'text-status-orange'
  return 'text-text-muted'
}

export function PlannedVsActualDiffPanel({ plannedBlocks, wrapUpPayload, wrapUpStatus, sessionExercises = [] }: Props) {
  if (!wrapUpPayload) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-text-muted text-sm">No coach wrap-up submitted for this session yet.</p>
          <p className="text-text-muted text-xs mt-1">
            The planned vs actual view appears after a coach completes the guided wrap-up.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Build lookup: block_id → completion data from wrap-up
  const completionByBlockId = new Map<string, BlockCompletionDraft>()
  const completionByName = new Map<string, BlockCompletionDraft>()
  for (const bc of wrapUpPayload.block_completion) {
    if (bc.block_id) completionByBlockId.set(bc.block_id, bc)
    if (bc.block_name) completionByName.set(bc.block_name.toLowerCase().trim(), bc)
  }

  // Group session exercises by block_id
  const exercisesByBlock = new Map<string, SessionExerciseActual[]>()
  for (const ex of sessionExercises) {
    const list = exercisesByBlock.get(ex.block_id) ?? []
    list.push(ex)
    exercisesByBlock.set(ex.block_id, list)
  }

  // Match each planned block to its wrap-up completion (by ID first, then name)
  const diffRows = plannedBlocks.map(block => {
    const completion = completionByBlockId.get(block.id)
      ?? completionByName.get(block.name.toLowerCase().trim())
      ?? null
    return {
      block,
      completion,
      status: (completion?.status ?? 'unknown') as BlockCompletionDraft['status'] | 'unknown',
      exercises: exercisesByBlock.get(block.id) ?? [],
    }
  })

  const completedCount = diffRows.filter(r => r.status === 'completed').length
  const skippedCount = diffRows.filter(r => r.status === 'skipped').length
  const modifiedCount = diffRows.filter(r => r.status === 'modified').length
  const unknownCount = diffRows.filter(r => r.status === 'unknown').length

  const wrapUpStatusLabel =
    wrapUpStatus === 'executed' ? 'applied'
    : wrapUpStatus === 'approved' ? 'approved — not yet applied'
    : wrapUpStatus === 'pending_review' ? 'pending director review'
    : wrapUpStatus === 'rejected' ? 'rejected'
    : wrapUpStatus ?? 'submitted'

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex flex-wrap gap-4 px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Wrap-Up Status</p>
          <p className="text-xs font-medium text-text-primary capitalize">{wrapUpStatusLabel}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Completed</p>
          <p className="text-xs font-mono font-bold text-status-green">{completedCount}</p>
        </div>
        {modifiedCount > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Modified</p>
            <p className="text-xs font-mono font-bold text-status-orange">{modifiedCount}</p>
          </div>
        )}
        {skippedCount > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Skipped</p>
            <p className="text-xs font-mono font-bold text-status-red">{skippedCount}</p>
          </div>
        )}
        {unknownCount > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Unknown</p>
            <p className="text-xs font-mono font-bold text-text-muted">{unknownCount}</p>
          </div>
        )}
      </div>

      {/* Per-block diff rows */}
      <div className="space-y-2">
        {diffRows.map(row => (
          <div
            key={row.block.id}
            className="rounded-xl bg-surface-raised border border-border overflow-hidden"
          >
            <div className="flex items-start gap-3 px-3 py-2.5">
              {/* Planned block */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">Planned</p>
                <p className="text-xs font-medium text-text-primary truncate">{row.block.name}</p>
                {row.block.duration_min && (
                  <p className="text-[10px] text-text-muted">{row.block.duration_min} min · {row.block.type}</p>
                )}
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-3" />

              {/* Actual status */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">Actual</p>
                <div className="flex items-center gap-1.5">
                  <BlockStatusIcon status={row.status} />
                  <p className={`text-xs font-medium ${statusColor(row.status)}`}>
                    {statusLabel(row.status)}
                  </p>
                </div>
                {row.completion?.note && (
                  <p className="text-[11px] text-text-muted mt-0.5 italic">"{row.completion.note}"</p>
                )}
              </div>
            </div>

            {/* Exercise-level actuals — shown when session exercises are available */}
            {row.exercises.length > 0 && (
              <div className="border-t border-border px-3 py-2 space-y-1">
                {row.exercises.map(ex => {
                  const isSkipped = ex.notes?.startsWith('[Skipped]') ?? false
                  const isModified = ex.notes?.startsWith('[Modified]') ?? false
                  const noteText = ex.notes
                    ? ex.notes.replace(/^\[(Skipped|Modified)\]\s*/, '')
                    : null
                  return (
                    <div key={ex.id} className="flex items-start gap-2 py-0.5">
                      {isSkipped ? (
                        <XCircle className="w-3 h-3 text-status-red shrink-0 mt-0.5" />
                      ) : isModified ? (
                        <Pencil className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
                      ) : ex.completed ? (
                        <CheckCircle2 className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] ${
                          isSkipped ? 'text-text-muted line-through' :
                          isModified ? 'text-status-orange' :
                          ex.completed ? 'text-text-secondary' :
                          'text-text-muted'
                        }`}>
                          {ex.exerciseName}
                          {isSkipped && <span className="ml-1 text-status-red not-italic font-medium">(skipped)</span>}
                          {isModified && <span className="ml-1 text-status-orange not-italic font-medium">(modified)</span>}
                        </p>
                        {noteText && (
                          <p className="text-[10px] text-text-muted italic">{noteText}</p>
                        )}
                      </div>
                      {ex.duration_min && (
                        <span className="text-[10px] font-mono text-text-muted shrink-0">{ex.duration_min}m</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Wrap-up context fields */}
      {(wrapUpPayload.changes_note || wrapUpPayload.next_focus || wrapUpPayload.group_note) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wrapUpPayload.changes_note && (
            <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-text-muted">Changes from Plan</p>
              <p className="text-xs text-text-secondary">{wrapUpPayload.changes_note}</p>
            </div>
          )}
          {wrapUpPayload.next_focus && (
            <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <Target className="w-3 h-3 text-lime" /> Next Focus
              </p>
              <p className="text-xs text-text-secondary">{wrapUpPayload.next_focus}</p>
            </div>
          )}
          {wrapUpPayload.group_note && (
            <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border space-y-1 sm:col-span-2">
              <p className="text-[9px] uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-status-blue" /> Group Note
              </p>
              <p className="text-xs text-text-secondary">{wrapUpPayload.group_note}</p>
            </div>
          )}
        </div>
      )}

      {/* Safety notice */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          Planned session, template, and curriculum are unchanged. This view reflects coach-submitted
          actuals only. Apply the wrap-up draft in the Review Queue to write session notes.
        </span>
      </div>
    </div>
  )
}
