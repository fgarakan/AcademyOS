'use client'

// Sprint 623 — DONNA Review Queue Summary V1
// Compact summary card for the director review queue.
// Shows counts, urgency, and link to open queue.
// Display only — no DB writes.

import { ClipboardList, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReviewQueueCategory =
  | 'wrap_up'
  | 'attendance_exception'
  | 'parent_draft'
  | 'level_readiness'
  | 'curriculum_override'
  | 'voice_intake'

export interface ReviewQueueCategoryCount {
  category: ReviewQueueCategory
  count: number
  urgentCount: number
}

export interface DONNAReviewQueueSummaryProps {
  totalPending: number
  totalUrgent: number
  categories: ReviewQueueCategoryCount[]
  reviewQueueHref?: string
  onOpen?: () => void
  className?: string
}

// ── Category labels ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ReviewQueueCategory, string> = {
  wrap_up: 'Session wrap-ups',
  attendance_exception: 'Attendance exceptions',
  parent_draft: 'Parent drafts',
  level_readiness: 'Level readiness',
  curriculum_override: 'Curriculum overrides',
  voice_intake: 'Voice intakes',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAReviewQueueSummary({
  totalPending,
  totalUrgent,
  categories,
  reviewQueueHref,
  onOpen,
  className = '',
}: DONNAReviewQueueSummaryProps) {
  const isAllClear = totalPending === 0

  const handleOpen = () => {
    if (onOpen) onOpen()
    else if (reviewQueueHref) window.location.href = reviewQueueHref
  }

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">Review queue</p>
        </div>
        {isAllClear ? (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
            <span className="text-[11px] text-status-green font-medium">All clear</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {totalUrgent > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-status-red" />
                <span className="text-[10px] text-status-red font-medium">{totalUrgent} urgent</span>
              </div>
            )}
            <span className="text-[10px] text-text-muted">{totalPending} pending</span>
          </div>
        )}
      </div>

      {/* Categories */}
      {!isAllClear && categories.filter(c => c.count > 0).length > 0 && (
        <div className="px-4 py-2 space-y-1.5 border-b border-border/50">
          {categories.filter(c => c.count > 0).map(cat => (
            <div key={cat.category} className="flex items-center justify-between">
              <p className="text-[11px] text-text-muted">{CATEGORY_LABELS[cat.category]}</p>
              <div className="flex items-center gap-2">
                {cat.urgentCount > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-status-red/10 text-status-red border border-status-red/20">
                    {cat.urgentCount} urgent
                  </span>
                )}
                <span className="text-[11px] font-medium text-text-primary">{cat.count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isAllClear && (
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-text-muted">Nothing pending director review.</p>
        </div>
      )}

      {/* Open button */}
      {!isAllClear && (reviewQueueHref || onOpen) && (
        <div className="px-4 py-2.5">
          <button
            onClick={handleOpen}
            className="flex items-center gap-1.5 text-xs text-lime hover:text-lime/80 transition-colors font-medium"
          >
            Open review queue
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
