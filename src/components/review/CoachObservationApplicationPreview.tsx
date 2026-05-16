'use client'

import { Eye, EyeOff, Star, Heart, Minus, Shield, AlertCircle, CheckCircle, XCircle, User } from 'lucide-react'
import type { ObservationSkillTag, ObservationVisibility } from '@/components/capture/WrapUpPlayerObservationInput'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CoachObservationDraftStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'promoted_to_profile'

export interface CoachObservationDraft {
  id: string
  playerName: string
  playerId: string | null
  observation: string
  observationType: 'positive' | 'concern' | 'neutral'
  skillTag: ObservationSkillTag | null
  nextStep: string
  visibility: ObservationVisibility
  isParentSafeCandidate: boolean
  sessionId: string
  status: CoachObservationDraftStatus
  profileMutationApplied: false
  directorReviewRequired: true
  createdAt: string
}

// ── Config maps ───────────────────────────────────────────────────────────────

const OBSERVATION_TYPE_CONFIG: Record<CoachObservationDraft['observationType'], {
  label: string
  icon: React.ReactNode
  accent: string
}> = {
  positive: {
    label: 'Positive standout',
    icon: <Star size={12} />,
    accent: 'text-lime bg-lime/10 border-lime/20',
  },
  concern: {
    label: 'Needs attention',
    icon: <Heart size={12} />,
    accent: 'text-status-blue bg-status-blue/10 border-status-blue/20',
  },
  neutral: {
    label: 'General note',
    icon: <Minus size={12} />,
    accent: 'text-text-muted bg-surface-raised border-border',
  },
}

const VISIBILITY_CONFIG: Record<ObservationVisibility, {
  label: string
  icon: React.ReactNode
}> = {
  staff_only: {
    label: 'Staff only',
    icon: <EyeOff size={11} />,
  },
  director_review: {
    label: 'Director review',
    icon: <Eye size={11} />,
  },
  parent_safe_candidate: {
    label: 'Parent-safe candidate',
    icon: <Eye size={11} />,
  },
}

const STATUS_CONFIG: Record<CoachObservationDraftStatus, {
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
  promoted_to_profile: {
    label: 'In Profile',
    icon: <CheckCircle size={12} />,
    borderClass: 'border-lime/30',
    badgeClass: 'bg-lime/10 text-lime border border-lime/30',
  },
}

// ── Profile impact preview ────────────────────────────────────────────────────

function ProfileImpactPreview({ draft }: { draft: CoachObservationDraft }) {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-3 space-y-2">
      <p className="text-[10px] text-text-muted uppercase tracking-widest">If approved, will add to player profile:</p>

      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center shrink-0 mt-0.5">
          <User size={11} className="text-text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-text-primary">{draft.playerName}</p>
          {draft.skillTag && (
            <p className="text-[10px] text-text-muted">Skill: {draft.skillTag.replace(/_/g, ' ')}</p>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-2 space-y-1">
        <div className="flex items-start gap-1.5 text-[11px]">
          <span className="text-text-muted shrink-0">Note:</span>
          <span className="text-text-secondary">{draft.observation}</span>
        </div>
        {draft.nextStep && (
          <div className="flex items-start gap-1.5 text-[11px]">
            <span className="text-text-muted shrink-0">Next:</span>
            <span className="text-text-secondary">{draft.nextStep}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          {VISIBILITY_CONFIG[draft.visibility].icon}
          {VISIBILITY_CONFIG[draft.visibility].label}
        </div>
      </div>

      {draft.isParentSafeCandidate && (
        <div className="border-t border-border pt-2 flex items-center gap-1.5 text-[10px] text-status-blue">
          <Eye size={10} />
          Marked as parent-safe candidate — requires second director approval to share.
        </div>
      )}

      <div className="border-t border-border pt-2">
        <p className="text-[10px] text-text-muted">
          <span className="text-status-green font-mono">profileMutationApplied: false</span>
          {' '}— profile unchanged until director promotes.
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface CoachObservationApplicationPreviewProps {
  draft: CoachObservationDraft
  onApprove?: (draftId: string) => void
  onReject?: (draftId: string) => void
  onPromoteToProfile?: (draftId: string) => void
  className?: string
}

export function CoachObservationApplicationPreview({
  draft,
  onApprove,
  onReject,
  onPromoteToProfile,
  className,
}: CoachObservationApplicationPreviewProps) {
  const status = STATUS_CONFIG[draft.status]
  const obsType = OBSERVATION_TYPE_CONFIG[draft.observationType]
  const canAct = draft.status === 'pending_review'
  const canPromote = draft.status === 'approved'

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden ${status.borderClass} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${obsType.accent}`}>
            {obsType.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Coach observation</p>
            <p className="text-[11px] text-text-muted">{draft.playerName} · {obsType.label}</p>
          </div>
        </div>

        <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${status.badgeClass}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Observation text */}
      <div className="px-4 py-3">
        <p className="text-sm text-text-secondary leading-relaxed">{draft.observation}</p>
        {draft.nextStep && (
          <p className="text-[12px] text-text-muted mt-1.5">
            <span className="text-text-secondary">Next step:</span> {draft.nextStep}
          </p>
        )}
      </div>

      {/* Profile impact preview */}
      <div className="px-4 pb-3">
        <ProfileImpactPreview draft={draft} />
      </div>

      {/* Director review required banner */}
      <div className="mx-4 mb-3 flex items-start gap-2 bg-status-orange/5 border border-status-orange/20 rounded-xl px-3 py-2">
        <Shield size={12} className="text-status-orange mt-0.5 shrink-0" />
        <p className="text-[11px] text-status-orange leading-snug">
          Director approval required before this observation is added to the player profile.
        </p>
      </div>

      {/* Actions: pending review */}
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
              className="flex-1 text-sm py-2 rounded-xl bg-surface border border-lime/40 text-lime hover:bg-lime/5 transition-colors font-medium"
            >
              Approve
            </button>
          )}
        </div>
      )}

      {/* Actions: approved → promote to profile */}
      {canPromote && onPromoteToProfile && (
        <div className="px-4 py-3 border-t border-border bg-surface-raised">
          <button
            onClick={() => onPromoteToProfile(draft.id)}
            className="w-full text-sm py-2 rounded-xl bg-lime text-black hover:bg-lime/90 transition-colors font-medium"
          >
            Add to player profile
          </button>
          <p className="text-[10px] text-text-muted text-center mt-1.5">
            This will write to the player profile. Action is logged in audit trail.
          </p>
        </div>
      )}

      {/* Promoted state note */}
      {draft.status === 'promoted_to_profile' && (
        <div className="px-4 py-3 border-t border-border bg-lime/5">
          <p className="text-[11px] text-lime flex items-center gap-1.5">
            <CheckCircle size={11} />
            Added to {draft.playerName}'s profile.
          </p>
        </div>
      )}

      {/* Rejected state note */}
      {draft.status === 'rejected' && (
        <div className="px-4 py-3 border-t border-border bg-status-red/5">
          <p className="text-[11px] text-status-red flex items-center gap-1.5">
            <XCircle size={11} />
            Rejected — this observation will not appear in the player profile.
          </p>
        </div>
      )}
    </div>
  )
}
