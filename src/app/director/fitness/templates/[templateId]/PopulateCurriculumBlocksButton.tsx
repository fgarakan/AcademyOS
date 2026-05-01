'use client'

import { useState } from 'react'
import { BookOpen, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { populateTemplateBlocksFromCurriculumAction } from '@/lib/actions/curriculumContentPopulation'
import type { BlockCurriculumResult } from '@/lib/actions/curriculumContentPopulation'

interface Props {
  templateId: string
  hasBlocks: boolean
  hasCurriculumLevel: boolean
}

export function PopulateCurriculumBlocksButton({ templateId, hasBlocks, hasCurriculumLevel }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    ok: boolean
    error: string | null
    levelName: string | null
    blocksUpdated: number
    blocksProcessed: number
    blockResults: BlockCurriculumResult[]
  } | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  async function handlePopulate() {
    if (!hasBlocks || !hasCurriculumLevel) return
    setLoading(true)
    setResult(null)
    try {
      const res = await populateTemplateBlocksFromCurriculumAction(templateId)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || !hasBlocks || !hasCurriculumLevel

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <button
          onClick={handlePopulate}
          disabled={disabled}
          className={[
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            disabled
              ? 'bg-surface-raised text-text-muted border border-border cursor-not-allowed'
              : 'bg-lime/10 text-lime border border-lime/30 hover:bg-lime/20',
          ].join(' ')}
        >
          <BookOpen className="w-4 h-4" />
          {loading ? 'Populating from Curriculum…' : 'Populate from Curriculum'}
        </button>

        {!hasBlocks && (
          <p className="text-xs text-text-muted self-center">Add blocks to this template first.</p>
        )}
        {hasBlocks && !hasCurriculumLevel && (
          <p className="text-xs text-text-muted self-center">Select a curriculum level above first.</p>
        )}
      </div>

      {result && (
        <div className={[
          'rounded-lg border p-3 space-y-2',
          result.ok
            ? 'bg-lime/5 border-lime/20'
            : 'bg-status-red/5 border-status-red/20',
        ].join(' ')}>
          <div className="flex items-center gap-2">
            {result.ok
              ? <CheckCircle className="w-4 h-4 text-lime shrink-0" />
              : <AlertCircle className="w-4 h-4 text-status-red shrink-0" />
            }
            <p className="text-sm text-text-primary">
              {result.ok
                ? `Populated ${result.blocksUpdated} of ${result.blocksProcessed} blocks from ${result.levelName ?? 'curriculum'}.`
                : result.error
              }
            </p>
          </div>

          {result.ok && result.blockResults.length > 0 && (
            <button
              onClick={() => setShowDetail(d => !d)}
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary"
            >
              {showDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showDetail ? 'Hide' : 'Show'} block detail
            </button>
          )}

          {showDetail && result.blockResults.map(r => (
            <div key={r.blockId} className="pl-4 border-l border-border">
              <p className="text-xs text-text-primary font-medium">{r.blockName}</p>
              {r.notesWritten
                ? <p className="text-[11px] text-status-green">{r.itemsFound} content items written to notes.</p>
                : <p className="text-[11px] text-text-muted">{r.skippedReason}</p>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
