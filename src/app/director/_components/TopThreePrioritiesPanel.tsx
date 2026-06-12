'use client'
// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// Top Three Priorities Panel: renders exactly 3 priority cards.
// No more. No exceptions. Director focus, not information overload.

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, HelpCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui'
import { ExplainWhyModal } from './ExplainWhyModal'
import type { TodayPriority } from '@/lib/donna/operations/whatShouldIDoTodayEngine'
import type { DonnaActionTarget } from '@/lib/donna/operations/academyChangeEngine'

interface Props {
  priorities:    TodayPriority[]
  actionTargets: DonnaActionTarget[]
}

const URGENCY_COLOUR: Record<string, string> = {
  immediate:  'text-status-red bg-status-red/15',
  this_week:  'text-status-orange bg-status-orange/15',
  this_month: 'text-status-blue bg-status-blue/15',
}

const URGENCY_LABEL: Record<string, string> = {
  immediate:  'Today',
  this_week:  'This Week',
  this_month: 'This Month',
}

const RANK_LABELS = ['', 'PRIORITY 1', 'PRIORITY 2', 'PRIORITY 3']

function PriorityCard({
  priority,
  target,
  index,
}: {
  priority: TodayPriority
  target:   DonnaActionTarget | null
  index:    number
}) {
  const [expanded, setExpanded]   = useState(index === 0)
  const [explainOpen, setExplain] = useState(false)

  return (
    <>
      <Card className="p-5 space-y-3 flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="label-xs text-lime">{RANK_LABELS[priority.rank] ?? `PRIORITY ${priority.rank}`}</p>
            <h3 className="text-text-primary font-semibold text-sm leading-snug">{priority.title}</h3>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1 text-text-muted hover:text-text-secondary flex-shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Why Today */}
        <p className="text-sm text-text-secondary leading-relaxed">{priority.whyToday}</p>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${URGENCY_COLOUR[priority.urgency] ?? 'text-text-muted bg-surface-raised'}`}>
            {URGENCY_LABEL[priority.urgency] ?? priority.urgency}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            priority.expectedImpact === 'high' ? 'bg-status-green/15 text-status-green' :
            priority.expectedImpact === 'medium' ? 'bg-status-blue/15 text-status-blue' :
            'bg-surface-raised text-text-muted'
          }`}>
            {priority.expectedImpact.charAt(0).toUpperCase() + priority.expectedImpact.slice(1)} Impact
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            priority.confidence === 'reliable' ? 'bg-status-green/10 text-status-green' : 'bg-status-orange/10 text-status-orange'
          }`}>
            {priority.confidence === 'reliable' ? 'Reliable' : 'Provisional'}
          </span>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="pt-2 space-y-3 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="label-xs text-text-muted mb-0.5">CAPACITY COST</p>
                <p className="text-sm font-mono text-text-primary">{priority.capacityCost} / 100</p>
              </div>
              <div>
                <p className="label-xs text-text-muted mb-0.5">TIME ESTIMATE</p>
                <p className="text-sm text-text-primary flex items-center gap-1">
                  <Clock size={11} className="text-text-muted" />
                  {priority.timeEstimate}
                </p>
              </div>
            </div>

            <div>
              <p className="label-xs text-text-muted mb-1">FIRST ACTION</p>
              <p className="text-sm text-text-secondary leading-relaxed">{priority.firstStep}</p>
            </div>

            {priority.reason && (
              <div>
                <p className="label-xs text-text-muted mb-1">WHY RANKED HERE</p>
                <p className="text-xs text-text-muted leading-relaxed">{priority.reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {target ? (
            <Link href={target.route} className="btn-lime text-xs px-3 py-1.5 flex items-center gap-1.5">
              {target.label}
              <ArrowRight size={12} />
            </Link>
          ) : (
            <Link href="/director/review" className="btn-lime text-xs px-3 py-1.5 flex items-center gap-1.5">
              Take Me There
              <ArrowRight size={12} />
            </Link>
          )}

          <button
            onClick={() => setExplain(true)}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <HelpCircle size={12} />
            Explain Why
          </button>
        </div>
      </Card>

      <ExplainWhyModal
        explanation={priority.explanation}
        priorityTitle={priority.title}
        isOpen={explainOpen}
        onClose={() => setExplain(false)}
      />
    </>
  )
}

export function TopThreePrioritiesPanel({ priorities, actionTargets }: Props) {
  if (priorities.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-text-muted text-sm">No priorities generated for today. Load more data to unlock DONNA recommendations.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
        Today&apos;s Priorities <span className="text-lime font-mono">{priorities.length}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {priorities.map((p, i) => (
          <PriorityCard
            key={p.title}
            priority={p}
            target={actionTargets[i] ?? null}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
