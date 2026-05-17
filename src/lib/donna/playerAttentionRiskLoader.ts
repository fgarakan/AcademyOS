// Sprint 516 — Player Attention Risk Live Adapter V1
// Read-only loader: derives per-player risk from concern observations + attendance gaps.
// No aggregation view required. No migrations. RLS-scoped by academy_id.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttentionRiskLevel = 'high' | 'medium' | 'low'

export interface PlayerAttentionRiskFactor {
  type: 'concern_observation' | 'attendance_gap'
  detail: string
}

export interface PlayerAttentionRisk {
  playerId: string
  playerName: string
  riskLevel: AttentionRiskLevel
  factors: PlayerAttentionRiskFactor[]
}

export interface PlayerAttentionRiskResult {
  players: PlayerAttentionRisk[]
  totalAtRisk: number
  fieldStatus: COOFieldStatus
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadPlayerAttentionRisk(
  db: DB,
  academyId: string,
): Promise<PlayerAttentionRiskResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  // Per-player concern counts (last 30 days)
  const concernsByPlayer = new Map<string, number>()

  const { data: concernObs } = await db
    .from('coach_observations')
    .select('player_id')
    .eq('academy_id', academyId)
    .eq('observation_type', 'concern')
    .gte('created_at', thirtyDaysAgo)

  for (const obs of concernObs ?? []) {
    concernsByPlayer.set(obs.player_id, (concernsByPlayer.get(obs.player_id) ?? 0) + 1)
  }

  // Sessions in the last 7 days
  const { data: recentSessions } = await db
    .from('sessions')
    .select('id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', sevenDaysAgoDate)

  const recentSessionIds = (recentSessions ?? []).map(s => s.id)

  // Absences: session_attendance where status != 'present' in recent sessions
  const absencesByPlayer = new Map<string, number>()

  if (recentSessionIds.length > 0) {
    const { data: absenceRows } = await db
      .from('session_attendance')
      .select('player_id')
      .in('session_id', recentSessionIds)
      .neq('status', 'present')

    for (const row of absenceRows ?? []) {
      absencesByPlayer.set(row.player_id, (absencesByPlayer.get(row.player_id) ?? 0) + 1)
    }
  }

  // Union of all flagged player IDs
  const allFlagged = Array.from(concernsByPlayer.keys()).concat(Array.from(absencesByPlayer.keys()))
  const flaggedPlayerIds = Array.from(new Set(allFlagged))

  if (flaggedPlayerIds.length === 0) {
    return { players: [], totalAtRisk: 0, fieldStatus: 'insufficient_data' }
  }

  // Player names
  const { data: playerRows } = await db
    .from('players')
    .select('id, first_name, last_name')
    .in('id', flaggedPlayerIds)

  const nameMap = new Map<string, string>()
  for (const p of playerRows ?? []) {
    nameMap.set(p.id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Player')
  }

  // Build risk entries
  const players: PlayerAttentionRisk[] = flaggedPlayerIds.map(pid => {
    const factors: PlayerAttentionRiskFactor[] = []
    const concerns = concernsByPlayer.get(pid) ?? 0
    const absences = absencesByPlayer.get(pid) ?? 0

    if (concerns > 0) {
      factors.push({
        type: 'concern_observation',
        detail: `${concerns} concern observation${concerns !== 1 ? 's' : ''} in the last 30 days`,
      })
    }
    if (absences > 0) {
      factors.push({
        type: 'attendance_gap',
        detail: `${absences} absence${absences !== 1 ? 's' : ''} in the last 7 days`,
      })
    }

    const riskLevel: AttentionRiskLevel =
      concerns > 2 || absences > 3 ? 'high' : concerns > 0 || absences > 1 ? 'medium' : 'low'

    return {
      playerId: pid,
      playerName: nameMap.get(pid) ?? 'Player',
      riskLevel,
      factors,
    }
  })

  // Sort: high → medium → low
  const RISK_ORDER: Record<AttentionRiskLevel, number> = { high: 0, medium: 1, low: 2 }
  players.sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel])

  return {
    players,
    totalAtRisk: players.length,
    fieldStatus: 'partial',
  }
}
