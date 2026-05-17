'use client'

// Sprint 572 — Session Actual Apply Confirmation UI V1
// Confirmation step before applying session actual to official session record.
// Review-first. Does not apply — delegates to existing ApplyWrapUpDraftControls.

import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SessionActualApplyConfirmationProps {
  sessionName: string
  completedBlocks: number
  skippedBlocks: number
  modifiedBlocks: number
  totalBlocks: number
  hasSessionNotes: boolean
  onConfirm: () => void
  onCancel: () => void
  isApplying?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionActualApplyConfirmation({
  sessionName,
  completedBlocks,
  skippedBlocks,
  modifiedBlocks,
  totalBlocks,
  hasSessionNotes,
  onConfirm,
  onCancel,
  isApplying = false,
}: SessionActualApplyConfirmationProps) {
  const hasSkipsOrModifications = skippedBlocks > 0 || modifiedBlocks > 0
  const completionRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0

  return (
    <div className="rounded-xl border border-status-blue/30 bg-status-blue/5 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-status-blue/20">
        <AlertTriangle className="w-4 h-4 text-status-blue shrink-0" />
        <p className="text-xs font-semibold text-status-blue">Confirm session apply</p>
        <button
          onClick={onCancel}
          className="ml-auto text-text-muted hover:text-text-secondary transition-colors"
          disabled={isApplying}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Summary ── */}
      <div className="px-3.5 py-3 flex flex-col gap-2">
        <p className="text-sm text-text-primary leading-snug">
          This will update session notes for{' '}
          <span className="font-semibold">{sessionName}</span>.
        </p>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
            <p className="text-xs text-text-muted">
              {completedBlocks}/{totalBlocks} blocks completed ({completionRate}%)
            </p>
          </div>
          {skippedBlocks > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 text-text-muted shrink-0 text-center text-xs">–</span>
              <p className="text-xs text-text-muted">{skippedBlocks} block{skippedBlocks === 1 ? '' : 's'} skipped</p>
            </div>
          )}
          {modifiedBlocks > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 text-status-orange shrink-0 text-center text-xs">~</span>
              <p className="text-xs text-status-orange">{modifiedBlocks} block{modifiedBlocks === 1 ? '' : 's'} modified from plan</p>
            </div>
          )}
          {hasSessionNotes && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 text-text-muted shrink-0 text-center text-xs">+</span>
              <p className="text-xs text-text-muted">Session notes will be written</p>
            </div>
          )}
        </div>

        {hasSkipsOrModifications && (
          <p className="text-[11px] text-text-muted leading-snug border-t border-border/50 pt-2 mt-0.5">
            Some blocks were skipped or modified. This is expected — the session note will reflect what actually happened.
          </p>
        )}

        <p className="text-[11px] text-text-muted leading-snug">
          Applying this will update the official session record. This cannot be automatically reversed.
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 px-3.5 py-3 border-t border-status-blue/20">
        <button
          onClick={onCancel}
          disabled={isApplying}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isApplying}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-status-blue text-white text-sm font-semibold hover:bg-status-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isApplying ? 'Applying…' : 'Apply session notes'}
        </button>
      </div>
    </div>
  )
}
