'use client'

import { UserX, UserPlus, Shield, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttendanceExceptionType = 'absence' | 'unrostered_attendee'

export type AttendanceExceptionDraftStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'noted'

export interface AttendanceExceptionDraft {
  id: string
  exceptionType: AttendanceExceptionType
  playerName: string
  sessionId: string
  sessionDate: string
  coachFreeText: string
  confirmed: boolean
  status: AttendanceExceptionDraftStatus
  officialWriteApplied: false
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

const STATUS_CONFIG: Record<AttendanceExceptionDraftStatus, StatusConfig> = {
  pending_review: {
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
  noted: {
    label: 'Noted',
    icon: <Clock size={12} />,
    borderClass: 'border-border',
    badgeClass: 'bg-surface-raised text-text-muted border border-border',
  },
}

const EXCEPTION_TYPE_CONFIG: Record<AttendanceExceptionType, {
  label: string
  description: string
  icon: React.ReactNode
  accent: string
}> = {
  absence: {
    label: 'Absence',
    description: 'Player was expected but did not attend.',
    icon: <UserX size={13} />,
    accent: 'text-status-orange bg-status-orange/10 border-status-orange/20',
  },
  unrostered_attendee: {
    label: 'Unrostered Attendee',
    description: 'Player attended but is not on the session roster.',
    icon: <UserPlus size={13} />,
    accent: 'text-status-blue bg-status-blue/10 border-status-blue/20',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface AttendanceExceptionApprovalCardProps {
  draft: AttendanceExceptionDraft
  onApprove?: (draftId: string) => void
  onReject?: (draftId: string) => void
  onNote?: (draftId: string) => void
  className?: string
}

export function AttendanceExceptionApprovalCard({
  draft,
  onApprove,
  onReject,
  onNote,
  className,
}: AttendanceExceptionApprovalCardProps) {
  const status = STATUS_CONFIG[draft.status]
  const exceptionType = EXCEPTION_TYPE_CONFIG[draft.exceptionType]
  const canAct = draft.status === 'pending_review'

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden ${status.borderClass} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${exceptionType.accent}`}>
            {exceptionType.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{exceptionType.label}</p>
            <p className="text-[11px] text-text-muted">{draft.playerName}</p>
          </div>
        </div>

        <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${status.badgeClass}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-muted">Session date</span>
          <span className="text-text-secondary font-mono">{draft.sessionDate}</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-muted">Exception type</span>
          <span className="text-text-secondary">{exceptionType.description}</span>
        </div>
        {draft.confirmed && (
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-text-muted">Confirmed by coach</span>
            <span className="text-status-green">Yes</span>
          </div>
        )}
      </div>

      {/* Coach free text */}
      {draft.coachFreeText && (
        <div className="px-4 pb-3">
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1">Coach note</p>
          <p className="text-sm text-text-secondary leading-relaxed italic">"{draft.coachFreeText}"</p>
        </div>
      )}

      {/* Director review required banner */}
      <div className="mx-4 mb-3 flex items-start gap-2 bg-status-orange/5 border border-status-orange/20 rounded-xl px-3 py-2">
        <Shield size={12} className="text-status-orange mt-0.5 shrink-0" />
        <p className="text-[11px] text-status-orange leading-snug">
          Director review required before this exception affects official attendance records. Nothing has been written.
        </p>
      </div>

      {/* Safety flag */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-text-muted">
          <span className="text-status-green font-mono">officialWriteApplied: false</span>
          {' '}— official attendance has not been modified. Approval queues the write; it does not apply it.
        </p>
      </div>

      {/* Actions */}
      {canAct && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-surface-raised">
          {onNote && (
            <button
              onClick={() => onNote(draft.id)}
              className="flex-1 text-sm py-2 rounded-xl border border-border text-text-muted hover:text-text-secondary hover:border-text-muted transition-colors"
            >
              Mark as noted
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
              className="flex-1 text-sm py-2 rounded-xl bg-status-orange text-white hover:bg-status-orange/90 transition-colors font-medium"
            >
              Approve exception
            </button>
          )}
        </div>
      )}

      {/* Approved state note */}
      {draft.status === 'approved' && (
        <div className="px-4 py-3 border-t border-border bg-status-green/5">
          <p className="text-[11px] text-status-green flex items-center gap-1.5">
            <CheckCircle size={11} />
            Approved — attendance exception queued for official record update.
          </p>
        </div>
      )}

      {/* Rejected state note */}
      {draft.status === 'rejected' && (
        <div className="px-4 py-3 border-t border-border bg-status-red/5">
          <p className="text-[11px] text-status-red flex items-center gap-1.5">
            <XCircle size={11} />
            Rejected — attendance records remain unchanged.
          </p>
        </div>
      )}

      {/* Noted state */}
      {draft.status === 'noted' && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[11px] text-text-muted flex items-center gap-1.5">
            <Clock size={11} />
            Noted — logged for records, no attendance change applied.
          </p>
        </div>
      )}
    </div>
  )
}
