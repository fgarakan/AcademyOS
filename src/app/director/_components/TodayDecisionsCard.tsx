'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardCheck, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import type { DirectorDecision } from '@/lib/donna/today/directorDecisionEngine'
import { TodayActionExpansionPanel } from './TodayActionExpansionPanel'

const URGENCY_DOT: Record<DirectorDecision['urgency'], string> = {
  high:   'bg-status-orange',
  medium: 'bg-yellow-400',
  low:    'bg-text-muted',
}

interface Props {
  decisions:            DirectorDecision[]
  totalPendingReviews:  number
}

function DecisionRow({ d }: { d: DirectorDecision }) {
  const [showAction, setShowAction] = useState(false)

  return (
    <div className="py-3 space-y-1 border-b border-border/50 last:border-none">
      <div className="flex items-start gap-3">
        <span className={`w-2 h-2 rounded-full shrink-0 mt-[5px] ${URGENCY_DOT[d.urgency]}`} />
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-[13px] font-semibold text-text-primary leading-snug">
            {d.headline}
          </p>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {d.synthesis}
          </p>
          {d.ageNote && (
            <p className="text-[10px] text-text-muted italic">{d.ageNote}</p>
          )}
        </div>
        <Link
          href={d.actionHref}
          className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity whitespace-nowrap pt-0.5"
        >
          {d.actionLabel} →
        </Link>
      </div>

      <div className="ml-5">
        <button
          type="button"
          onClick={() => setShowAction(v => !v)}
          className="flex items-center gap-1 text-[10px] font-semibold text-lime/70 hover:text-lime transition-colors"
        >
          {showAction ? 'Hide' : 'Take action'}
          {showAction ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showAction && (
        <TodayActionExpansionPanel plan={d.executionPlan} />
      )}
    </div>
  )
}

export function TodayDecisionsCard({ decisions, totalPendingReviews }: Props) {
  return (
    <div
      className="rounded-2xl border border-border bg-surface overflow-hidden"
      data-donna-focus-id="today-decisions-card"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="label-xs">Decisions Needed</p>
        </div>
        {totalPendingReviews > 0 && (
          <Link
            href="/director/review"
            className="text-[10px] font-semibold text-text-muted hover:text-lime transition-colors"
          >
            All {totalPendingReviews} →
          </Link>
        )}
      </div>

      {decisions.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-[12px] text-text-secondary">No decisions waiting — queue is clear.</p>
        </div>
      ) : (
        <div className="px-4">
          {decisions.map((d) => (
            <DecisionRow key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  )
}
