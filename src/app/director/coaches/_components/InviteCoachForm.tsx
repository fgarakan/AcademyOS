'use client'

// Mega Sprint 1115–1144 — DONNA Coach Creation Completion V1
// Extended InviteCoachForm with DONNA goal session listener.
//
// DONNA path:
//   1. DONNA asks coach_email + coach_role (2 steps)
//   2. onPageStatePatch → pre-fills email and role fields + "Set by DONNA" badges
//   3. onGoalSessionCompleted → buildWorkflowExecutionPlan → shows DONNA review banner
//   4. Director confirms → inviteCoachAction called → coach linked
//   5. WorkflowCompletionSummary built → shown in banner
//
// Standard path (unchanged): director types email + selects role + submits.

import { useState, useEffect, useTransition } from 'react'
import { CheckCircle2, AlertCircle, Loader2, UserPlus, Sparkles, ChevronRight } from 'lucide-react'
import { inviteCoachAction, type InviteCoachResult } from '@/app/director/coaches/inviteCoachAction'
import { onPageStatePatch, onGoalSessionCompleted } from '@/lib/donna/pageSync/donnaPageSyncEvents'
import {
  buildWorkflowExecutionPlan,
  buildWorkflowDraftPayload,
  buildWorkflowVerificationResult,
  buildWorkflowCompletionSummary,
  type WorkflowExecutionPlan,
  type WorkflowCompletionSummary,
} from '@/lib/donna/workflows/donnaWorkflowExecutionEngine'

type CoachRole = 'coach' | 'head_coach'

function normaliseRole(raw: string): CoachRole {
  const lower = raw.toLowerCase().trim()
  if (lower.includes('head')) return 'head_coach'
  return 'coach'
}

export function InviteCoachForm() {
  const [email,  setEmail]  = useState('')
  const [role,   setRole]   = useState<CoachRole>('coach')
  const [result, setResult] = useState<InviteCoachResult | null>(null)
  const [isPending, startTransition] = useTransition()

  // DONNA state
  const [donnaSyncedFields, setDonnaSyncedFields] = useState<Set<string>>(new Set())
  const [donnaPlan,         setDonnaPlan]          = useState<WorkflowExecutionPlan | null>(null)
  const [donnaSubmitting,   setDonnaSubmitting]    = useState(false)
  const [donnaError,        setDonnaError]         = useState<string | null>(null)
  const [donnaCompletion,   setDonnaCompletion]    = useState<WorkflowCompletionSummary | null>(null)

  // ── DONNA: per-answer field sync ────────────────────────────────────────────
  useEffect(() => {
    return onPageStatePatch(patch => {
      if (patch.workflowId !== 'coach_creation_completion') return

      setDonnaSyncedFields(prev => {
        const next = new Set(prev)
        next.add(patch.fieldId)
        return next
      })

      if (patch.fieldId === 'email') {
        setEmail(patch.value.trim())
      } else if (patch.fieldId === 'role') {
        setRole(normaliseRole(patch.value))
      }
    })
  }, [])

  // ── DONNA: session complete → build plan ────────────────────────────────────
  useEffect(() => {
    return onGoalSessionCompleted(detail => {
      if (detail.workflowId !== 'coach_creation_completion') return
      const plan = buildWorkflowExecutionPlan(detail)
      if (plan) setDonnaPlan(plan)
    })
  }, [])

  // ── Standard form submit ─────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setResult(null)

    startTransition(async () => {
      const res = await inviteCoachAction({ email: email.trim(), role })
      setResult(res)
      if (res.ok) setEmail('')
    })
  }

  // ── DONNA confirm ────────────────────────────────────────────────────────────
  async function handleDonnaConfirm() {
    if (!donnaPlan) return
    const payload = buildWorkflowDraftPayload(donnaPlan)
    if (!payload) return

    setDonnaSubmitting(true)
    setDonnaError(null)

    const emailVal = (payload.answers['coach_email'] ?? email).trim()
    const roleVal  = normaliseRole(payload.answers['coach_role'] ?? role)

    const actionResult = await inviteCoachAction({ email: emailVal, role: roleVal })

    const submitResult = {
      ok:         actionResult.ok,
      entityId:   actionResult.coachProfileId ?? null,
      entityType: 'coach',
      redirectTo: actionResult.coachProfileId
        ? `/director/coaches/${actionResult.coachProfileId}`
        : '/director/coaches',
      error:      actionResult.error,
    }

    const verification = buildWorkflowVerificationResult(submitResult, emailVal)

    if (verification.verified) {
      const summary = buildWorkflowCompletionSummary(
        'coach_creation_completion',
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
  }

  // ── DONNA review banner ──────────────────────────────────────────────────────
  function renderDonnaBanner() {
    if (donnaCompletion) {
      return (
        <div className="rounded-xl border border-status-green/30 bg-status-green/5 p-4 space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm font-semibold text-status-green">Coach linked</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{donnaCompletion.donnaMessage}</p>
        </div>
      )
    }

    if (!donnaPlan) return null

    const filledFields = donnaPlan.fields.filter(f => f.filled)

    return (
      <div className="rounded-xl border border-lime/25 bg-lime/5 overflow-hidden mb-4">
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
            onClick={handleDonnaConfirm}
            disabled={!donnaPlan.readyToSubmit || donnaSubmitting}
            className="btn-lime text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {donnaSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {donnaSubmitting ? 'Linking…' : 'Confirm & Link Coach'}
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

  // ── Outcome labels ───────────────────────────────────────────────────────────
  const outcomeLabels: Record<string, string> = {
    linked:         'Coach linked to academy successfully.',
    already_member: 'This coach is already an active member.',
    role_updated:   'Coach role updated.',
    no_account:     'No account found for this email.',
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-surface-raised flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-lime" />
        <p className="text-sm font-semibold text-text-primary">Invite Coach</p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* DONNA banner */}
        {renderDonnaBanner()}

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-text-muted leading-relaxed">
            The coach must already have an account. Enter their email to link them to this academy.
          </p>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="label-xs text-text-muted">
              Coach Email
              {donnaSyncedFields.has('email') && (
                <span className="ml-1.5 text-lime text-[10px]">
                  <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />set by DONNA
                </span>
              )}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="coach@example.com"
              required
              className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-lime/40 transition-colors"
              disabled={isPending}
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="label-xs text-text-muted">
              Role
              {donnaSyncedFields.has('role') && (
                <span className="ml-1.5 text-lime text-[10px]">
                  <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />set by DONNA
                </span>
              )}
            </label>
            <div className="flex gap-2">
              {(['coach', 'head_coach'] as CoachRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                    role === r
                      ? 'bg-lime/10 border-lime/30 text-lime'
                      : 'bg-surface-raised border-border text-text-secondary hover:border-border-strong'
                  }`}
                >
                  {r === 'head_coach' ? 'Head Coach' : 'Coach'}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || !email.trim()}
            className="w-full py-2.5 rounded-xl bg-lime text-base text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Inviting…' : 'Invite Coach'}
          </button>

          {/* Standard path result */}
          {result && (
            <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl ${
              result.ok
                ? 'bg-status-green/8 border border-status-green/20'
                : 'bg-status-red/8 border border-status-red/20'
            }`}>
              {result.ok
                ? <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
                : <AlertCircle  className="w-4 h-4 text-status-red    shrink-0 mt-0.5" />
              }
              <div>
                <p className={`text-sm font-semibold ${result.ok ? 'text-status-green' : 'text-status-red'}`}>
                  {result.ok ? (outcomeLabels[result.outcome ?? ''] ?? 'Done.') : 'Invite failed'}
                </p>
                {!result.ok && result.error && (
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{result.error}</p>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
