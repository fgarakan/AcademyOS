import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui'
import {
  computeRecentAbsences,
  type AttendanceRow,
} from '@/lib/kpi/attendanceKpiEngine'
import { computeTimeInLevel } from '@/lib/kpi/developmentVelocityKpiEngine'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

// ---------------------------------------------------------------------------
// Raw query shape types
// ---------------------------------------------------------------------------

interface PlayerRow {
  id: string
  full_name: string | null
  is_active: boolean | null
}

interface CurriculumStateRow {
  player_id: string
  advancement_eligible: boolean | null
  enrolled_at: string | null
}

interface AttendanceJoinRow {
  player_id: string
  session_id: string
  status: string
  marked_at: string
}

// ---------------------------------------------------------------------------
// Director KPI Dashboard — Sprint 432
// Server component. Read-only. No mutations.
// ---------------------------------------------------------------------------

export default async function KpiDashboardPage() {
  const supabase = await getSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = (profile as { academy_id: string | null } | null)?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="p-6">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // Fetch all active players
  const { data: playersRaw } = await supabase
    .from('players')
    .select('id, full_name, is_active')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  const players: PlayerRow[] = ((playersRaw ?? []) as unknown[]).map((p: unknown) => {
    const r = p as Record<string, unknown>
    return {
      id: String(r.id ?? ''),
      full_name: r.full_name ? String(r.full_name) : null,
      is_active: r.is_active === true,
    }
  })

  const playerIds = players.map(p => p.id)

  // Fetch curriculum states for all active players (advancement_eligible, enrolled_at)
  const { data: curriculumStatesRaw } = await supabase
    .from('player_curriculum_states')
    .select('player_id, advancement_eligible, enrolled_at')
    .eq('academy_id', academyId)
    .in('player_id', playerIds.length > 0 ? playerIds : ['__none__'])

  const curriculumStateByPlayer = new Map<string, CurriculumStateRow>()
  for (const row of ((curriculumStatesRaw ?? []) as unknown[]).map((r: unknown) => {
    const s = r as Record<string, unknown>
    return {
      player_id: String(s.player_id ?? ''),
      advancement_eligible: s.advancement_eligible === true ? true : s.advancement_eligible === false ? false : null,
      enrolled_at: s.enrolled_at ? String(s.enrolled_at) : null,
    }
  })) {
    curriculumStateByPlayer.set(row.player_id, row)
  }

  // Fetch 30-day attendance — academy_id scoped via sessions inner join
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const { data: attendanceRaw } = await supabase
    .from('session_attendance')
    .select('player_id, session_id, status, marked_at, sessions!inner(academy_id)')
    .eq('sessions.academy_id', academyId)
    .gte('marked_at', thirtyDaysAgoStr)

  // Build per-player attendance map
  const attendanceByPlayer = new Map<string, AttendanceRow[]>()
  for (const row of ((attendanceRaw ?? []) as unknown[]).map((r: unknown) => {
    const a = r as Record<string, unknown>
    return {
      player_id: String(a.player_id ?? ''),
      session_id: String(a.session_id ?? ''),
      status: String(a.status ?? ''),
      marked_at: String(a.marked_at ?? ''),
    } satisfies AttendanceJoinRow
  })) {
    if (!playerIds.includes(row.player_id)) continue
    const existing = attendanceByPlayer.get(row.player_id) ?? []
    existing.push({
      player_id: row.player_id,
      session_id: row.session_id,
      status: row.status,
      marked_at: row.marked_at,
    })
    attendanceByPlayer.set(row.player_id, existing)
  }

  // Compute per-player KPI signals
  const playerKpis = players.map(player => {
    const cs = curriculumStateByPlayer.get(player.id)
    const playerAttendance = attendanceByPlayer.get(player.id) ?? []
    const absenceResult = computeRecentAbsences(player.id, playerAttendance, 30)
    const timeInLevelResult = computeTimeInLevel(cs?.enrolled_at ?? null)

    return {
      player,
      absences: absenceResult.value ?? 0,
      absenceFlag: (absenceResult.value ?? 0) >= 2,
      daysInLevel: timeInLevelResult.value,
      advancementEligible: cs?.advancement_eligible ?? false,
    }
  })

  const atRiskCount = playerKpis.filter(
    p => p.absenceFlag || (p.daysInLevel !== null && p.daysInLevel > 180),
  ).length

  return (
    <div className="p-6 animate-fade-in space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <p className="page-eyebrow">Academy Health</p>
        <h1 className="page-title">KPI Dashboard</h1>
        <p className="page-subtitle">
          Per-player KPI signals — absences 30d, time in level, and advancement readiness.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="label-xs mb-1">Active Players</p>
            <p className="font-mono text-2xl text-lime font-semibold">{players.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="label-xs mb-1">Advancement Ready</p>
            <p className="font-mono text-2xl text-status-green font-semibold">
              {playerKpis.filter(p => p.advancementEligible).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="label-xs mb-1">Attention Signals</p>
            <p
              className={`font-mono text-2xl font-semibold ${
                atRiskCount > 0 ? 'text-status-orange' : 'text-text-secondary'
              }`}
            >
              {atRiskCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Player KPI table */}
      <Card>
        <CardHeader>
          <span className="text-sm font-semibold text-text-primary">Player KPI Signals</span>
          <span className="label-xs ml-auto text-text-muted">30-day window</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest text-text-muted font-semibold w-1/3">
                    Player
                  </th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest text-text-muted font-semibold">
                    Time in Level{' '}
                    <span className="text-lime/60 normal-case tracking-normal font-normal">live</span>
                  </th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest text-text-muted font-semibold">
                    Absences 30d{' '}
                    <span className="text-text-muted/60 normal-case tracking-normal font-normal">demo</span>
                  </th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-widest text-text-muted font-semibold">
                    Advancement
                  </th>
                </tr>
              </thead>
              <tbody>
                {playerKpis.map(({ player, absences, absenceFlag, daysInLevel, advancementEligible }) => {
                  const levelAlert = daysInLevel !== null && daysInLevel > 180
                  const levelWarn = daysInLevel !== null && daysInLevel > 120 && daysInLevel <= 180
                  return (
                    <tr
                      key={player.id}
                      className="border-b border-border last:border-0 hover:bg-surface-raised transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/director/players/${player.id}`}
                          className="text-text-primary hover:text-lime font-medium transition-colors"
                        >
                          {player.full_name ?? 'Unnamed Player'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {daysInLevel !== null ? (
                          <span
                            className={`font-mono text-sm ${
                              levelAlert
                                ? 'text-status-red'
                                : levelWarn
                                ? 'text-status-orange'
                                : 'text-text-secondary'
                            }`}
                          >
                            {daysInLevel}d
                            {levelAlert && <AlertTriangle className="inline w-3 h-3 ml-1 mb-0.5" />}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-sm ${
                            absenceFlag
                              ? 'text-status-orange'
                              : absences > 0
                              ? 'text-text-secondary'
                              : 'text-text-muted'
                          }`}
                        >
                          {absences}
                          {absenceFlag && <AlertTriangle className="inline w-3 h-3 ml-1 mb-0.5" />}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {advancementEligible ? (
                          <span className="inline-flex items-center gap-1 text-lime text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-text-muted text-xs">
                            <Clock className="w-3 h-3" />
                            In progress
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {players.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted text-sm">
                      No active players found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Data quality note */}
      <p className="text-xs text-text-muted">
        KPI status: Time in Level is live (direct from enrollment date). Absences are demo — counts
        explicit absence markings only; sessions not marked are excluded. Advancement readiness from
        curriculum state.
      </p>
    </div>
  )
}
