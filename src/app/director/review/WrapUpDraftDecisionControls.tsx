'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, HelpCircle, AlertTriangle, PlayCircle, ShieldCheck } from 'lucide-react'
import { updateWrapUpDraftDecisionAction } from './actions'
import type { DraftDecision } from './actions'
import { approveAndApplyWrapUpAction } from './approveAndApplyWrapUpAction'

interface Props {
  proposedActionId: string
}

export function WrapUpDraftDecisionControls({ proposedActionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [noteText, setNoteText] = useState('')
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)

  function handleDecision(decision: DraftDecision) {
    setLastAction(decision)
    startTransition(async () => {
      const res = await updateWrapUpDraftDecisionAction(
        proposedActionId,
        decision,
        noteText.trim() || undefined
      )
      setResult(res)
      if (res.ok) {
        router.refresh()
      }
    })
  }

  function handleApproveAndApply() {
    setLastAction('approve_and_apply')
    startTransition(async () => {
      const res = await approveAndApplyWrapUpAction(proposedActionId)
      setResult(res)
      if (res.ok) {
        router.refresh()
      }
    })
  }

  if (result?.ok) {
    const isApplied = lastAction === 'approve_and_apply'
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {isApplied
            ? 'Approved and applied. Session notes written and session marked completed. Refreshing…'
            : 'Decision recorded. Refreshing queue…'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">

      {/* Approve & Apply — primary combined action */}
      <div className="space-y-1.5">
        <button
          onClick={handleApproveAndApply}
          disabled={isPending}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-lime/15 text-lime border border-lime/30 hover:bg-lime/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlayCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Approve &amp; Apply</span>
          <span className="text-[10px] font-normal text-lime/70">Does both in one step</span>
        </button>
        <p className="text-[10px] text-text-muted flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 shrink-0 text-text-muted" />
          Approve &amp; Apply writes session notes and marks the session completed. Nothing is sent to parents.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-border" />
        <p className="text-[10px] text-text-muted shrink-0">or review separately</p>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Standard two-step controls */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
        <span>
          Approve marks this wrap-up as reviewed. Use the Apply button that appears next to write the session actual.
          Rejecting records your decision but takes no further action. Nothing changes until you explicitly act.
        </span>
      </div>

      <div className="space-y-1">
        <label className="label-xs" htmlFor={`wrapup-note-${proposedActionId}`}>
          Clarification note
        </label>
        <textarea
          id={`wrapup-note-${proposedActionId}`}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="What should the coach clarify?"
          disabled={isPending}
          className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 disabled:opacity-50"
        />
        <p className="text-[10px] text-text-muted">This note is visible to the coach.</p>
        {noteText.length > 800 && (
          <p className="text-[10px] text-text-muted text-right">{noteText.length}/1000</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleDecision('approved')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-status-green/10 text-status-green border border-status-green/30 hover:bg-status-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Approve only
        </button>
        <button
          onClick={() => handleDecision('clarification_needed')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-status-orange/10 text-status-orange border border-status-orange/30 hover:bg-status-orange/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Needs Clarification
        </button>
        <button
          onClick={() => handleDecision('rejected')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-status-red/10 text-status-red border border-status-red/30 hover:bg-status-red/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}

      {isPending && (
        <p className="text-[11px] text-text-muted">
          {lastAction === 'approve_and_apply' ? 'Approving and applying…' : 'Recording decision…'}
        </p>
      )}
    </div>
  )
}
