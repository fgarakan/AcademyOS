'use client'

import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'

export interface DrillItem {
  id: string
  text: string
  duration?: string
}

interface Props {
  drills: DrillItem[]
}

export function PracticeChecklist({ drills }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const doneCount = checked.size

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-surface-raised px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Today&apos;s Drills</p>
        <p className="text-xs text-text-muted">{doneCount}/{drills.length} done</p>
      </div>
      <div className="bg-surface divide-y divide-border">
        {drills.map(drill => {
          const done = checked.has(drill.id)
          return (
            <button
              key={drill.id}
              onClick={() => toggle(drill.id)}
              className="w-full flex items-start gap-4 px-4 py-3.5 text-left hover:bg-surface-raised/50 transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                {done ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-lime" />
                ) : (
                  <Circle className="w-4.5 h-4.5 text-text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${done ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                  {drill.text}
                </p>
                {drill.duration && (
                  <p className="text-xs text-text-muted mt-0.5">{drill.duration}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
      {doneCount === drills.length && drills.length > 0 && (
        <div className="bg-lime/5 border-t border-lime/20 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-lime">Session complete. Great work.</p>
        </div>
      )}
    </div>
  )
}
