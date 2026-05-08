'use client'

import { useState, useTransition } from 'react'
import { FileEdit, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { draftSummaryUpdateAction } from './draftSummaryUpdateAction'

interface Props {
  playerId: string
  academyId: string
  hasObservations: boolean
}

export function DraftSummaryUpdateButton({ playerId, academyId, hasObservations }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null; observationCount: number } | null>(null)

  function handleDraft() {
    startTransition(async () => {
      const res = await draftSummaryUpdateAction(playerId, academyId)
      setResult(res)
    })
  }

  if (result?.ok) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        <span>
          Draft submitted for director review — assembled from {result.observationCount} observation{result.observationCount !== 1 ? 's' : ''}.
          Go to the Review Queue → Development Summaries tab to review and apply.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleDraft}
        disabled={isPending || !hasObservations}
        className="flex items-center gap-1.5 text-xs btn-lime px-3 py-1.5 disabled:opacity-40"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileEdit className="w-3.5 h-3.5" />}
        {isPending ? 'Assembling draft…' : 'Draft Development Summary Update'}
      </button>
      {!hasObservations && (
        <p className="text-[10px] text-text-muted">Add internal coach observations before drafting a summary update.</p>
      )}
      {result?.error && (
        <div className="flex items-start gap-1.5 text-xs text-status-red">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{result.error}</span>
        </div>
      )}
    </div>
  )
}
