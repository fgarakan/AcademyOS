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
      <span className={`text-[10px] uppercase tracking-widest font-medium ${
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
          <span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-bold text-text-muted shrink-0">
            {decision.rank}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${urg.bg} ${urg.color}`}>
            <UrgIcon className="w-2.5 h-2.5" />
            {urg.label}
          </span>
        </div>
        <ConfidenceDot confidence={decision.confidence} />
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-text-primary leading-snug">
        {decision.title}
      </p>

      {/* First step */}
      <p className="text-[12px] text-text-muted leading-snug flex-1">
        {decision.firstStep}
      </p>

      {/* CTA */}
      <div className="flex items-center justify-between pt-1">
        {decision.approvalRequired && (
          <span className="text-[10px] uppercase tracking-widest text-status-orange font-medium">
            Approval required
          </span>
        )}
        <Link
          href={decision.actionHref}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-lime hover:underline"
        >
          Open <ChevronRight className="w-3 h-3" />
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
          <CircleDot className="w-6 h-6 text-text-muted mx-auto" />
          <p className="text-text-secondary text-sm">No decisions need your attention right now.</p>
          <p className="text-text-muted text-[11px]">DONNA will surface priorities here as they emerge.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label-xs">Top Decisions</p>
        <p className="text-[10px] text-text-muted">
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
