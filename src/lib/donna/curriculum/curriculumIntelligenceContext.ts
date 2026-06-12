// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1716–1745
// Extended: Mega Sprint 1836–1865 — item summary list for duplicate detection + gap report
// CurriculumIntelligenceContext: the pre-loaded intelligence payload
// that DONNA uses before producing any curriculum response.
//
// Loaded server-side in the builder page and passed to client components.
// Pure data — no functions, fully serializable.
//
// V1 scope: Academy DNA + structural curriculum data + player intelligence + memory.
// Player intelligence is primary — curriculum recommendations without it are incomplete.
// Coach intelligence deferred to V2.
//
// Player intelligence loading:
//   Q1: player_curriculum_states  → player counts + advancement eligible per level
//   Q2: player_evidence_records   → evidence records by level (with fallback to assessments)
//   Q3: (fallback) assessments    → synthesized evidence when Q2 table is empty/missing
//   Per-level: analyzeCurriculumImprovements() from curriculumImprovementEngine

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { EvidenceRecord } from '@/lib/evidence/playerEvidenceTypes'
import {
  analyzeCurriculumImprovements,
  type CurriculumImprovementSuggestion,
} from '@/lib/donna/curriculumImprovementEngine'
import type { CurriculumMemoryEntry } from './curriculumMemory'
import { buildCurriculumGapReport, type CurriculumGapReport } from './curriculumGapAnalysis'

type DB = SupabaseClient<Database>

// ── Intelligence context shape ────────────────────────────────────────────────

export interface CurriculumLevelSummary {
  id: string
  displayName: string
  stage: string
  sortOrder: number
  /** Total academy-owned content items at this level */
  itemCount: number
  /** Item count broken down by content_type */
  itemCountByType: Record<string, number>
  /** True if this level has no academy-owned content items at all */
  isEmpty: boolean
  /** True if fewer than 3 items — low coverage signal */
  isSparse: boolean
}

export interface CurriculumGateSummary {
  id: string
  fromLevelId: string
  toLevelId: string
  domain: string
  criterion: string
  gateType: string
}

export interface AcademyDnaSummary {
  inferredModel: string
  playerMix: string
  familyPriorities: string
  stagePriorities: Record<string, number>  // stage key → rank position (1-based)
  priorityEdge: string
  advancementApproval: string
  parentTransparency: string
  hasDna: boolean
}

// ── Academy curriculum item summary (for duplicate detection) ─────────────────

export interface CurriculumItemSummary {
  id: string
  title: string
  contentType: string
  levelId: string
  levelName: string
  domain: string | null
}

export interface PendingOverrideSummary {
  id: string
  overrideType: string
  targetType: string
  targetId: string | null
  levelId: string | null
  title: string | null
  createdAt: string
}

// ── Player intelligence per level ─────────────────────────────────────────────

export interface PlayerLevelSummary {
  levelId: string
  levelName: string
  /** Players currently assigned to this level */
  playerCount: number
  /** Players flagged as advancement-eligible */
  advancementEligibleCount: number
  /** Evidence-backed improvement suggestions for this level's curriculum */
  improvementSuggestions: CurriculumImprovementSuggestion[]
  /** Top coaching domains with weak evidence signals at this level */
  weakDomains: string[]
  /** True when improvement suggestions have evidence backing */
  hasEvidence: boolean
  /** Where evidence came from */
  evidenceSource: 'evidence_records' | 'fallback_tables' | 'none'
}

// ── Full intelligence context ──────────────────────────────────────────────────

export interface CurriculumIntelligenceContext {
  academyDna: AcademyDnaSummary
  levels: CurriculumLevelSummary[]
  gates: CurriculumGateSummary[]
  pendingOverrides: PendingOverrideSummary[]
  pendingOverrideCount: number
  /** Player intelligence per level — core to curriculum recommendations */
  playerByLevel: PlayerLevelSummary[]
  totalPlayerCount: number
  advancementEligibleTotal: number
  playerIntelligenceAvailable: boolean
  memory: CurriculumMemoryEntry[]
  /** Academy-owned curriculum items — used for duplicate detection (capped at 200) */
  curriculumItems: CurriculumItemSummary[]
  /** Gap analysis computed from loaded items */
  gapReport: CurriculumGapReport
  /** ISO timestamp when context was built */
  loadedAt: string
  /** True if all data sources were reachable */
  dataAvailable: boolean
  /** Layers that could not be loaded */
  dataGaps: string[]
}

// ── Academy DNA extraction ────────────────────────────────────────────────────

function extractDna(raw: Record<string, unknown> | null): AcademyDnaSummary {
  if (!raw) {
    return {
      inferredModel: 'unknown',
      playerMix: 'unknown',
      familyPriorities: 'unknown',
      stagePriorities: {},
      priorityEdge: 'coach_judgment',
      advancementApproval: 'coach_recommendation',
      parentTransparency: 'standard',
      hasDna: false,
    }
  }

  const stagePriorities: Record<string, number> = {}
  const rawStageP = raw.stage_priorities as Array<{ key: string; rank?: number }> | undefined
  if (Array.isArray(rawStageP)) {
    rawStageP.forEach((s, i) => {
      if (s?.key) stagePriorities[s.key] = (s.rank ?? i + 1)
    })
  }

  return {
    inferredModel:       String(raw.inferred_model ?? 'unknown'),
    playerMix:           String(raw.player_mix ?? 'unknown'),
    familyPriorities:    String(raw.family_priorities ?? 'unknown'),
    stagePriorities,
    priorityEdge:        String(raw.priority_edge ?? 'coach_judgment'),
    advancementApproval: String(raw.advancement_approval ?? 'coach_recommendation'),
    parentTransparency:  String(raw.parent_transparency ?? 'standard'),
    hasDna: true,
  }
}

// ── Player intelligence loader ────────────────────────────────────────────────
//
// Three-query pattern:
//   Q1: player_curriculum_states → counts per level
//   Q2: player_evidence_records  → evidence records for all occupied levels
//   Q3: assessments (fallback)   → when evidence table is empty or missing
//
// Evidence records are grouped by curriculum_level_id, then
// analyzeCurriculumImprovements() runs per level.

async function loadPlayerIntelligence(
  rawDb: any,
  academyId: string,
  levelIds: string[],
  levelNameMap: Record<string, string>,
): Promise<{ byLevel: PlayerLevelSummary[]; totalCount: number; eligibleTotal: number; available: boolean }> {
  // ── Q1: Player counts per level ─────────────────────────────────────────
  let playerCountByLevel: Record<string, number> = {}
  let eligibleCountByLevel: Record<string, number> = {}
  let totalCount = 0
  let eligibleTotal = 0

  try {
    const { data: stateRows } = await rawDb
      .from('player_curriculum_states')
      .select('current_level_id, advancement_eligible')
      .eq('academy_id', academyId)

    for (const row of (stateRows ?? []) as Array<{ current_level_id: string; advancement_eligible: boolean }>) {
      if (!row.current_level_id) continue
      playerCountByLevel[row.current_level_id] = (playerCountByLevel[row.current_level_id] ?? 0) + 1
      totalCount++
      if (row.advancement_eligible) {
        eligibleCountByLevel[row.current_level_id] = (eligibleCountByLevel[row.current_level_id] ?? 0) + 1
        eligibleTotal++
      }
    }
  } catch {
    // player_curriculum_states unavailable — player intelligence will show as empty
    return {
      byLevel: levelIds.map(id => emptyPlayerLevelSummary(id, levelNameMap[id] ?? id)),
      totalCount: 0,
      eligibleTotal: 0,
      available: false,
    }
  }

  // Only load evidence for levels that have players
  const occupiedLevelIds = levelIds.filter(id => (playerCountByLevel[id] ?? 0) > 0)
  if (occupiedLevelIds.length === 0) {
    return {
      byLevel: levelIds.map(id => emptyPlayerLevelSummary(id, levelNameMap[id] ?? id)),
      totalCount,
      eligibleTotal,
      available: true,
    }
  }

  // ── Q2: Evidence records by curriculum_level_id ──────────────────────────
  let evidenceByLevel: Record<string, EvidenceRecord[]> = {}
  let evidenceSource: 'evidence_records' | 'fallback_tables' | 'none' = 'none'

  try {
    const { data: evidenceRows, error: evidenceErr } = await rawDb
      .from('player_evidence_records')
      .select([
        'id', 'academy_id', 'player_id', 'source_type', 'source_id',
        'curriculum_level_id', 'curriculum_level_name',
        'curriculum_requirement_id', 'curriculum_requirement_label',
        'priority_key', 'priority_label',
        'pathway', 'evidence_category', 'confidence', 'evidence_strength',
        'evidence_weight', 'evidence_summary',
        'visible_to_director', 'visible_to_coach', 'visible_to_parent', 'visible_to_player',
        'owner_scope', 'portability_status', 'consent_status', 'consent_version',
        'anonymized_at', 'transferred_at', 'expires_at',
        'created_by', 'created_at', 'updated_at',
      ].join(', '))
      .eq('academy_id', academyId)
      .in('curriculum_level_id', occupiedLevelIds)
      .is('anonymized_at', null)
      .limit(500)

    const rows = (evidenceRows ?? []) as EvidenceRecord[]

    if (!evidenceErr && rows.length > 0) {
      for (const r of rows) {
        if (!r.curriculum_level_id) continue
        if (!evidenceByLevel[r.curriculum_level_id]) evidenceByLevel[r.curriculum_level_id] = []
        evidenceByLevel[r.curriculum_level_id].push(r)
      }
      evidenceSource = 'evidence_records'
    } else {
      // Table empty or missing — fall back to assessments
      evidenceByLevel = await fallbackEvidenceFromAssessments(rawDb, academyId, playerCountByLevel, levelIds)
      evidenceSource = Object.values(evidenceByLevel).some(arr => arr.length > 0) ? 'fallback_tables' : 'none'
    }
  } catch {
    evidenceByLevel = await fallbackEvidenceFromAssessments(rawDb, academyId, playerCountByLevel, levelIds)
    evidenceSource = Object.values(evidenceByLevel).some(arr => arr.length > 0) ? 'fallback_tables' : 'none'
  }

  // ── Build per-level summaries with improvement analysis ──────────────────
  const byLevel: PlayerLevelSummary[] = levelIds.map(levelId => {
    const count    = playerCountByLevel[levelId] ?? 0
    const eligible = eligibleCountByLevel[levelId] ?? 0
    const evidence = evidenceByLevel[levelId] ?? []
    const levelName = levelNameMap[levelId] ?? levelId

    if (count === 0) return emptyPlayerLevelSummary(levelId, levelName)

    let improvementSuggestions: CurriculumImprovementSuggestion[] = []
    let weakDomains: string[] = []

    if (evidence.length > 0) {
      const analysis = analyzeCurriculumImprovements({
        levelKey:        levelId,
        levelLabel:      levelName,
        evidenceRecords: evidence,
        readiness:       null,
        priorities:      null,
        playerCount:     count,
      })
      improvementSuggestions = analysis.suggestions
      weakDomains = analysis.suggestions.map(s => s.targetDomain).filter((d, i, arr) => arr.indexOf(d) === i)
    }

    return {
      levelId,
      levelName,
      playerCount:             count,
      advancementEligibleCount: eligible,
      improvementSuggestions,
      weakDomains,
      hasEvidence:             evidence.length > 0,
      evidenceSource,
    }
  })

  return { byLevel, totalCount, eligibleTotal, available: true }
}

function emptyPlayerLevelSummary(levelId: string, levelName: string): PlayerLevelSummary {
  return {
    levelId,
    levelName,
    playerCount:              0,
    advancementEligibleCount: 0,
    improvementSuggestions:   [],
    weakDomains:              [],
    hasEvidence:              false,
    evidenceSource:           'none',
  }
}

// ── Assessment fallback ───────────────────────────────────────────────────────
// Synthesises EvidenceRecord-shaped objects from assessments when
// player_evidence_records table is empty or unavailable.
// Links assessments to levels via player_curriculum_states.current_level_id.

async function fallbackEvidenceFromAssessments(
  rawDb: any,
  academyId: string,
  playerCountByLevel: Record<string, number>,
  levelIds: string[],
): Promise<Record<string, EvidenceRecord[]>> {
  const result: Record<string, EvidenceRecord[]> = {}

  try {
    // Get player IDs per level from player_curriculum_states (already queried above,
    // but we need them here to join with assessments)
    const { data: stateRows } = await rawDb
      .from('player_curriculum_states')
      .select('player_id, current_level_id')
      .eq('academy_id', academyId)
      .in('current_level_id', levelIds)

    const playerLevelMap: Record<string, string> = {}
    for (const row of (stateRows ?? []) as Array<{ player_id: string; current_level_id: string }>) {
      if (row.player_id && row.current_level_id) {
        playerLevelMap[row.player_id] = row.current_level_id
      }
    }

    const playerIds = Object.keys(playerLevelMap)
    if (playerIds.length === 0) return result

    const { data: assessmentRows } = await rawDb
      .from('assessments')
      .select('id, player_id, assessed_date, type, overall_score, scores_detail')
      .eq('academy_id', academyId)
      .in('player_id', playerIds)
      .order('assessed_date', { ascending: false })
      .limit(200)

    for (const a of (assessmentRows ?? []) as Array<{
      id: string; player_id: string; assessed_date: string;
      type: string; overall_score: number | null; scores_detail: unknown
    }>) {
      const levelId = playerLevelMap[a.player_id]
      if (!levelId) continue
      if (!result[levelId]) result[levelId] = []

      const score = a.overall_score ?? 50
      const strength: EvidenceRecord['evidence_strength'] =
        score >= 70 ? 'strong' : score >= 45 ? 'moderate' : 'weak'

      result[levelId].push({
        id:                        `fallback_${a.id}`,
        academy_id:                academyId,
        player_id:                 a.player_id,
        source_type:               'assessment_score',
        source_id:                 a.id,
        curriculum_level_id:       levelId,
        curriculum_level_name:     null,
        curriculum_requirement_id: null,
        curriculum_requirement_label: null,
        priority_key:              null,
        priority_label:            null,
        pathway:                   'skill',
        evidence_category:         'technical',
        confidence:                score,
        evidence_strength:         strength,
        evidence_weight:           1.0,
        evidence_summary:          `Assessment score: ${score} (${a.type ?? 'general'})`,
        visible_to_director:       true,
        visible_to_coach:          true,
        visible_to_parent:         false,
        visible_to_player:         false,
        owner_scope:               'academy_owned',
        portability_status:        'internal_only',
        consent_status:            'not_required',
        consent_version:           null,
        anonymized_player_key:     null,
        former_player_stage:       null,
        former_player_age_band:    null,
        anonymized_at:             null,
        transferred_at:            null,
        expires_at:                null,
        created_by:                null,
        created_at:                a.assessed_date,
        updated_at:                a.assessed_date,
      })
    }
  } catch {
    // Assessments unavailable — return empty
  }

  return result
}

// ── Main loader ───────────────────────────────────────────────────────────────

export async function buildCurriculumIntelligenceContext(
  db: DB,
  academyId: string,
  rawSettings: Record<string, unknown>,
): Promise<CurriculumIntelligenceContext> {
  const dataGaps: string[] = []
  const rawDb = db as any

  // Extract academy DNA from settings (already loaded by page.tsx)
  const rawDna = (rawSettings.academy_dna as Record<string, unknown>) ?? null
  const academyDna = extractDna(rawDna)
  if (!academyDna.hasDna) dataGaps.push('academy_dna_not_set')

  // Extract memory from settings
  const memory: CurriculumMemoryEntry[] = Array.isArray(rawSettings.donna_curriculum_memory)
    ? (rawSettings.donna_curriculum_memory as CurriculumMemoryEntry[])
    : []

  // ── Curriculum levels ─────────────────────────────────────────────────────

  const { data: levelRows, error: levelErr } = await db
    .from('curriculum_levels')
    .select('id, display_name, stage, sort_order')
    .order('sort_order', { ascending: true })

  if (levelErr || !levelRows) dataGaps.push('curriculum_levels')

  // ── Academy-owned item counts per level ────────────────────────────────────

  const { data: itemRows, error: itemErr } = await rawDb
    .from('curriculum_content_items')
    .select('id, title, level_id, content_type, domain')
    .eq('academy_id', academyId)
    .limit(200)

  if (itemErr) dataGaps.push('item_counts')

  const itemCountByLevel: Record<string, Record<string, number>> = {}
  const curriculumItems: CurriculumItemSummary[] = []

  for (const row of (itemRows ?? []) as Array<{
    id: string; title: string; level_id: string; content_type: string; domain: string | null
  }>) {
    if (!row.level_id) continue
    if (!itemCountByLevel[row.level_id]) itemCountByLevel[row.level_id] = {}
    itemCountByLevel[row.level_id][row.content_type] =
      (itemCountByLevel[row.level_id][row.content_type] ?? 0) + 1
  }

  // Build item summary list after level name map is ready (populated below)
  // We'll fill curriculumItems after levels are built.

  const levels: CurriculumLevelSummary[] = (levelRows ?? []).map(l => {
    const byType = itemCountByLevel[l.id] ?? {}
    const total = Object.values(byType).reduce((s, n) => s + n, 0)
    return {
      id:              l.id,
      displayName:     l.display_name ?? '',
      stage:           (l as any).stage ?? '',
      sortOrder:       (l as any).sort_order ?? 0,
      itemCount:       total,
      itemCountByType: byType,
      isEmpty:         total === 0,
      isSparse:        total > 0 && total < 3,
    }
  })

  // ── Global gates ──────────────────────────────────────────────────────────

  const { data: gateRows, error: gateErr } = await rawDb
    .from('curriculum_gates')
    .select('id, from_level_id, to_level_id, domain, criterion, gate_type')
    .eq('is_active', true)

  if (gateErr) dataGaps.push('curriculum_gates')

  const gates: CurriculumGateSummary[] = (gateRows ?? []).map((g: any) => ({
    id:          g.id,
    fromLevelId: g.from_level_id,
    toLevelId:   g.to_level_id,
    domain:      g.domain ?? '',
    criterion:   g.criterion ?? '',
    gateType:    g.gate_type ?? '',
  }))

  // ── Pending overrides ─────────────────────────────────────────────────────

  const { data: overrideRows, error: overrideErr } = await rawDb
    .from('academy_curriculum_overrides')
    .select('id, override_type, target_type, target_id, proposed_change, created_at')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(20)

  if (overrideErr) dataGaps.push('pending_overrides')

  const pendingOverrides: PendingOverrideSummary[] = (overrideRows ?? []).map((o: any) => {
    const change = o.proposed_change as Record<string, unknown> | null
    return {
      id:           o.id,
      overrideType: o.override_type ?? '',
      targetType:   o.target_type ?? '',
      targetId:     o.target_id ?? null,
      levelId:      change?.level_id as string | null ?? null,
      title:        change?.title as string | null ?? null,
      createdAt:    o.created_at ?? '',
    }
  })

  // ── Player intelligence ───────────────────────────────────────────────────

  const levelIds = (levelRows ?? []).map(l => l.id)
  const levelNameMap: Record<string, string> = {}
  for (const l of levelRows ?? []) levelNameMap[l.id] = l.display_name ?? l.id

  // ── Populate curriculumItems now that levelNameMap is available ───────────
  for (const row of (itemRows ?? []) as Array<{
    id: string; title: string; level_id: string; content_type: string; domain: string | null
  }>) {
    if (!row.level_id || !row.id) continue
    curriculumItems.push({
      id:          row.id,
      title:       row.title ?? '',
      contentType: row.content_type ?? '',
      levelId:     row.level_id,
      levelName:   levelNameMap[row.level_id] ?? row.level_id,
      domain:      row.domain ?? null,
    })
  }

  const playerIntel = await loadPlayerIntelligence(rawDb, academyId, levelIds, levelNameMap)

  if (!playerIntel.available) dataGaps.push('player_intelligence')

  // ── Gap report (pure TS — computed from already-loaded data) ─────────────
  const gapReport = buildCurriculumGapReport(levels, gates, curriculumItems)

  return {
    academyDna,
    levels,
    gates,
    pendingOverrides,
    pendingOverrideCount: pendingOverrides.length,
    playerByLevel:               playerIntel.byLevel,
    totalPlayerCount:            playerIntel.totalCount,
    advancementEligibleTotal:    playerIntel.eligibleTotal,
    playerIntelligenceAvailable: playerIntel.available,
    memory,
    curriculumItems,
    gapReport,
    loadedAt: new Date().toISOString(),
    dataAvailable: dataGaps.length === 0,
    dataGaps,
  }
}
