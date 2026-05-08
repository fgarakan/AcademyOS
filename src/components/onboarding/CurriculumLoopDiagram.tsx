import { ArrowRight } from 'lucide-react'

interface Step {
  num: number
  label: string
  sublabel: string
  accent: boolean
}

const STEPS: Step[] = [
  { num: 1, label: 'Global Curriculum',  sublabel: 'Levels, gates, drills', accent: true },
  { num: 2, label: 'Class Template',     sublabel: 'Assign level + lesson plan', accent: false },
  { num: 3, label: 'Session Created',    sublabel: 'Coach receives plan', accent: false },
  { num: 4, label: 'Coach Runs It',      sublabel: 'On court with players', accent: false },
  { num: 5, label: 'Wrap-Up Submitted',  sublabel: 'Coach notes sent to director', accent: false },
  { num: 6, label: 'Director Reviews',   sublabel: 'Approve, adjust, repeat', accent: true },
]

interface Props {
  className?: string
}

export function CurriculumLoopDiagram({ className }: Props) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <p className="label-xs mb-3">How curriculum flows to court</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center gap-1.5">
            <div className={`flex flex-col items-center px-3 py-2.5 rounded-xl border min-w-[90px] transition-colors ${
              step.accent
                ? 'bg-lime/5 border-lime/30'
                : 'bg-surface-raised border-border'
            }`}>
              <span className={`text-[9px] font-mono font-bold mb-1 ${step.accent ? 'text-lime' : 'text-text-muted'}`}>
                {step.num}
              </span>
              <p className={`text-[11px] font-semibold leading-tight text-center ${step.accent ? 'text-lime' : 'text-text-primary'}`}>
                {step.label}
              </p>
              <p className="text-[9px] text-text-muted text-center leading-tight mt-0.5">
                {step.sublabel}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-text-muted pt-1">
        The loop closes when directors review coach wrap-ups and use the insights to update the next session.
      </p>
    </div>
  )
}
