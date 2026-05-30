// Sprint 993 — DONNA Coach/Session Context Retrieval V1
// Safe read-only retrieval of coach and session state for DONNA context.
// Server-side only. RLS enforced. No raw coach notes returned.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface CoachSessionContextSummary {
  totalActiveCoaches: number
  todaySessionCount: number
  upcomingSessionCount: number
  sessionsWithMissingRecap: number
  pendingWrapUpCount: number
  coachesWithPendingWrapUp: number
}

export interface CoachSessionContextRetrievalResult {
  summary: CoachSessionContextSummary
  retrievedAt: string
  errors: string[]
}

export async function retrieveCoachSessionContext(
  supabase: SupabaseClient,
  academyId: string,
): Promise<CoachSessionContextRetrievalResult> {
  const errors: string[] = []
  const today = new Date().toISOString().slice(0, 10)
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  let totalActiveCoaches = 0
  let todaySessionCount = 0
  let upcomingSessionCount = 0
  let sessionsWithMissingRecap = 0
  let pendingWrapUpCount = 0

  // 1. Active coaches
  try {
    const { count } = await supabase
      .from('academy_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .in('role', ['coach', 'head_coach'])
    totalActiveCoaches = count ?? 0
  } catch { errors.push('active_coaches: failed') }

  // 2. Today's sessions
  try {
    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('scheduled_date', today)
    todaySessionCount = count ?? 0
  } catch { errors.push('today_sessions: failed') }

  // 3. Upcoming sessions (next 7 days, excluding today)
  try {
    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .gt('scheduled_date', today)
      .lte('scheduled_date', nextWeek)
    upcomingSessionCount = count ?? 0
  } catch { errors.push('upcoming_sessions: failed') }

  // 4. Sessions missing recap (past, not completed)
  try {
    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .lt('scheduled_date', today)
      .in('status', ['planned', 'in_progress'])
    sessionsWithMissingRecap = count ?? 0
  } catch { errors.push('missing_recap: failed') }

  // 5. Pending wrap-up drafts (from proposed_actions)
  try {
    const { count } = await supabase
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')
      .eq('action_type', 'session_actual')
    pendingWrapUpCount = count ?? 0
  } catch { errors.push('pending_wrapups: failed') }

  return {
    summary: {
      totalActiveCoaches,
      todaySessionCount,
      upcomingSessionCount,
      sessionsWithMissingRecap,
      pendingWrapUpCount,
      coachesWithPendingWrapUp: 0, // V2: requires join
    },
    retrievedAt: new Date().toISOString(),
    errors,
  }
}
