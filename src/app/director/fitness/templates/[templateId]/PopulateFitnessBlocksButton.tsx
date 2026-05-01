'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Loader2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { populateFitnessTemplateBlocksAction } from './populateFitnessBlocksAction'
import type { PopulateFitnessBlocksResult } from './populateFitnessBlocksAction'

interface Props {
  templateId: string
  hasBlocks: boolean
}

export function PopulateFitnessBlocksButton({ templateId, hasBlocks }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<PopulateFitnessBlocksResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  function handlePopulate() {
    setResult(null)
    startTransition(async () => {
      const res = await populateFitnessTemplateBlocksAction(templateId)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {result.totalExercisesAdded > 0
              ? `${result.totalExercisesAdded} exercise${result.totalExercisesAdded !== 1 ? 's' : ''} added across ${result.blocksProcessed} block${result.blocksProcessed !== 1 ? 's' : ''}.`
              : 'Blocks already populated — no new exercises added.'
            }
          </span>
          {result.blockResults.length > 0 && (
            <button
              onClick={() => setShowDetails(v => !v)}
              className="ml-auto text-[10px] flex items-center gap-1 opacity-70 hover:opacity-100"
            >
              Details
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {showDetails && (
          <div className="space-y-1 pl-2">
            {result.blockResults.map(br => (
              <div key={br.blockId} className="text-[10px] text-text-muted flex items-center gap-2">
                <span className="font-medium text-text-secondary">{br.blockName}</span>
                <span>({br.blockType})</span>
                <span>→ +{br.exercisesAdded} exercises</span>
                {br.skippedExisting > 0 && <span className="text-text-muted">{br.skippedExisting} existing</span>}
                <span className="text-text-muted">{br.durationUsedMin}/{br.durationBudgetMin} min</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePopulate}
        disabled={isPending || !hasBlocks}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-lime text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Dumbbell className="w-3.5 h-3.5" />
        }
        {isPending ? 'Populating…' : 'Populate Blocks with Exercises'}
      </button>

      {!hasBlocks && (
        <p className="text-[10px] text-text-muted">Add blocks to this template first.</p>
      )}

      <p className="text-[10px] text-text-muted">
        Matches exercises from the library to each block by category. Respects block duration. Skips blocks that already have exercises.
      </p>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}
    </div>
  )
}
