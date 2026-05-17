import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui'
import {
  computeRecentAbsences,
  type AttendanceRow,
} from '@/lib/kpi/attendanceKpiEngine'
import { computeTimeInLevel } from '@/lib/kpi/developmentVelocityKpiEngine'
import { AlertTriangle, CheckCircle, Clock, BarChart2 } from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// PlayerKpiDrilldownCard — Sprint 434
//
// Self-contained server component. Fetches curriculum state + attendance
// for this player and computes KPI 13 (time in level) and KPI 3 (absences).
// Read-only. No mutations.
// ---------------------------------------------------------------------------

interface Props {
  playerId: string
  academyId: string
}

export async function PlayerKpiDrilldownCard({ playerId, academyId }: Props) {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as unknown as typeof supabase

  // Curriculum state — enrolled_at, advancement_eligible
  const { data: csRaw } = await (rawDb as any)
    .from('player_curriculum_states')
    .select('enrolled_at, advancement_eligible')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  const enrolledAt: string | null = csRaw?.enrolled_at ? String(csRaw.enrolled_at) : null
  const advancementEligible: boolean = csRaw?.advancement_eligible === true

  // 30-day attendance — scoped via sessions!inner(academy_id)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const { data: attendanceRaw } = await (rawDb as any)
    .from('session_attendance')
    .select('player_id, session_id, status, marked_at, sessions!inner(academy_id)')
    .eq('player_id', playerId)
    .eq('sessions.academy_id', academyId)
    .gte('marked_at', thirtyDaysAgoStr)

  const playerAttendance: AttendanceRow[] = ((attendanceRaw ?? []) as Array<Record<string, unknown>>).map(a => ({
    player_id: String(a.player_id ?? ''),
    session_id: String(a.session_id ?? ''),
    status: String(a.status ?? ''),
    marked_at: String(a.marked_at ?? ''),
  }))

  // Compute KPI signals
  const timeInLevelResult = computeTimeInLevel(enrolledAt)
  const absenceResult = computeRecentAbsences(playerId, playerAttendance, 30)

  const daysInLevel = timeInLevelResult.value
  const absences = absenceResult.value ?? 0
  const absenceFlag = absences >= 2
  const levelAlert = daysInLevel !== null && daysInLevel > 180
  const levelWarn = daysInLevel !== null && daysInLevel > 120 && daysInLevel <= 180

  return (
    <Card>
      <CardHeader>
        <span className="text-sm font-semibold text-text-primary">KPI Signals</span>
        <Link
          href="/director/kpi"
          className="ml-auto inline-flex items-center gap-1 text-xs text-text-muted hover:text-lime transition-colors"
        >
          <BarChart2 className="w-3 h-3" />
          All Players
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Time in Level */}
          <div>
            <p className="label-xs mb-1.5">
              Time in Level
              <span className="ml-1 text-lime/70 normal-case tracking-normal">live</span>
            </p>
            {daysInLevel !== null ? (
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono text-xl font-semibold ${
                    levelAlert ? 'text-status-red' : levelWarn ? 'text-status-orange' : 'text-text-primary'
                  }`}
                >
                  {daysInLevel}d
                </span>
                {levelAlert && <AlertTriangle className="w-4 h-4 text-status-red" />}
              </div>
            ) : (
              <span className="text-text-muted text-sm">Not enrolled</span>
            )}
            {levelAlert && (
              <p className="text-xs text-status-red mt-1">Stalled — 180+ days in level</p>
            )}
            {levelWarn && !levelAlert && (
              <p className="text-xs text-status-orange mt-1">Watch — 120+ days in level</p>
            )}
          </div>

          {/* Absences 30d */}
          <div>
            <p className="label-xs mb-1.5">
              Absences 30d
              <span className="ml-1 text-text-muted/60 normal-case tracking-normal">demo</span>
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono text-xl font-semibold ${
                  absenceFlag ? 'text-status-orange' : absences > 0 ? 'text-text-primary' : 'text-text-secondary'
                }`}
              >
                {absences}
              </span>
              {absenceFlag && <AlertTriangle className="w-4 h-4 text-status-orange" />}
            </div>
            {absenceFlag && (
              <p className="text-xs text-status-orange mt-1">Meets 2+ absence threshold</p>
            )}
          </div>

          {/* Advancement */}
          <div>
            <p className="label-xs mb-1.5">Advancement</p>
            {advancementEligible ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-lime" />
                  <span className="text-sm font-semibold text-lime">Ready</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Eligible to advance</p>
              </div>
            ) : enrolledAt ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">In progress</span>
                </div>
                <p className="text-xs text-text-muted mt-1">Not yet eligible</p>
              </div>
            ) : (
              <span className="text-text-muted text-sm">No curriculum</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
