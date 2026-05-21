// Sprint 422 — Director Dashboard Data Layer V1
// Typed query helpers for the director's command center dashboard.
// All queries are academy-scoped. No select('*') — only needed columns.
// Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// ── Pending review count ──────────────────────────────────────────────────────

// Returns the count of items needing director action today.
export async function fetchDirectorActionCount(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<{ pendingActions: number; clarificationNeeded: number }> {
  const rawDb = db as ReturnType<typeof db.from> extends never ? never : typeof db

  const [pendingResult, clarificationResult] = await Promise.all([
    (rawDb as typeof db)
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review'),
    (rawDb as typeof db)
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'clarification_needed'),
  ])

  return {
    pendingActions: pendingResult.count ?? 0,
    clarificationNeeded: clarificationResult.count ?? 0,
  }
}

// ── Today's session coverage ──────────────────────────────────────────────────

export interface SessionCoverageSummary {
  totalToday: number
  withWrapUp: number
  missingWrapUp: number
}

// Returns how many of today's sessions have wrap-up submissions.
export async function fetchTodaySessionCoverage(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<SessionCoverageSummary> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data, error } = await db
    .from('sessions')
    .select('id, status')
    .eq('academy_id', academyId)
    .gte('scheduled_date', todayStart.toISOString())
    .lte('scheduled_date', todayEnd.toISOString())

  if (error || !data) {
    return { totalToday: 0, withWrapUp: 0, missingWrapUp: 0 }
  }

  const completed = data.filter(s => s.status === 'completed')
  return {
    totalToday: data.length,
    withWrapUp: completed.length,
    missingWrapUp: data.filter(s => s.status !== 'completed' && s.status !== 'cancelled').length,
  }
}

// ── Active player summary ─────────────────────────────────────────────────────

export interface PlayerRosterSummary {
  total: number
  active: number
  inactive: number
}

export async function fetchPlayerRosterSummary(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<PlayerRosterSummary> {
  const { data, error } = await db
    .from('players')
    .select('id, is_active')
    .eq('academy_id', academyId)

  if (error || !data) {
    return { total: 0, active: 0, inactive: 0 }
  }

  const active = data.filter(p => p.is_active).length
  return {
    total: data.length,
    active,
    inactive: data.length - active,
  }
}

// ── High-risk pending actions ─────────────────────────────────────────────────

export interface HighRiskActionSummary {
  id: string
  action_label: string
  action_type: Database['public']['Enums']['action_type']
  risk_level: string
  created_at: string
  target_module: string
}

export async function fetchHighRiskPendingActions(
  db: SupabaseClient<Database>,
  academyId: string,
  limit = 5,
): Promise<HighRiskActionSummary[]> {
  const { data, error } = await db
    .from('proposed_actions')
    .select('id, action_label, action_type, risk_level, created_at, target_module')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .eq('risk_level', 'high')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) return []
  return (data ?? []) as HighRiskActionSummary[]
}
