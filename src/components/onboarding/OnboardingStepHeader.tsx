'use client'

interface Props {
  stepNumber: number
  totalSteps: number
  eyebrow?: string
  title: string
  subtitle?: string
}

export function OnboardingStepHeader({ stepNumber, totalSteps, eyebrow, title, subtitle }: Props) {
  return (
    <div className="mb-8">
      <p className="text-[10px] font-bold uppercase tracking-widest text-lime mb-2">
        {eyebrow ?? `Step ${stepNumber} of ${totalSteps}`}
      </p>
      <h2 className="text-2xl font-bold text-text-primary leading-tight mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-text-secondary leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}
