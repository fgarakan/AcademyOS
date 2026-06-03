'use client'

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import type { CurriculumImprovementSuggestion } from '@/lib/donna/curriculumImprovementEngine'
import { donnaCurriculumImprovementDraftAction } from '@/app/director/_actions/donnaCurriculumImprovementDraftAction'

interface Props {
  suggestion: CurriculumImprovementSuggestion
}

export function DonnaCurriculumImproveDraftButton({ suggestion }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; draftId: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (result?.ok) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-status-green">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        Draft created — review it in the Review Center before anything is applied.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const res = await donnaCurriculumImprovementDraftAction({
              recommendation:  suggestion.recommendation,
              changeType:      suggestion.changeType,
              targetDomain:    suggestion.targetDomain,
              draftStarter:    suggestion.draftStarter,
              confidenceScore: suggestion.confidenceScore,
              evidenceCount:   suggestion.evidenceCount,
              affectedPlayers: suggestion.affectedPlayers,
              reasoning:       suggestion.reasoning,
            })
            if (res.ok) {
              setResult(res)
            } else {
              setError(res.error ?? 'Failed to create draft.')
            }
          })
        }}
        className="w-full btn-lime text-xs py-2 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Draft…</>
        ) : (
          'Draft This Change → Review Queue'
        )}
      </button>
      {error && <p className="text-[10px] text-status-red">{error}</p>}
    </div>
  )
}
