// Sprint 928 — Coach Session Wrap-Up Status Wiring V1
// Read-only batch loader: returns the most recent wrap-up review status
// for each session ID from proposed_actions (target_module = 'session_wrap_up_v1').
// No writes. No mutations. academy_id-scoped. Best-effort — callers must handle failure.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ── Display status type ───────────────────────────────────────────────────────
// Maps raw proposed_actions.status values to coach-facing states.
// 'not_started' means no proposed_action was found for the session.

export type WrapUpDisplayStatus =
  | 'not_started'
  | 'pending_review'
  | 'approved'
  | 'executed'
  | 'rejected'
  | 'clarification_needed'

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadWrapUpStatusMap(
  db: DB,
  sessionIds: string[],
  academyId: string,
): Promise<Record<string, WrapUpDisplayStatus>> {
  if (sessionIds.length === 0) return {}

  const rawDb = db as any
  const { data: rows } = await rawDb
    .from('proposed_actions')
    .select('target_object_id, status')
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .in('target_object_id', sessionIds)
    .order('created_at', { ascending: false })

  const result: Record<string, WrapUpDisplayStatus> = {}

  for (const row of rows ?? []) {
    const sessionId = row.target_object_id as string
    // Take only the most recent proposed_action per session (rows are DESC by created_at)
    if (result[sessionId]) continue

    const rawStatus = row.status as string
    const displayStatus: WrapUpDisplayStatus =
      rawStatus === 'pending_review' ? 'pending_review' :
      rawStatus === 'approved' ? 'approved' :
      rawStatus === 'executed' ? 'executed' :
      rawStatus === 'rejected' ? 'rejected' :
      rawStatus === 'clarification_needed' ? 'clarification_needed' :
      'not_started'

    result[sessionId] = displayStatus
  }

  return result
}
