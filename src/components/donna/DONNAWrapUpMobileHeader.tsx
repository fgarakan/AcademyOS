'use client'

// Sprint 627 — Mobile Coach Flow Polish V1
// Sticky mobile header for the DONNA wrap-up conversation.
// Shows question progress, current question text, and skip controls.
// Display only — no DB writes.

import { ChevronRight, CheckCircle2 } from 'lucide-react'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DONNAWrapUpMobileHeaderProps {
  questionNumber: number
  totalQuestions: number
  questionText: string | null
  donnaOpener: string | null
  isComplete: boolean
  canSkipRemaining: boolean
  onSkipRemaining?: () => void
  className?: string
}

// ── Progress dots ─────────────────────────────────────────────────────────────

function ProgressDots({
  total,
  current,
  isComplete,
}: {
  total: number
  current: number
  isComplete: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const answered = i < current - 1
        const active = i === current - 1
        return (
          <div
            key={i}
            className={`rounded-full transition-all ${
              isComplete
                ? 'w-1.5 h-1.5 bg-status-green'
                : answered
                ? 'w-1.5 h-1.5 bg-lime'
                : active
                ? 'w-2.5 h-1.5 bg-lime/60'
                : 'w-1.5 h-1.5 bg-surface-raised border border-border'
            }`}
          />
        )
      })}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAWrapUpMobileHeader({
  questionNumber,
  totalQuestions,
  questionText,
  donnaOpener,
  isComplete,
  canSkipRemaining,
  onSkipRemaining,
  className = '',
}: DONNAWrapUpMobileHeaderProps) {
  if (isComplete) {
    return (
      <div className={`px-4 py-4 text-center ${className}`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-status-green" />
          <p className="text-sm font-medium text-status-green">Wrap-up complete</p>
        </div>
        <p className="text-[11px] text-text-muted">DONNA has captured everything. Submitting for review.</p>
      </div>
    )
  }

  return (
    <div className={`px-4 py-3 ${className}`}>
      {/* Progress row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ProgressDots total={totalQuestions} current={questionNumber} isComplete={isComplete} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">
            {questionNumber} of {totalQuestions}
          </span>
          {canSkipRemaining && onSkipRemaining && questionNumber < totalQuestions && (
            <button
              onClick={onSkipRemaining}
              className="flex items-center gap-0.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors px-1.5 py-0.5 rounded border border-border/60"
            >
              Skip rest
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* DONNA opener */}
      {donnaOpener && (
        <p className="text-[11px] text-text-muted mb-1">{donnaOpener}</p>
      )}

      {/* Question */}
      {questionText && (
        <p className="text-base font-medium text-text-primary leading-snug">{questionText}</p>
      )}
    </div>
  )
}
