'use client'

// Sprint 279 — Donna Intelligence Draft Decision Controls
// Inline review controls for parent_communication, level_review, curriculum_adjustment drafts.
// Approve / Needs Clarification / Discard — all decisions update proposed_actions.status only.
// No data mutations, no communication, no level changes, no curriculum writes.

import { useState, useTransition } from 'react'
import { CheckCircle, HelpCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { updateDonnaIntelligenceDraftDecisionAction } from '@/app/director/_actions/donnaIntelligenceDraftReviewActions'

interface Props {
  proposedActionId: string
  targetModule: string
  onSuccess: () => void
}

const APPROVE_LABELS: Record<string, string> = {
  parent_communication: 'Approve Draft Status',
  level_review: 'Mark Reviewed',
  curriculum_adjustment: 'Approve Proposal Status',
  coach_communication: 'Mark Reviewed',
}

const SAFETY_NOTES: Record<string, string> = {
  parent_communication:
    'Approving status does not send the update. This draft is not visible to the parent or player. No messaging provider exists — no communication will be sent.',
  level_review:
    'Marking reviewed does not move the player. No level change occurs until you explicitly advance the player through the level management flow.',
  curriculum_adjustment:
    'Approving status does not apply any curriculum change. No curriculum data, template, or requirement is modified.',
  coach_communication:
    'This draft is internal only. No coach communication infrastructure exists — the coach will not receive anything. Marking reviewed records your review decision only.',
}

export function DonnaIntelligenceDraftDecisionControls({
  proposedActionId,
  targetModule,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  const approveLabel = APPROVE_LABELS[targetModule] ?? 'Mark Reviewed'
  const safetyNote =
    SAFETY_NOTES[targetModule] ?? 'This decision only changes the review status. No data is applied.'

  function handleDecision(decision: 'approved' | 'rejected' | 'clarification_needed') {
    startTransition(async () => {
      const res = await updateDonnaIntelligenceDraftDecisionAction(
        proposedActionId,
        targetModule,
        decision,
      )
      setResult(res)
      if (res.ok) onSuccess()
    })
  }

  if (result?.ok) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-status-green"
        style={{ background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.25)' }}
      >
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        Decision recorded.
      </div>
    )
  }

  return (
    <div
      className="space-y-2.5 pt-2.5"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <p className="text-[10px] text-text-muted leading-snug">{safetyNote}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => handleDecision('approved')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(48,209,88,0.08)',
            color: '#30D158',
            border: '1px solid rgba(48,209,88,0.25)',
          }}
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )}
          {approveLabel}
        </button>

        <button
          onClick={() => handleDecision('clarification_needed')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(10,132,255,0.08)',
            color: '#0A84FF',
            border: '1px solid rgba(10,132,255,0.25)',
          }}
        >
          <HelpCircle className="w-3 h-3" />
          Needs Clarification
        </button>

        <button
          onClick={() => handleDecision('rejected')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(255,59,48,0.08)',
            color: '#FF3B30',
            border: '1px solid rgba(255,59,48,0.25)',
          }}
        >
          <XCircle className="w-3 h-3" />
          Discard
        </button>
      </div>

      {result?.error && (
        <div className="flex items-center gap-1.5 text-xs text-status-red">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {result.error}
        </div>
      )}
    </div>
  )
}
