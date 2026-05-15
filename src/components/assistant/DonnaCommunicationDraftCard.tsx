'use client'

// Sprint 366 — Donna Communication Draft Card V1
// Sprint 382 — Added "Make warmer" / "Make shorter" revision buttons + review CTA
//              for draft status (not just ready). Sending remains blocked.
// Never shows a "Send" button — always shows "Review before sending".
// No DB writes. No API calls.

import { X, MessageSquare, Wand2 } from 'lucide-react'
import type { CommunicationDraft } from './donnaCommunicationDraft'

interface Props {
  draft: CommunicationDraft
  onDiscard: () => void
  onReview?: () => void
  onRevise?: (command: string) => void
}

const TYPE_LABELS: Record<string, string> = {
  parent_update:    'Parent Update',
  coach_brief:      'Coach Brief',
  attendance_note:  'Attendance Note',
  progress_summary: 'Progress Summary',
}

const STATUS_STYLES = {
  draft:   { bg: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#c4b5fd' },
  ready:   { bg: 'rgba(48,209,88,0.08)',  border: '1px solid rgba(48,209,88,0.25)',  color: '#30D158' },
  blocked: { bg: 'rgba(255,59,48,0.08)',  border: '1px solid rgba(255,59,48,0.2)',   color: '#FF3B30' },
}

export function DonnaCommunicationDraftCard({ draft, onDiscard, onReview, onRevise }: Props) {
  const statusStyle = STATUS_STYLES[draft.status]
  const typeLabel = TYPE_LABELS[draft.type] ?? draft.type
  const bodyPreview = draft.body ? draft.body.slice(0, 120) + (draft.body.length > 120 ? '…' : '') : null
  const hasBody = !!draft.body && draft.body.trim().length > 0

  return (
    <div
      className="rounded-xl p-3.5 space-y-2.5"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: '#8b5cf6' }} />
          <span className="text-xs font-semibold text-text-primary">{typeLabel}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: statusStyle.bg, border: statusStyle.border, color: statusStyle.color }}
          >
            {draft.status === 'ready' ? 'Ready' : draft.status === 'blocked' ? 'Blocked' : 'Draft'}
          </span>
        </div>
        <button
          onClick={onDiscard}
          aria-label="Discard communication draft"
          className="shrink-0 text-text-muted hover:text-status-red transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recipient */}
      <div className="text-[11px] text-text-muted">
        To: <span className="text-text-secondary capitalize">{draft.recipientRole}</span>
        {draft.subject && (
          <> · <span className="text-text-secondary">{draft.subject}</span></>
        )}
      </div>

      {/* Body preview */}
      {bodyPreview && (
        <p className="text-[11px] text-text-secondary leading-snug italic">
          &ldquo;{bodyPreview}&rdquo;
        </p>
      )}

      {/* Violations */}
      {draft.violations && draft.violations.length > 0 && (
        <div
          className="rounded-lg px-2.5 py-2 space-y-1"
          style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.18)' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold text-status-red">Content issues</p>
          {draft.violations.map((v, i) => (
            <p key={i} className="text-[10px] text-text-muted leading-snug">· {v}</p>
          ))}
        </div>
      )}

      {/* Revision buttons — only when there is body content to revise */}
      {hasBody && onRevise && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-text-muted">
            <Wand2 className="w-3 h-3" />
            Revise:
          </span>
          <button
            type="button"
            onClick={() => onRevise('make the message warmer and more personal')}
            className="text-[10px] px-2 py-1 rounded-md font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd' }}
          >
            Make warmer
          </button>
          <button
            type="button"
            onClick={() => onRevise('make the message shorter and more concise')}
            className="text-[10px] px-2 py-1 rounded-md font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd' }}
          >
            Make shorter
          </button>
        </div>
      )}

      {/* Review boundary notice — never a "Send" button */}
      <div
        className="rounded-lg px-2.5 py-1.5"
        style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)' }}
      >
        <p className="text-[10px] text-text-muted leading-snug">
          Review before sending — Donna cannot send messages directly.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {hasBody && onReview && (
          <button
            onClick={onReview}
            className="btn-lime text-xs px-3 py-1.5"
          >
            Review on screen
          </button>
        )}
        <button
          onClick={onDiscard}
          className="text-[11px] text-text-muted hover:text-status-red transition-colors underline underline-offset-2"
        >
          Discard
        </button>
      </div>
    </div>
  )
}
