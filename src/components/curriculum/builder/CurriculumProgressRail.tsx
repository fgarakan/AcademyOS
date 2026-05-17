'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  levels: CurriculumLevel[]
  currentIndex: number
  reviewed: Set<number>
  onJump: () => void
}

export function CurriculumProgressRail({ levels, currentIndex, reviewed, onJump }: Props) {
  const reviewedCount = reviewed.size
  const total = levels.length
  const pct = total > 0 ? Math.round((reviewedCount / total) * 100) : 0

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0 bg-surface-raised rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-lime rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-text-muted shrink-0">
          {reviewedCount}/{total}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1">
          {levels.slice(0, 8).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full flex items-center justify-center">
              {reviewed.has(i)
                ? <CheckCircle2 className="w-2 h-2 text-status-green" />
                : i === currentIndex
                ? <Circle className="w-2 h-2 text-lime" />
                : <Circle className="w-2 h-2 text-text-muted opacity-40" />
              }
            </div>
          ))}
          {levels.length > 8 && (
            <span className="text-[10px] text-text-muted">+{levels.length - 8}</span>
          )}
        </div>
        <button
          onClick={onJump}
          className="text-[11px] text-text-muted hover:text-lime transition-colors border border-border rounded-lg px-2.5 py-1"
        >
          Jump to level
        </button>
      </div>
    </div>
  )
}
