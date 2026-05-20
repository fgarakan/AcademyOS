'use client'

const STEP_PROGRESS: Record<number, number> = {
  0: 0,
  1: 14,
  2: 28,
  3: 42,
  4: 56,
  5: 70,
  6: 84,
  7: 96,
  8: 96,
  9: 100,
}

const STEP_LABELS = [
  'Welcome',
  'Academy Basics',
  'Coaching Philosophy',
  'Coach Communication',
  'Session Design',
  'Player Development',
  'Parent Communication',
  'DNA Summary',
  'DONNA Adjustment',
  'Final Activation',
]

interface Props {
  currentStep: number
}

export function OnboardingProgressRail({ currentStep }: Props) {
  if (currentStep === 0) return null
  const progress = STEP_PROGRESS[currentStep] ?? 0
  const label = STEP_LABELS[currentStep] ?? ''
  return (
    <div className="flex-shrink-0">
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
      <div className="flex items-center justify-between px-6 py-2 border-b border-border">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-lime">
          {label}
        </p>
        <p className="text-[10px] text-text-muted tabular-nums">
          Step {currentStep} of 9
        </p>
      </div>
    </div>
  )
}
