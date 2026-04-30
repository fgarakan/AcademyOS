'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Target } from 'lucide-react'
import { applyApprovedPriorityRecommendationAction } from './actions'

interface Props {
  proposedActionId: string
}

export function ApplyPriorityRecommendationControls({ proposedActionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  function handleApply() {
    startTransition(async () => {
      const res = await applyApprovedPriorityRecommendationAction(proposedActionId)
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
        <span>Active priority created. Refreshing…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      {/* Guardrail copy — required sprint copy */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
        <span>
          Creates one active internal priority for this player. It does not update levels, profiles,
          parent/player views, or communication.
        </span>
      </div>

      <button
        onClick={handleApply}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-lime/10 text-lime border border-lime/30 hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Target className="w-3.5 h-3.5" />
        {isPending ? 'Creating priority…' : 'Create Active Priority'}
      </button>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}

      {isPending && (
        <p className="text-[11px] text-text-muted">Creating priority…</p>
      )}
    </div>
  )
}
