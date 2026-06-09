'use client'

// Mega Sprint 1085–1114 — DONNA Player Creation Completion V1
// Mega Sprint 1475–1504 — DONNA Player Relationship Resolution V1
//   Extended to extract assigned_coach, assigned_group, recommended_level from plan,
//   pass them to createPlayerDonnaAction, and handle disambiguation UI when multiple
//   entities match.
//
// DONNA path:
//   1. DONNA asks player creation questions in the sidebar (goal session)
//   2. onPageStatePatch → pre-fills first_name, last_name, date_of_birth, notes
//   3. onGoalSessionCompleted → builds WorkflowExecutionPlan → shows review banner
//   4. Director clicks "Confirm & Create Player"
//   5. createPlayerDonnaAction resolves text labels → IDs; returns disambiguationRequired if needed
//   6. If disambiguation: shows selection UI; director picks; action re-called with explicit IDs
//   7. WorkflowCompletionSummary built → shown in banner → navigate to onboarding
//
// Standard path (unchanged):
//   Director fills form manually and clicks "Create player".

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { createPlayerAction } from './createPlayerAction'
import { createPlayerDonnaAction, type DisambiguationField } from './createPlayerDonnaAction'
import { onPageStatePatch, onGoalSessionCompleted } from '@/lib/donna/pageSync/donnaPageSyncEvents'
import {
  buildWorkflowExecutionPlan,
  buildWorkflowDraftPayload,
  buildWorkflowVerificationResult,
  buildWorkflowCompletionSummary,
  type WorkflowExecutionPlan,
  type WorkflowCompletionSummary,
} from '@/lib/donna/workflows/donnaWorkflowExecutionEngine'

// ── Utility: split full name into first + last ────────────────────────────────

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  const lastName  = parts[parts.length - 1]
  const firstName = parts.slice(0, parts.length - 1).join(' ')
  return { firstName, lastName }
}

// ── Utility: convert age or ISO date string to YYYY-MM-DD ─────────────────────

function toIsoDate(input: string): string {
  const trimmed = input.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const age = parseInt(trimmed, 10)
  if (!isNaN(age) && age >= 1 && age <= 25) {
    return `${new Date().getFullYear() - age}-01-01`
  }
  return ''
}

// ── Component ──────────────────────────────────────────────────────────────────

export function NewPlayerForm() {
  const router = useRouter()

  // Standard form state (controlled)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [dob,       setDob]       = useState('')
  const [gender,    setGender]    = useState('')
  const [notes,     setNotes]     = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // DONNA state
  const [donnaSyncedFields, setDonnaSyncedFields]   = useState<Set<string>>(new Set())
  const [donnaPlan,         setDonnaPlan]            = useState<WorkflowExecutionPlan | null>(null)
  const [donnaSubmitting,   setDonnaSubmitting]      = useState(false)
  const [donnaError,        setDonnaError]           = useState<string | null>(null)
  const [donnaCompletion,   setDonnaCompletion]      = useState<WorkflowCompletionSummary | null>(null)

  // Disambiguation state (set when createPlayerDonnaAction returns disambiguationRequired)
  const [disambiguation, setDisambiguation] = useState<{
    fields:    DisambiguationField[]
    choices:   Record<string, string>
    savedParams: {
      fn: string; ln: string; dob: string; notes: string | null; planId: string
      coachText: string | null; groupText: string | null; levelText: string | null
    }
  } | null>(null)

  // Prevent stale closure in event handlers
  const firstNameRef = useRef(firstName)
  const lastNameRef  = useRef(lastName)
  const dobRef       = useRef(dob)
  useEffect(() => { firstNameRef.current = firstName }, [firstName])
  useEffect(() => { lastNameRef.current = lastName },   [lastName])
  useEffect(() => { dobRef.current = dob },             [dob])

  // ── DONNA: per-answer field sync ──────────────────────────────────────────
  useEffect(() => {
    return onPageStatePatch(patch => {
      if (patch.workflowId !== 'player_onboarding_completion') return

      setDonnaSyncedFields(prev => {
        const next = new Set(prev)
        next.add(patch.fieldId)
        return next
      })

      switch (patch.fieldId) {
        case 'player_name': {
          const { firstName: fn, lastName: ln } = splitFullName(patch.value)
          setFirstName(fn)
          setLastName(ln)
          break
        }
        case 'player_age': {
          const iso = toIsoDate(patch.value)
          if (iso) setDob(iso)
          break
        }
        case 'intake_notes':
          setNotes(patch.value)
          break
      }
    })
  }, [])

  // ── DONNA: session complete → build plan ──────────────────────────────────
  useEffect(() => {
    return onGoalSessionCompleted(detail => {
      if (detail.workflowId !== 'player_onboarding_completion') return
      const plan = buildWorkflowExecutionPlan(detail)
      if (plan) setDonnaPlan(plan)
    })
  }, [])

  // ── Standard form submit ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await createPlayerAction(formData)
    if (result && !result.ok) {
      setError(result.error)
      setSubmitting(false)
    }
  }

  // ── DONNA confirm ─────────────────────────────────────────────────────────
  async function handleDonnaConfirm() {
    if (!donnaPlan) return
    const payload = buildWorkflowDraftPayload(donnaPlan)
    if (!payload) return

    setDonnaSubmitting(true)
    setDonnaError(null)

    const { firstName: fn, lastName: ln } = splitFullName(payload.answers['player_name'] ?? '')
    const dobIso = toIsoDate(payload.answers['player_age'] ?? '')

    const resolvedFn    = fn || firstName
    const resolvedLn    = ln || lastName
    const resolvedDob   = dobIso || dob
    const resolvedNotes = payload.answers['intake_notes'] ?? notes ?? null
    const coachText     = payload.answers['assigned_coach']     ?? null
    const groupText     = payload.answers['assigned_group']     ?? null
    const levelText     = payload.answers['recommended_level']  ?? null

    const actionResult = await createPlayerDonnaAction({
      firstName:            resolvedFn,
      lastName:             resolvedLn,
      dateOfBirth:          resolvedDob,
      notes:                resolvedNotes,
      planId:               payload.planId,
      assignedCoachText:    coachText,
      assignedGroupText:    groupText,
      recommendedLevelText: levelText,
    })

    // Disambiguation required — show selection UI
    if (actionResult.disambiguationRequired) {
      setDisambiguation({
        fields:  actionResult.disambiguationRequired,
        choices: {},
        savedParams: {
          fn:    resolvedFn,
          ln:    resolvedLn,
          dob:   resolvedDob,
          notes: resolvedNotes,
          planId: payload.planId,
          coachText,
          groupText,
          levelText,
        },
      })
      setDonnaSubmitting(false)
      return
    }

    const submitResult = {
      ok:         actionResult.ok,
      entityId:   actionResult.playerId,
      entityType: 'player',
      redirectTo: actionResult.redirectTo,
      error:      actionResult.error,
    }

    const verification = buildWorkflowVerificationResult(submitResult, payload.answers['player_name'])

    if (verification.verified) {
      const summary = buildWorkflowCompletionSummary(
        'player_onboarding_completion',
        verification,
        payload.answers,
      )
      setDonnaCompletion(summary)
      setDonnaSubmitting(false)
      setTimeout(() => {
        if (actionResult.redirectTo) router.push(actionResult.redirectTo)
      }, 2000)
    } else {
      setDonnaError(verification.failureReason ?? 'Something went wrong. Please try again.')
      setDonnaSubmitting(false)
    }
  }

  // ── Disambiguation confirm ─────────────────────────────────────────────────
  async function handleDisambiguationConfirm() {
    if (!disambiguation || !donnaPlan) return

    const allChosen = disambiguation.fields.every(f => disambiguation.choices[f.field])
    if (!allChosen) {
      setDonnaError('Please select an option for each item below.')
      return
    }

    setDonnaSubmitting(true)
    setDonnaError(null)

    const { fn, ln, dob: savedDob, notes: savedNotes, planId,
            coachText, groupText, levelText } = disambiguation.savedParams

    const actionResult = await createPlayerDonnaAction({
      firstName:            fn,
      lastName:             ln,
      dateOfBirth:          savedDob,
      notes:                savedNotes,
      planId,
      assignedCoachText:    coachText,
      assignedGroupText:    groupText,
      recommendedLevelText: levelText,
      primaryCoachIdOverride:  disambiguation.choices['primary_coach']     ?? null,
      currentGroupIdOverride:  disambiguation.choices['group']             ?? null,
      currentLevelIdOverride:  disambiguation.choices['curriculum_level']  ?? null,
    })

    if (actionResult.disambiguationRequired) {
      setDonnaError('Unexpected disambiguation on second attempt. Please dismiss and try again.')
      setDonnaSubmitting(false)
      return
    }

    const submitResult = {
      ok:         actionResult.ok,
      entityId:   actionResult.playerId,
      entityType: 'player',
      redirectTo: actionResult.redirectTo,
      error:      actionResult.error,
    }

    const payload = buildWorkflowDraftPayload(donnaPlan)
    const verification = buildWorkflowVerificationResult(submitResult, payload?.answers['player_name'] ?? fn)

    if (verification.verified) {
      const summary = buildWorkflowCompletionSummary(
        'player_onboarding_completion',
        verification,
        payload?.answers ?? {},
      )
      setDisambiguation(null)
      setDonnaCompletion(summary)
      setDonnaSubmitting(false)
      setTimeout(() => {
        if (actionResult.redirectTo) router.push(actionResult.redirectTo)
      }, 2000)
    } else {
      setDonnaError(verification.failureReason ?? 'Something went wrong. Please try again.')
      setDonnaSubmitting(false)
    }
  }

  function handleDonnaDismiss() {
    setDonnaPlan(null)
    setDisambiguation(null)
    setDonnaError(null)
  }

  // ── DONNA review banner ────────────────────────────────────────────────────
  function renderDonnaBanner() {
    if (!donnaPlan) return null

    if (donnaCompletion) {
      return (
        <div className="rounded-xl border border-status-green/30 bg-status-green/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <p className="text-sm font-semibold text-status-green">Player created</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{donnaCompletion.donnaMessage}</p>
          <p className="text-xs text-text-muted">Taking you to onboarding…</p>
        </div>
      )
    }

    // Disambiguation panel
    if (disambiguation) {
      const fieldLabel: Record<string, string> = {
        primary_coach:    'Coach',
        group:            'Group',
        curriculum_level: 'Curriculum level',
      }
      const allChosen = disambiguation.fields.every(f => disambiguation.choices[f.field])

      return (
        <div className="rounded-xl border border-status-orange/30 bg-status-orange/5 space-y-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-status-orange/20 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0" />
            <p className="text-xs font-semibold text-status-orange">Multiple matches found — please confirm</p>
          </div>
          <div className="px-4 py-3 space-y-4">
            {disambiguation.fields.map(f => (
              <div key={f.field} className="space-y-1.5">
                <p className="text-xs text-text-muted">{fieldLabel[f.field] ?? f.field} — DONNA heard: <span className="text-text-primary">"{f.inputText}"</span></p>
                <div className="space-y-1">
                  {f.options.map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={f.field}
                        value={opt.id}
                        checked={disambiguation.choices[f.field] === opt.id}
                        onChange={() => setDisambiguation(prev => prev ? {
                          ...prev,
                          choices: { ...prev.choices, [f.field]: opt.id },
                        } : null)}
                        className="accent-lime"
                      />
                      <span className="text-xs text-text-primary">{opt.displayName}</span>
                      <span className="text-[10px] text-text-muted ml-auto">{Math.round(opt.confidence * 100)}% match</span>
                    </label>
                  ))}
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
          <div className="px-4 py-3 border-t border-status-orange/20 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDisambiguationConfirm}
              disabled={!allChosen || donnaSubmitting}
              className="btn-lime text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {donnaSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {donnaSubmitting ? 'Creating…' : 'Confirm selections & create'}
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

    const filledFields = donnaPlan.fields.filter(f => f.filled)

    return (
      <div className="rounded-xl border border-lime/25 bg-lime/5 space-y-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-lime/15 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-xs font-semibold text-lime">DONNA collected these answers</p>
        </div>

        {/* Field list */}
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

        {/* Validation errors */}
        {!donnaPlan.readyToSubmit && donnaPlan.validationErrors.length > 0 && (
          <div className="px-4 py-2 border-t border-lime/15 space-y-1">
            {donnaPlan.validationErrors.map((err, i) => (
              <p key={i} className="text-xs text-status-orange">{err}</p>
            ))}
          </div>
        )}

        {/* Error */}
        {donnaError && (
          <div className="px-4 py-2 border-t border-status-red/20 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0" />
            <p className="text-xs text-status-red">{donnaError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-t border-lime/15 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDonnaConfirm}
            disabled={!donnaPlan.readyToSubmit || donnaSubmitting}
            className="btn-lime text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {donnaSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {donnaSubmitting ? 'Creating…' : 'Confirm & Create Player'}
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* DONNA review banner (shown above form when plan is ready) */}
      {renderDonnaBanner()}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="first_name" className="label-xs">
              First name *
              {donnaSyncedFields.has('player_name') && (
                <span className="ml-1.5 text-lime text-[10px]">
                  <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />set by DONNA
                </span>
              )}
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              autoComplete="given-name"
              placeholder="e.g. Maria"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="last_name" className="label-xs">Last name *</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              autoComplete="family-name"
              placeholder="e.g. Rodriguez"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="date_of_birth" className="label-xs">
            Date of birth *
            {donnaSyncedFields.has('player_age') && (
              <span className="ml-1.5 text-lime text-[10px]">
                <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />set by DONNA
              </span>
            )}
          </label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            required
            value={dob}
            onChange={e => setDob(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary focus:outline-none focus:border-lime/50 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="gender" className="label-xs">Gender (optional)</label>
          <select
            id="gender"
            name="gender"
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary focus:outline-none focus:border-lime/50 transition-colors"
          >
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="notes" className="label-xs">Initial notes (optional)</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={500}
            placeholder="Any context for this player's first session…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-status-red">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-lime w-full"
        >
          {submitting ? 'Creating player…' : 'Create player'}
        </button>
      </form>
    </div>
  )
}
