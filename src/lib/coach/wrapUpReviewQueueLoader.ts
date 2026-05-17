// Sprint 531 — Coach Wrap-Up Review Queue Context V1
// Read-only loader: returns a coach's pending proposed_actions for their own visibility.
// Shows what the coach has submitted that's awaiting director review.
// No writes. No migrations. RLS-scoped by academy_id and proposed_by_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoachPendingItem {
  actionId: string
  actionLabel: string
  targetModule: string
  status: string
  createdAt: string
  expiresAt: string
  sessionId: string | null
}

export interface CoachReviewQueueResult {
  pendingItems: CoachPendingItem[]
  approvedItems: CoachPendingItem[]
  totalPending: number
  totalApproved: number
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadCoachReviewQueue(
  db: DB,
  coachUserId: string,
  academyId: string,
): Promise<CoachReviewQueueResult> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Items the coach submitted in the last 7 days, pending or approved
  const { data: actionRows } = await db
    .from('proposed_actions')
    .select('id, action_label, target_module, status, created_at, expires_at, target_object_id')
    .eq('academy_id', academyId)
    .eq('proposed_by_id', coachUserId)
    .in('status', ['pending_review', 'approved'])
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(20)

  const items: CoachPendingItem[] = (actionRows ?? []).map(row => ({
    actionId: row.id,
    actionLabel: row.action_label,
    targetModule: row.target_module,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    sessionId: row.target_object_id ?? null,
  }))

  const pendingItems = items.filter(i => i.status === 'pending_review')
  const approvedItems = items.filter(i => i.status === 'approved')

  return {
    pendingItems,
    approvedItems,
    totalPending: pendingItems.length,
    totalApproved: approvedItems.length,
  }
}
