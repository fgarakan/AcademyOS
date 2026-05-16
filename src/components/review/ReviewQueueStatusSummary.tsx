'use client'

import { CheckCircle, Clock, AlertCircle, ChevronRight, Layers } from 'lucide-react'
import type { ReviewItemTargetModule } from '@/lib/wrap-up/wrapUpReviewQueueMapper'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReviewItemStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'applied'

export interface ReviewQueueItem {
  id: string
  targetModule: ReviewItemTargetModule
  status: ReviewItemStatus
  playerName: string | null
  summary: string
  createdAt: string
  approvedAt: string | null
  appliedAt: string | null
}

export interface ReviewQueueStatusSummaryProps {
  items: ReviewQueueItem[]
  onViewItem?: (itemId: string) => void
  onApplyAll?: () => void
  className?: string
}

// ── Module display config ─────────────────────────────────────────────────────

const MODULE_LABELS: Record<ReviewItemTargetModule, string> = {
  attendance_exception: 'Attendance exception',
  session_wrap_up_v1: 'Session wrap-up',
  coach_observation: 'Coach observation',
  parent_update: 'Parent update',
  director_follow_up: 'Director follow-up',
  coach_follow_up: 'Coach follow-up',
  player_support: 'Player support',
  admin_note: 'Admin note',
}

// ── Status display config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReviewItemStatus, {
  label: string
  icon: React.ReactNode
  chipClass: string
  rowClass: string
}> = {
  pending_review: {
    label: 'Pending review',
    icon: <AlertCircle size={11} />,
    chipClass: 'bg-status-orange/10 text-status-orange border border-status-orange/30',
    rowClass: 'border-status-orange/20 bg-status-orange/5',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle size={11} />,
    chipClass: 'bg-status-green/10 text-status-green border border-status-green/30',
    rowClass: 'border-status-green/20 bg-status-green/5',
  },
  rejected: {
    label: 'Rejected',
    icon: <Clock size={11} />,
    chipClass: 'bg-surface-raised text-text-muted border border-border',
    rowClass: 'border-border bg-surface-raised',
  },
  applied: {
    label: 'Applied',
    icon: <CheckCircle size={11} />,
    chipClass: 'bg-lime/10 text-lime border border-lime/30',
    rowClass: 'border-lime/20 bg-lime/5',
  },
}

// ── Count helpers ─────────────────────────────────────────────────────────────

function countByStatus(items: ReviewQueueItem[]): Record<ReviewItemStatus, number> {
  return {
    pending_review: items.filter(i => i.status === 'pending_review').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
    applied: items.filter(i => i.status === 'applied').length,
  }
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({
  count,
  label,
  chipClass,
  icon,
}: {
  count: number
  label: string
  chipClass: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 py-3 bg-surface-raised border border-border rounded-xl">
      <span className="text-xl font-mono font-bold text-text-primary">{count}</span>
      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${chipClass}`}>
        {icon}
        {label}
      </span>
    </div>
  )
}

// ── Item row ──────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onViewItem,
}: {
  item: ReviewQueueItem
  onViewItem?: (id: string) => void
}) {
  const statusCfg = STATUS_CONFIG[item.status]

  return (
    <button
      onClick={() => onViewItem?.(item.id)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors text-left ${
        statusCfg.rowClass
      } ${onViewItem ? 'hover:border-lime/30 cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-text-primary">
            {MODULE_LABELS[item.targetModule]}
          </span>
          {item.playerName && (
            <span className="text-[10px] text-text-muted">· {item.playerName}</span>
          )}
        </div>
        <p className="text-[11px] text-text-muted truncate mt-0.5">{item.summary}</p>
      </div>

      <div className="flex items-center gap-2 ml-3 shrink-0">
        <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${statusCfg.chipClass}`}>
          {statusCfg.icon}
          {statusCfg.label}
        </span>
        {onViewItem && <ChevronRight size={12} className="text-text-muted" />}
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReviewQueueStatusSummary({
  items,
  onViewItem,
  onApplyAll,
  className,
}: ReviewQueueStatusSummaryProps) {
  const counts = countByStatus(items)
  const approvedItems = items.filter(i => i.status === 'approved')
  const pendingItems = items.filter(i => i.status === 'pending_review')
  const appliedItems = items.filter(i => i.status === 'applied')
  const rejectedItems = items.filter(i => i.status === 'rejected')

  if (items.length === 0) {
    return (
      <div className={`bg-surface border border-border rounded-2xl px-4 py-8 text-center ${className}`}>
        <Layers size={24} className="text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-muted">No items in review queue</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stat tiles */}
      <div className="flex items-stretch gap-2">
        <StatTile
          count={counts.pending_review}
          label="Pending"
          icon={STATUS_CONFIG.pending_review.icon}
          chipClass={STATUS_CONFIG.pending_review.chipClass}
        />
        <StatTile
          count={counts.approved}
          label="Approved"
          icon={STATUS_CONFIG.approved.icon}
          chipClass={STATUS_CONFIG.approved.chipClass}
        />
        <StatTile
          count={counts.applied}
          label="Applied"
          icon={STATUS_CONFIG.applied.icon}
          chipClass={STATUS_CONFIG.applied.chipClass}
        />
        <StatTile
          count={counts.rejected}
          label="Rejected"
          icon={STATUS_CONFIG.rejected.icon}
          chipClass={STATUS_CONFIG.rejected.chipClass}
        />
      </div>

      {/* Approved — awaiting execution */}
      {approvedItems.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-text-muted">
              Approved — awaiting execution
            </p>
            {onApplyAll && (
              <button
                onClick={onApplyAll}
                className="text-[11px] text-status-green hover:text-status-green/80 transition-colors"
              >
                Apply all →
              </button>
            )}
          </div>
          <div className="space-y-1">
            {approvedItems.map(item => (
              <ItemRow key={item.id} item={item} onViewItem={onViewItem} />
            ))}
          </div>
        </div>
      )}

      {/* Pending review */}
      {pendingItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-widest text-text-muted">
            Pending director review
          </p>
          <div className="space-y-1">
            {pendingItems.map(item => (
              <ItemRow key={item.id} item={item} onViewItem={onViewItem} />
            ))}
          </div>
        </div>
      )}

      {/* Applied */}
      {appliedItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Applied</p>
          <div className="space-y-1">
            {appliedItems.map(item => (
              <ItemRow key={item.id} item={item} onViewItem={onViewItem} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected */}
      {rejectedItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Rejected</p>
          <div className="space-y-1">
            {rejectedItems.map(item => (
              <ItemRow key={item.id} item={item} onViewItem={onViewItem} />
            ))}
          </div>
        </div>
      )}

      {/* Separation note */}
      <div className="flex items-start gap-2 bg-surface-raised border border-border rounded-xl px-3 py-2">
        <p className="text-[11px] text-text-muted leading-snug">
          <span className="text-status-green">Approved</span> items are director-reviewed but not yet written.{' '}
          <span className="text-lime">Applied</span> items are written to official records.
          These states are always kept separate.
        </p>
      </div>
    </div>
  )
}
