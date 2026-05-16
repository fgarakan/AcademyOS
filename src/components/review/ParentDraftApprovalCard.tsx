'use client'

import { MessageSquare, Shield, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ParentDraftStatus =
  | 'draft'
  | 'pending_director_review'
  | 'approved'
  | 'rejected'

export interface ParentMessageDraft {
  id: string
  playerName: string
  messageText: string
  urgency: 'low' | 'medium' | 'high'
  draftedByCoachId: string
  sessionId: string
  status: ParentDraftStatus
  sendApplied: false
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

const STATUS_CONFIG: Record<ParentDraftStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
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
}

const URGENCY_LABEL: Record<ParentMessageDraft['urgency'], string> = {
  low: 'Low urgency',
  medium: 'Medium urgency',
  high: 'High urgency',
}

const URGENCY_CLASS: Record<ParentMessageDraft['urgency'], string> = {
  low: 'text-text-muted',
  medium: 'text-status-orange',
  high: 'text-status-red',
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface ParentDraftApprovalCardProps {
  draft: ParentMessageDraft
  onApprove?: (draftId: string) => void
  onReject?: (draftId: string) => void
  onEdit?: (draftId: string) => void
  className?: string
}

export function ParentDraftApprovalCard({
  draft,
  onApprove,
  onReject,
  onEdit,
  className,
}: ParentDraftApprovalCardProps) {
  const status = STATUS_CONFIG[draft.status]
  const isEditable = draft.status === 'draft' || draft.status === 'pending_director_review'
  const canApprove = draft.status === 'pending_director_review'
  const canReject = draft.status === 'pending_director_review' || draft.status === 'approved'

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden ${status.borderClass} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-status-blue/10 border border-status-blue/20 flex items-center justify-center">
            <MessageSquare size={13} className="text-status-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Parent update</p>
            <p className="text-[11px] text-text-muted">Re: {draft.playerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${URGENCY_CLASS[draft.urgency]}`}>
            {URGENCY_LABEL[draft.urgency]}
          </span>
          <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${status.badgeClass}`}>
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>

      {/* Message preview */}
      <div className="px-4 py-3">
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
          {draft.messageText}
        </p>
      </div>

      {/* Director review required banner */}
      <div className="mx-4 mb-3 flex items-start gap-2 bg-status-orange/5 border border-status-orange/20 rounded-xl px-3 py-2">
        <Shield size={12} className="text-status-orange mt-0.5 shrink-0" />
        <p className="text-[11px] text-status-orange leading-snug">
          Director review required before this message is sent. Nothing has been sent to the parent.
        </p>
      </div>

      {/* Safety flag */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-text-muted">
          <span className="text-status-green font-mono">sendApplied: false</span>
          {' '}— this draft is not delivered until a director explicitly approves and triggers send.
        </p>
      </div>

      {/* Actions */}
      {(canApprove || canReject || isEditable) && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-surface-raised">
          {isEditable && onEdit && (
            <button
              onClick={() => onEdit(draft.id)}
              className="flex-1 text-sm py-2 rounded-xl border border-border text-text-muted hover:text-text-secondary hover:border-text-muted transition-colors"
            >
              Edit draft
            </button>
          )}
          {canReject && onReject && (
            <button
              onClick={() => onReject(draft.id)}
              className="flex-1 text-sm py-2 rounded-xl border border-status-red/30 text-status-red hover:bg-status-red/5 transition-colors"
            >
              Reject
            </button>
          )}
          {canApprove && onApprove && (
            <button
              onClick={() => onApprove(draft.id)}
              className="flex-1 text-sm py-2 rounded-xl bg-status-blue text-white hover:bg-status-blue/90 transition-colors font-medium"
            >
              Approve to send
            </button>
          )}
        </div>
      )}

      {/* Approved state note */}
      {draft.status === 'approved' && (
        <div className="px-4 py-3 border-t border-border bg-status-green/5">
          <p className="text-[11px] text-status-green flex items-center gap-1.5">
            <CheckCircle size={11} />
            Approved — awaiting send trigger from director.
          </p>
        </div>
      )}

      {/* Rejected state note */}
      {draft.status === 'rejected' && (
        <div className="px-4 py-3 border-t border-border bg-status-red/5">
          <p className="text-[11px] text-status-red flex items-center gap-1.5">
            <XCircle size={11} />
            Rejected — this draft will not be sent.
          </p>
        </div>
      )}
    </div>
  )
}
