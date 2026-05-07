'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { populateCurriculumDrillNotesAction } from '@/lib/actions/curriculumContentPopulation'
import type { PopulateCurriculumBlocksResult } from '@/lib/actions/curriculumContentPopulation'

interface Props {
  templateId: string
  hasBlocks: boolean
  hasLevel: boolean
}

export function PopulateDrillNotesButton({ templateId, hasBlocks, hasLevel }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<PopulateCurriculumBlocksResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  function handlePopulate() {
    setResult(null)
    startTransition(async () => {
      const res = await populateCurriculumDrillNotesAction(templateId)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  const disabled = isPending || !hasBlocks || !hasLevel

  if (result?.ok) {
    return (
      <div className="space-y-2">
        <div className={[
          'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs',
          result.blocksUpdated > 0
            ? 'bg-status-green/10 border-status-green/30 text-status-green'
            : 'bg-surface-raised border-border text-text-secondary',
        ].join(' ')}>
          {result.blocksUpdated > 0
            ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            : <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          }
          <span>
            {result.blocksUpdated > 0
              ? `Drill notes written to ${result.blocksUpdated} block${result.blocksUpdated !== 1 ? 's' : ''} (${result.levelName}).`
              : 'No blocks updated — blocks may already have notes or no drills matched.'
            }
          </span>
          {result.blockResults.length > 0 && result.blocksUpdated > 0 && (
            <button
              onClick={() => setShowDetails(v => !v)}
              className="ml-auto text-[10px] flex items-center gap-1 opacity-70 hover:opacity-100 shrink-0"
            >
              Details
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {showDetails && (
          <div className="space-y-1 pl-2">
            {result.blockResults.map(br => (
              <div key={br.blockId} className="text-[10px] text-text-muted flex flex-wrap items-center gap-2">
                <span className="font-medium text-text-secondary">{br.blockName}</span>
                {br.notesWritten
                  ? <span className="text-status-green">→ {br.itemsFound} drill{br.itemsFound !== 1 ? 's' : ''} written</span>
                  : <span className="text-text-muted italic">{br.skippedReason}</span>
                }
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
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-lime text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <BookOpen className="w-3.5 h-3.5" />
          }
          {isPending ? 'Writing drill notes…' : 'Populate Block Notes with Curriculum Drills'}
        </button>
      </div>

      {!hasLevel && (
        <p className="text-[10px] text-status-orange">Assign a curriculum level to this template first.</p>
      )}
      {hasLevel && !hasBlocks && (
        <p className="text-[10px] text-text-muted">Add blocks to this template first.</p>
      )}

      <p className="text-[10px] text-text-muted">
        Writes curriculum drill objectives, coaching cues, and progressions into block notes.
        Skips blocks that already have notes. Does not add formal exercise records.
      </p>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}
    </div>
  )
}
