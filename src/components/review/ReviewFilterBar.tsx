'use client'

// Sprint 631 — Review Center Filter Bar V1
// Client component — no DB calls, no mutations.
// Renders filter chips for the /director/review command view.
// Filter state is managed by the parent — this is a pure UI component.

import { cn } from '@/lib/utils'
import {
  REVIEW_CENTER_FILTERS,
  type ReviewFilterId,
} from '@/lib/review/reviewCenterFilters'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ReviewFilterBarProps {
  activeFilters: ReviewFilterId[]
  onToggleFilter: (id: ReviewFilterId) => void
  /** Counts by filter ID — optional; shows badge if provided */
  counts?: Partial<Record<ReviewFilterId, number>>
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReviewFilterBar({
  activeFilters,
  onToggleFilter,
  counts,
  className = '',
}: ReviewFilterBarProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {REVIEW_CENTER_FILTERS.map(filter => {
        const isActive = activeFilters.includes(filter.id)
        const count = counts?.[filter.id]

        return (
          <button
            key={filter.id}
            onClick={() => onToggleFilter(filter.id)}
            title={filter.description}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border',
              isActive
                ? 'bg-lime/10 border-lime/30 text-lime'
                : 'bg-surface border-border text-text-secondary hover:border-lime/20 hover:text-text-primary',
            )}
          >
            <span>{filter.label}</span>
            {typeof count === 'number' && count > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-semibold',
                  isActive
                    ? 'bg-lime text-base'
                    : 'bg-surface-raised text-text-secondary',
                )}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Review item metadata row ──────────────────────────────────────────────────
// Renders risk, module, visibility, approval requirement for a single item.

import {
  classifyReviewItemRisk,
  resolveModuleLabel,
  resolveVisibilityImpact,
  resolveApprovalRequirement,
} from '@/lib/review/reviewCenterFilters'
import { ShieldAlert, Eye, Lock } from 'lucide-react'

export interface ReviewItemMetaRowProps {
  targetModule: string | null
  status: string
  createdAt?: string | null
  source?: string | null
  className?: string
}

export function ReviewItemMetaRow({
  targetModule,
  status,
  createdAt,
  source,
  className = '',
}: ReviewItemMetaRowProps) {
  const risk = classifyReviewItemRisk(targetModule)
  const moduleLabel = resolveModuleLabel(targetModule)
  const visibilityImpact = resolveVisibilityImpact(targetModule)
  const approvalReq = resolveApprovalRequirement(targetModule)

  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-[10px]', className)}>
      {/* Risk */}
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium',
          risk.risk === 'high'
            ? 'bg-status-red/10 text-status-red'
            : risk.risk === 'medium'
            ? 'bg-status-orange/10 text-status-orange'
            : 'bg-surface-raised text-text-muted',
        )}
        title={risk.reason}
      >
        {risk.risk === 'high' && <ShieldAlert className="w-2.5 h-2.5" />}
        {risk.label}
      </span>

      {/* Module */}
      <span className="text-text-muted">{moduleLabel}</span>

      {/* Visibility impact */}
      {risk.risk !== 'low' && (
        <span
          className="inline-flex items-center gap-1 text-text-muted"
          title={visibilityImpact}
        >
          <Eye className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate max-w-[180px]">{visibilityImpact}</span>
        </span>
      )}

      {/* Approval requirement */}
      <span
        className="inline-flex items-center gap-1 text-text-muted"
        title={approvalReq}
      >
        <Lock className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate max-w-[180px]">{approvalReq}</span>
      </span>

      {/* Created date */}
      {createdAt && (
        <span className="text-text-muted">
          {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}

      {/* Source */}
      {source && (
        <span className="uppercase tracking-widest text-text-muted">{source}</span>
      )}

      {/* Status */}
      <span
        className={cn(
          'uppercase tracking-widest',
          status === 'pending_review'
            ? 'text-status-orange'
            : status === 'approved'
            ? 'text-status-green'
            : status === 'rejected'
            ? 'text-status-red'
            : 'text-text-muted',
        )}
      >
        {status.replace(/_/g, ' ')}
      </span>
    </div>
  )
}
