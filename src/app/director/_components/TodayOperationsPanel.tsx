import Link from 'next/link'
import { Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface SessionRow {
  id: string
  name: string | null
  scheduled_date: string
  status: string
  coach_id: string | null
  group_id: string | null
}

interface OverCapacityGroup {
  id: string
  name: string
  memberCount: number
  maxPlayers: number | null
}

interface Props {
  todaySessions: SessionRow[]
  expectedAttendance: number
  coachCoverageGaps: number
  overCapacityGroups: OverCapacityGroup[]
  assessmentsDue: number
  parentUpdatesPending: number
}

function StatCell({
  label,
  value,
  warn = false,
  ok = false,
}: {
  label: string
  value: string | number
  warn?: boolean
  ok?: boolean
}) {
  const valueClass = warn
    ? 'text-status-orange font-mono font-bold text-[20px]'
    : ok
      ? 'text-status-green font-mono font-bold text-[20px]'
      : 'text-text-primary font-mono font-bold text-[20px]'

  return (
    <div className="space-y-0.5">
      <p className={valueClass}>{value}</p>
      <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
    </div>
  )
}

function CoverageChip({ gaps }: { gaps: number }) {
  if (gaps === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-green">
        <CheckCircle2 className="w-3 h-3" />
        All covered
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-orange">
      <AlertTriangle className="w-3 h-3" />
      {gaps} session{gaps !== 1 ? 's' : ''} unassigned
    </span>
  )
}

export function TodayOperationsPanel({
  todaySessions,
  expectedAttendance,
  coachCoverageGaps,
  overCapacityGroups,
  assessmentsDue,
  parentUpdatesPending,
}: Props) {
  const sessionCount = todaySessions.length

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="label-xs">Today&apos;s Operations</p>
        <Link
          href="/director/sessions"
          className="text-[11px] text-text-muted hover:text-lime transition-colors font-medium"
        >
          View schedule →
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-5 py-4 space-y-4">

        {sessionCount === 0 ? (
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-text-muted shrink-0" />
            <p className="text-[12px] text-text-secondary">No sessions scheduled today.</p>
          </div>
        ) : (
          <>
            {/* Primary stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <StatCell label="Sessions today" value={sessionCount} />
              <StatCell
                label="Expected players"
                value={expectedAttendance > 0 ? expectedAttendance : '—'}
              />
              <StatCell
                label="Assessments due"
                value={assessmentsDue}
                warn={assessmentsDue > 0}
                ok={assessmentsDue === 0}
              />
              <StatCell
                label="Parent updates"
                value={parentUpdatesPending}
                warn={parentUpdatesPending > 0}
                ok={parentUpdatesPending === 0}
              />
            </div>

            {/* Coverage + ratio row */}
            <div
              className="flex items-center gap-5 pt-3 flex-wrap"
              style={{ borderTop: '1px solid var(--color-border, #222222)' }}
            >
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-text-muted">Coach coverage</p>
                <CoverageChip gaps={coachCoverageGaps} />
              </div>

              {overCapacityGroups.length > 0 ? (
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">Ratio warning</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-orange">
                    <AlertTriangle className="w-3 h-3" />
                    {overCapacityGroups[0].name} over capacity ({overCapacityGroups[0].memberCount}/{overCapacityGroups[0].maxPlayers ?? '?'})
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">Ratio</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-green">
                    <CheckCircle2 className="w-3 h-3" />
                    All groups within capacity
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
