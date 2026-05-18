'use client'

import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  levels: CurriculumLevel[]
  currentIndex: number
  reviewed: Set<number>
  onJump: () => void
}

const STAGE_DOT: Record<string, string> = {
  red_foundation:     '#ef4444',
  orange_development: '#f97316',
  green_performance:  '#22c55e',
  yellow_competitive: '#eab308',
  high_performance:   '#a78bfa',
}

export function CurriculumProgressRail({ levels, currentIndex, reviewed, onJump }: Props) {
  const reviewedCount = reviewed.size
  const total = levels.length
  const pct = total > 0 ? Math.round((reviewedCount / total) * 100) : 0
  const currentLevel = levels[currentIndex]

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-2.5">
      {/* Top row: label + jump */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-text-primary">
            {currentLevel?.display_name ?? `Level ${currentIndex + 1}`}
          </span>
          <span className="text-[10px] text-text-muted">
            ({currentIndex + 1} of {total})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-text-muted">
            <span className="font-mono text-lime">{reviewedCount}</span>/{total} reviewed
          </span>
          <button
            onClick={onJump}
            className="text-[11px] text-text-muted hover:text-lime transition-colors border border-border rounded-lg px-2.5 py-1"
          >
            Jump
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-surface-raised rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-lime rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-text-muted font-mono shrink-0 w-8 text-right">{pct}%</span>
      </div>

      {/* Level dots */}
      <div className="flex items-center gap-1 flex-wrap">
        {levels.map((level, i) => {
          const isReviewed = reviewed.has(i)
          const isCurrent = i === currentIndex
          const dot = STAGE_DOT[level.stage ?? ''] ?? '#555'
          return (
            <div
              key={level.id}
              title={level.display_name}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: isReviewed ? '#30D158' : isCurrent ? dot : dot + '44',
                outline: isCurrent ? `2px solid ${dot}` : 'none',
                outlineOffset: '1px',
                transform: isCurrent ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
