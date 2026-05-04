'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { populateFitnessTemplateBlocksAction } from './populateFitnessBlocksAction'
import type { PopulateFitnessBlocksResult } from './populateFitnessBlocksAction'

interface Props {
  templateId: string
  hasBlocks: boolean
  exerciseLibraryCount: number
}

export function PopulateFitnessBlocksButton({ templateId, hasBlocks, exerciseLibraryCount }: Props) {
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
    const libraryCount = result.exercisesInLibrary
    return (
      <div className="space-y-2">
        <div className={[
          'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs',
          result.totalExercisesAdded > 0
            ? 'bg-status-green/10 border-status-green/30 text-status-green'
            : libraryCount === 0
              ? 'bg-status-orange/10 border-status-orange/30 text-status-orange'
              : 'bg-surface-raised border-border text-text-secondary',
        ].join(' ')}>
          {result.totalExercisesAdded > 0
            ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            : <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          }
          <span>
            {result.totalExercisesAdded > 0
              ? `${result.totalExercisesAdded} exercise${result.totalExercisesAdded !== 1 ? 's' : ''} added across ${result.blocksProcessed} block${result.blocksProcessed !== 1 ? 's' : ''}.`
              : libraryCount === 0
                ? 'Exercise library is empty for this academy. Import exercises to enable auto-population.'
                : 'Blocks already populated — no new exercises added.'
            }
          </span>
          {libraryCount > 0 && (
            <span className="ml-auto text-[10px] text-text-muted shrink-0">
              {libraryCount} in library
            </span>
          )}
          {result.blockResults.length > 0 && result.totalExercisesAdded > 0 && (
            <button
              onClick={() => setShowDetails(v => !v)}
              className="ml-1 text-[10px] flex items-center gap-1 opacity-70 hover:opacity-100 shrink-0"
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
      <div className="flex items-center gap-3 flex-wrap">
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

        {exerciseLibraryCount > 0 ? (
          <span className="text-[10px] text-text-muted">
            {exerciseLibraryCount} exercise{exerciseLibraryCount !== 1 ? 's' : ''} in library
          </span>
        ) : (
          <span className="text-[10px] text-status-orange">
            Exercise library is empty — import exercises to enable auto-population
          </span>
        )}
      </div>

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
