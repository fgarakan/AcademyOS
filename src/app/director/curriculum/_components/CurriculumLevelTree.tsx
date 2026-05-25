'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Search, X, ExternalLink } from 'lucide-react'
import type { CurriculumExplorerData, CurriculumLevel } from '@/lib/backend/curriculumExplorer'

const STAGE_ORDER = [
  'red_foundation',
  'orange_development',
  'green_performance',
  'yellow_competitive',
  'high_performance',
] as const

const STAGE_LABEL: Record<string, string> = {
  red_foundation:     'Red Ball',
  orange_development: 'Orange Ball',
  green_performance:  'Green Ball',
  yellow_competitive: 'Yellow Ball',
  high_performance:   'High Performance',
}

const STAGE_COLOR: Record<string, string> = {
  red_foundation:     'text-red-400',
  orange_development: 'text-amber-400',
  green_performance:  'text-green-400',
  yellow_competitive: 'text-yellow-300',
  high_performance:   'text-violet-400',
}

const STAGE_DOT: Record<string, string> = {
  red_foundation:     'bg-red-400',
  orange_development: 'bg-amber-400',
  green_performance:  'bg-green-400',
  yellow_competitive: 'bg-yellow-300',
  high_performance:   'bg-violet-400',
}

interface Props {
  explorerData: CurriculumExplorerData
}

export function CurriculumLevelTree({ explorerData }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [openStages, setOpenStages] = useState<Set<string>>(new Set(STAGE_ORDER))

  const levelsByStage = useMemo(() => {
    const grouped = new Map<string, CurriculumLevel[]>()
    for (const stage of STAGE_ORDER) grouped.set(stage, [])
    for (const level of explorerData.levels) {
      grouped.get(level.stage)?.push(level)
    }
    return grouped
  }, [explorerData.levels])

  const filteredByStage = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return levelsByStage
    const result = new Map<string, CurriculumLevel[]>()
    Array.from(levelsByStage.entries()).forEach(([stage, levels]) => {
      result.set(
        stage,
        levels.filter(
          (l: CurriculumLevel) =>
            l.display_name.toLowerCase().includes(q) ||
            (STAGE_LABEL[stage] ?? '').toLowerCase().includes(q),
        ),
      )
    })
    return result
  }, [levelsByStage, searchQuery])

  const hasResults = useMemo(
    () => Array.from(filteredByStage.values()).some((ls: CurriculumLevel[]) => ls.length > 0),
    [filteredByStage],
  )

  function toggleStage(stage: string) {
    setOpenStages(prev => {
      const next = new Set(prev)
      if (next.has(stage)) next.delete(stage)
      else next.add(stage)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {/* Search bar — Sprint 561 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search levels…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-raised pl-9 pr-9 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Empty search result */}
      {searchQuery && !hasResults && (
        <p className="text-[12px] text-text-muted text-center py-6">
          No levels match &ldquo;{searchQuery}&rdquo;
        </p>
      )}

      {/* Stage sections */}
      {STAGE_ORDER.map(stage => {
        const levels = filteredByStage.get(stage) ?? []
        if (searchQuery && levels.length === 0) return null
        const isOpen = openStages.has(stage) || !!searchQuery
        const stageLabel = STAGE_LABEL[stage]
        const stageColor = STAGE_COLOR[stage]
        const stageDot = STAGE_DOT[stage]
        const totalLevels = levelsByStage.get(stage)?.length ?? 0

        return (
          <div key={stage} className="rounded-xl border border-border overflow-hidden">
            {/* Stage header */}
            <button
              onClick={() => !searchQuery && toggleStage(stage)}
              className={`w-full flex items-center justify-between px-4 py-3 bg-surface transition-colors ${
                searchQuery ? 'cursor-default' : 'hover:bg-surface-raised'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${stageDot}`} />
                <p className={`text-[12px] font-semibold ${stageColor}`}>{stageLabel}</p>
                <span className="text-[10px] text-text-muted font-mono">
                  {searchQuery ? `${levels.length} of ${totalLevels}` : `${totalLevels} levels`}
                </span>
              </div>
              {!searchQuery && (
                isOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                  : <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              )}
            </button>

            {/* Level rows */}
            {isOpen && levels.length > 0 && (
              <div className="divide-y divide-border border-t border-border">
                {levels.map(level => {
                  const gateCount = explorerData.gates.filter(g => g.from_level_id === level.id).length
                  const drillCount = explorerData.drills.filter(d => d.level_min_id === level.id).length
                  const cueCount = explorerData.coachLanguage.filter(c => c.level_id === level.id).length

                  return (
                    <Link
                      key={level.id}
                      href={`/director/curriculum/level/${level.id}`}
                      className="flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-raised hover:border-l-2 hover:border-l-lime transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate text-text-secondary group-hover:text-text-primary transition-colors">
                          {level.display_name}
                        </p>
                        {explorerData.tablesAvailable && (
                          <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                            {gateCount}g · {drillCount}d · {cueCount}cl
                          </p>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-text-muted group-hover:text-lime transition-colors" />
                    </Link>
                  )
                })}
              </div>
            )}

            {isOpen && levels.length === 0 && !searchQuery && (
              <div className="px-4 py-3 border-t border-border">
                <p className="text-[11px] text-text-muted">No levels in this stage yet.</p>
              </div>
            )}
          </div>
        )
      })}

    </div>
  )
}
