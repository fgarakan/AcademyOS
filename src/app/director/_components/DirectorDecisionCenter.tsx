'use client'

import Link from 'next/link'
import { ChevronRight, CircleDot, AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react'
import { Card } from '@/components/ui'
import type { DirectorDecision, DecisionUrgency } from '@/lib/donna/operations/directorDecisionEngine'
import { DonnaExplainPopover } from './DonnaExplainPopover'

interface Props {
  decisions: DirectorDecision[]
}

const URGENCY_CONFIG: Record<DecisionUrgency, {
  color: string; bg: string; border: string
  icon: React.ComponentType<{ className?: string }>; label: string
}> = {
  critical: { color: 'text-status-red',    bg: 'bg-status-red/10',    border: 'border-status-red/30',    icon: AlertCircle,   label: 'Act now' },
  high:     { color: 'text-status-orange', bg: 'bg-status-orange/10', border: 'border-status-orange/30', icon: AlertTriangle, label: 'This week' },
  medium:   { color: 'text-status-blue',   bg: 'bg-status-blue/10',   border: 'border-status-blue/30',   icon: Info,          label: 'This month' },
  low:      { color: 'text-text-muted',    bg: 'bg-surface-raised',   border: 'border-border',            icon: Clock,         label: 'When ready' },
}

// ── DONNA reasoning builder ────────────────────────────────────────────────────
// Constructs operator-readable reasoning from decision metadata.
// No AI, no new intelligence — synthesises from existing domain + urgency.

function buildDonnaReasoning(decision: DirectorDecision): string {
  const urgencyPhrase: Record<DecisionUrgency, string> = {
    critical: 'Acting today prevents this from getting worse.',
    high:     'Left unaddressed this week, this will compound.',
    medium:   'Address it before month-end to stay on track.',
    low:      'This is stable — address it when you have capacity.',
  }
  const domainPhrase: Record<string, string> = {
    players:    'Player development outcomes are directly affected.',
    coaches:    'Coach effectiveness and accountability depend on this.',
    curriculum: 'Your curriculum delivery quality is impacted.',
    parents:    'Parent trust, transparency, and retention are at risk.',
    system:     'Academy operations are slowed or blocked by this.',
  }
  const domain  = domainPhrase[decision.domain] ?? 'Academy performance is affected.'
  const urgency = urgencyPhrase[decision.urgency]
  return `${domain} ${urgency}`
}

// ── Decision card ─────────────────────────────────────────────────────────────

function DecisionCard({ decision }: { decision: DirectorDecision }) {
  const urg = URGENCY_CONFIG[decision.urgency] ?? URGENCY_CONFIG.medium
  const UrgIcon = urg.icon
  const actionLabel = decision.approvalRequired ? 'Review' : 'Open'

  return (
    <div className={`rounded-xl border ${urg.border} bg-surface-raised p-4 space-y-3`}>

      {/* Header: rank + urgency + evidence count + confidence */}
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
        <div className="flex items-center gap-2 shrink-0">
          {decision.evidenceUsed.length > 0 && (
            <span className="text-xs text-text-secondary">
              {decision.evidenceUsed.length} signal{decision.evidenceUsed.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className={`flex items-center gap-1 text-xs font-medium ${
            decision.confidence === 'reliable' ? 'text-status-green' : 'text-status-orange'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              decision.confidence === 'reliable' ? 'bg-status-green' : 'bg-status-orange'
            }`} />
            {decision.confidence}
          </span>
        </div>
      </div>

      {/* Decision title — what the director must decide */}
      <p className="text-xl font-semibold text-text-primary leading-snug">
        {decision.title}
      </p>

      {/* Action row: primary CTA + Ask DONNA */}
      <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
        <Link
          href={decision.actionHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-lime hover:underline min-h-[44px] py-2"
        >
          {actionLabel} <ChevronRight className="w-4 h-4" />
        </Link>

        <DonnaExplainPopover
          reasoning={buildDonnaReasoning(decision)}
          recommendedStep={decision.firstStep}
          evidence={decision.evidenceUsed}
        />
      </div>

    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export function DirectorDecisionCenter({ decisions }: Props) {
  if (decisions.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center space-y-2">
          <CircleDot className="w-6 h-6 text-text-secondary mx-auto" />
          <p className="text-base text-text-secondary">No decisions need your attention right now.</p>
          <p className="text-sm text-text-secondary">DONNA will surface priorities here as they emerge.</p>
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
