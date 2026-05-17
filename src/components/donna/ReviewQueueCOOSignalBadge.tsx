'use client'

// Sprint 558 — Review Queue COO Signal Integration V1
// Badge showing COO signal source, linked KPI, and confidence for review items.

import { TrendingUp, AlertCircle, Info } from 'lucide-react'
import type { ReviewQueueCOOSignal } from '@/lib/donna/reviewQueueCOOSignal'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'

// ── Confidence badge ──────────────────────────────────────────────────────────

const CONFIDENCE_COLORS: Record<DONNAConfidence, string> = {
  high:         'text-status-green',
  partial:      'text-status-orange',
  insufficient: 'text-text-muted',
  blocked:      'text-status-red',
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ReviewQueueCOOSignalBadgeProps {
  signal: ReviewQueueCOOSignal
  compact?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReviewQueueCOOSignalBadge({
  signal,
  compact = false,
}: ReviewQueueCOOSignalBadgeProps) {
  const confidenceColor = CONFIDENCE_COLORS[signal.confidence]

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <TrendingUp className={`w-3 h-3 shrink-0 ${confidenceColor}`} />
        <span className="text-[10px] text-text-muted">{signal.sourceLabel}</span>
        {signal.urgency === 'high' && (
          <AlertCircle className="w-3 h-3 text-status-orange shrink-0" />
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5 flex flex-col gap-1.5">
      {/* Source + KPI */}
      <div className="flex items-center gap-2">
        <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${confidenceColor}`} />
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          COO Signal — {signal.sourceLabel}
        </span>
        {signal.urgency === 'high' && (
          <span className="ml-auto inline-flex items-center gap-1 text-[9px] text-status-orange">
            <AlertCircle className="w-3 h-3" />
            Urgent
          </span>
        )}
      </div>

      {/* KPI */}
      <p className="text-[10px] text-text-muted">
        <span className="text-text-secondary">KPI:</span> {signal.linkedKPI}
      </p>

      {/* Priority reason */}
      <div className="flex items-start gap-1.5">
        <Info className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[11px] text-text-muted leading-snug">{signal.priorityReason}</p>
      </div>
    </div>
  )
}
