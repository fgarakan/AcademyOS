'use client'

import { useState, useTransition } from 'react'
import { X, ChevronRight, ChevronLeft, Check, Loader2, Copy } from 'lucide-react'
import { saveSessionRecapAction } from './actions'

// ─────────────────────────────────────────────────────────────
// Step definitions
// ─────────────────────────────────────────────────────────────

interface WrapUpStep {
  key: string
  question: string
  hint: string
  placeholder: string
}

const STEPS: WrapUpStep[] = [
  {
    key: 'attendance',
    question: 'Was everyone here, or was anyone missing or added today?',
    hint: 'Mention absences, late arrivals, or any players who weren\'t on the roster.',
    placeholder: 'Everyone was here / Max was absent / A new player showed up',
  },
  {
    key: 'blocks',
    question: 'Did you complete all the planned blocks?',
    hint: 'If you skipped or shortened anything, mention it here.',
    placeholder: 'Yes, all blocks / We skipped the conditioning block',
  },
  {
    key: 'changes',
    question: 'What changed or got skipped — and why?',
    hint: 'Any deviations from the plan, adjustments made, or timing changes.',
    placeholder: 'Shortened warm-up due to late start. Skipped third drill — group was fatigued.',
  },
  {
    key: 'standouts',
    question: 'Who stood out today — in a good way or needs follow-up?',
    hint: 'Positive or negative. Skill breakthroughs, focus issues, anything noteworthy.',
    placeholder: 'Lucas was exceptional on serve. Emma struggled with movement consistency.',
  },
  {
    key: 'attention',
    question: 'Who needs specific attention next session?',
    hint: 'Players who need extra focus, one-on-one work, or a check-in.',
    placeholder: 'Emma needs one-on-one work on footwork. Check in with Max after his absence.',
  },
  {
    key: 'next',
    question: 'What should the focus be for the next session?',
    hint: 'What would make the next session most valuable for this group?',
    placeholder: 'Serve placement and consistency under pressure. Build on today\'s forehand work.',
  },
]

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Props {
  sessionId: string
  sessionName: string
  onClose: () => void
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function CoachWrapUpDrawer({ sessionId, sessionName, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ''))
  const [phase, setPhase] = useState<'questions' | 'summary' | 'saved'>('questions')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isLastQuestion = stepIndex === STEPS.length - 1
  const currentStep = STEPS[stepIndex]

  function setAnswer(idx: number, value: string) {
    setAnswers(prev => prev.map((a, i) => i === idx ? value : a))
  }

  function goNext() {
    if (isLastQuestion) {
      setPhase('summary')
    } else {
      setStepIndex(i => i + 1)
    }
  }

  function goBack() {
    if (phase === 'summary') {
      setPhase('questions')
      setStepIndex(STEPS.length - 1)
    } else if (stepIndex > 0) {
      setStepIndex(i => i - 1)
    }
  }

  function buildSummaryText(): string {
    const lines = STEPS.map((s, i) => {
      const answer = answers[i]?.trim() || '(skipped)'
      return `${s.question}\n${answer}`
    })
    return `[Coach Wrap-Up — ${sessionName}]\n\n${lines.join('\n\n')}`
  }

  function handleCopy() {
    const text = buildSummaryText()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleSave() {
    setSaveError(null)
    const recapText = buildSummaryText()
    startTransition(async () => {
      const result = await saveSessionRecapAction({ sessionId, recapText })
      if (result.ok) {
        setPhase('saved')
      } else {
        setSaveError(result.error ?? 'Save failed. Try copying the summary instead.')
      }
    })
  }

  // ── Saved state ─────────────────────────────────────────────
  if (phase === 'saved') {
    return (
      <WrapUpShell sessionName={sessionName} onClose={onClose} showClose>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8">
          <div className="w-14 h-14 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
            <Check className="w-7 h-7 text-status-green" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-base font-semibold text-text-primary">Wrap-up saved</p>
            <p className="text-sm text-text-muted">
              Your recap has been saved for director review. Nothing official has been changed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost px-5 py-2 text-sm mt-1"
          >
            Done
          </button>
        </div>
      </WrapUpShell>
    )
  }

  // ── Summary / review state ───────────────────────────────────
  if (phase === 'summary') {
    return (
      <WrapUpShell sessionName={sessionName} onClose={onClose} showClose>
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs text-text-muted">Review your wrap-up before saving. Nothing is official yet.</p>
          </div>
          <div className="px-5 py-4 space-y-5">
            {STEPS.map((s, i) => (
              <div key={s.key}>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{s.question}</p>
                <p className={`text-sm ${answers[i]?.trim() ? 'text-text-primary' : 'text-text-muted italic'}`}>
                  {answers[i]?.trim() || 'Skipped'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border space-y-3">
          {saveError && (
            <p className="text-xs text-status-red">{saveError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              disabled={isPending}
              className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCopy}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors px-3 py-2 disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn-lime flex items-center gap-1.5 text-sm px-4 py-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isPending ? 'Saving…' : 'Save Recap'}
            </button>
          </div>
        </div>
      </WrapUpShell>
    )
  }

  // ── Question step ────────────────────────────────────────────
  return (
    <WrapUpShell sessionName={sessionName} onClose={onClose} showClose>
      {/* Progress */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < stepIndex ? 'bg-lime' : i === stepIndex ? 'bg-lime/60' : 'bg-surface-raised'
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted">
          Question {stepIndex + 1} of {STEPS.length}
        </p>
      </div>

      {/* Question content */}
      <div className="flex-1 px-5 space-y-5">
        <div>
          <p className="text-base font-semibold text-text-primary leading-snug mb-2">
            {currentStep.question}
          </p>
          <p className="text-xs text-text-muted">{currentStep.hint}</p>
        </div>

        <textarea
          value={answers[stepIndex]}
          onChange={e => setAnswer(stepIndex, e.target.value)}
          placeholder={currentStep.placeholder}
          rows={5}
          autoFocus
          className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 resize-none"
        />

        <p className="text-[10px] text-text-muted">
          Tap Next to continue — you can go back at any time. Nothing is saved until you tap Save Recap.
        </p>
      </div>

      {/* Navigation */}
      <div className="px-5 py-4 border-t border-border flex items-center gap-3">
        <button
          onClick={goBack}
          disabled={stepIndex === 0}
          className="btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex-1" />
        <button
          onClick={goNext}
          className="btn-lime flex items-center gap-1.5 text-sm px-4 py-2"
        >
          {isLastQuestion ? 'Review' : 'Next'}
          {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </WrapUpShell>
  )
}

// ─────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────

function WrapUpShell({
  sessionName,
  onClose,
  showClose,
  children,
}: {
  sessionName: string
  onClose: () => void
  showClose?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Coach Wrap-Up</p>
          <p className="text-sm font-semibold text-text-primary mt-0.5 truncate max-w-[240px]">
            {sessionName}
          </p>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {children}
    </div>
  )
}
