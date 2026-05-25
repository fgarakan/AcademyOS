import Link from 'next/link'
import { AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import type { CurriculumCoverageReport, CoverageStatus } from '@/lib/curriculum/coverageModel'
import { getCoverageStatusLabel } from '@/lib/curriculum/coverageModel'
import { CurriculumDimensionBreakdown } from './CurriculumDimensionBreakdown'

export interface DimensionSummary {
  gates: number
  drills: number
  coachCues: number
  competitionTrack: number
  fitnessGuidance: number
  volumeGuidance: number
}

interface Props {
  report: CurriculumCoverageReport
  dimensionSummary?: DimensionSummary
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 55) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

function gradeTextClass(grade: string): string {
  switch (grade) {
    case 'A': return 'text-status-green'
    case 'B': return 'text-lime'
    case 'C': return 'text-yellow-400'
    case 'D': return 'text-status-orange'
    default:  return 'text-status-red'
  }
}

function statusTextClass(status: CoverageStatus): string {
  switch (status) {
    case 'complete': return 'text-status-green'
    case 'partial':  return 'text-yellow-400'
    case 'minimal':  return 'text-status-orange'
    default:         return 'text-status-red'
  }
}

function statusBarClass(status: CoverageStatus): string {
  switch (status) {
    case 'complete': return 'bg-status-green'
    case 'partial':  return 'bg-yellow-400'
    case 'minimal':  return 'bg-status-orange'
    default:         return 'bg-status-red'
  }
}

export function CurriculumHealthPanel({ report, dimensionSummary }: Props) {
  const overallGrade = scoreToGrade(report.overallScoreOutOf100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="label-xs">Curriculum Content Coverage</p>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed max-w-md">
              Score based on 3 available dimensions — gates, drills, coach cues. Skills, assessment,
              missions, badges, and parent guidance are not yet tracked.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`font-mono font-bold text-4xl leading-none ${gradeTextClass(overallGrade)}`}>
              {overallGrade}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mt-1 font-mono">
              {report.overallScoreOutOf100}<span className="text-text-muted/50">/100</span>
            </p>
            <p className="text-[10px] text-text-muted/50 mt-0.5">gates · drills · cues</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-5">

        {/* ── Partial-score disclaimer ─────────────────────────────── */}
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
          <Info className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-muted leading-relaxed">
            <span className="text-text-secondary font-medium">Score normalised to available dimensions.</span>{' '}
            Gates, drills, and coach cues are tracked and scored. Skills, assessment criteria,
            missions, badges, and parent guidance are not yet connected — they are excluded from
            scoring so levels are not unfairly penalised. A 100 score means all 3 tracked
            dimensions are fully populated.
          </p>
        </div>

        {/* ── Dimension breakdown — Sprint 554 ────────────────────── */}
        {dimensionSummary && (
          <CurriculumDimensionBreakdown
            tracked={[
              { label: 'Exit Gates',        count: dimensionSummary.gates },
              { label: 'Drills',            count: dimensionSummary.drills },
              { label: 'Coach Language',    count: dimensionSummary.coachCues },
              { label: 'Competition Track', count: dimensionSummary.competitionTrack },
              { label: 'Fitness Guidance',  count: dimensionSummary.fitnessGuidance },
              { label: 'Volume Guidance',   count: dimensionSummary.volumeGuidance },
            ]}
            notTracked={[
              'Skills',
              'Assessment Criteria',
              'Missions',
              'Badges',
              'Parent Guidance',
              'Learning Modules',
            ]}
          />
        )}

        {/* ── Per-level breakdown ──────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">Per Level</p>
          {report.levels.map(level => {
            const grade = scoreToGrade(level.scoreOutOf100)
            const barPct = Math.max(2, level.scoreOutOf100)
            const criticalGaps = level.gaps.filter(g => g.severity === 'critical')
            return (
              <div key={level.levelId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-medium text-text-primary truncate min-w-0">
                    {level.levelName}
                  </p>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-[10px] font-medium ${statusTextClass(level.status)}`}>
                      {getCoverageStatusLabel(level.status)}
                    </span>
                    <span className={`font-mono text-[13px] font-bold ${gradeTextClass(grade)}`}>
                      {grade}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${statusBarClass(level.status)}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>

                {/* Critical gap chips */}
                {criticalGaps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {criticalGaps.slice(0, 2).map((gap, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] text-status-orange border border-status-orange/25 bg-status-orange/5 px-1.5 py-0.5 rounded"
                      >
                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                        {gap.area}
                      </span>
                    ))}
                    {criticalGaps.length > 2 && (
                      <span className="text-[10px] text-text-muted self-center">
                        +{criticalGaps.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Top critical gaps summary ────────────────────────────── */}
        {report.criticalGapCount > 0 && (
          <div className="rounded-xl border border-status-orange/25 bg-status-orange/5 px-4 py-3 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-status-orange font-semibold">
              {report.criticalGapCount} critical gap{report.criticalGapCount !== 1 ? 's' : ''} to address
            </p>
            <div className="space-y-2">
              {report.topGaps.slice(0, 3).map((gap, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="text-[12px] font-medium text-text-primary">{gap.area}</p>
                  <p className="text-[11px] text-text-muted">{gap.fixHint}</p>
                </div>
              ))}
            </div>
            <Link
              href="/director/curriculum/builder"
              className="inline-flex text-[11px] text-lime font-medium hover:opacity-80 transition-opacity pt-0.5"
            >
              Open Curriculum Builder →
            </Link>
          </div>
        )}

        {/* ── Summary counts ───────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border">
          {[
            { label: 'Complete', value: report.completeLevels, colorClass: 'text-status-green' },
            { label: 'Partial',  value: report.partialLevels,  colorClass: 'text-yellow-400' },
            { label: 'Minimal',  value: report.minimalLevels,  colorClass: 'text-status-orange' },
            { label: 'Empty',    value: report.emptyLevels,    colorClass: 'text-status-red' },
          ].map(({ label, value, colorClass }) => (
            <div key={label} className="text-center">
              <p className={`font-mono font-bold text-xl leading-none ${colorClass}`}>
                {value}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  )
}
