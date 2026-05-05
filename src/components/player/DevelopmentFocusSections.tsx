import { Target, CheckCircle2, Zap, ArrowRight } from 'lucide-react'

interface Props {
  doingWell: string[]
  workingOn: string[]
  currentFocus: string | null
  nextStep: string | null
}

function SectionRow({
  icon: Icon,
  label,
  color,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{label}</p>
        {children}
      </div>
    </div>
  )
}

export function DevelopmentFocusSections({ doingWell, workingOn, currentFocus, nextStep }: Props) {
  const hasContent = doingWell.length > 0 || workingOn.length > 0 || currentFocus || nextStep

  if (!hasContent) {
    return (
      <p className="text-xs text-text-muted italic">
        No development focus set yet. Add observations or a development summary to populate this section.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Doing Well */}
      <SectionRow icon={CheckCircle2} label="Doing Well" color="bg-status-green/10 text-status-green">
        {doingWell.length > 0 ? (
          <ul className="space-y-1">
            {doingWell.slice(0, 3).map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-status-green shrink-0 mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-text-muted">Not added yet.</p>
        )}
      </SectionRow>

      {/* Working On */}
      <SectionRow icon={Target} label="Working On" color="bg-status-blue/10 text-status-blue">
        {workingOn.length > 0 ? (
          <ul className="space-y-1">
            {workingOn.slice(0, 3).map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-status-blue shrink-0 mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-text-muted">Not added yet.</p>
        )}
      </SectionRow>

      {/* Current Focus */}
      <SectionRow icon={Zap} label="Current Focus" color="bg-lime/10 text-lime">
        {currentFocus ? (
          <p className="text-sm text-text-secondary leading-relaxed">{currentFocus}</p>
        ) : (
          <p className="text-xs text-text-muted">Not added yet.</p>
        )}
      </SectionRow>

      {/* Next Step */}
      <SectionRow icon={ArrowRight} label="Next Step" color="bg-status-orange/10 text-status-orange">
        {nextStep ? (
          <p className="text-sm text-text-secondary leading-relaxed">{nextStep}</p>
        ) : (
          <p className="text-xs text-text-muted">Not added yet.</p>
        )}
      </SectionRow>
    </div>
  )
}
