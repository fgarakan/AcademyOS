// Sprint 532 — Director Review Surface Wrap-Up V1
// Read-only loader: enriches the director review queue with wrap-up coverage context.
// Returns session-level wrap-up status for the current week.
// No writes. No migrations. RLS-scoped by academy_id.

import type { DB } from '@/lib/types/db'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WrapUpSessionStatus {
  sessionId: string
  sessionName: string
  scheduledDate: string
  coachId: string
  wrapUpSubmitted: boolean
  wrapUpStatus: string | null
}

export interface WrapUpReviewSurfaceResult {
  sessions: WrapUpSessionStatus[]
  totalSessionsThisWeek: number
  wrapUpsSubmitted: number
  wrapUpsPending: number
  coverageRate: number | null
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadWrapUpReviewSurface(
  db: DB,
  academyId: string,
): Promise<WrapUpReviewSurfaceResult> {
  const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  // 1 — sessions this week (any status, not cancelled)
  const { data: sessionRows } = await db
    .from('sessions')
    .select('id, name, scheduled_date, coach_id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', sevenDaysAgoDate)
    .lte('scheduled_date', today)
    .not('status', 'eq', 'cancelled')
    .order('scheduled_date', { ascending: false })

  const sessions = sessionRows ?? []
  if (sessions.length === 0) {
    return { sessions: [], totalSessionsThisWeek: 0, wrapUpsSubmitted: 0, wrapUpsPending: 0, coverageRate: null }
  }

  const sessionIds = sessions.map(s => s.id)

  // 2 — voice_notes as wrap-up proxy (session_id present = wrap-up submitted)
  const { data: vnRows } = await db
    .from('voice_notes')
    .select('session_id')
    .eq('academy_id', academyId)
    .in('session_id', sessionIds)

  const submittedSet = new Set<string>()
  for (const vn of vnRows ?? []) {
    if (vn.session_id) submittedSet.add(vn.session_id)
  }

  // 3 — pending wrap-up proposed_actions for status context
  const { data: paRows } = await db
    .from('proposed_actions')
    .select('target_object_id, status')
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .in('status', ['pending_review', 'approved'])
    .in('target_object_id', sessionIds)

  const paStatusMap = new Map<string, string>()
  for (const row of paRows ?? []) {
    if (row.target_object_id && !paStatusMap.has(row.target_object_id)) {
      paStatusMap.set(row.target_object_id, row.status)
    }
  }

  const sessionStatuses: WrapUpSessionStatus[] = sessions.map(s => ({
    sessionId: s.id,
    sessionName: s.name ?? 'Session',
    scheduledDate: s.scheduled_date,
    coachId: s.coach_id,
    wrapUpSubmitted: submittedSet.has(s.id) || paStatusMap.has(s.id),
    wrapUpStatus: paStatusMap.get(s.id) ?? (submittedSet.has(s.id) ? 'submitted' : null),
  }))

  const wrapUpsSubmitted = sessionStatuses.filter(s => s.wrapUpSubmitted).length
  const wrapUpsPending = sessions.length - wrapUpsSubmitted
  const coverageRate = sessions.length > 0 ? wrapUpsSubmitted / sessions.length : null

  return {
    sessions: sessionStatuses,
    totalSessionsThisWeek: sessions.length,
    wrapUpsSubmitted,
    wrapUpsPending,
    coverageRate,
  }
}
