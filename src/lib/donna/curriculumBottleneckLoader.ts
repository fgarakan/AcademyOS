// Sprint 521 — Curriculum Bottleneck Blocked State V1
// Read-only loader documenting the blocked state for curriculum bottleneck detection.
// BLOCKED: curriculum_requirements and player_curriculum_levels tables do not exist
// (migrations 041-044 unapplied). Returns blocked_by_schema with available partial signals.
// No migrations. RLS-scoped by academy_id.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CurriculumBottleneckResult {
  skillTaggedObservationsLast30Days: number
  topTaggedConcerns: Array<{ tag: string; count: number }>
  curriculumTablesAvailable: false
  blockReason: string
  fieldStatus: COOFieldStatus
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadCurriculumBottleneck(
  db: DB,
  academyId: string,
): Promise<CurriculumBottleneckResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Probe: skill-tagged concern observations (tags array is not null)
  const { data: taggedObs } = await db
    .from('coach_observations')
    .select('tags')
    .eq('academy_id', academyId)
    .eq('observation_type', 'concern')
    .not('tags', 'is', null)
    .gte('created_at', thirtyDaysAgo)

  const tagCount = new Map<string, number>()
  for (const obs of taggedObs ?? []) {
    for (const tag of obs.tags ?? []) {
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1)
    }
  }

  const topTaggedConcerns = Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))

  return {
    skillTaggedObservationsLast30Days: (taggedObs ?? []).length,
    topTaggedConcerns,
    curriculumTablesAvailable: false,
    blockReason:
      'Curriculum bottleneck detection requires curriculum_requirements and player_curriculum_levels tables — pending migrations 041–044.',
    fieldStatus: 'blocked_by_schema',
  }
}
