'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, HelpCircle, AlertTriangle } from 'lucide-react'
import { updateEvidenceRequirementDraftDecisionAction } from './actions'
import type { DraftDecision } from './actions'

interface Props {
  proposedActionId: string
}

export function EvidenceRequirementDraftDecisionControls({ proposedActionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [noteText, setNoteText] = useState('')
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  function handleDecision(decision: DraftDecision) {
    startTransition(async () => {
      const res = await updateEvidenceRequirementDraftDecisionAction(
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

  if (result?.ok) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Decision recorded. Refreshing queue…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      {/* Governance note — required sprint copy */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
        <span>
          Approval marks this draft as reviewed. It does not create official evidence links yet.
        </span>
      </div>

      {/* Decision note */}
      <div className="space-y-1">
        <label className="label-xs" htmlFor={`erd-note-${proposedActionId}`}>
          Decision note (optional)
        </label>
        <textarea
          id={`erd-note-${proposedActionId}`}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Add context for the coach or next reviewer…"
          disabled={isPending}
          className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 disabled:opacity-50"
        />
        {noteText.length > 800 && (
          <p className="text-[10px] text-text-muted text-right">{noteText.length}/1000</p>
        )}
      </div>

      {/* Decision buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleDecision('approved')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-status-green/10 text-status-green border border-status-green/30 hover:bg-status-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Approve Draft
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
          Reject Draft
        </button>
      </div>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}

      {isPending && (
        <p className="text-[11px] text-text-muted">Recording decision…</p>
      )}
    </div>
  )
}
