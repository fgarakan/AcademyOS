'use client'

import { CheckCircle2 } from 'lucide-react'

// Sprint 961 — upgraded from bar-only to bar + 9-step dot strip.
// Shows completed (lime check), current (lime ring), and upcoming (muted) states.
// "Next:" hint tells director what step is coming.

const STEPS = [
  { index: 1, label: 'Academy Basics',       short: 'Basics'    },
  { index: 2, label: 'Coaching Philosophy',  short: 'Coaching'  },
  { index: 3, label: 'Coach Comms',          short: 'Comms'     },
  { index: 4, label: 'Session Design',       short: 'Sessions'  },
  { index: 5, label: 'Player Development',   short: 'Players'   },
  { index: 6, label: 'Parent Comms',         short: 'Parents'   },
  { index: 7, label: 'DNA Summary',          short: 'Summary'   },
  { index: 8, label: 'DONNA Adjustment',     short: 'Adjust'    },
  { index: 9, label: 'Final Activation',     short: 'Activate'  },
]

const STEP_PROGRESS: Record<number, number> = {
  0: 0, 1: 11, 2: 22, 3: 33, 4: 44,
  5: 55, 6: 66, 7: 77, 8: 88, 9: 100,
}

interface Props {
  currentStep: number
}

export function OnboardingProgressRail({ currentStep }: Props) {
  if (currentStep === 0) return null

  const progress = STEP_PROGRESS[currentStep] ?? 0
  const currentStepDef = STEPS.find(s => s.index === currentStep)
  const nextStepDef    = STEPS.find(s => s.index === currentStep + 1)

  return (
    <div className="flex-shrink-0 border-b border-border bg-surface">

      {/* Progress bar */}
      <div className="h-[3px] bg-border/40">
        <div
          className="h-full bg-lime"
          style={{
            width: `${progress}%`,
            borderRadius: '0 9999px 9999px 0',
            boxShadow: '0 0 6px rgba(200,255,0,0.25)',
            transition: 'width 400ms cubic-bezier(0.77, 0, 0.175, 1)',
          }}
        />
      </div>

      {/* Step label row */}
      <div className="flex items-center justify-between px-4 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-lime leading-none">
          {currentStepDef?.label ?? ''}
        </p>
        <div className="flex items-center gap-2">
          {nextStepDef && (
            <p className="text-[10px] text-text-muted leading-none hidden sm:block">
              Next: {nextStepDef.label}
            </p>
          )}
          <p className="text-[10px] text-text-muted tabular-nums leading-none">
            {currentStep} / 9
          </p>
        </div>
      </div>

      {/* Step dot strip — compact, scrollable on very small screens */}
      <div className="px-4 pb-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {STEPS.map((step, i) => {
            const isDone    = step.index < currentStep
            const isCurrent = step.index === currentStep
            const isNext    = step.index === currentStep + 1

            return (
              <div key={step.index} className="flex items-center gap-1.5">
                {/* Dot + short label */}
                <div className="flex items-center gap-1">
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 text-lime shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-3 h-3 rounded-full border-2 border-lime bg-lime/20 shrink-0" />
                  ) : (
                    <div className={[
                      'w-2 h-2 rounded-full shrink-0',
                      isNext ? 'bg-text-muted/40' : 'bg-border',
                    ].join(' ')} />
                  )}
                  <span className={[
                    'text-[9px] whitespace-nowrap leading-none',
                    isDone    ? 'text-lime/60'      :
                    isCurrent ? 'text-lime font-semibold' :
                    isNext    ? 'text-text-muted'   :
                                'text-text-muted/40',
                  ].join(' ')}>
                    {step.short}
                  </span>
                </div>
                {/* Connector line between dots */}
                {i < STEPS.length - 1 && (
                  <div className={[
                    'w-3 h-px shrink-0',
                    step.index < currentStep ? 'bg-lime/30' : 'bg-border/60',
                  ].join(' ')} />
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
