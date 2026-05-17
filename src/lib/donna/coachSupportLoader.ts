// Sprint 518 — Coach Support Live Adapter V1
// Read-only loader: identifies coaches who may need director support.
// Signals: wrap-up submission gap, observation frequency, session load.
// No aggregation view required. No migrations. RLS-scoped by academy_id.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CoachSupportSignal = 'needs_support' | 'monitor' | 'on_track' | 'insufficient_data'

export interface CoachSupportSummary {
  coachId: string
  coachName: string
  sessionsLast30Days: number
  wrapUpsSubmitted: number
  wrapUpGap: number
  observationsLast30Days: number
  supportSignal: CoachSupportSignal
  reasons: string[]
}

export interface CoachSupportResult {
  coaches: CoachSupportSummary[]
  coachesNeedingSupport: number
  fieldStatus: COOFieldStatus
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadCoachSupport(
  db: DB,
  academyId: string,
): Promise<CoachSupportResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgoDate = thirtyDaysAgo.slice(0, 10)

  // 1 — active coach memberships
  const { data: memberships } = await db
    .from('academy_memberships')
    .select('profile_id, role')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .in('role', ['head_coach', 'coach'])

  const coachIds = (memberships ?? []).map(m => m.profile_id)
  if (coachIds.length === 0) {
    return { coaches: [], coachesNeedingSupport: 0, fieldStatus: 'insufficient_data' }
  }

  // 2 — coach display names
  const { data: profiles } = await db
    .from('profiles')
    .select('id, display_name')
    .in('id', coachIds)

  const nameMap = new Map<string, string>()
  for (const p of profiles ?? []) {
    nameMap.set(p.id, p.display_name ?? p.id.slice(0, 8))
  }

  // 3 — sessions per coach in last 30 days
  const { data: sessionRows } = await db
    .from('sessions')
    .select('id, coach_id')
    .eq('academy_id', academyId)
    .in('coach_id', coachIds)
    .gte('scheduled_date', thirtyDaysAgoDate)

  const sessions = sessionRows ?? []
  const sessionsByCoach = new Map<string, string[]>()
  for (const s of sessions) {
    const arr = sessionsByCoach.get(s.coach_id) ?? []
    arr.push(s.id)
    sessionsByCoach.set(s.coach_id, arr)
  }

  // 4 — wrap-ups (voice_notes with session_id in coach sessions)
  const allSessionIds = sessions.map(s => s.id)
  const wrapUpSessionIds = new Set<string>()

  if (allSessionIds.length > 0) {
    const { data: vnRows } = await db
      .from('voice_notes')
      .select('session_id')
      .eq('academy_id', academyId)
      .in('session_id', allSessionIds)

    for (const vn of vnRows ?? []) {
      if (vn.session_id) wrapUpSessionIds.add(vn.session_id)
    }
  }

  // 5 — observations per coach in last 30 days
  const { data: obsRows } = await db
    .from('coach_observations')
    .select('coach_id')
    .eq('academy_id', academyId)
    .in('coach_id', coachIds)
    .gte('created_at', thirtyDaysAgo)

  const obsByCoach = new Map<string, number>()
  for (const obs of obsRows ?? []) {
    obsByCoach.set(obs.coach_id, (obsByCoach.get(obs.coach_id) ?? 0) + 1)
  }

  // 6 — assemble per-coach summaries
  const coaches: CoachSupportSummary[] = coachIds.map(cid => {
    const coachSessions = sessionsByCoach.get(cid) ?? []
    const sessionCount = coachSessions.length
    const wrapUps = coachSessions.filter(sid => wrapUpSessionIds.has(sid)).length
    const wrapUpGap = sessionCount - wrapUps
    const observations = obsByCoach.get(cid) ?? 0

    const reasons: string[] = []

    if (sessionCount === 0) {
      return {
        coachId: cid,
        coachName: nameMap.get(cid) ?? cid.slice(0, 8),
        sessionsLast30Days: 0,
        wrapUpsSubmitted: 0,
        wrapUpGap: 0,
        observationsLast30Days: 0,
        supportSignal: 'insufficient_data' as CoachSupportSignal,
        reasons: ['No sessions in the last 30 days'],
      }
    }

    if (wrapUpGap > 3) {
      reasons.push(`${wrapUpGap} sessions without a wrap-up`)
    }
    if (observations === 0 && sessionCount > 5) {
      reasons.push('No observations recorded in the last 30 days')
    }

    const supportSignal: CoachSupportSignal =
      reasons.length > 1
        ? 'needs_support'
        : reasons.length === 1
          ? 'monitor'
          : 'on_track'

    return {
      coachId: cid,
      coachName: nameMap.get(cid) ?? cid.slice(0, 8),
      sessionsLast30Days: sessionCount,
      wrapUpsSubmitted: wrapUps,
      wrapUpGap,
      observationsLast30Days: observations,
      supportSignal,
      reasons,
    }
  })

  // Sort: needs_support first
  const SIGNAL_ORDER: Record<CoachSupportSignal, number> = {
    needs_support: 0,
    monitor: 1,
    on_track: 2,
    insufficient_data: 3,
  }
  coaches.sort((a, b) => SIGNAL_ORDER[a.supportSignal] - SIGNAL_ORDER[b.supportSignal])

  const coachesNeedingSupport = coaches.filter(
    c => c.supportSignal === 'needs_support' || c.supportSignal === 'monitor',
  ).length

  return {
    coaches,
    coachesNeedingSupport,
    fieldStatus: sessions.length > 0 ? 'partial' : 'insufficient_data',
  }
}
