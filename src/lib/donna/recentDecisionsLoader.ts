// Sprint 742F — DONNA Recent Decisions Loader V1
// Loads the last 15 non-pending proposed_actions for director review.
// Read-only. No mutations. Academy-scoped. Fails safely.
//
// Returns approved / executed / rejected / modified decisions so DONNA can
// answer "what happened last?", "what was approved?", "recent decisions", etc.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecentDecisionStatus =
  | 'approved'
  | 'executed'
  | 'rejected'
  | 'modified'
  | 'expired'
  | 'failed'

export interface RecentDecisionSummary {
  id: string
  actionLabel: string
  targetModule: string
  status: RecentDecisionStatus
  riskLevel: string
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
  reviewerNotes: string | null
}

export interface RecentDecisionsResult {
  decisions: RecentDecisionSummary[]
  totalLoaded: number
  fieldStatus: COOFieldStatus
}

// ── Loader ─────────────────────────────────────────────────────────────────────

export async function loadRecentDecisions(
  db: DB,
  academyId: string,
): Promise<RecentDecisionsResult> {
  try {
    const rawDb = db as any

    const { data, error } = await rawDb
      .from('proposed_actions')
      .select(
        'id, action_label, target_module, status, risk_level, created_at, approved_at, rejected_at, reviewer_notes',
      )
      .eq('academy_id', academyId)
      .in('status', ['approved', 'executed', 'rejected', 'modified', 'expired', 'failed'])
      .order('updated_at', { ascending: false })
      .limit(15)

    if (error || !data) {
      return { decisions: [], totalLoaded: 0, fieldStatus: 'insufficient_data' }
    }

    const decisions: RecentDecisionSummary[] = (data as any[]).map(row => ({
      id: row.id as string,
      actionLabel: (row.action_label as string) ?? 'Unnamed action',
      targetModule: (row.target_module as string) ?? 'unknown',
      status: (row.status as RecentDecisionStatus),
      riskLevel: (row.risk_level as string) ?? 'low',
      createdAt: row.created_at as string,
      approvedAt: (row.approved_at as string | null) ?? null,
      rejectedAt: (row.rejected_at as string | null) ?? null,
      reviewerNotes: (row.reviewer_notes as string | null) ?? null,
    }))

    return {
      decisions,
      totalLoaded: decisions.length,
      fieldStatus: decisions.length > 0 ? 'live' : 'insufficient_data',
    }
  } catch {
    return { decisions: [], totalLoaded: 0, fieldStatus: 'insufficient_data' }
  }
}
