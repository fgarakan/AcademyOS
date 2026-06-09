// Sprint 742B — Extended Context Loaders V1
// Sprint 742C — Added currentLevelDisplayName (join with curriculum_levels) to PlayerCurriculumStateSummary;
//               added curriculumLevelId to TemplateSummary for UUID-based coverage gap matching.
// Mega Sprint 1475–1504 — Added CoachContextSummary, CurriculumLevelContextSummary,
//               loadCoachesSummary(), loadCurriculumLevelsSummary() for player relationship resolution.
// Lightweight read-only loaders for player_curriculum_states, assessments, groups, templates, coaches, curriculum_levels.
// No migrations required. All tables have academy_id RLS scoping (curriculum_levels is global, authenticated-read RLS).
// All loaders fail safely — any error returns insufficient_data, never throws.
// rawDb pattern (db as any) used for tables with deep Supabase type inference to prevent TS2589.

import type { DB } from '@/lib/types/db'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Summary types ─────────────────────────────────────────────────────────────

export interface PlayerCurriculumStateSummary {
  playerId: string
  playerName: string                       // Sprint 742G: joined from players.first_name + last_name
  currentLevelId: string
  currentLevelDisplayName: string | null   // Sprint 742C: joined from curriculum_levels.display_name
  advancementEligible: boolean
  enrolledAt: string
  lastEvaluatedAt: string | null
}

export interface AssessmentSummary {
  assessmentId: string
  playerId: string
  type: string
  assessedDate: string
  promotionReady: boolean
  overallScore: number | null
}

export interface GroupSummary {
  groupId: string
  name: string
  levelId: string | null
  track: string | null
  maxPlayers: number | null
}

export interface CoachContextSummary {
  coachId: string
  displayName: string
  firstName: string
  lastName: string
  role: 'head_coach' | 'coach' | 'assistant_coach'
}

export interface CurriculumLevelContextSummary {
  id: string
  displayName: string
  stage: string
  levelNumber: number
  sortOrder: number
}

export interface TemplateSummary {
  templateId: string
  name: string
  templateType: string | null
  status: string
  curriculumLevelId: string | null    // Sprint 742C: UUID for matching against player_curriculum_states.current_level_id
  curriculumLevelKey: string | null
  curriculumStageKey: string | null
  totalDurationMin: number | null
  track: string | null
}

// ── Result types ───────────────────────────────────────────────────────────────

export interface PlayerCurriculumStateResult {
  summaries: PlayerCurriculumStateSummary[]
  totalCount: number
  advancementEligibleCount: number
  fieldStatus: COOFieldStatus
}

export interface AssessmentResult {
  summaries: AssessmentSummary[]
  totalCount: number
  recentCount: number
  fieldStatus: COOFieldStatus
}

export interface GroupResult {
  summaries: GroupSummary[]
  totalCount: number
  fieldStatus: COOFieldStatus
}

export interface CoachContextResult {
  summaries: CoachContextSummary[]
  totalCount: number
  fieldStatus: COOFieldStatus
}

export interface CurriculumLevelContextResult {
  summaries: CurriculumLevelContextSummary[]
  totalCount: number
  fieldStatus: COOFieldStatus
}

export interface TemplateResult {
  summaries: TemplateSummary[]
  totalCount: number
  activeCount: number
  fieldStatus: COOFieldStatus
}

// ── Config ─────────────────────────────────────────────────────────────────────

const SUMMARY_LIMIT = 30

// ── 1. Player curriculum state loader ─────────────────────────────────────────
// Reads player_curriculum_states — academy_id scoped.
// Returns the most recently enrolled players first, capped at SUMMARY_LIMIT.
// advancement_eligible flag is surfaced so DONNA can alert directors.

export async function loadPlayerCurriculumStates(
  db: DB,
  academyId: string,
): Promise<PlayerCurriculumStateResult> {
  try {
    // rawDb: player_curriculum_states has complex FK relationships that can trigger TS2589
    const rawDb = db as any
    // Sprint 742C: join curriculum_levels to get display_name for human-readable gap messages.
    // Sprint 742G: join players to get first_name + last_name for stall detector answers.
    // curriculum_levels is global (no academy_id) with authenticated-read RLS — safe to join.
    // players is academy-scoped; RLS ensures only academy players are returned.
    const { data, count } = await rawDb
      .from('player_curriculum_states')
      .select(
        'player_id, current_level_id, advancement_eligible, enrolled_at, last_evaluated_at, curriculum_levels(display_name), players(first_name, last_name)',
        { count: 'exact' },
      )
      .eq('academy_id', academyId)
      .order('enrolled_at', { ascending: false })
      .limit(SUMMARY_LIMIT)

    const rows = (data ?? []) as Array<{
      player_id: string
      current_level_id: string
      advancement_eligible: boolean
      enrolled_at: string
      last_evaluated_at: string | null
      curriculum_levels: { display_name: string } | null
      players: { first_name: string | null; last_name: string | null } | null
    }>

    const summaries: PlayerCurriculumStateSummary[] = rows.map(r => ({
      playerId: r.player_id,
      playerName: [r.players?.first_name, r.players?.last_name].filter(Boolean).join(' ') || 'Player',
      currentLevelId: r.current_level_id,
      currentLevelDisplayName: r.curriculum_levels?.display_name ?? null,
      advancementEligible: r.advancement_eligible,
      enrolledAt: r.enrolled_at,
      lastEvaluatedAt: r.last_evaluated_at,
    }))

    const advancementEligibleCount = summaries.filter(s => s.advancementEligible).length
    const totalCount = (count as number | null) ?? summaries.length

    return {
      summaries,
      totalCount,
      advancementEligibleCount,
      fieldStatus: totalCount > 0 ? 'live' : 'insufficient_data',
    }
  } catch {
    return {
      summaries: [],
      totalCount: 0,
      advancementEligibleCount: 0,
      fieldStatus: 'insufficient_data',
    }
  }
}

// ── 2. Assessment summary loader ───────────────────────────────────────────────
// Reads assessments — academy_id scoped.
// Returns the most recently assessed records, capped at SUMMARY_LIMIT.
// recentCount = assessments with assessed_date in last 30 days.
// Note: assessments table has no 'status' column — recency used as proxy for pipeline health.

export async function loadAssessmentsSummary(
  db: DB,
  academyId: string,
): Promise<AssessmentResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  try {
    // rawDb: assessments.type is Database["public"]["Enums"]["assessment_type"] — rawDb avoids cast errors
    const rawDb = db as any
    const { data, count } = await rawDb
      .from('assessments')
      .select(
        'id, player_id, type, assessed_date, promotion_ready, overall_score',
        { count: 'exact' },
      )
      .eq('academy_id', academyId)
      .order('assessed_date', { ascending: false })
      .limit(SUMMARY_LIMIT)

    const rows = (data ?? []) as Array<{
      id: string
      player_id: string
      type: string
      assessed_date: string
      promotion_ready: boolean
      overall_score: number | null
    }>

    const summaries: AssessmentSummary[] = rows.map(r => ({
      assessmentId: r.id,
      playerId: r.player_id,
      type: r.type,
      assessedDate: r.assessed_date,
      promotionReady: r.promotion_ready,
      overallScore: r.overall_score,
    }))

    const recentCount = summaries.filter(s => s.assessedDate >= thirtyDaysAgo).length
    const totalCount = (count as number | null) ?? summaries.length

    return {
      summaries,
      totalCount,
      recentCount,
      fieldStatus: totalCount > 0 ? 'live' : 'insufficient_data',
    }
  } catch {
    return {
      summaries: [],
      totalCount: 0,
      recentCount: 0,
      fieldStatus: 'insufficient_data',
    }
  }
}

// ── 3. Group summary loader ────────────────────────────────────────────────────
// Reads groups — academy_id scoped, is_active = true only.
// Returns active groups ordered by name, capped at SUMMARY_LIMIT.
// groups table queries cleanly via typed DB (no TS2589 risk — see groupHealthLoader.ts pattern).

export async function loadGroupsSummary(
  db: DB,
  academyId: string,
): Promise<GroupResult> {
  try {
    const { data: rows } = await db
      .from('groups')
      .select('id, name, level_id, track, max_players')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(SUMMARY_LIMIT)

    const summaries: GroupSummary[] = (rows ?? []).map(r => ({
      groupId: r.id,
      name: r.name,
      levelId: r.level_id,
      track: r.track as string | null,
      maxPlayers: r.max_players,
    }))

    return {
      summaries,
      totalCount: summaries.length,
      fieldStatus: summaries.length > 0 ? 'live' : 'insufficient_data',
    }
  } catch {
    return { summaries: [], totalCount: 0, fieldStatus: 'insufficient_data' }
  }
}

// ── 4. Template summary loader ─────────────────────────────────────────────────
// Reads templates — academy_id scoped, is_active = true only.
// Returns most recently updated active templates, capped at SUMMARY_LIMIT.
// curriculum_level_key and curriculum_stage_key surface curriculum coverage for DONNA reasoning.

export async function loadTemplatesSummary(
  db: DB,
  academyId: string,
): Promise<TemplateResult> {
  try {
    // rawDb: templates has many columns and complex FK relationships — use rawDb to prevent TS2589
    const rawDb = db as any
    // Sprint 742C: also select curriculum_level_id (UUID) for matching against player_curriculum_states.current_level_id.
    const { data, count } = await rawDb
      .from('templates')
      .select(
        'id, name, template_type, status, curriculum_level_id, curriculum_level_key, curriculum_stage_key, total_duration_min, track',
        { count: 'exact' },
      )
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(SUMMARY_LIMIT)

    const rows = (data ?? []) as Array<{
      id: string
      name: string
      template_type: string | null
      status: string
      curriculum_level_id: string | null
      curriculum_level_key: string | null
      curriculum_stage_key: string | null
      total_duration_min: number | null
      track: string | null
    }>

    const summaries: TemplateSummary[] = rows.map(r => ({
      templateId: r.id,
      name: r.name,
      templateType: r.template_type,
      status: r.status,
      curriculumLevelId: r.curriculum_level_id,
      curriculumLevelKey: r.curriculum_level_key,
      curriculumStageKey: r.curriculum_stage_key,
      totalDurationMin: r.total_duration_min,
      track: r.track,
    }))

    const activeCount = summaries.length
    const totalCount = (count as number | null) ?? summaries.length

    return {
      summaries,
      totalCount,
      activeCount,
      fieldStatus: totalCount > 0 ? 'live' : 'insufficient_data',
    }
  } catch {
    return {
      summaries: [],
      totalCount: 0,
      activeCount: 0,
      fieldStatus: 'insufficient_data',
    }
  }
}

// ── 5. Coach context loader ────────────────────────────────────────────────────
// Reads academy_memberships (head_coach + coach roles) + profiles (display_name).
// Used by the entity context (BLOCKER 6 fix) and player creation resolution.
// profiles.display_name is split into firstName/lastName for the resolver.

export async function loadCoachesSummary(
  db: DB,
  academyId: string,
): Promise<CoachContextResult> {
  try {
    const { data: memberships } = await db
      .from('academy_memberships')
      .select('profile_id, role')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .in('role', ['head_coach', 'coach'])

    const coachIds = (memberships ?? []).map(m => m.profile_id)
    if (coachIds.length === 0) {
      return { summaries: [], totalCount: 0, fieldStatus: 'insufficient_data' }
    }

    const { data: profiles } = await db
      .from('profiles')
      .select('id, display_name')
      .in('id', coachIds)

    const roleMap = new Map<string, string>()
    for (const m of memberships ?? []) {
      roleMap.set(m.profile_id, m.role)
    }

    const summaries: CoachContextSummary[] = (profiles ?? []).map(p => {
      const parts     = (p.display_name ?? '').trim().split(/\s+/)
      const firstName = parts[0] ?? ''
      const lastName  = parts.length > 1 ? parts[parts.length - 1] : ''
      const role      = (roleMap.get(p.id) ?? 'coach') as CoachContextSummary['role']
      return { coachId: p.id, displayName: p.display_name ?? '', firstName, lastName, role }
    })

    return {
      summaries,
      totalCount: summaries.length,
      fieldStatus: summaries.length > 0 ? 'live' : 'insufficient_data',
    }
  } catch {
    return { summaries: [], totalCount: 0, fieldStatus: 'insufficient_data' }
  }
}

// ── 6. Curriculum level context loader ────────────────────────────────────────
// Reads curriculum_levels — global table (no academy_id), authenticated-read RLS.
// Used by player creation resolution to map display names to UUIDs.
// rawDb used because curriculum_levels has complex FK inference (TS2589 risk).

export async function loadCurriculumLevelsSummary(
  db: DB,
): Promise<CurriculumLevelContextResult> {
  try {
    const rawDb = db as any
    const { data } = await rawDb
      .from('curriculum_levels')
      .select('id, display_name, stage, level_number, sort_order')
      .order('sort_order', { ascending: true })

    const rows = (data ?? []) as Array<{
      id: string
      display_name: string
      stage: string
      level_number: number
      sort_order: number
    }>

    const summaries: CurriculumLevelContextSummary[] = rows.map(r => ({
      id:          r.id,
      displayName: r.display_name,
      stage:       r.stage,
      levelNumber: r.level_number,
      sortOrder:   r.sort_order,
    }))

    return {
      summaries,
      totalCount: summaries.length,
      fieldStatus: summaries.length > 0 ? 'live' : 'insufficient_data',
    }
  } catch {
    return { summaries: [], totalCount: 0, fieldStatus: 'insufficient_data' }
  }
}
