'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { updateSummaryDraftDecisionAction } from './actions'
import type { DraftDecision } from './actions'

interface Props {
  proposedActionId: string
}

export function DevelopmentSummaryDraftDecisionControls({ proposedActionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [noteText, setNoteText] = useState('')
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  function handleDecision(decision: DraftDecision) {
    startTransition(async () => {
      const res = await updateSummaryDraftDecisionAction(proposedActionId, decision, noteText.trim() || undefined)
      setResult(res)
      if (res.ok) router.refresh()
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
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
        <span>
          Approving marks this draft as ready to apply. Use the Apply button to write it to the player's development summary. Rejecting records your decision only — the summary is not changed. No player level, parent message, or curriculum record is touched.
        </span>
      </div>
      <div className="space-y-1">
        <label className="label-xs" htmlFor={`summary-note-${proposedActionId}`}>
          Decision note (optional)
        </label>
        <textarea
          id={`summary-note-${proposedActionId}`}
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Add context for the next reviewer…"
          disabled={isPending}
          className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleDecision('approved')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-status-green/10 text-status-green border border-status-green/30 hover:bg-status-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Approve
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
      {result?.error && <p className="text-xs text-status-red">{result.error}</p>}
      {isPending && <p className="text-[11px] text-text-muted">Recording decision…</p>}
    </div>
  )
}
