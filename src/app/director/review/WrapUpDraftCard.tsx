import Link from 'next/link'
import {
  Calendar, CheckCircle2, XCircle, AlertTriangle, Pencil,
  ExternalLink, MessageSquare, Target, FileText, Info, Users, HelpCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import type { SessionActualDraftPayload, BlockCompletionDraft } from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'
import { WrapUpDraftDecisionControls } from './WrapUpDraftDecisionControls'
import { ApplyWrapUpDraftControls } from './ApplyWrapUpDraftControls'

export interface EnrichedWrapUpDraftItem {
  id: string
  status: string
  createdAt: string
  sessionId: string | null
  sessionName: string | null
  sessionDate: string | null
  groupName?: string | null
  proposerName: string | null
  payload: SessionActualDraftPayload
  reviewerNotes?: string | null
}

function BlockStatusIcon({ status }: { status: BlockCompletionDraft['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
  if (status === 'skipped') return <XCircle className="w-3.5 h-3.5 text-status-red shrink-0" />
  return <Pencil className="w-3.5 h-3.5 text-status-orange shrink-0" />
}

function blockStatusLabel(status: BlockCompletionDraft['status']) {
  if (status === 'completed') return 'Completed'
  if (status === 'skipped') return 'Skipped'
  return 'Modified'
}

export function WrapUpDraftCard({ draft }: { draft: EnrichedWrapUpDraftItem }) {
  const { payload } = draft
  const completed = payload.block_completion.filter(b => b.status === 'completed').length
  const skipped = payload.block_completion.filter(b => b.status === 'skipped').length
  const modified = payload.block_completion.filter(b => b.status === 'modified').length

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-lime font-medium">
              Session Wrap-Up Draft ·{' '}
              {draft.status === 'approved'
                ? 'approved — ready to apply'
                : draft.status === 'clarification_needed'
                ? 'needs clarification'
                : draft.status === 'rejected'
                ? 'rejected'
                : 'pending review'}
            </p>
            {draft.sessionName && (
              <p className="text-sm font-semibold text-text-primary mt-0.5">{draft.sessionName}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              {draft.sessionDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(draft.sessionDate)}
                </span>
              )}
              {draft.proposerName && <span>by {draft.proposerName}</span>}
              {draft.groupName && (
                <span className="flex items-center gap-1 text-text-secondary">
                  <Users className="w-3 h-3" />
                  {draft.groupName}
                </span>
              )}
              <span>
                Created{' '}
                {new Date(draft.createdAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          {draft.sessionId && (
            <Link
              href={`/director/sessions/${draft.sessionId}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-text-secondary border border-border hover:border-lime/30 hover:text-lime transition-colors shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              View Session
            </Link>
          )}
        </div>

        {/* Block completion summary strip */}
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1.5 text-xs text-status-green">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completed} completed
          </span>
          {modified > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-status-orange">
              <Pencil className="w-3.5 h-3.5" />
              {modified} modified
            </span>
          )}
          {skipped > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-status-red">
              <XCircle className="w-3.5 h-3.5" />
              {skipped} skipped
            </span>
          )}
        </div>

        {/* Block details */}
        {payload.block_completion.length > 0 && (
          <div className="space-y-1.5">
            <p className="label-xs">Block Completion</p>
            <div className="space-y-1">
              {payload.block_completion.map((block, i) => (
                <div
                  key={block.block_id || i}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border"
                >
                  <BlockStatusIcon status={block.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text-primary truncate">{block.block_name}</p>
                    <p className="text-[10px] text-text-muted">{blockStatusLabel(block.status)}</p>
                    {block.note && (
                      <p className="text-[11px] text-text-secondary mt-0.5 italic">"{block.note}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {payload.changes_note && (
            <div className="space-y-1">
              <p className="label-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-status-orange" />
                Changes from Plan
              </p>
              <p className="text-xs text-text-secondary px-3 py-2 rounded-lg bg-surface-raised border border-border">
                {payload.changes_note}
              </p>
            </div>
          )}
          {payload.next_focus && (
            <div className="space-y-1">
              <p className="label-xs flex items-center gap-1.5">
                <Target className="w-3 h-3 text-lime" />
                Next Focus
              </p>
              <p className="text-xs text-text-secondary px-3 py-2 rounded-lg bg-surface-raised border border-border">
                {payload.next_focus}
              </p>
            </div>
          )}
          {payload.group_note && (
            <div className="space-y-1">
              <p className="label-xs flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-status-blue" />
                Group Note
              </p>
              <p className="text-xs text-text-secondary px-3 py-2 rounded-lg bg-surface-raised border border-border">
                {payload.group_note}
              </p>
            </div>
          )}
          {payload.raw_attendance_answer && (
            <div className="space-y-1">
              <p className="label-xs flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-text-muted" />
                Attendance Notes
              </p>
              <p className="text-xs text-text-muted px-3 py-2 rounded-lg bg-surface-raised border border-border italic">
                "{payload.raw_attendance_answer}"
              </p>
            </div>
          )}
          {payload.raw_standouts_answer && (
            <div className="space-y-1">
              <p className="label-xs flex items-center gap-1.5">
                <Users className="w-3 h-3 text-lime" />
                Player Standouts
              </p>
              <p className="text-xs text-text-secondary px-3 py-2 rounded-lg bg-surface-raised border border-border">
                {payload.raw_standouts_answer}
              </p>
            </div>
          )}
          {payload.raw_attention_answer && (
            <div className="space-y-1">
              <p className="label-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-status-orange" />
                Needs Attention
              </p>
              <p className="text-xs text-text-secondary px-3 py-2 rounded-lg bg-surface-raised border border-border">
                {payload.raw_attention_answer}
              </p>
            </div>
          )}
        </div>

        {/* Warnings */}
        {payload.warnings && payload.warnings.length > 0 && (
          <div className="space-y-1">
            <p className="label-xs">Warnings</p>
            <div className="space-y-1">
              {payload.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange"
                >
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety note */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            This is a coach-submitted session summary. No session data has been changed yet.
            Planned session and template are untouched. Approve, then use the Apply button to write the official session actual. Rejecting this draft records your decision but takes no further action.
          </span>
        </div>

        {/* Director note — shown when a clarification or rejection note was sent to the coach */}
        {(draft.status === 'clarification_needed' || draft.status === 'rejected') && draft.reviewerNotes && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-status-orange/5 border border-status-orange/20">
            <HelpCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-status-orange font-medium mb-1">
                Director Note{' '}
                <span className="normal-case tracking-normal font-normal text-text-muted">· Visible to coach</span>
              </p>
              <p className="text-xs text-text-secondary leading-snug">{draft.reviewerNotes}</p>
            </div>
          </div>
        )}

        {/* Decision controls — only for pending_review */}
        {draft.status === 'pending_review' && (
          <WrapUpDraftDecisionControls proposedActionId={draft.id} />
        )}
        {draft.status === 'approved' && (
          <ApplyWrapUpDraftControls proposedActionId={draft.id} />
        )}
      </CardContent>
    </Card>
  )
}
