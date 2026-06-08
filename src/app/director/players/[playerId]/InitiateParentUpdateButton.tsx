'use client'

// Sprint 1771 — Atomic Loop Clarity: Loop 6 fix
// Allows director to initiate a parent update draft from the player profile.
// Draft goes to the director review queue — no parent communication is sent from here.
//
// Sprint 1175 — DONNA Parent Update Completion V1
// Added onGoalSessionCompleted listener for parent_update_completion.
// DONNA path: collects 5 answers → review banner → submitDonnaActionDraft → proposed_action.

import { useState, useTransition, useEffect } from 'react'
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles, ChevronRight } from 'lucide-react'
import { initiateParentUpdateAction } from './initiateParentUpdateAction'
import { onGoalSessionCompleted } from '@/lib/donna/pageSync/donnaPageSyncEvents'
import {
  buildWorkflowExecutionPlan,
  buildWorkflowDraftPayload,
  buildWorkflowVerificationResult,
  buildWorkflowCompletionSummary,
  type WorkflowExecutionPlan,
  type WorkflowCompletionSummary,
} from '@/lib/donna/workflows/donnaWorkflowExecutionEngine'
import { submitDonnaActionDraft } from '@/lib/actions/donnaSentinelAction'

interface Props {
  playerId: string
  playerFirstName?: string | null
}

export function InitiateParentUpdateButton({ playerId, playerFirstName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null; draftId: string | null } | null>(null)

  const [donnaPlan,       setDonnaPlan]       = useState<WorkflowExecutionPlan | null>(null)
  const [donnaSubmitting, setDonnaSubmitting] = useState(false)
  const [donnaError,      setDonnaError]      = useState<string | null>(null)
  const [donnaCompletion, setDonnaCompletion] = useState<WorkflowCompletionSummary | null>(null)

  useEffect(() => {
    return onGoalSessionCompleted(detail => {
      if (detail.workflowId !== 'parent_update_completion') return
      const plan = buildWorkflowExecutionPlan(detail)
      if (plan) setDonnaPlan(plan)
    })
  }, [])

  async function handleDonnaParentUpdateConfirm() {
    if (!donnaPlan) return
    const payload = buildWorkflowDraftPayload(donnaPlan)
    if (!payload) return

    setDonnaSubmitting(true)
    setDonnaError(null)

    const ans = payload.answers
    const result = await submitDonnaActionDraft({
      rawInput: `Parent update draft: ${ans['player_name'] ?? playerFirstName ?? 'Player'}`,
      actionLabel: `Parent Update Draft — ${playerFirstName ?? ans['player_name'] ?? 'Player'}`,
      targetModule: 'parent_update_draft_v1',
      proposedPayload: {
        playerId,
        player_name:     ans['player_name'],
        main_message:    ans['main_message'],
        positive_progress: ans['positive_progress'],
        home_support:    ans['home_support'],
        internal_flag:   ans['internal_flag'],
      },
      riskLevel: 'low',
    })

    const submitResult = {
      ok:         result.error === null,
      entityId:   result.actionId ?? null,
      entityType: 'proposed_action',
      redirectTo: '/director/review',
      error:      result.error,
    }

    const verification = buildWorkflowVerificationResult(submitResult, ans['player_name'] ?? playerFirstName ?? 'Parent Update')

    if (verification.verified) {
      const summary = buildWorkflowCompletionSummary('parent_update_completion', verification, ans)
      setDonnaCompletion(summary)
      setDonnaPlan(null)
    } else {
      setDonnaError(verification.failureReason ?? result.error ?? 'Failed to save parent update draft.')
    }
    setDonnaSubmitting(false)
  }

  // ── DONNA completion banner ──────────────────────────────────────────────────
  if (donnaCompletion) {
    return (
      <div className="rounded-xl border border-status-green/30 bg-status-green/5 p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-sm font-semibold text-status-green">Parent update draft queued for review</p>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">{donnaCompletion.donnaMessage}</p>
      </div>
    )
  }

  // ── DONNA review banner ──────────────────────────────────────────────────────
  if (donnaPlan) {
    const filledFields = donnaPlan.fields.filter(f => f.filled)
    return (
      <div className="rounded-xl border border-lime/25 bg-lime/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-lime/15 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-xs font-semibold text-lime">DONNA collected these answers</p>
        </div>
        <div className="px-4 py-3 space-y-2">
          {filledFields.map(field => (
            <div key={field.fieldId} className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-lime shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-xs text-text-muted">{field.displayLabel}: </span>
                <span className="text-xs text-text-primary">{field.value}</span>
              </div>
            </div>
          ))}
        </div>
        {donnaError && (
          <div className="px-4 py-2 border-t border-status-red/20 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0" />
            <p className="text-xs text-status-red">{donnaError}</p>
          </div>
        )}
        <div className="px-4 py-3 border-t border-lime/15 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDonnaParentUpdateConfirm}
            disabled={!donnaPlan.readyToSubmit || donnaSubmitting}
            className="btn-lime text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {donnaSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {donnaSubmitting ? 'Saving…' : 'Confirm & Queue Parent Update'}
          </button>
          <button
            type="button"
            onClick={() => { setDonnaPlan(null); setDonnaError(null) }}
            disabled={donnaSubmitting}
            className="btn-ghost text-xs px-3 py-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  // ── Standard path result ─────────────────────────────────────────────────────
  if (result?.ok) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-xl border border-status-green/30 bg-status-green/5">
        <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs text-status-green font-medium">Parent update draft created.</p>
          <p className="text-[11px] text-text-muted leading-relaxed">
            The draft is now in the director review queue under &ldquo;Parent Communications.&rdquo;
            Review and approve it there — nothing is sent to the parent until you approve and apply.
          </p>
          <button
            className="text-[11px] text-text-muted underline underline-offset-2 hover:text-text-secondary mt-1"
            onClick={() => setResult(null)}
          >
            Create another draft
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {result?.error && (
        <div className="flex items-start gap-2 p-2 rounded-lg border border-status-red/30 bg-status-red/5">
          <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-red leading-relaxed">{result.error}</p>
        </div>
      )}
      <button
        onClick={() => startTransition(async () => { const res = await initiateParentUpdateAction(playerId); setResult(res) })}
        disabled={isPending}
        className="btn-lime flex items-center gap-2 text-sm disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {isPending ? 'Creating draft…' : 'Draft parent update'}
      </button>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Creates a parent-safe draft for director review. Nothing is sent until you approve and apply the draft in the review queue.
      </p>
    </div>
  )
}
