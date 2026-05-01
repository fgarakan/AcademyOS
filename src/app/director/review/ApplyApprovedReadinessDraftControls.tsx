'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import { applyApprovedReadinessDraftAction } from './actions'

interface Props {
  proposedActionId: string
}

export function ApplyApprovedReadinessDraftControls({ proposedActionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    ok: boolean
    error: string | null
    levelMovementPlanId: string | null
  } | null>(null)

  function handleApply() {
    startTransition(async () => {
      const res = await applyApprovedReadinessDraftAction(proposedActionId)
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
        <span>
          Level movement plan draft created. Find it in the review queue for a separate director approval step.
          No level change has occurred.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
        <span>
          This creates a level movement plan draft for a separate review step. No level change occurs now.
          The player&apos;s current level is not updated until the movement plan is separately approved and applied.
        </span>
      </div>

      <button
        type="button"
        onClick={handleApply}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-lime/10 text-lime border border-lime/30 hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        {isPending ? 'Creating plan draft…' : 'Create Level Movement Plan Draft'}
      </button>

      {result?.error && (
        <div className="flex items-start gap-2 text-status-red text-xs bg-status-red/10 border border-status-red/30 rounded p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{result.error}</span>
        </div>
      )}

      {isPending && (
        <p className="text-[11px] text-text-muted">Creating level movement plan draft…</p>
      )}
    </div>
  )
}
