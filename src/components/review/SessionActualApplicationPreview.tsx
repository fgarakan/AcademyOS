'use client'

import { ClipboardCheck, Shield, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { SessionModificationType } from '@/components/capture/WrapUpSessionActualInput'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SessionActualDraftStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'applied'

export interface SessionActualDraft {
  id: string
  sessionId: string
  sessionDate: string
  groupName: string
  completedAsPlanned: boolean
  modified: boolean
  modifications: SessionModificationType[]
  notes: string
  coachId: string
  status: SessionActualDraftStatus
  officialWriteApplied: false
  directorReviewRequired: true
  createdAt: string
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SessionActualDraftStatus, {
  label: string
  icon: React.ReactNode
  borderClass: string
  badgeClass: string
}> = {
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
  applied: {
    label: 'Applied',
    icon: <CheckCircle size={12} />,
    borderClass: 'border-lime/30',
    badgeClass: 'bg-lime/10 text-lime border border-lime/30',
  },
}

const MODIFICATION_LABELS: Record<SessionModificationType, string> = {
  skipped_block: 'Skipped block',
  added_block: 'Added block',
  shortened_block: 'Shortened block',
  reordered: 'Reordered',
  weather: 'Weather disruption',
  space_issue: 'Space issue',
  group_energy: 'Group energy',
  late_start: 'Late start',
  other: 'Other',
}

// ── Session record impact preview ─────────────────────────────────────────────

function SessionRecordImpactPreview({ draft }: { draft: SessionActualDraft }) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-3 space-y-2">
      <p className="text-[10px] text-text-muted uppercase tracking-widest">
        If approved, will write to session record:
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-muted">Session</span>
          <span className="text-text-secondary font-mono">{draft.sessionDate} · {draft.groupName}</span>
        </div>

        <div className="flex items-center justify-between text-[12px]">
          <span className="text-text-muted">completed_as_planned</span>
          <span className={`font-mono ${draft.completedAsPlanned ? 'text-status-green' : 'text-status-orange'}`}>
            {String(draft.completedAsPlanned)}
          </span>
        </div>

        {draft.modified && draft.modifications.length > 0 && (
          <div className="flex items-start justify-between text-[12px] gap-2">
            <span className="text-text-muted shrink-0">modifications</span>
            <div className="flex flex-wrap gap-1 justify-end">
              {draft.modifications.map(mod => (
                <span
                  key={mod}
                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-status-orange/10 text-status-orange border border-status-orange/20"
                >
                  {MODIFICATION_LABELS[mod] ?? mod}
                </span>
              ))}
            </div>
          </div>
        )}

        {draft.notes && (
          <div className="flex items-start gap-2 text-[12px]">
            <span className="text-text-muted shrink-0">coach_notes</span>
            <span className="text-text-secondary italic leading-snug">"{draft.notes}"</span>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-2">
        <p className="text-[10px] text-text-muted">
          <span className="text-status-green font-mono">officialWriteApplied: false</span>
          {' '}— session record unchanged until director approves and triggers write.
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface SessionActualApplicationPreviewProps {
  draft: SessionActualDraft
  onApprove?: (draftId: string) => void
  onReject?: (draftId: string) => void
  className?: string
}

export function SessionActualApplicationPreview({
  draft,
  onApprove,
  onReject,
  className,
}: SessionActualApplicationPreviewProps) {
  const status = STATUS_CONFIG[draft.status]
  const canAct = draft.status === 'pending_review'

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden ${status.borderClass} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-text-muted/10 border border-border flex items-center justify-center">
            <ClipboardCheck size={13} className="text-text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Session wrap-up</p>
            <p className="text-[11px] text-text-muted">{draft.groupName} · {draft.sessionDate}</p>
          </div>
        </div>

        <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${status.badgeClass}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Summary */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          {draft.completedAsPlanned ? (
            <span className="text-status-green flex items-center gap-1.5">
              <CheckCircle size={14} />
              Completed as planned
            </span>
          ) : (
            <span className="text-status-orange flex items-center gap-1.5">
              <Clock size={14} />
              Modified from plan
            </span>
          )}
        </div>
      </div>

      {/* Session record impact preview */}
      <div className="px-4 pb-3">
        <SessionRecordImpactPreview draft={draft} />
      </div>

      {/* Director review required banner */}
      <div className="mx-4 mb-3 flex items-start gap-2 bg-status-orange/5 border border-status-orange/20 rounded-xl px-3 py-2">
        <Shield size={12} className="text-status-orange mt-0.5 shrink-0" />
        <p className="text-[11px] text-status-orange leading-snug">
          Director approval required before session records are updated.
        </p>
      </div>

      {/* Actions */}
      {canAct && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-surface-raised">
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
              className="flex-1 text-sm py-2 rounded-xl bg-status-green text-white hover:bg-status-green/90 transition-colors font-medium"
            >
              Approve & apply
            </button>
          )}
        </div>
      )}

      {/* Applied state note */}
      {draft.status === 'applied' && (
        <div className="px-4 py-3 border-t border-border bg-lime/5">
          <p className="text-[11px] text-lime flex items-center gap-1.5">
            <CheckCircle size={11} />
            Session record updated.
          </p>
        </div>
      )}

      {/* Rejected state note */}
      {draft.status === 'rejected' && (
        <div className="px-4 py-3 border-t border-border bg-status-red/5">
          <p className="text-[11px] text-status-red flex items-center gap-1.5">
            <XCircle size={11} />
            Rejected — session record unchanged.
          </p>
        </div>
      )}
    </div>
  )
}
