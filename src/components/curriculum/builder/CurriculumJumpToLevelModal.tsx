'use client'

import { X } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  levels: CurriculumLevel[]
  currentIndex: number
  reviewed: Set<number>
  onJump: (index: number) => void
  onClose: () => void
}

const STAGE_COLOR: Record<string, string> = {
  red_foundation:     'text-red-400',
  orange_development: 'text-amber-400',
  green_performance:  'text-green-400',
  yellow_competitive: 'text-yellow-300',
  high_performance:   'text-violet-400',
}

export function CurriculumJumpToLevelModal({ levels, currentIndex, reviewed, onJump, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-[13px] font-semibold text-text-primary">Jump to level</p>
          <button onClick={onClose} className="text-text-muted hover:text-lime transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-80">
          {levels.map((level, i) => (
            <button
              key={level.id}
              onClick={() => onJump(i)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-surface-raised transition-colors border-b border-border last:border-b-0 ${
                i === currentIndex ? 'bg-lime/[0.05]' : ''
              }`}
            >
              <span className={`text-[10px] font-semibold w-4 text-center ${STAGE_COLOR[level.stage ?? ''] ?? 'text-text-muted'}`}>
                {i + 1}
              </span>
              <span className="flex-1 text-[12px] text-text-primary">{level.display_name}</span>
              {reviewed.has(i) && (
                <span className="text-[10px] text-status-green shrink-0">✓</span>
              )}
              {i === currentIndex && (
                <span className="text-[10px] text-lime shrink-0 font-semibold">Current</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
