import { Lock, BookOpen, Target, Shield } from 'lucide-react'

interface Drill { id: string; name: string; domain: string; objective?: string | null }
interface Gate { id: string; criterion: string; domain: string; threshold: string }

interface Props {
  levelName: string
  stage: string
  drills: Drill[]
  gates: Gate[]
}

export function CurriculumCoachReadOnlyView({ levelName, stage, drills, gates }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
        <Lock className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <p className="text-[11px] text-text-muted">
          You are viewing the curriculum for <span className="text-text-secondary font-semibold">{levelName}</span>.
          To suggest a change, use the session wrap-up note — it goes to the director.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-status-blue shrink-0" />
          <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted">
            Drills — {drills.length}
          </p>
        </div>
        {drills.length === 0 ? (
          <p className="text-[12px] text-text-muted px-2">No drills defined for this level.</p>
        ) : (
          <div className="space-y-1.5">
            {drills.map(d => (
              <div key={d.id} className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                <p className="text-[12px] font-semibold text-text-primary">{d.name}</p>
                <p className="text-[10px] text-text-muted capitalize">{d.domain}</p>
                {d.objective && <p className="text-[11px] text-text-secondary mt-1">{d.objective}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-status-orange shrink-0" />
          <p className="text-[11px] uppercase tracking-widest font-semibold text-text-muted">
            Assessment gates — {gates.length}
          </p>
        </div>
        {gates.length === 0 ? (
          <p className="text-[12px] text-text-muted px-2">No gates defined for this level.</p>
        ) : (
          <div className="space-y-1.5">
            {gates.map(g => (
              <div key={g.id} className="rounded-xl border border-border bg-surface-raised px-4 py-3">
                <p className="text-[12px] font-semibold text-text-primary">{g.criterion}</p>
                <p className="text-[11px] text-text-secondary mt-0.5">{g.threshold}</p>
                <p className="text-[10px] text-text-muted capitalize mt-0.5">{g.domain}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
