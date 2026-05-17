'use client'

// Sprint 602 — Top 5 Academy Priorities Live Actions V1
// Shows the director's top 5 DONNA-ranked next best actions with direct action links.
// Display only — no DB writes, no mutations.

import { ArrowRight, Ban, AlertCircle, CheckCircle2, Minus } from 'lucide-react'
import type { NextBestAction } from '@/lib/donna/donnaNBAEngine'

// ── Urgency config ────────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  high: { label: 'Urgent', dot: 'bg-status-red', text: 'text-status-red' },
  medium: { label: 'Today', dot: 'bg-status-orange', text: 'text-status-orange' },
  low: { label: 'When ready', dot: 'bg-text-muted', text: 'text-text-muted' },
}

// ── Priority row ──────────────────────────────────────────────────────────────

function PriorityRow({
  action,
  onActionClick,
}: {
  action: NextBestAction
  onActionClick?: (action: NextBestAction) => void
}) {
  const urgencyCfg = URGENCY_CONFIG[action.urgency]

  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 ${
      action.isBlocked ? 'opacity-60' : ''
    }`}>
      {/* Rank + dot */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
        <span className="text-[10px] font-mono text-text-muted w-4 text-center">{action.rank}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${urgencyCfg.dot}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-xs font-medium text-text-primary leading-snug flex-1">{action.title}</p>
          <span className={`text-[9px] font-medium ${urgencyCfg.text} shrink-0`}>
            {urgencyCfg.label}
          </span>
        </div>
        <p className="text-[10px] text-text-muted leading-snug mt-0.5">{action.reason}</p>
        {action.isBlocked && action.blockedReason && (
          <div className="flex items-center gap-1 mt-1">
            <Ban className="w-3 h-3 text-status-orange shrink-0" />
            <p className="text-[10px] text-status-orange">{action.blockedReason}</p>
          </div>
        )}
      </div>

      {/* Action */}
      {!action.isBlocked && action.actionRoute && (
        <button
          onClick={() => onActionClick?.(action)}
          className="flex items-center gap-1 text-[11px] text-lime hover:text-lime/80 transition-colors shrink-0 pt-0.5"
        >
          <span>{action.actionLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
      {action.isBlocked && (
        <div className="pt-0.5">
          <Ban className="w-3.5 h-3.5 text-text-muted" />
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export interface AcademyTopPrioritiesPanelProps {
  actions: NextBestAction[]
  isLoading?: boolean
  onActionClick?: (action: NextBestAction) => void
  className?: string
}

export function AcademyTopPrioritiesPanel({
  actions,
  isLoading = false,
  onActionClick,
  className = '',
}: AcademyTopPrioritiesPanelProps) {
  const top5 = actions.slice(0, 5)
  const urgentCount = top5.filter(a => a.urgency === 'high').length

  if (isLoading) {
    return (
      <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-lime shrink-0" />
          <p className="text-sm font-medium text-text-primary">Top priorities</p>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-text-muted animate-pulse">Loading priorities…</p>
        </div>
      </div>
    )
  }

  if (top5.length === 0) {
    return (
      <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
          <p className="text-sm font-medium text-text-primary">All clear</p>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-text-muted">No high-priority items right now.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-lime shrink-0" />
          <p className="text-sm font-medium text-text-primary">Top priorities</p>
        </div>
        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-status-red" />
              <span className="text-[10px] text-status-red font-medium">
                {urgentCount} urgent
              </span>
            </div>
          )}
          <span className="text-[10px] text-text-muted">{top5.length} items</span>
        </div>
      </div>

      {/* Actions */}
      {top5.map(action => (
        <PriorityRow key={action.rank} action={action} onActionClick={onActionClick} />
      ))}

      {/* DONNA attribution */}
      <div className="px-4 py-2 border-t border-border bg-surface-raised">
        <p className="text-[10px] text-text-muted">
          Ranked by DONNA based on live academy context.
        </p>
      </div>
    </div>
  )
}
