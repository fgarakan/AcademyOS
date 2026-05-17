'use client'

import { Sparkles, AlertCircle, TrendingUp, BookOpen } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  level: CurriculumLevel
  drillCount: number
  gateCount: number
}

const OBSERVATIONS = [
  {
    icon: BookOpen,
    color: 'text-status-blue',
    label: 'Drill library',
    getValue: (drillCount: number) =>
      drillCount === 0
        ? 'No drills defined yet — this level has no structured drill content.'
        : drillCount < 3
        ? `Only ${drillCount} drill${drillCount !== 1 ? 's' : ''} defined. Consider adding more variety.`
        : `${drillCount} drills on file. Coverage looks sufficient for planning.`,
  },
  {
    icon: TrendingUp,
    color: 'text-status-orange',
    label: 'Assessment gates',
    getValue: (_: number, gateCount: number) =>
      gateCount === 0
        ? 'No assessment gates defined. Players cannot be evaluated for promotion without gates.'
        : `${gateCount} gate${gateCount !== 1 ? 's' : ''} defined. Review gate criteria for clarity.`,
  },
]

export function DonnaCurriculumContextPanel({ level, drillCount, gateCount }: Props) {
  return (
    <div className="rounded-2xl border border-lime/15 bg-lime/[0.02] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-lime shrink-0" />
        <p className="text-[12px] font-semibold text-text-primary">
          DONNA — What I know about {level.display_name}
        </p>
      </div>

      <div className="space-y-3">
        {OBSERVATIONS.map(({ icon: Icon, color, label, getValue }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
            <div>
              <p className="text-[11px] font-semibold text-text-secondary">{label}</p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {getValue(drillCount, gateCount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-status-orange/20 bg-status-orange/[0.04] px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          DONNA&apos;s observations come from your curriculum database. She cannot see player session history
          or attendance here — those signals live in the coaching layer.
        </p>
      </div>

      <p className="text-[10px] text-text-muted">
        To ask DONNA to draft content for this level, use the buttons in the Drills, Gates, or Fitness tabs above.
      </p>
    </div>
  )
}
