'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Loader2, CheckCircle } from 'lucide-react'
import { createFitnessHomeworkRecommendationDraftAction } from './fitnessHomeworkRecommendationAction'

interface Props {
  playerId: string
}

export function FitnessHomeworkRecommendationButton({ playerId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null; draftId: string | null } | null>(null)

  function handleGenerate() {
    setResult(null)
    startTransition(async () => {
      const res = await createFitnessHomeworkRecommendationDraftAction(playerId)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Fitness homework recommendation draft created — visible in the director review queue.</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-lime text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Dumbbell className="w-3.5 h-3.5" />
        }
        {isPending ? 'Generating…' : 'Generate Fitness Homework Recommendation Draft'}
      </button>

      <p className="text-[10px] text-text-muted">
        Reads attendance, assessments, and coach notes to compute fitness gaps.
        Creates a draft for director review — not visible to player or parent.
      </p>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}
    </div>
  )
}
