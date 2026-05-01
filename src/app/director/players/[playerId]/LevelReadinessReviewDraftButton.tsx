'use client'

import { useTransition, useState } from 'react'
import { TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import type { LevelReadinessReviewDraftResult } from './levelReadinessReviewDraftAction'

interface Props {
  onCreateDraft: () => Promise<LevelReadinessReviewDraftResult>
}

export function LevelReadinessReviewDraftButton({ onCreateDraft }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<LevelReadinessReviewDraftResult | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await onCreateDraft()
      setResult(res)
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn-lime flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <TrendingUp className="w-4 h-4" />
        {isPending ? 'Creating review draft…' : 'Request Director Readiness Review'}
      </button>

      <p className="text-[11px] text-text-muted">
        Creates a draft readiness review for director approval. No level movement occurs automatically.
        Not visible to parents or players.
      </p>

      {result?.ok && (
        <div className="flex items-start gap-2 text-status-green text-xs bg-status-green/10 border border-status-green/30 rounded p-3">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Level readiness review draft created. Review it in the Director Review Queue before approving.
          </span>
        </div>
      )}

      {result && !result.ok && result.error && (
        <div className="flex items-start gap-2 text-status-red text-xs bg-status-red/10 border border-status-red/30 rounded p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{result.error}</span>
        </div>
      )}
    </div>
  )
}
