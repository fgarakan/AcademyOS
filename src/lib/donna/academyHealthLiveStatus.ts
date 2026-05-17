// Sprint 515 — Academy Health Live Source Status V1
// Probes live KPI data availability and returns COOFieldStatus per KPI ID.
// Read-only. No writes. No migrations.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import { ACADEMY_HEALTH_SOURCE_MAP } from '@/lib/donna/academyHealthSourceMap'
import type { HealthKPIAvailability } from '@/lib/donna/academyHealthSourceMap'

// ── Static availability → COO status baseline ─────────────────────────────────

const AVAILABILITY_BASELINE: Record<HealthKPIAvailability, COOFieldStatus> = {
  live: 'live',
  partial: 'partial',
  deferred: 'blocked_by_schema',
  not_yet_built: 'blocked_by_schema',
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadAcademyHealthLiveStatus(
  db: DB,
  academyId: string,
): Promise<Record<string, COOFieldStatus>> {
  const statusMap: Record<string, COOFieldStatus> = {}

  for (const kpi of ACADEMY_HEALTH_SOURCE_MAP) {
    statusMap[kpi.id] = AVAILABILITY_BASELINE[kpi.availability]
  }

  // Live probe: player_attention_risk — concern observations in the last 30 days
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await db
      .from('coach_observations')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('observation_type', 'concern')
      .gte('created_at', thirtyDaysAgo)
    statusMap['player_attention_risk'] = (count ?? 0) > 0 ? 'partial' : 'insufficient_data'
  } catch {
    statusMap['player_attention_risk'] = 'insufficient_data'
  }

  // Live probe: wrap_up_coverage_rate — any voice_notes with session_id exist?
  try {
    const { count } = await db
      .from('voice_notes')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .not('session_id', 'is', null)
    statusMap['wrap_up_coverage_rate'] = (count ?? 0) > 0 ? 'partial' : 'insufficient_data'
  } catch {
    statusMap['wrap_up_coverage_rate'] = 'insufficient_data'
  }

  // Live probe: review_queue_throughput — any approved actions exist?
  // approved_at is available but applied_at is not — partial throughput calc only
  try {
    const { count } = await db
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .not('approved_at', 'is', null)
    statusMap['review_queue_throughput'] = (count ?? 0) > 0 ? 'partial' : 'blocked_by_schema'
  } catch {
    statusMap['review_queue_throughput'] = 'blocked_by_schema'
  }

  return statusMap
}
