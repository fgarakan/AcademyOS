// Sprint 519 — Parent Trust Live Adapter V1
// Read-only loader for parent communication coverage.
// BLOCKED: proposed_actions has no applied_at; players has no parent_id.
// Returns blocked_by_schema status with available partial signals.
// No migrations. RLS-scoped by academy_id.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParentTrustResult {
  totalActivePlayers: number
  parentActionsProposed: number
  parentActionsPending: number
  coverageAvailable: false
  blockReason: string
  fieldStatus: COOFieldStatus
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadParentTrust(
  db: DB,
  academyId: string,
): Promise<ParentTrustResult> {
  // 1 — total active players (coverage denominator)
  const { count: activePlayerCount } = await db
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .eq('is_active', true)

  // 2 — any parent-related proposed actions (target_module probe)
  const { count: parentActionCount } = await db
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .ilike('target_module', '%parent%')

  const { count: parentPendingCount } = await db
    .from('proposed_actions')
    .select('id', { count: 'exact', head: true })
    .eq('academy_id', academyId)
    .ilike('target_module', '%parent%')
    .eq('status', 'pending_review')

  return {
    totalActivePlayers: activePlayerCount ?? 0,
    parentActionsProposed: parentActionCount ?? 0,
    parentActionsPending: parentPendingCount ?? 0,
    coverageAvailable: false,
    blockReason:
      'Parent communication coverage requires proposed_actions.applied_at and a parent contact history table — both pending migration.',
    fieldStatus: 'blocked_by_schema',
  }
}
