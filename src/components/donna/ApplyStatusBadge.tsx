'use client'

// Sprint 564 — Review Queue Approved vs Applied Logic V1
// Status badge making approved vs applied distinction clear throughout the review queue.
// "Approved" = human said yes. "Applied" = official system record changed.

import {
  getStatusLabel,
  getStatusColor,
  getStatusDot,
  APPLY_STATUS_META,
} from '@/lib/donna/proposedActionApplyStatus'
import type { ProposedActionApplyStatus } from '@/lib/donna/proposedActionApplyStatus'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ApplyStatusBadgeProps {
  status: ProposedActionApplyStatus
  showDescription?: boolean
  compact?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ApplyStatusBadge({
  status,
  showDescription = false,
  compact = false,
}: ApplyStatusBadgeProps) {
  const meta = APPLY_STATUS_META[status]
  const colorClass = getStatusColor(status)
  const dotClass = getStatusDot(status)
  const label = getStatusLabel(status)

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${colorClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
        {label}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorClass}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        {label}
      </span>
      {showDescription && (
        <p className="text-[10px] text-text-muted leading-snug pl-3.5">
          {meta.description}
        </p>
      )}
      {meta.requiresHumanAction && !meta.isTerminal && (
        <p className="text-[10px] text-status-orange pl-3.5">Requires human action</p>
      )}
    </div>
  )
}

// ── Approved vs Applied clarification banner ──────────────────────────────────

export function ApprovedVsAppliedBanner({
  status,
}: {
  status: ProposedActionApplyStatus
}) {
  if (status !== 'approved' && status !== 'approved_not_applied') return null

  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-status-blue/20 bg-status-blue/5">
      <span className="w-1.5 h-1.5 rounded-full bg-status-blue shrink-0 mt-1.5" />
      <p className="text-[11px] text-status-blue leading-snug">
        <span className="font-semibold">Approved</span> means a director or head coach said yes.{' '}
        <span className="font-semibold">Applied</span> means the official record was actually changed.
        This item is approved but not yet applied.
      </p>
    </div>
  )
}
