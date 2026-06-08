'use client'

// Mega Sprint 1265–1294 — DONNA Academy Setup Completion V1
// Client component wiring DONNA goal session to /director/setup.
//
// DONNA path:
//   1. DONNA asks 10 setup questions in the sidebar (goal session)
//   2. onPageStatePatch → tracks live answer progress
//   3. onGoalSessionCompleted → builds WorkflowExecutionPlan → shows review banner
//   4. Director clicks "Confirm & Save Draft" → donnaSaveAcademySetupDraftAction called
//   5. WorkflowCompletionSummary shown in banner
//
// Existing draft path:
//   If donna_setup_draft already exists in settings, shows a saved-draft notice.

import { useState, useEffect } from 'react'
import { Sparkles, CheckCircle2, AlertCircle, Loader2, ChevronRight, FileText } from 'lucide-react'
import { onPageStatePatch, onGoalSessionCompleted } from '@/lib/donna/pageSync/donnaPageSyncEvents'
import {
  buildWorkflowExecutionPlan,
  buildWorkflowDraftPayload,
  buildWorkflowVerificationResult,
  buildWorkflowCompletionSummary,
  type WorkflowExecutionPlan,
  type WorkflowCompletionSummary,
} from '@/lib/donna/workflows/donnaWorkflowExecutionEngine'
import { donnaSaveAcademySetupDraftAction } from '@/app/director/_actions/donnaSaveAcademySetupDraftAction'
import { ACADEMY_SETUP_REQUIRED_FIELDS } from '@/lib/donna/setup/donnaAcademySetupCompletionEngine'

interface Props {
  existingDraft: Record<string, string> | null
}

export function AcademySetupDonnaBanner({ existingDraft }: Props) {
  const [liveAnswerCount, setLiveAnswerCount] = useState(0)
  const [donnaPlan,       setDonnaPlan]       = useState<WorkflowExecutionPlan | null>(null)
  const [donnaSubmitting, setDonnaSubmitting] = useState(false)
  const [donnaError,      setDonnaError]      = useState<string | null>(null)
  const [donnaCompletion, setDonnaCompletion] = useState<WorkflowCompletionSummary | null>(null)

  // ── DONNA: per-answer progress tracking ──────────────────────────────────────
  useEffect(() => {
    return onPageStatePatch(patch => {
      if (patch.workflowId !== 'academy_setup_completion') return
      setLiveAnswerCount(prev => prev + 1)
    })
  }, [])

  // ── DONNA: session complete → build plan ─────────────────────────────────────
  useEffect(() => {
    return onGoalSessionCompleted(detail => {
      if (detail.workflowId !== 'academy_setup_completion') return
      const plan = buildWorkflowExecutionPlan(detail)
      if (plan) setDonnaPlan(plan)
    })
  }, [])

  // ── DONNA confirm ─────────────────────────────────────────────────────────────
  async function handleDonnaConfirm() {
    if (!donnaPlan) return
    const payload = buildWorkflowDraftPayload(donnaPlan)
    if (!payload) return

    setDonnaSubmitting(true)
    setDonnaError(null)

    const actionResult = await donnaSaveAcademySetupDraftAction(payload.answers, payload.planId)

    const submitResult = {
      ok:         actionResult.ok,
      entityId:   actionResult.entityId,
      entityType: actionResult.entityType,
      redirectTo: actionResult.redirectTo,
      error:      actionResult.error,
    }

    const verification = buildWorkflowVerificationResult(submitResult, 'Academy Setup Draft')

    if (verification.verified) {
      const summary = buildWorkflowCompletionSummary(
        'academy_setup_completion',
        verification,
        payload.answers,
      )
      setDonnaCompletion(summary)
      setDonnaSubmitting(false)
      setDonnaPlan(null)
    } else {
      setDonnaError(verification.failureReason ?? actionResult.error ?? 'Something went wrong. Please try again.')
      setDonnaSubmitting(false)
    }
  }

  function handleDonnaDismiss() {
    setDonnaPlan(null)
    setDonnaError(null)
    setLiveAnswerCount(0)
  }

  // ── Session in progress ───────────────────────────────────────────────────────
  if (liveAnswerCount > 0 && !donnaPlan && !donnaCompletion) {
    return (
      <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 flex items-center gap-3">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-xs text-text-secondary">
          DONNA is collecting setup answers —{' '}
          <span className="font-mono text-lime">{liveAnswerCount}</span>
          {' '}of{' '}
          <span className="font-mono text-lime">{ACADEMY_SETUP_REQUIRED_FIELDS.length}</span>
          {' '}collected.
        </p>
      </div>
    )
  }

  // ── Completion notice ─────────────────────────────────────────────────────────
  if (donnaCompletion) {
    return (
      <div className="rounded-xl border border-status-green/30 bg-status-green/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-sm font-semibold text-status-green">Setup draft saved</p>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">{donnaCompletion.donnaMessage}</p>
      </div>
    )
  }

  // ── Review banner ─────────────────────────────────────────────────────────────
  if (donnaPlan) {
    const filledFields = donnaPlan.fields.filter(f => f.filled)

    return (
      <div className="rounded-xl border border-lime/25 bg-lime/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-lime/15 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-xs font-semibold text-lime">
            DONNA collected these setup answers — review before saving
          </p>
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
          {filledFields.length === 0 && (
            <p className="text-xs text-text-muted">No answers collected yet.</p>
          )}
        </div>

        {!donnaPlan.readyToSubmit && donnaPlan.validationErrors.length > 0 && (
          <div className="px-4 py-2 border-t border-lime/15 space-y-1">
            {donnaPlan.validationErrors.map((err, i) => (
              <p key={i} className="text-xs text-status-orange">{err}</p>
            ))}
          </div>
        )}

        {donnaError && (
          <div className="px-4 py-2 border-t border-status-red/20 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0" />
            <p className="text-xs text-status-red">{donnaError}</p>
          </div>
        )}

        <div className="px-4 py-3 border-t border-lime/15 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDonnaConfirm}
            disabled={!donnaPlan.readyToSubmit || donnaSubmitting}
            className="btn-lime text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {donnaSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {donnaSubmitting ? 'Saving…' : 'Confirm & Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleDonnaDismiss}
            disabled={donnaSubmitting}
            className="btn-ghost text-xs px-3 py-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  // ── Existing saved draft notice ───────────────────────────────────────────────
  if (existingDraft) {
    const filledCount = ACADEMY_SETUP_REQUIRED_FIELDS.filter(
      id => (existingDraft[id] ?? '').trim().length > 0,
    ).length
    const savedAt = existingDraft['saved_at']
      ? new Date(existingDraft['saved_at']).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : null

    return (
      <div className="rounded-xl border border-lime/15 bg-lime/5 px-4 py-3 flex items-start gap-3">
        <FileText className="w-3.5 h-3.5 text-lime/70 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-secondary">
            DONNA setup draft saved —{' '}
            <span className="font-mono text-lime">{filledCount}</span>
            {' '}of{' '}
            <span className="font-mono text-lime">{ACADEMY_SETUP_REQUIRED_FIELDS.length}</span>
            {' '}fields.
            {savedAt && <span className="text-text-muted font-normal"> Saved {savedAt}.</span>}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Ask DONNA to &quot;walk me through academy setup&quot; to update or complete it.
          </p>
        </div>
      </div>
    )
  }

  return null
}
