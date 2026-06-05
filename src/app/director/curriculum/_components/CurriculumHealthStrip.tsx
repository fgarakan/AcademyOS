import type { CurriculumCoverageReport } from '@/lib/curriculum/coverageModel'
import type { DimensionSummary } from './CurriculumHealthPanel'

interface Props {
  report: CurriculumCoverageReport
  dimensionSummary: DimensionSummary
}

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 55) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-status-green'
    case 'B': return 'text-lime'
    case 'C': return 'text-yellow-400'
    case 'D': return 'text-status-orange'
    default:  return 'text-status-red'
  }
}

export function CurriculumHealthStrip({ report, dimensionSummary }: Props) {
  const grade = scoreToGrade(report.overallScoreOutOf100)

  const slots = [
    {
      label: 'Health Score',
      value: grade,
      note: `${report.overallScoreOutOf100}%`,
      colorClass: gradeColor(grade),
    },
    {
      label: 'Gates',
      value: String(dimensionSummary.gates),
      note: 'advancement gates',
      colorClass: dimensionSummary.gates > 0 ? 'text-text-primary' : 'text-text-muted',
    },
    {
      label: 'Drills',
      value: String(dimensionSummary.drills),
      note: 'drill templates',
      colorClass: dimensionSummary.drills > 0 ? 'text-text-primary' : 'text-text-muted',
    },
    {
      label: 'Coach Cues',
      value: String(dimensionSummary.coachCues),
      note: 'language guides',
      colorClass: dimensionSummary.coachCues > 0 ? 'text-text-primary' : 'text-text-muted',
    },
  ]

  return (
    <div
      className="grid grid-cols-4 gap-2"
      data-donna-focus-id="curriculum-health-strip"
    >
      {slots.map(slot => (
        <div key={slot.label} className="rounded-xl border border-border bg-surface px-3 py-2.5 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">{slot.label}</p>
          <p className={`text-[22px] font-mono font-bold leading-none ${slot.colorClass}`}>{slot.value}</p>
          <p className="text-[10px] text-text-muted">{slot.note}</p>
        </div>
      ))}
    </div>
  )
}
