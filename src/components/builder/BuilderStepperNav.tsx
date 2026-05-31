'use client'

import { CheckCircle2 } from 'lucide-react'

// Shared stepper nav for Fitness Builder and Class Builder.
// Both builders had identical StepperNav implementations — this DRYs them up.

export interface BuilderStep {
  id: number
  label: string
  shortLabel: string
}

interface BuilderStepperNavProps {
  steps: readonly BuilderStep[]
  activeStep: number
  onGoTo: (n: number) => void
  ariaLabel?: string
}

export function BuilderStepperNav({
  steps,
  activeStep,
  onGoTo,
  ariaLabel = 'Builder steps',
}: BuilderStepperNavProps) {
  return (
    <nav aria-label={ariaLabel} className="flex items-center gap-0 overflow-x-auto">
      {steps.map((step, i) => {
        const isActive = step.id === activeStep
        const isDone = step.id < activeStep
        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onGoTo(step.id)}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors shrink-0',
                isActive
                  ? 'bg-lime/10 text-lime font-semibold'
                  : isDone
                  ? 'text-status-green hover:text-status-green/80'
                  : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <div className={[
                  'w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-mono shrink-0',
                  isActive ? 'border-lime text-lime' : 'border-border text-text-muted',
                ].join(' ')}>
                  {step.id}
                </div>
              )}
              <span className="hidden sm:block">{step.label}</span>
              <span className="sm:hidden font-mono">{step.shortLabel}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={[
                'w-6 h-px shrink-0',
                step.id < activeStep ? 'bg-status-green/40' : 'bg-border',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// Shared bottom nav — Back / Step X of Y / Next
interface BuilderBottomNavProps {
  activeStep: number
  totalSteps: number
  nextLabel: string | null
  onPrev: () => void
  onNext: () => void
}

export function BuilderBottomNav({
  activeStep,
  totalSteps,
  nextLabel,
  onPrev,
  onNext,
}: BuilderBottomNavProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
      <button
        onClick={onPrev}
        disabled={activeStep === 1}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ‹ Back
      </button>
      <span className="text-[10px] text-text-muted tabular-nums">
        Step {activeStep} of {totalSteps}
      </span>
      {nextLabel ? (
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary hover:text-lime transition-colors"
        >
          {nextLabel} ›
        </button>
      ) : (
        <span className="text-[10px] text-status-green flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Done
        </span>
      )}
    </div>
  )
}
