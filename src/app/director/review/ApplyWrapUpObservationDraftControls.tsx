'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlayCircle, CheckCircle, AlertCircle, ShieldCheck, XCircle } from 'lucide-react'
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

      {/* What changes when applied */}
      <div className="space-y-1.5 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">What changes when applied</p>
        <div className="space-y-1 mt-1">
          <div className="flex items-start gap-2 text-[11px] text-text-secondary">
            <CheckCircle className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
            <span>One internal coach observation is created on the player profile</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-text-secondary">
            <CheckCircle className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
            <span>Draft is marked as applied</span>
          </div>
        </div>
        <div className="space-y-1 mt-2 pt-2 border-t border-border">
          <div className="flex items-start gap-2 text-[11px] text-text-muted">
            <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5" />
            <span>Observation is private — not visible to parents or players</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-text-muted">
            <XCircle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
            <span>Does not move the player to a new curriculum level</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-text-muted">
            <XCircle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
            <span>Does not send any parent or player communication</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-text-muted">
            <XCircle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
            <span>Does not change the session template or curriculum</span>
          </div>
        </div>
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
