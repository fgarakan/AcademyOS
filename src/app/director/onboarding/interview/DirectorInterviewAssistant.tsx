'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { INTERVIEW_STEPS, type InterviewField } from './interviewSteps'
import { updateDirectorInterviewAction } from './updateDirectorInterviewAction'

interface Props {
  initialPhilosophy: string
  initialPlayerFocus: string
  initialDevelopmentPriorities: string
  initialCompetitionApproach: string
  initialParentCommunicationStyle: string
  initialCoachOperatingStyle: string
  initialNinetyDaySuccess: string
}

type AnswerState = { chips: string[]; custom: string }
type Answers = Record<InterviewField, AnswerState>

function buildValue(chips: string[], custom: string): string {
  const trimmed = custom.trim()
  if (chips.length === 0) return trimmed
  if (!trimmed) return chips.join('; ')
  return `${chips.join('; ')}; Custom note: ${trimmed}`
}

function initAnswer(initial: string): AnswerState {
  return { chips: [], custom: initial }
}

const BTN_LIME =
  'flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime text-base text-sm font-semibold hover:bg-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_GHOST =
  'flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:border-lime/30 hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

export function DirectorInterviewAssistant({
  initialPhilosophy,
  initialPlayerFocus,
  initialDevelopmentPriorities,
  initialCompetitionApproach,
  initialParentCommunicationStyle,
  initialCoachOperatingStyle,
  initialNinetyDaySuccess,
}: Props) {
  // step: -1 = welcome, 0–6 = questions, 7 = review, 8 = saved
  const [step, setStep] = useState(-1)
  const [answers, setAnswers] = useState<Answers>({
    philosophy: initAnswer(initialPhilosophy),
    player_focus: initAnswer(initialPlayerFocus),
    development_priorities: initAnswer(initialDevelopmentPriorities),
    competition_approach: initAnswer(initialCompetitionApproach),
    parent_communication_style: initAnswer(initialParentCommunicationStyle),
    coach_operating_style: initAnswer(initialCoachOperatingStyle),
    ninety_day_success: initAnswer(initialNinetyDaySuccess),
  })
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  function toggleChip(field: InterviewField, chip: string) {
    setAnswers(prev => {
      const current = prev[field].chips
      const next = current.includes(chip)
        ? current.filter(c => c !== chip)
        : [...current, chip]
      return { ...prev, [field]: { ...prev[field], chips: next } }
    })
  }

  function setCustom(field: InterviewField, value: string) {
    setAnswers(prev => ({ ...prev, [field]: { ...prev[field], custom: value } }))
  }

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await updateDirectorInterviewAction(
        buildValue(answers.philosophy.chips, answers.philosophy.custom),
        buildValue(answers.player_focus.chips, answers.player_focus.custom),
        buildValue(answers.development_priorities.chips, answers.development_priorities.custom),
        buildValue(answers.competition_approach.chips, answers.competition_approach.custom),
        buildValue(answers.parent_communication_style.chips, answers.parent_communication_style.custom),
        buildValue(answers.coach_operating_style.chips, answers.coach_operating_style.custom),
        buildValue(answers.ninety_day_success.chips, answers.ninety_day_success.custom),
      )
      if (result.ok) {
        setStep(8)
      } else {
        setSaveError(result.error ?? 'Failed to save. Please try again.')
      }
    })
  }

  // ── Welcome ──────────────────────────────────────────────────────────────────
  if (step === -1) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-lime" />
            <span className="label-xs">Director Interview</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary leading-tight">
            Let&apos;s shape your academy<br />operating system together.
          </h2>
          <p className="text-sm text-text-secondary pt-1">
            Great academies are built on shared language. This short interview captures yours.
          </p>
        </div>

        <div className="space-y-2.5 py-1">
          {([
            'Takes 3–5 minutes. Short answers are perfect.',
            'Pick chips that match your style, or add your own note.',
            'Academy OS uses this to shape setup, curriculum, and communication.',
            'Nothing leaves your academy. You review everything before saving.',
          ] as const).map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-mono text-lime">{i + 1}</span>
              </span>
              <p className="text-sm text-text-secondary">{item}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStep(0)}
          className={`w-full ${BTN_LIME}`}
        >
          Start the interview
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // ── Review ───────────────────────────────────────────────────────────────────
  if (step === 7) {
    return (
      <div className="space-y-6">
        <div>
          <p className="label-xs mb-1">Review your answers</p>
          <h2 className="text-lg font-semibold text-text-primary">Here&apos;s what you&apos;ve shared</h2>
          <p className="text-xs text-text-muted mt-0.5">Everything looks good? Save to lock it in.</p>
        </div>

        <div className="space-y-3">
          {INTERVIEW_STEPS.map(s => {
            const value = buildValue(answers[s.field].chips, answers[s.field].custom)
            return (
              <div key={s.field} className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
                <p className="label-xs mb-1">{s.stepLabel}</p>
                {value ? (
                  <p className="text-sm text-text-secondary leading-relaxed">{value}</p>
                ) : (
                  <p className="text-xs text-text-muted italic">Not answered — you can go back and add a note.</p>
                )}
              </div>
            )
          })}
        </div>

        {saveError && (
          <p className="text-sm text-status-red px-1">{saveError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => setStep(INTERVIEW_STEPS.length - 1)}
            disabled={isPending}
            className={`flex-1 ${BTN_GHOST}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className={`flex-1 ${BTN_LIME}`}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Saving…' : 'Save Interview'}
          </button>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === 8) {
    return (
      <div className="py-4 space-y-6">
        <div className="flex flex-col items-center text-center gap-3 py-8">
          <div className="w-12 h-12 rounded-full bg-status-green/10 border border-status-green/25 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-status-green" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Interview saved.</h2>
            <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto">
              Academy OS now has the context it needs to shape your setup, curriculum, and workflows.
            </p>
          </div>
        </div>

        <Link
          href="/director/onboarding"
          className={`w-full ${BTN_LIME}`}
        >
          Back to Onboarding
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  // ── Question step ────────────────────────────────────────────────────────────
  const currentStep = INTERVIEW_STEPS[step]
  const { field } = currentStep
  const currentAnswer = answers[field]
  const isLast = step === INTERVIEW_STEPS.length - 1

  return (
    <div className="space-y-6">

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-text-muted">{step + 1} / {INTERVIEW_STEPS.length}</p>
          <p className="label-xs">{currentStep.stepLabel}</p>
        </div>
        <div className="w-full h-0.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-lime transition-all duration-300"
            style={{ width: `${((step + 1) / INTERVIEW_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-text-primary leading-snug">
          {currentStep.question}
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">{currentStep.whyItMatters}</p>
      </div>

      {/* Answer chips */}
      <div className="flex flex-wrap gap-2">
        {currentStep.chips.map(chip => {
          const selected = currentAnswer.chips.includes(chip)
          return (
            <button
              key={chip}
              type="button"
              onClick={() => toggleChip(field, chip)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                selected
                  ? 'bg-lime/10 border-lime/40 text-lime'
                  : 'bg-surface-raised border-border text-text-secondary hover:border-lime/30 hover:text-text-primary'
              }`}
            >
              {chip}
            </button>
          )
        })}
      </div>

      {/* Custom text */}
      <div className="space-y-1.5">
        <label className="label-xs">Add your own note (optional)</label>
        <textarea
          value={currentAnswer.custom}
          onChange={e => setCustom(field, e.target.value)}
          rows={2}
          maxLength={400}
          placeholder="Add a note in your own words…"
          className="w-full text-sm bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
        />
        <p className="text-[10px] text-text-muted text-right">{currentAnswer.custom.length} / 400</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => setStep(prev => prev - 1)}
          className={`flex-1 ${BTN_GHOST}`}
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? 'Welcome' : 'Back'}
        </button>
        <button
          type="button"
          onClick={() => setStep(prev => prev + 1)}
          className={`flex-1 ${BTN_LIME}`}
        >
          {isLast ? 'Review' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  )
}
