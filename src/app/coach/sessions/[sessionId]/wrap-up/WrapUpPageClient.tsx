'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Check, Loader2, Sparkles, SkipForward } from 'lucide-react'
import Link from 'next/link'
import { saveWrapUpDraftAction, type BlockCompletionDraft } from '../saveWrapUpDraftAction'

// ── Question definitions ──────────────────────────────────────

interface Question {
  key: string
  question: string
  hint: string
  placeholder: string
}

const QUESTIONS: Question[] = [
  {
    key: 'overall',
    question: 'How did the session go overall?',
    hint: 'A quick summary — energy, flow, what worked.',
    placeholder: 'Great session. High energy, group was focused...',
  },
  {
    key: 'attendance',
    question: 'Any attendance exceptions?',
    hint: 'Absences, late arrivals, early departures, or players not on the roster.',
    placeholder: 'Everyone was here / Max was absent / A new player showed up',
  },
  {
    key: 'standouts',
    question: 'Any players stand out positively today?',
    hint: 'Skill breakthroughs, great effort, focus.',
    placeholder: 'Lucas was exceptional on serve. Emma showed real improvement.',
  },
  {
    key: 'attention',
    question: 'Any players need extra attention next time?',
    hint: 'Players who need extra focus, one-on-one work, or a check-in.',
    placeholder: 'Emma needs one-on-one work on footwork. Check in with Max.',
  },
  {
    key: 'adjust',
    question: 'Anything to adjust for next time?',
    hint: 'Changes to blocks, drills, pacing, or group dynamic.',
    placeholder: 'Shorten the warm-up. Add more game-based drilling at the end.',
  },
  {
    key: 'followup',
    question: 'Any parent or director follow-up needed?',
    hint: 'Flag anything that needs to be communicated or actioned.',
    placeholder: 'No follow-up needed / Emma\'s parent asked about schedule changes',
  },
]

// ── Types ─────────────────────────────────────────────────────

interface Props {
  sessionId: string
  sessionName: string
  blockList: Array<{ id: string; name: string }>
  returnHref: string
}

type Phase = 'questions' | 'saved'

// ── Main client component ────────────────────────────────────

export function WrapUpPageClient({ sessionId, sessionName, blockList, returnHref }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const q of QUESTIONS) init[q.key] = ''
    return init
  })
  const [phase, setPhase] = useState<Phase>('questions')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentQuestion = QUESTIONS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === QUESTIONS.length - 1
  const answered = QUESTIONS.filter(q => answers[q.key]?.trim()).length

  function goNext() { if (!isLast) setStepIndex(i => i + 1) }
  function goPrev() { if (!isFirst) setStepIndex(i => i - 1) }
  function skip() { if (!isLast) setStepIndex(i => i + 1) }

  function handleSave() {
    setSaveError(null)
    const blockCompletion: BlockCompletionDraft[] = blockList.map(b => ({
      block_id: b.id,
      block_name: b.name,
      status: 'completed' as const,
      note: '',
    }))

    startTransition(async () => {
      const result = await saveWrapUpDraftAction(
        sessionId,
        sessionName,
        blockCompletion,
        {
          attendance: answers.attendance ?? '',
          changes: answers.adjust ?? '',
          standouts: answers.standouts ?? '',
          attention: answers.attention ?? '',
          nextFocus: answers.adjust ?? '',
          groupNote: answers.overall ?? '',
        }
      )
      if (result.ok) {
        setPhase('saved')
      } else {
        setSaveError(result.error ?? 'Failed to save wrap-up. Please try again.')
      }
    })
  }

  if (phase === 'saved') {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
          <Check className="w-7 h-7 text-status-green" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Wrap-up saved</h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed max-w-xs mx-auto">
            Your notes have been submitted for director review. Nothing has been sent to parents or applied to player profiles yet.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link
            href={`/coach/sessions/${sessionId}/wrap-up/review`}
            className="px-5 py-3 rounded-xl bg-lime text-black text-sm font-bold hover:bg-lime/90 transition-all text-center"
          >
            Review Submitted Draft
          </Link>
          <Link
            href={returnHref}
            className="px-5 py-3 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-raised transition-all text-center"
          >
            Back to Session
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base flex flex-col max-w-lg mx-auto px-4 py-6">

      {/* Top nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={returnHref}
          className="flex items-center gap-1 text-text-muted text-xs hover:text-text-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
          {sessionName}
        </Link>
        <p className="text-[10px] font-mono text-text-muted">
          {stepIndex + 1} / {QUESTIONS.length}
        </p>
      </div>

      {/* Progress rail */}
      <div className="flex gap-1 mb-6">
        {QUESTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStepIndex(i)}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              i < stepIndex ? 'bg-status-green' :
              i === stepIndex ? 'bg-lime' :
              'bg-surface-raised'
            }`}
            aria-label={`Question ${i + 1}`}
          />
        ))}
      </div>

      {/* DONNA intro chip */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-lime" />
        </div>
        <p className="text-xs text-text-muted">
          {stepIndex === 0
            ? "Let's wrap this up quickly. I'll turn your answers into drafts for review."
            : "Keep going — almost done."}
        </p>
      </div>

      {/* Question card */}
      <div className="flex-1 rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary leading-snug">
            {currentQuestion.question}
          </h2>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{currentQuestion.hint}</p>
        </div>

        <textarea
          value={answers[currentQuestion.key] ?? ''}
          onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.key]: e.target.value }))}
          placeholder={currentQuestion.placeholder}
          className="w-full rounded-xl bg-surface-raised border border-border px-3 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
          rows={4}
          autoFocus
        />

        {/* Running answer summary */}
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-widest text-text-muted">{answered} of {QUESTIONS.length} answered</p>
          <div className="flex flex-wrap gap-1">
            {QUESTIONS.map((q, i) => (
              <span
                key={q.key}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  answers[q.key]?.trim()
                    ? 'border-status-green/30 bg-status-green/10 text-status-green'
                    : i === stepIndex
                    ? 'border-lime/30 bg-lime/5 text-lime'
                    : 'border-border text-text-muted'
                }`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Running structured summary */}
      {answered > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-text-muted">DONNA Summary Draft</p>
          </div>
          <div className="space-y-2">
            {QUESTIONS.map(q => {
              const val = answers[q.key]?.trim()
              if (!val) return null
              return (
                <div key={q.key}>
                  <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">
                    {q.key === 'overall' ? 'Session Overview' :
                     q.key === 'attendance' ? 'Attendance' :
                     q.key === 'standouts' ? 'Positive Standouts' :
                     q.key === 'attention' ? 'Needs Extra Attention' :
                     q.key === 'adjust' ? 'Next Session Adjustments' :
                     'Follow-Up Items'}
                  </p>
                  <p className="text-xs text-text-secondary leading-snug line-clamp-2">{val}</p>
                </div>
              )
            })}
          </div>
          <p className="text-[9px] text-text-muted leading-snug">
            Draft only — submitted for director review. Nothing sent to parents or applied to player profiles.
          </p>
        </div>
      )}

      {/* Error */}
      {saveError && (
        <p className="text-xs text-status-red mt-3 text-center">{saveError}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex items-center gap-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-raised transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={skip}
          disabled={isLast}
          className="flex items-center gap-1 px-3 py-3 rounded-xl border border-border text-xs text-text-muted disabled:opacity-30 hover:bg-surface-raised transition-all"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </button>
        <div className="flex-1" />
        {isLast ? (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-lime text-base font-bold text-black hover:bg-lime/90 disabled:opacity-60 transition-all"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Wrap-Up
          </button>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-1 px-4 py-3 rounded-xl bg-lime text-base font-bold text-black hover:bg-lime/90 transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  )
}
