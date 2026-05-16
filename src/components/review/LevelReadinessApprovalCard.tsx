'use client'

import { TrendingUp, Shield, AlertCircle, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type LevelReadinessDraftStatus =
  | 'proposed'
  | 'pending_director_review'
  | 'approved'
  | 'rejected'
  | 'deferred'

export interface LevelReadinessDraft {
  id: string
  playerName: string
  playerId: string | null
  currentLevel: string
  proposedLevel: string
  reason: string
  evidenceSummary: string[]
  recommendedByCoachId: string | null
  sessionId: string | null
  status: LevelReadinessDraftStatus
  levelChangeApplied: false
  directorReviewRequired: true
  createdAt: string
}

// ── Status config ─────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string
  icon: React.ReactNode
  borderClass: string
  badgeClass: string
}

const STATUS_CONFIG: Record<LevelReadinessDraftStatus, StatusConfig> = {
  proposed: {
    label: 'Proposed',
    icon: <Clock size={12} />,
    borderClass: 'border-border',
    badgeClass: 'bg-surface-raised text-text-muted border border-border',
  },
  pending_director_review: {
    label: 'Pending Review',
    icon: <AlertCircle size={12} />,
    borderClass: 'border-status-orange/40',
    badgeClass: 'bg-status-orange/10 text-status-orange border border-status-orange/30',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle size={12} />,
    borderClass: 'border-status-green/40',
    badgeClass: 'bg-status-green/10 text-status-green border border-status-green/30',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle size={12} />,
    borderClass: 'border-status-red/40',
    badgeClass: 'bg-status-red/10 text-status-red border border-status-red/30',
  },
  deferred: {
    label: 'Deferred',
    icon: <Clock size={12} />,
    borderClass: 'border-status-blue/30',
    badgeClass: 'bg-status-blue/10 text-status-blue border border-status-blue/30',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface LevelReadinessApprovalCardProps {
  draft: LevelReadinessDraft
  onApprove?: (draftId: string) => void
  onReject?: (draftId: string) => void
  onDefer?: (draftId: string) => void
  className?: string
}

export function LevelReadinessApprovalCard({
  draft,
  onApprove,
  onReject,
  onDefer,
  className,
}: LevelReadinessApprovalCardProps) {
  const status = STATUS_CONFIG[draft.status]
  const canAct = draft.status === 'pending_director_review'

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden ${status.borderClass} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-lime/10 border border-lime/20 flex items-center justify-center">
            <TrendingUp size={13} className="text-lime" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Level advancement</p>
            <p className="text-[11px] text-text-muted">{draft.playerName}</p>
          </div>
        </div>

        <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${status.badgeClass}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Level change preview */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 justify-center bg-surface-raised border border-border rounded-xl px-4 py-3">
          <div className="text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Current</p>
            <p className="text-base font-mono font-bold text-text-secondary">{draft.currentLevel}</p>
          </div>

          <ChevronRight size={16} className="text-lime shrink-0" />

          <div className="text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Proposed</p>
            <p className="text-base font-mono font-bold text-lime">{draft.proposedLevel}</p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="px-4 pb-3">
        <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1">Reason</p>
        <p className="text-sm text-text-secondary leading-relaxed">{draft.reason}</p>
      </div>

      {/* Evidence */}
      {draft.evidenceSummary.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1.5">Supporting evidence</p>
          <ul className="space-y-1">
            {draft.evidenceSummary.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-text-secondary">
                <span className="text-lime mt-0.5 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Director review required banner */}
      <div className="mx-4 mb-3 flex items-start gap-2 bg-status-orange/5 border border-status-orange/20 rounded-xl px-3 py-2">
        <Shield size={12} className="text-status-orange mt-0.5 shrink-0" />
        <p className="text-[11px] text-status-orange leading-snug">
          Director approval required before the player's level changes. This is a proposal only.
        </p>
      </div>

      {/* Safety flag */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-text-muted">
          <span className="text-status-green font-mono">levelChangeApplied: false</span>
          {' '}— no level change has occurred. Approval here queues the change; it does not apply it.
        </p>
      </div>

      {/* Actions */}
      {canAct && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-surface-raised">
          {onDefer && (
            <button
              onClick={() => onDefer(draft.id)}
              className="flex-1 text-sm py-2 rounded-xl border border-border text-text-muted hover:text-text-secondary hover:border-text-muted transition-colors"
            >
              Defer
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(draft.id)}
              className="flex-1 text-sm py-2 rounded-xl border border-status-red/30 text-status-red hover:bg-status-red/5 transition-colors"
            >
              Reject
            </button>
          )}
          {onApprove && (
            <button
              onClick={() => onApprove(draft.id)}
              className="flex-1 text-sm py-2 rounded-xl bg-lime text-black hover:bg-lime/90 transition-colors font-medium"
            >
              Approve
            </button>
          )}
        </div>
      )}

      {/* Approved state note */}
      {draft.status === 'approved' && (
        <div className="px-4 py-3 border-t border-border bg-status-green/5">
          <p className="text-[11px] text-status-green flex items-center gap-1.5">
            <CheckCircle size={11} />
            Approved — level change will be applied when the director triggers execution.
          </p>
        </div>
      )}

      {/* Rejected state note */}
      {draft.status === 'rejected' && (
        <div className="px-4 py-3 border-t border-border bg-status-red/5">
          <p className="text-[11px] text-status-red flex items-center gap-1.5">
            <XCircle size={11} />
            Rejected — {draft.playerName}'s level remains at {draft.currentLevel}.
          </p>
        </div>
      )}

      {/* Deferred state note */}
      {draft.status === 'deferred' && (
        <div className="px-4 py-3 border-t border-border bg-status-blue/5">
          <p className="text-[11px] text-status-blue flex items-center gap-1.5">
            <Clock size={11} />
            Deferred — this proposal will stay in queue for the next review cycle.
          </p>
        </div>
      )}
    </div>
  )
}
