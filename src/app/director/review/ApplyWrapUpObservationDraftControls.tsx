'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlayCircle, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { applyApprovedObservationDraftAction } from './actions'

interface Props {
  proposedActionId: string
}

export function ApplyWrapUpObservationDraftControls({ proposedActionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  function handleApply() {
    startTransition(async () => {
      const res = await applyApprovedObservationDraftAction(proposedActionId)
      setResult(res)
      if (res.ok) {
        router.refresh()
      }
    })
  }

  if (result?.ok) {
    return (
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>Applied. Internal coach observation created on player profile. Refreshing…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <Info className="w-3 h-3 shrink-0 mt-0.5 text-status-blue" />
        <span>
          Apply creates one internal coach observation on this player's profile. This observation is private — not visible to parents or players. No player level, curriculum, or parent communication is changed.
        </span>
      </div>

      <button
        onClick={handleApply}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-lime/10 text-lime border border-lime/30 hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlayCircle className="w-3.5 h-3.5" />
        {isPending ? 'Applying…' : 'Apply — Create Observation'}
      </button>

      {result?.error && (
        <div className="flex items-start gap-1.5 text-xs text-status-red">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{result.error}</span>
        </div>
      )}
      {isPending && (
        <p className="text-[11px] text-text-muted">Writing observation…</p>
      )}
    </div>
  )
}
