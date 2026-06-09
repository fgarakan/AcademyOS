'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import type { DirectorPriority } from '@/lib/donna/today/directorPriorityEngine'

interface Props {
  priorities: DirectorPriority[]
}

function PriorityRow({ priority, index }: { priority: DirectorPriority; index: number }) {
  const [showWhy, setShowWhy] = useState(false)

  return (
    <div className="py-3 space-y-1.5 border-b border-border/50 last:border-none">
      <div className="flex items-start gap-3">
        <span className="font-mono text-[11px] font-bold text-text-muted shrink-0 w-4 text-center pt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-[13px] font-semibold text-text-primary leading-snug">
            {priority.headline}
          </p>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {priority.synthesis}
          </p>
        </div>
        <Link
          href={priority.actionHref}
          className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity whitespace-nowrap pt-0.5"
        >
          {priority.actionLabel} →
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setShowWhy(v => !v)}
        className="ml-7 flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
      >
        {showWhy ? 'Hide' : 'Why?'}
        {showWhy ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showWhy && (
        <p className="ml-7 text-[11px] text-text-muted leading-relaxed">
          {priority.whyText}
        </p>
      )}
    </div>
  )
}

export function TodayPrioritiesCard({ priorities }: Props) {
  return (
    <div
      className="rounded-2xl border border-border bg-surface overflow-hidden"
      data-donna-focus-id="today-priorities-card"
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="label-xs">Top Priorities</p>
      </div>

      {priorities.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-[12px] text-text-secondary">No priority items right now — academy is clear.</p>
        </div>
      ) : (
        <div className="px-4">
          {priorities.map((p, i) => (
            <PriorityRow key={p.actionHref + i} priority={p} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
