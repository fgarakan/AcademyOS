'use client'

import Link from 'next/link'
import { ChevronRight, CircleDot, AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react'
import { Card } from '@/components/ui'
import type { DirectorDecision } from '@/lib/donna/operations/directorDecisionEngine'

interface Props {
  decisions: DirectorDecision[]
}

const URGENCY_CONFIG = {
  critical: { color: 'text-status-red',    bg: 'bg-status-red/10',    border: 'border-status-red/30',    icon: AlertCircle,   label: 'Act now' },
  high:     { color: 'text-status-orange', bg: 'bg-status-orange/10', border: 'border-status-orange/30', icon: AlertTriangle, label: 'This week' },
  medium:   { color: 'text-status-blue',   bg: 'bg-status-blue/10',   border: 'border-status-blue/30',   icon: Info,          label: 'This month' },
  low:      { color: 'text-text-muted',    bg: 'bg-surface-raised',   border: 'border-border',            icon: Clock,         label: 'When ready' },
}

function ConfidenceDot({ confidence }: { confidence: 'reliable' | 'provisional' }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          confidence === 'reliable' ? 'bg-status-green' : 'bg-status-orange'
        }`}
      />
      <span className={`text-xs uppercase tracking-widest font-medium ${
        confidence === 'reliable' ? 'text-status-green' : 'text-status-orange'
      }`}>
        {confidence}
      </span>
    </span>
  )
}

function DecisionCard({ decision }: { decision: DirectorDecision }) {
  const urg = URGENCY_CONFIG[decision.urgency] ?? URGENCY_CONFIG.medium
  const UrgIcon = urg.icon

  return (
    <div className={`rounded-xl border ${urg.border} bg-surface-raised p-4 space-y-3`}>
      {/* Rank + urgency + confidence */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
            {decision.rank}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider ${urg.bg} ${urg.color}`}>
            <UrgIcon className="w-3 h-3" />
            {urg.label}
          </span>
        </div>
        <ConfidenceDot confidence={decision.confidence} />
      </div>

      {/* Title */}
      <p className="text-xl font-semibold text-text-primary leading-snug">
        {decision.title}
      </p>

      {/* First step */}
      <p className="text-base text-text-secondary leading-snug">
        {decision.firstStep}
      </p>

      {/* CTA */}
      <div className="flex items-center justify-between pt-1">
        {decision.approvalRequired && (
          <span className="text-xs uppercase tracking-widest text-status-orange font-medium">
            Approval required
          </span>
        )}
        <Link
          href={decision.actionHref}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-lime hover:underline min-h-[44px] py-2"
        >
          Open <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export function DirectorDecisionCenter({ decisions }: Props) {
  if (decisions.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center space-y-2">
          <CircleDot className="w-6 h-6 text-text-secondary mx-auto" />
          <p className="text-text-secondary text-base">No decisions need your attention right now.</p>
          <p className="text-text-secondary text-sm">DONNA will surface priorities here as they emerge.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label-xs">Top Decisions</p>
        <p className="text-xs text-text-secondary">
          {decisions.length} item{decisions.length !== 1 ? 's' : ''} needing a call
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {decisions.map(d => (
          <DecisionCard key={d.rank} decision={d} />
        ))}
      </div>
    </div>
  )
}
