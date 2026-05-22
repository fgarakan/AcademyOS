'use client'

// Sprint 643 — DONNA Current Question Display V1
// Standalone component: shows the active question prominently above voice input.
// No DB calls, no mutations. Pure display driven by props.

interface Props {
  question: string
  helperText?: string | null
  stepNumber?: number | null
  totalSteps?: number | null
  /** 'onboarding' | 'guided_task' | 'generic' — affects label copy */
  context?: 'onboarding' | 'guided_task' | 'generic'
  className?: string
}

export function DonnaCurrentQuestionDisplay({
  question,
  helperText,
  stepNumber,
  totalSteps,
  context = 'generic',
  className = '',
}: Props) {
  const eyebrow =
    context === 'onboarding'
      ? 'Setup question'
      : context === 'guided_task'
      ? 'Current question'
      : 'Donna asks'

  const hasProgress = stepNumber != null && totalSteps != null

  return (
    <div
      className={`rounded-lg px-3 py-2.5 ${className}`}
      style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.2)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">
          {eyebrow}
        </p>
        {hasProgress && (
          <p className="text-[10px] text-text-muted font-mono tabular-nums">
            {stepNumber} / {totalSteps}
          </p>
        )}
      </div>

      <p className="text-[13px] text-text-primary font-medium leading-snug">
        {question}
      </p>

      {helperText && (
        <p className="text-[10px] text-text-muted mt-1 leading-snug">
          {helperText}
        </p>
      )}
    </div>
  )
}
