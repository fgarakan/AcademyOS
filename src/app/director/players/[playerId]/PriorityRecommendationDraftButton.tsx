'use client'

import { useTransition, useState } from 'react'
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react'
import type { PriorityRecommendationDraftResult } from './priorityRecommendationAction'

interface Props {
  onCreateDraft: () => Promise<PriorityRecommendationDraftResult>
}

export function PriorityRecommendationDraftButton({ onCreateDraft }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<PriorityRecommendationDraftResult | null>(null)

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
        <Sparkles className="w-4 h-4" />
        {isPending ? 'Creating draft…' : 'Create Priority Recommendation Draft'}
      </button>

      <p className="text-[11px] text-text-muted">
        Creates a draft recommendation from internal evidence. It does not update active priorities.
      </p>

      {result?.ok && (
        <div className="flex items-start gap-2 text-status-green text-xs bg-status-green/10 border border-status-green/30 rounded p-3">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Priority recommendation draft created for review.</span>
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
