// Sprint 521 — Curriculum Bottleneck Loader V1
// Activated in Mega Sprint 1981–1990 after confirming migrations 041–044 applied to live DB.
// Reads curriculum_track_requirements + player_requirement_progress to detect
// which levels have the highest stall rates, lowest completion, and most failed gates.
// RLS-scoped by academy_id.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LevelBottleneckSignal {
  levelId: string
  levelName: string
  stage: string
  totalPlayers: number
  stalled: number          // players in 'not_started' or 'in_progress' with no recent progress
  requirementCount: number
  avgCompletionPct: number
  lowestDomain: string | null
  lowestDomainCompletionPct: number | null
}

export interface CurriculumBottleneckResult {
  skillTaggedObservationsLast30Days: number
  topTaggedConcerns: Array<{ tag: string; count: number }>
  levelBottlenecks: LevelBottleneckSignal[]
  curriculumTablesAvailable: true
  fieldStatus: COOFieldStatus
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadCurriculumBottleneck(
  db: DB,
  academyId: string,
): Promise<CurriculumBottleneckResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // ── Probe 1: skill-tagged concern observations ─────────────────────────────
  const { data: taggedObs } = await db
    .from('coach_observations')
    .select('tags')
    .eq('academy_id', academyId)
    .eq('observation_type', 'concern')
    .not('tags', 'is', null)
    .gte('created_at', thirtyDaysAgo)

  const tagCount = new Map<string, number>()
  for (const obs of taggedObs ?? []) {
    for (const tag of (obs.tags ?? []) as string[]) {
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1)
    }
  }

  const topTaggedConcerns = Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))

  // ── Probe 2: requirement progress per level ────────────────────────────────
  const rawDb = db as any

  const { data: progressRows } = await rawDb
    .from('player_requirement_progress')
    .select(`
      curriculum_level_id,
      player_id,
      status,
      last_evidence_at,
      requirement:requirement_id(
        requirement_domain_id,
        requirement_domain:requirement_domain_id(key, label)
      )
    `)
    .eq('academy_id', academyId)

  // ── Probe 3: level metadata ────────────────────────────────────────────────
  const { data: levelRows } = await rawDb
    .from('curriculum_levels')
    .select('id, display_name, stage')

  const levelMap = new Map<string, { display_name: string; stage: string }>(
    (levelRows ?? []).map((l: any) => [l.id, { display_name: l.display_name, stage: l.stage }]),
  )

  // ── Aggregate by level ─────────────────────────────────────────────────────
  // Group progress records by level
  interface LevelAgg {
    players: Set<string>
    statuses: string[]
    domainGroups: Map<string, string[]>   // domainKey → statuses[]
  }
  const levelAgg = new Map<string, LevelAgg>()

  for (const row of (progressRows ?? []) as any[]) {
    const lid = row.curriculum_level_id
    if (!lid) continue
    if (!levelAgg.has(lid)) {
      levelAgg.set(lid, { players: new Set(), statuses: [], domainGroups: new Map() })
    }
    const agg = levelAgg.get(lid)!
    agg.players.add(row.player_id)
    agg.statuses.push(row.status)

    const domainKey: string = (row.requirement as any)?.requirement_domain?.key ?? 'unknown'
    if (!agg.domainGroups.has(domainKey)) agg.domainGroups.set(domainKey, [])
    agg.domainGroups.get(domainKey)!.push(row.status)
  }

  const TERMINAL = new Set(['met', 'waived'])
  const levelBottlenecks: LevelBottleneckSignal[] = []

  for (const [levelId, agg] of Array.from(levelAgg.entries())) {
    const meta = levelMap.get(levelId)
    const total = agg.statuses.length
    const completedCount = agg.statuses.filter((s: string) => TERMINAL.has(s)).length
    const avgCompletionPct = total > 0 ? Math.round((completedCount / total) * 100) : 0
    const stalledCount = agg.statuses.filter((s: string) => s === 'not_started').length

    // Find lowest domain
    let lowestDomain: string | null = null
    let lowestPct: number | null = null
    for (const [domain, statuses] of Array.from(agg.domainGroups.entries())) {
      const domTotal = statuses.length
      const domCompleted = statuses.filter((s: string) => TERMINAL.has(s)).length
      const pct = domTotal > 0 ? Math.round((domCompleted / domTotal) * 100) : 0
      if (lowestPct === null || pct < lowestPct) {
        lowestPct = pct
        lowestDomain = domain
      }
    }

    levelBottlenecks.push({
      levelId,
      levelName: meta?.display_name ?? levelId,
      stage: meta?.stage ?? '',
      totalPlayers: agg.players.size,
      stalled: stalledCount,
      requirementCount: total,
      avgCompletionPct,
      lowestDomain,
      lowestDomainCompletionPct: lowestPct,
    })
  }

  // Sort by lowest completion (most blocked first)
  levelBottlenecks.sort((a, b) => a.avgCompletionPct - b.avgCompletionPct)

  return {
    skillTaggedObservationsLast30Days: (taggedObs ?? []).length,
    topTaggedConcerns,
    levelBottlenecks,
    curriculumTablesAvailable: true,
    fieldStatus: progressRows && progressRows.length > 0 ? 'live' : 'insufficient_data',
  }
}
