import { Dumbbell, Zap, Clock, Info } from 'lucide-react'

interface FitnessGuidance {
  level_id: string
  fitness_phase?: string | null
  primary_energy_system?: string | null
  weekly_fitness_minutes?: number | null
  strength_focus?: string | null
  speed_agility_focus?: string | null
  coaching_notes?: string | null
}

interface Props {
  guidance: FitnessGuidance | null
  levelName: string
}

export function FitnessLayerPanel({ guidance, levelName }: Props) {
  if (!guidance) {
    return (
      <div className="rounded-2xl border border-border border-dashed p-6 text-center space-y-2">
        <Dumbbell className="w-5 h-5 text-text-muted mx-auto" />
        <p className="text-[12px] text-text-secondary">No fitness guidance for {levelName}.</p>
        <p className="text-[11px] text-text-muted">Ask DONNA to draft fitness content or set it via the level builder.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Dumbbell className="w-4 h-4 text-status-green shrink-0" />
        <p className="text-[12px] font-semibold text-text-primary">Fitness guidance — {levelName}</p>
      </div>

      <div className="divide-y divide-border">
        {guidance.fitness_phase && (
          <div className="flex items-start gap-3 px-4 py-3">
            <Zap className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Phase</p>
              <p className="text-[12px] text-text-primary">{guidance.fitness_phase}</p>
            </div>
          </div>
        )}

        {guidance.primary_energy_system && (
          <div className="flex items-start gap-3 px-4 py-3">
            <Zap className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Primary energy system</p>
              <p className="text-[12px] text-text-primary">{guidance.primary_energy_system}</p>
            </div>
          </div>
        )}

        {guidance.weekly_fitness_minutes != null && (
          <div className="flex items-start gap-3 px-4 py-3">
            <Clock className="w-3.5 h-3.5 text-status-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Weekly target</p>
              <p className="text-[12px] text-text-primary">
                <span className="font-mono text-lime">{guidance.weekly_fitness_minutes}</span> minutes
              </p>
            </div>
          </div>
        )}

        {guidance.strength_focus && (
          <div className="flex items-start gap-3 px-4 py-3">
            <Dumbbell className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Strength focus</p>
              <p className="text-[12px] text-text-secondary">{guidance.strength_focus}</p>
            </div>
          </div>
        )}

        {guidance.speed_agility_focus && (
          <div className="flex items-start gap-3 px-4 py-3">
            <Dumbbell className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Speed & agility focus</p>
              <p className="text-[12px] text-text-secondary">{guidance.speed_agility_focus}</p>
            </div>
          </div>
        )}

        {guidance.coaching_notes && (
          <div className="flex items-start gap-3 px-4 py-3">
            <Info className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Coaching notes</p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{guidance.coaching_notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
