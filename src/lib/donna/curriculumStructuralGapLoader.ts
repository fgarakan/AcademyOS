// Sprint 741 — DONNA Curriculum Structural Gap Loader V1
// Read-only query helper that detects structural curriculum gaps from existing tables.
// Queries: curriculum_levels (global) + curriculum_drills + curriculum_gates.
// All three tables have authenticated-read RLS — safe for director session.
//
// SCOPE: structural content gaps only — which levels have no drills or no gates.
// BLOCKED (needs migrations 041-044): player-progress gaps (player_requirement_progress
// joined with curriculum_requirements). See DONNA_CURRICULUM_GAP_WIREUP_LIMITATION_741.md.
//
// Fails safely — returns [] on any error so DirectorDonnaContext is unaffected.
// No DB writes. No mutations. No side effects.

import type { DB } from '@/lib/types/db'

// ── Result types ──────────────────────────────────────────────────────────────

export interface CurriculumStructuralGap {
  levelId: string
  displayName: string
  missingDrills: boolean
  missingGates: boolean
  drillCount: number
  gateCount: number
}

export interface CurriculumStructuralGapResult {
  gaps: CurriculumStructuralGap[]
  totalLevels: number
  levelsWithContent: number
  dataAvailable: boolean
}

// ── Main loader ───────────────────────────────────────────────────────────────

export async function loadCurriculumStructuralGaps(
  db: DB,
  academyId: string,
): Promise<string[]> {
  try {
    // 1. Fetch all curriculum levels (global spine — no academy_id scoping)
    // RLS: "Authenticated read curriculum_levels" — safe for director session.
    const { data: levelRows, error: levelError } = await db
      .from('curriculum_levels')
      .select('id, display_name, sort_order, stage')
      .order('sort_order', { ascending: true })

    if (levelError || !levelRows || levelRows.length === 0) return []

    // 2. Fetch active global drills (academy_id IS NULL)
    // RLS: "Authenticated read global drills" — safe for any authenticated user.
    const { data: globalDrills } = await db
      .from('curriculum_drills')
      .select('level_min_id')
      .eq('is_active', true)
      .is('academy_id', null)
      .not('level_min_id', 'is', null)

    // 3. Fetch active academy-specific drills (academy_id = academyId)
    // RLS: "Academy staff read academy drills" — safe for this academy's users.
    const { data: academyDrills } = await db
      .from('curriculum_drills')
      .select('level_min_id')
      .eq('is_active', true)
      .eq('academy_id', academyId)
      .not('level_min_id', 'is', null)

    // 4. Fetch active gates (global — no academy_id)
    // RLS: "Authenticated read curriculum gates" — safe for any authenticated user.
    const { data: gateRows } = await db
      .from('curriculum_gates')
      .select('from_level_id')
      .eq('is_active', true)

    // Build drill count map (global + academy drills merged)
    const drillCountByLevel = new Map<string, number>()
    for (const row of [...(globalDrills ?? []), ...(academyDrills ?? [])]) {
      const lvl = row.level_min_id
      if (lvl) {
        drillCountByLevel.set(lvl, (drillCountByLevel.get(lvl) ?? 0) + 1)
      }
    }

    // Build gate count map
    const gateCountByLevel = new Map<string, number>()
    for (const row of gateRows ?? []) {
      gateCountByLevel.set(
        row.from_level_id,
        (gateCountByLevel.get(row.from_level_id) ?? 0) + 1,
      )
    }

    // Compute gaps — levels with missing drills or missing gates
    const gaps: string[] = []
    for (const level of levelRows) {
      const drills = drillCountByLevel.get(level.id) ?? 0
      const gates = gateCountByLevel.get(level.id) ?? 0

      if (drills === 0 && gates === 0) {
        gaps.push(`${level.display_name} — no drills or advancement gates defined`)
      } else if (drills === 0) {
        gaps.push(
          `${level.display_name} — no drills defined (${gates} gate${gates !== 1 ? 's' : ''} exist)`,
        )
      } else if (gates === 0) {
        gaps.push(
          `${level.display_name} — no advancement gates defined (${drills} drill${drills !== 1 ? 's' : ''} exist)`,
        )
      }
    }

    return gaps
  } catch {
    // Fail safely — DONNA context is unaffected
    return []
  }
}

// ── Detailed result loader (for curriculum builder context, not DONNA chat) ───
// Returns structured data instead of string[]. Used if a curriculum builder
// page needs structural gap detail. DONNA chat uses loadCurriculumStructuralGaps above.

export async function loadCurriculumStructuralGapDetail(
  db: DB,
  academyId: string,
): Promise<CurriculumStructuralGapResult> {
  try {
    const { data: levelRows, error: levelError } = await db
      .from('curriculum_levels')
      .select('id, display_name, sort_order, stage')
      .order('sort_order', { ascending: true })

    if (levelError || !levelRows || levelRows.length === 0) {
      return { gaps: [], totalLevels: 0, levelsWithContent: 0, dataAvailable: false }
    }

    const { data: globalDrills } = await db
      .from('curriculum_drills')
      .select('level_min_id')
      .eq('is_active', true)
      .is('academy_id', null)
      .not('level_min_id', 'is', null)

    const { data: academyDrills } = await db
      .from('curriculum_drills')
      .select('level_min_id')
      .eq('is_active', true)
      .eq('academy_id', academyId)
      .not('level_min_id', 'is', null)

    const { data: gateRows } = await db
      .from('curriculum_gates')
      .select('from_level_id')
      .eq('is_active', true)

    const drillCountByLevel = new Map<string, number>()
    for (const row of [...(globalDrills ?? []), ...(academyDrills ?? [])]) {
      const lvl = row.level_min_id
      if (lvl) {
        drillCountByLevel.set(lvl, (drillCountByLevel.get(lvl) ?? 0) + 1)
      }
    }

    const gateCountByLevel = new Map<string, number>()
    for (const row of gateRows ?? []) {
      gateCountByLevel.set(
        row.from_level_id,
        (gateCountByLevel.get(row.from_level_id) ?? 0) + 1,
      )
    }

    const gaps: CurriculumStructuralGap[] = []
    let levelsWithContent = 0

    for (const level of levelRows) {
      const drillCount = drillCountByLevel.get(level.id) ?? 0
      const gateCount = gateCountByLevel.get(level.id) ?? 0
      const missingDrills = drillCount === 0
      const missingGates = gateCount === 0

      if (missingDrills || missingGates) {
        gaps.push({
          levelId: level.id,
          displayName: level.display_name,
          missingDrills,
          missingGates,
          drillCount,
          gateCount,
        })
      } else {
        levelsWithContent++
      }
    }

    return {
      gaps,
      totalLevels: levelRows.length,
      levelsWithContent,
      dataAvailable: true,
    }
  } catch {
    return { gaps: [], totalLevels: 0, levelsWithContent: 0, dataAvailable: false }
  }
}
