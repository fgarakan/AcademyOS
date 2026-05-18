'use client'

import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  levels: CurriculumLevel[]
  currentIndex: number
  reviewed: Set<number>
  skipped?: Set<number>
  onJump: () => void
}

const STAGE_COLOR: Record<string, string> = {
  red_foundation:     '#ef4444',
  orange_development: '#f97316',
  green_performance:  '#22c55e',
  yellow_competitive: '#eab308',
  high_performance:   '#a78bfa',
}

const STAGE_PREFIX: Record<string, string> = {
  red_foundation:     'R',
  orange_development: 'O',
  green_performance:  'G',
  yellow_competitive: 'Y',
  high_performance:   'HP',
}

function compactLabel(level: CurriculumLevel): string {
  const prefix = level.stage ? (STAGE_PREFIX[level.stage] ?? '?') : '?'
  const match = level.display_name.match(/(\d+)\s*$/)
  return match ? `${prefix}${match[1]}` : prefix
}

export function CurriculumProgressRail({
  levels,
  currentIndex,
  reviewed,
  skipped = new Set(),
  onJump,
}: Props) {
  const reviewedCount = reviewed.size
  const total = levels.length
  const pct = total > 0 ? Math.round((reviewedCount / total) * 100) : 0

  return (
    <div
      className="rounded-xl px-4 py-3 space-y-2.5"
      style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-text-muted">
          <span className="font-mono text-lime">{reviewedCount}</span>
          <span className="text-text-muted">/{total} reviewed</span>
        </span>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[9px] text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: '#30D158' }} />
              Kept
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: '#FF9500' }} />
              Skipped
            </span>
          </div>
          <button
            onClick={onJump}
            className="text-[10px] text-text-muted hover:text-lime transition-colors border border-border rounded-lg px-2 py-0.5"
          >
            Jump
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-full h-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: '#C8FF00' }}
          />
        </div>
        <span className="text-[10px] font-mono shrink-0 w-8 text-right" style={{ color: pct === 100 ? '#30D158' : '#555' }}>
          {pct}%
        </span>
      </div>

      {/* Pill rail — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-1 px-1 pb-0.5">
        <div className="flex items-center gap-1.5 min-w-max">
          {levels.map((level, i) => {
            const isReviewed = reviewed.has(i)
            const isSkipped  = skipped.has(i)
            const isCurrent  = i === currentIndex
            const stageColor = level.stage ? (STAGE_COLOR[level.stage] ?? '#555') : '#555'
            const label = compactLabel(level)

            let bg: string
            let color: string
            let borderColor: string

            if (isReviewed) {
              bg = 'rgba(48,209,88,0.18)'
              color = '#30D158'
              borderColor = 'rgba(48,209,88,0.35)'
            } else if (isSkipped) {
              bg = 'rgba(255,149,0,0.18)'
              color = '#FF9500'
              borderColor = 'rgba(255,149,0,0.35)'
            } else if (isCurrent) {
              bg = 'rgba(17,217,223,0.15)'
              color = '#11d9df'
              borderColor = 'rgba(17,217,223,0.50)'
            } else {
              bg = 'rgba(255,255,255,0.04)'
              color = stageColor + '88'
              borderColor = stageColor + '33'
            }

            return (
              <div
                key={level.id}
                title={`${level.display_name}${isSkipped ? ' (skipped)' : isReviewed ? ' (reviewed)' : ''}`}
                className="shrink-0 rounded-md px-2 py-0.5 transition-all"
                style={{
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  color,
                  fontSize: isCurrent ? '10px' : '9px',
                  fontWeight: isCurrent ? 700 : 500,
                  fontFamily: 'monospace',
                  transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isCurrent ? `0 0 8px ${borderColor}` : 'none',
                }}
              >
                {label}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
