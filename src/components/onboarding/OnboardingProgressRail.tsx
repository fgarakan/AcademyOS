'use client'

import { CheckCircle2 } from 'lucide-react'

const STEPS = [
  { id: 'welcome',             label: 'Welcome' },
  { id: 'academy-basics',      label: 'Academy' },
  { id: 'coaching-dna',        label: 'Philosophy' },
  { id: 'coach-comm',          label: 'Comm Voice' },
  { id: 'curriculum',          label: 'Curriculum' },
  { id: 'class-template',      label: 'Class Tmpl' },
  { id: 'fitness-template',    label: 'Fitness Tmpl' },
  { id: 'players',             label: 'Players' },
  { id: 'coaches',             label: 'Coaches' },
  { id: 'portal-preview',      label: 'Portals' },
  { id: 'review-dna',          label: 'Review DNA' },
  { id: 'activate',            label: 'Activate' },
]

interface Props {
  currentStep: number
}

export function OnboardingProgressRail({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-0 px-4 py-3 border-b border-border bg-surface overflow-x-auto">
      {STEPS.map((step, i) => {
        const isComplete = i < currentStep
        const isActive   = i === currentStep
        return (
          <div key={step.id} className="flex items-center shrink-0">
            {/* Node */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                  isComplete
                    ? 'bg-lime/20 border border-lime/40'
                    : isActive
                      ? 'bg-lime/10 border-2 border-lime'
                      : 'bg-surface-raised border border-border',
                ].join(' ')}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-lime" />
                ) : (
                  <span
                    className={[
                      'text-[9px] font-mono font-bold leading-none',
                      isActive ? 'text-lime' : 'text-text-muted',
                    ].join(' ')}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                className={[
                  'text-[8px] font-medium whitespace-nowrap uppercase tracking-wide leading-none hidden lg:block',
                  isActive ? 'text-lime' : isComplete ? 'text-text-muted' : 'text-text-muted/50',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'h-px w-5 mx-0.5 shrink-0 transition-all',
                  i < currentStep ? 'bg-lime/40' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
