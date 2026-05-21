// Sprint 418 — Approval Center Query Helpers V1
// Typed query builders for the director's approval center.
// All queries are academy-scoped and enforce RLS at the DB level.
// Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { isExpiredAction } from './proposedActionStateMachine'

type ProposedAction = Database['public']['Tables']['proposed_actions']['Row']

export interface ApprovalCenterFilters {
  riskLevel?: 'low' | 'medium' | 'high' | null
  targetModule?: string | null
  proposedById?: string | null
  limit?: number
  offset?: number
}

// Fetch all pending proposed_actions for an academy.
// Ordered by risk level (high first) then created_at (oldest first — FIFO).
export async function fetchPendingActions(
  db: SupabaseClient<Database>,
  academyId: string,
  filters?: ApprovalCenterFilters,
): Promise<ProposedAction[]> {
  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0

  let query = db
    .from('proposed_actions')
    .select('*')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .order('risk_level', { ascending: false })
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (filters?.riskLevel) {
    query = query.eq('risk_level', filters.riskLevel)
  }
  if (filters?.targetModule) {
    query = query.eq('target_module', filters.targetModule)
  }
  if (filters?.proposedById) {
    query = query.eq('proposed_by_id', filters.proposedById)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// Fetch a single proposed_action by ID, scoped to academy.
export async function fetchActionById(
  db: SupabaseClient<Database>,
  academyId: string,
  actionId: string,
): Promise<ProposedAction | null> {
  const { data, error } = await db
    .from('proposed_actions')
    .select('*')
    .eq('academy_id', academyId)
    .eq('id', actionId)
    .single()

  if (error) return null
  return data ?? null
}

// Fetch recently completed actions (approved + executed, or rejected) for audit view.
export async function fetchRecentlyResolvedActions(
  db: SupabaseClient<Database>,
  academyId: string,
  limitDays = 7,
): Promise<ProposedAction[]> {
  const since = new Date(Date.now() - limitDays * 86_400_000).toISOString()

  const { data, error } = await db
    .from('proposed_actions')
    .select('*')
    .eq('academy_id', academyId)
    .in('status', ['executed', 'rejected', 'failed'])
    .gte('updated_at', since)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) return []
  return data ?? []
}

// Fetch the count of pending and clarification-needed actions for the director badge.
export async function fetchPendingActionCount(
  db: SupabaseClient<Database>,
  academyId: string,
): Promise<number> {
  const { count, error } = await db
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'clarification_needed'])

  if (error) return 0
  return count ?? 0
}

// Returns actions that have passed their expiry and are still in a non-terminal state.
// Used by a cleanup job or cron to mark stale actions as expired.
export function filterExpiredActions(actions: ProposedAction[]): ProposedAction[] {
  return actions.filter(a => isExpiredAction(a.expires_at))
}
