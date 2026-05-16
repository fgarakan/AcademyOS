'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, SkipForward, CheckCircle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type WrapUpQuestionId =
  | 'q1_attendance'
  | 'q2_session_actual'
  | 'q3_standouts'
  | 'q4_needs_attention'
  | 'q5_follow_up'

export interface WrapUpAnswer {
  questionId: WrapUpQuestionId
  rawText: string
  voiceTranscript: null
  answeredAt: string
  skipped: boolean
}

export interface WrapUpAnswerSet {
  sessionId: string
  answers: WrapUpAnswer[]
  completedAt: string
  totalQuestions: number
  answeredCount: number
  skippedCount: number
}

// ── Question definitions ──────────────────────────────────────────────────────

interface WrapUpQuestion {
  id: WrapUpQuestionId
  question: string
  hint: string
  placeholder: string
  donna: string
}

const QUESTIONS: WrapUpQuestion[] = [
  {
    id: 'q1_attendance',
    question: 'Who was here today?',
    hint: 'Any absences or unexpected players?',
    placeholder: 'Everyone was here / Max was absent / A new player showed up…',
    donna: 'Let\'s start with attendance.',
  },
  {
    id: 'q2_session_actual',
    question: 'Did the session go as planned?',
    hint: 'Did you complete all the blocks, or were there any changes?',
    placeholder: 'Followed the plan / Skipped the conditioning block / Changed focus due to weather…',
    donna: 'How did the session itself go?',
  },
  {
    id: 'q3_standouts',
    question: 'Who stood out positively?',
    hint: 'Skill breakthroughs, great effort, focus — anything worth noting.',
    placeholder: 'Lucas was exceptional on serve. Emma showed real improvement on movement…',
    donna: 'Any highlights from the group?',
  },
  {
    id: 'q4_needs_attention',
    question: 'Who needs attention?',
    hint: 'Players who need extra focus, one-on-one work, or a check-in.',
    placeholder: 'Emma needs one-on-one work on footwork. Max was off today…',
    donna: 'Anyone who needs extra support next time?',
  },
  {
    id: 'q5_follow_up',
    question: 'Any parent or director follow-up?',
    hint: 'Scheduling notes, parent updates needed, or anything for the director.',
    placeholder: 'Talk to Max\'s parent about absences. Director needs to know about the group energy today…',
    donna: 'Anything that needs follow-up beyond the session?',
  },
]

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="label-xs">Question {current} of {total}</p>
        <p className="text-[10px] text-text-muted">{pct}% complete</p>
      </div>
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-lime rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Summary screen ────────────────────────────────────────────────────────────

function WrapUpSummaryScreen({
  answers,
  onBack,
  onSubmit,
}: {
  answers: WrapUpAnswer[]
  onBack: () => void
  onSubmit: (set: WrapUpAnswerSet) => void
}) {
  function handleSubmit() {
    const answered = answers.filter(a => !a.skipped)
    const skipped = answers.filter(a => a.skipped)
    onSubmit({
      sessionId: '',
      answers,
      completedAt: new Date().toISOString(),
      totalQuestions: answers.length,
      answeredCount: answered.length,
      skippedCount: skipped.length,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="label-xs mb-1">Wrap-Up Summary</p>
        <p className="text-xs text-text-secondary">Review your answers before submitting. Nothing is saved yet.</p>
      </div>

      <div className="space-y-3">
        {answers.map((answer, i) => {
          const q = QUESTIONS.find(q => q.id === answer.questionId)
          return (
            <div key={answer.questionId} className="border border-border rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Q{i + 1}: {q?.question}</p>
              {answer.skipped ? (
                <p className="text-xs text-text-muted italic">Skipped</p>
              ) : (
                <p className="text-xs text-text-primary leading-relaxed">{answer.rawText || <span className="italic text-text-muted">No answer</span>}</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-start gap-2 text-xs text-text-muted bg-surface-raised border border-border rounded-xl px-3 py-2">
        <CheckCircle size={13} className="shrink-0 mt-0.5 text-lime" />
        <span>Draft only — nothing is official until a director reviews and approves.</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary border border-border rounded-lg px-3 py-2 transition-colors"
        >
          <ArrowLeft size={13} />
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 btn-lime text-sm py-2.5 rounded-lg font-medium"
        >
          Submit Wrap-Up Draft
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface WrapUpGuidedFlowProps {
  sessionId: string
  onComplete: (answerSet: WrapUpAnswerSet) => void
  onCancel: () => void
  className?: string
}

export function WrapUpGuidedFlow({ sessionId, onComplete, onCancel, className }: WrapUpGuidedFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<WrapUpAnswer[]>([])
  const [currentText, setCurrentText] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  const currentQuestion = QUESTIONS[currentIndex]
  const isLast = currentIndex === QUESTIONS.length - 1

  function recordAnswer(text: string, skipped: boolean) {
    const answer: WrapUpAnswer = {
      questionId: currentQuestion.id,
      rawText: text,
      voiceTranscript: null,
      answeredAt: new Date().toISOString(),
      skipped,
    }
    // Replace if already answered (back/forward navigation)
    const existing = answers.findIndex(a => a.questionId === currentQuestion.id)
    if (existing >= 0) {
      setAnswers(prev => prev.map((a, i) => i === existing ? answer : a))
    } else {
      setAnswers(prev => [...prev, answer])
    }
  }

  function handleNext() {
    recordAnswer(currentText, false)
    if (isLast) {
      setShowSummary(true)
    } else {
      // Pre-fill text if already answered this question
      const nextQ = QUESTIONS[currentIndex + 1]
      const existingAnswer = answers.find(a => a.questionId === nextQ.id)
      setCurrentText(existingAnswer?.rawText ?? '')
      setCurrentIndex(i => i + 1)
    }
  }

  function handleSkip() {
    recordAnswer('', true)
    if (isLast) {
      setShowSummary(true)
    } else {
      const nextQ = QUESTIONS[currentIndex + 1]
      const existingAnswer = answers.find(a => a.questionId === nextQ.id)
      setCurrentText(existingAnswer?.rawText ?? '')
      setCurrentIndex(i => i + 1)
    }
  }

  function handleBack() {
    if (currentIndex === 0) {
      onCancel()
      return
    }
    const prevQ = QUESTIONS[currentIndex - 1]
    const existingAnswer = answers.find(a => a.questionId === prevQ.id)
    setCurrentText(existingAnswer?.rawText ?? '')
    setCurrentIndex(i => i - 1)
  }

  function handleSummaryBack() {
    setShowSummary(false)
    const lastQ = QUESTIONS[QUESTIONS.length - 1]
    const existingAnswer = answers.find(a => a.questionId === lastQ.id)
    setCurrentText(existingAnswer?.rawText ?? '')
    setCurrentIndex(QUESTIONS.length - 1)
  }

  function handleSubmit(set: WrapUpAnswerSet) {
    onComplete({ ...set, sessionId })
  }

  if (showSummary) {
    // Ensure all questions have an answer entry (fill skipped for unanswered)
    const allAnswers = QUESTIONS.map(q => {
      return answers.find(a => a.questionId === q.id) ?? {
        questionId: q.id,
        rawText: '',
        voiceTranscript: null,
        answeredAt: new Date().toISOString(),
        skipped: true,
      }
    })
    return (
      <div className={className}>
        <WrapUpSummaryScreen
          answers={allAnswers}
          onBack={handleSummaryBack}
          onSubmit={handleSubmit}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-5">
        {/* Progress */}
        <ProgressBar current={currentIndex + 1} total={QUESTIONS.length} />

        {/* DONNA prompt */}
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-lime text-[10px] font-bold">D</span>
          </div>
          <p className="text-xs text-text-muted italic">{currentQuestion.donna}</p>
        </div>

        {/* Question */}
        <div>
          <p className="text-text-primary font-medium text-base leading-snug mb-1">
            {currentQuestion.question}
          </p>
          <p className="text-xs text-text-muted">{currentQuestion.hint}</p>
        </div>

        {/* Input */}
        <textarea
          value={currentText}
          onChange={e => setCurrentText(e.target.value)}
          placeholder={currentQuestion.placeholder}
          rows={4}
          className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors leading-relaxed"
          autoFocus
        />

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary border border-border rounded-lg px-3 py-2.5 transition-colors"
          >
            <ArrowLeft size={13} />
            {currentIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary border border-border rounded-lg px-3 py-2.5 transition-colors"
          >
            <SkipForward size={13} />
            Skip
          </button>

          <button
            onClick={handleNext}
            disabled={!currentText.trim()}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded-lg py-2.5 transition-colors ${
              currentText.trim()
                ? 'bg-lime text-black hover:bg-lime/90'
                : 'bg-surface-raised text-text-muted border border-border cursor-not-allowed'
            }`}
          >
            {isLast ? 'Review' : 'Next'}
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Safety note */}
        <p className="text-[10px] text-text-muted text-center">
          Draft only — nothing is official until a director reviews and approves.
        </p>
      </div>
    </div>
  )
}
