'use client'

// Sprint 571 — Session Actual Apply Preview V1
// Shows what would change if a session actual draft were applied.
// No official mutation — preview only.

import { CheckCircle2, SkipForward, Edit2, FileText } from 'lucide-react'
import type {
  SessionActualDraftPayload,
  BlockCompletionDraft,
} from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SessionActualApplyPreviewProps {
  payload: SessionActualDraftPayload
}

// ── Block row ─────────────────────────────────────────────────────────────────

function BlockRow({ block }: { block: BlockCompletionDraft }) {
  const icon =
    block.status === 'completed' ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
    ) : block.status === 'skipped' ? (
      <SkipForward className="w-3.5 h-3.5 text-text-muted shrink-0" />
    ) : (
      <Edit2 className="w-3.5 h-3.5 text-status-orange shrink-0" />
    )

  const statusColor =
    block.status === 'completed' ? 'text-status-green'
    : block.status === 'skipped' ? 'text-text-muted'
    : 'text-status-orange'

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-primary truncate">{block.block_name}</span>
          <span className={`text-[10px] font-medium capitalize ${statusColor}`}>
            {block.status}
          </span>
        </div>
        {block.note && (
          <p className="text-[11px] text-text-muted leading-snug mt-0.5">{block.note}</p>
        )}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionActualApplyPreview({ payload }: SessionActualApplyPreviewProps) {
  const completed = payload.block_completion.filter(b => b.status === 'completed').length
  const skipped = payload.block_completion.filter(b => b.status === 'skipped').length
  const modified = payload.block_completion.filter(b => b.status === 'modified').length
  const total = payload.block_completion.length

  const hasSessionNotes =
    payload.changes_note || payload.next_focus || payload.group_note

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-status-blue shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">Session apply preview — no changes yet</p>
      </div>

      {/* ── Session name ── */}
      <div className="px-3.5 py-2.5 border-b border-border/50">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Session</p>
        <p className="text-sm text-text-primary font-medium">{payload.session_name}</p>
      </div>

      {/* ── Block summary chips ── */}
      <div className="flex gap-3 px-3.5 py-2.5 border-b border-border/50">
        {completed > 0 && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
            <span className="text-xs text-status-green">{completed}/{total} completed</span>
          </div>
        )}
        {skipped > 0 && (
          <div className="flex items-center gap-1.5">
            <SkipForward className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs text-text-muted">{skipped} skipped</span>
          </div>
        )}
        {modified > 0 && (
          <div className="flex items-center gap-1.5">
            <Edit2 className="w-3.5 h-3.5 text-status-orange" />
            <span className="text-xs text-status-orange">{modified} modified</span>
          </div>
        )}
      </div>

      {/* ── Block completion rows ── */}
      {payload.block_completion.length > 0 && (
        <div className="px-3.5 divide-y divide-border/30">
          {payload.block_completion.map(b => (
            <BlockRow key={b.block_id} block={b} />
          ))}
        </div>
      )}

      {/* ── Session notes preview ── */}
      {hasSessionNotes && (
        <div className="px-3.5 py-2.5 border-t border-border/50 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Session notes to write</p>
          </div>
          {payload.changes_note && (
            <div>
              <p className="text-[10px] text-text-muted mb-0.5">Changes</p>
              <p className="text-xs text-text-primary leading-snug">{payload.changes_note}</p>
            </div>
          )}
          {payload.next_focus && (
            <div>
              <p className="text-[10px] text-text-muted mb-0.5">Next focus</p>
              <p className="text-xs text-text-primary leading-snug">{payload.next_focus}</p>
            </div>
          )}
          {payload.group_note && (
            <div>
              <p className="text-[10px] text-text-muted mb-0.5">Group note</p>
              <p className="text-xs text-text-primary leading-snug">{payload.group_note}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="px-3.5 py-2 border-t border-border/30 bg-surface">
        <p className="text-[10px] text-text-muted italic text-center">
          Preview only — session records will not change until you click Apply.
        </p>
      </div>
    </div>
  )
}
