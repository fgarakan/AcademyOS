// DONNA UI Constitution — DecisionCard
//
// A single reviewable item that requires director decision.
// Used in the Review Queue and anywhere a decision is surfaced.
//
// Shows: what it is, why it matters, risk level, recommended action.
// Hides: technical metadata, raw payload, historical context.
//
// Constitution rule: one decision per card, one recommended action.

import Link from 'next/link'
import { AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

export type DecisionRisk = 'high' | 'medium' | 'low'
export type DecisionStatus = 'pending' | 'ready_to_apply' | 'clarification_needed'

interface DecisionCardProps {
  /** What type of item this is */
  type: string
  /** Human-readable title */
  title: string
  /** Why this item matters (1 sentence) */
  whyItMatters?: string
  /** Risk level — high items are visually emphasized */
  risk?: DecisionRisk
  /** Current status */
  status?: DecisionStatus
  /** How old this item is (days) */
  ageDays?: number | null
  /** Link to the detail view or action */
  href?: string
  /** Inline action slot (approve/reject buttons) */
  actionSlot?: ReactNode
  /** Optional: recommendation from DONNA */
  donnaRecommendation?: string
}

const RISK_STYLES: Record<DecisionRisk, { border: string; badge: string; label: string }> = {
  high:   { border: 'border-status-orange/30', badge: 'bg-status-orange/10 text-status-orange border-status-orange/20', label: 'High Risk' },
  medium: { border: 'border-border',            badge: 'bg-surface-raised text-text-muted border-border',                label: 'Review' },
  low:    { border: 'border-border',            badge: 'bg-status-green/8 text-status-green border-status-green/15',      label: 'Safe' },
}

const STATUS_ICONS: Record<DecisionStatus, typeof AlertTriangle> = {
  pending:              Clock,
  ready_to_apply:       CheckCircle,
  clarification_needed: AlertTriangle,
}

export function DecisionCard({
  type,
  title,
  whyItMatters,
  risk = 'medium',
  status = 'pending',
  ageDays,
  href,
  actionSlot,
  donnaRecommendation,
}: DecisionCardProps) {
  const riskStyles = RISK_STYLES[risk]
  const StatusIcon = STATUS_ICONS[status]

  const inner = (
    <div className={`rounded-xl border ${riskStyles.border} bg-surface px-4 py-3.5 space-y-2 hover:bg-surface-raised transition-colors`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${status === 'ready_to_apply' ? 'text-status-green' : status === 'clarification_needed' ? 'text-status-orange' : 'text-text-muted'}`} />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-0.5">{type}</p>
            <p className="text-sm font-semibold text-text-primary leading-snug">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {risk === 'high' && (
            <span className={`text-[8px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border ${riskStyles.badge}`}>
              {riskStyles.label}
            </span>
          )}
          {ageDays !== null && ageDays !== undefined && ageDays > 0 && (
            <span className={`text-[9px] font-mono ${ageDays > 5 ? 'text-status-orange' : 'text-text-muted'}`}>
              {ageDays}d
            </span>
          )}
          {href && <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
        </div>
      </div>

      {/* Why it matters */}
      {whyItMatters && (
        <p className="text-[11px] text-text-muted leading-relaxed pl-6">{whyItMatters}</p>
      )}

      {/* DONNA recommendation */}
      {donnaRecommendation && (
        <div className="pl-6 flex items-start gap-1.5">
          <span className="text-[9px] font-bold text-lime uppercase tracking-wide shrink-0 mt-0.5">DONNA</span>
          <p className="text-[11px] text-text-secondary leading-relaxed">{donnaRecommendation}</p>
        </div>
      )}

      {/* Action slot */}
      {actionSlot && (
        <div className="pl-6 pt-1">
          {actionSlot}
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }
  return inner
}
