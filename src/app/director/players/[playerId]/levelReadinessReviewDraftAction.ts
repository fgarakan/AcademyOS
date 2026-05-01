'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'

// ─────────────────────────────────────────────────────────────
// Local types — v_player_requirement_progress_detail not yet in database.types.ts
// ─────────────────────────────────────────────────────────────

interface ProgressRow {
  requirement_domain_key: string
  status: string
  is_required: boolean
  evidence_count: number
}

interface DomainStat {
  key: string
  total: number
  met: number
  in_progress: number
  evidence_needed: number
  blocked: number
  not_started: number
  evidence: number
}

// ─────────────────────────────────────────────────────────────
// Readiness label — mirrors LevelReadinessSummary.tsx logic
// ─────────────────────────────────────────────────────────────

function computeReadinessLabel(rows: ProgressRow[]): string {
  const required = rows.filter(r => r.is_required)
  if (required.length === 0) return 'Not Configured'

  const metCount      = required.filter(r => r.status === 'met').length
  const blockedCount  = required.filter(r => r.status === 'blocked').length
  const evNeededCount = required.filter(r => r.status === 'evidence_needed').length
  const totalEvidence = rows.reduce((sum, r) => sum + r.evidence_count, 0)
  const pct           = metCount / required.length

  if (metCount === 0 && totalEvidence === 0) return 'Not Started'
  if (pct < 0.25) return 'Building Foundation'
  if (pct < 0.50) return 'Developing'
  if (pct < 0.75) return 'Strong Progress'
  if (pct < 0.90) return blockedCount === 0 ? 'Nearly Ready' : 'Strong Progress'
  return (blockedCount === 0 && evNeededCount === 0) ? 'Ready for Director Review' : 'Nearly Ready'
}

function computeDomainStats(rows: ProgressRow[]): DomainStat[] {
  const DOMAIN_ORDER = ['skill', 'competition', 'fitness'] as const
  const stats: DomainStat[] = []
  for (const key of DOMAIN_ORDER) {
    const domain = rows.filter(r => r.requirement_domain_key === key)
    if (domain.length === 0) continue
    stats.push({
      key,
      total:           domain.length,
      met:             domain.filter(r => r.status === 'met').length,
      in_progress:     domain.filter(r => r.status === 'in_progress').length,
      evidence_needed: domain.filter(r => r.status === 'evidence_needed').length,
      blocked:         domain.filter(r => r.status === 'blocked').length,
      not_started:     domain.filter(r => r.status === 'not_started').length,
      evidence:        domain.reduce((sum, r) => sum + r.evidence_count, 0),
    })
  }
  return stats
}

// ─────────────────────────────────────────────────────────────
// Result type
// ─────────────────────────────────────────────────────────────

export interface LevelReadinessReviewDraftResult {
  ok: boolean
  error: string | null
  draftId: string | null
}

// ─────────────────────────────────────────────────────────────
// Server action
// Creates a proposed_actions row for director review.
// No level movement. No player_curriculum_states update.
// Not visible to parents or players.
// ─────────────────────────────────────────────────────────────

export async function createLevelReadinessReviewDraftAction(
  playerId: string
): Promise<LevelReadinessReviewDraftResult> {
  const fail = (error: string): LevelReadinessReviewDraftResult =>
    ({ ok: false, error, draftId: null })

  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')
  if (!playerId) return fail('Missing player ID.')

  // 2. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  // 3. Verify active academy membership — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const memberRole = membership?.role
  if (memberRole !== 'academy_director' && memberRole !== 'head_coach') {
    return fail('You do not have permission to create level readiness review drafts.')
  }

  // 4. Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  const rawDb = supabase as any

  // 5. Check for existing pending draft — prevent duplicates
  const { data: existingDrafts } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('target_module', 'level_readiness_review')
    .eq('target_object_id', playerId)
    .eq('status', 'pending_review')
    .limit(1)

  if (existingDrafts && existingDrafts.length > 0) {
    return fail(
      'A pending level readiness review already exists for this player. Review or dismiss the existing draft first.'
    )
  }

  // 6. Fetch current level display name
  let currentLevelName: string | null = null
  const { data: rawCurriculumState } = await rawDb
    .from('player_curriculum_states')
    .select('current_level_id')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)
    .limit(1)

  if (rawCurriculumState && rawCurriculumState.length > 0) {
    const levelId = rawCurriculumState[0]?.current_level_id
    if (levelId) {
      const { data: levelData } = await rawDb
        .from('curriculum_levels')
        .select('display_name')
        .eq('id', levelId)
        .limit(1)
      currentLevelName = levelData?.[0]?.display_name ?? null
    }
  }

  // 7. Fetch requirement progress snapshot — rawDb avoids TS2589
  const { data: rawReqs } = await rawDb
    .from('v_player_requirement_progress_detail')
    .select('requirement_domain_key, status, is_required, evidence_count')
    .eq('academy_id', academyId)
    .eq('player_id', playerId)

  const progressRows: ProgressRow[] = (rawReqs ?? []) as ProgressRow[]

  if (progressRows.length === 0) {
    return fail('No requirement progress rows are available for this player yet.')
  }

  // 8. Compute readiness snapshot — deterministic, no AI API
  const required      = progressRows.filter(r => r.is_required)
  const metCount      = required.filter(r => r.status === 'met').length
  const blockedCount  = required.filter(r => r.status === 'blocked').length
  const evNeeded      = required.filter(r => r.status === 'evidence_needed').length
  const totalEvidence = progressRows.reduce((sum, r) => sum + r.evidence_count, 0)
  const readinessLabel = computeReadinessLabel(progressRows)
  const domainStats    = computeDomainStats(progressRows)

  // 9. Build proposed_payload
  const payload = {
    draft_type: 'level_readiness_review_v1',
    player_id: playerId,
    current_level_name: currentLevelName,
    readiness_label: readinessLabel,
    met_count: metCount,
    total_required: required.length,
    evidence_count: totalEvidence,
    blocked_count: blockedCount,
    evidence_needed_count: evNeeded,
    domain_stats: domainStats,
    snapshot_at: new Date().toISOString(),
    warnings: [
      'Draft only. No level movement has occurred.',
      'Director review is required before any level change.',
      'Not visible to parents or players.',
    ],
  }

  // 10. Create voice_commands relay row — proposed_actions.voice_command_id is NOT NULL
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: memberRole as any,
      input_method: 'typed',
      raw_input: `Level readiness review draft requested for player: ${playerId}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return fail(`Failed to create command record: ${vcError?.message ?? 'unknown'}`)
  }

  // 11. Insert proposed_actions — status pending_review
  //     Never writes player_curriculum_states, player level, or any level-movement table
  const { data: proposedAction, error: paError } = await supabase
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: 'Level Readiness Review',
      target_module: 'level_readiness_review',
      target_object_id: playerId,
      target_object_type: 'player',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. No level movement has occurred.',
        'No player_curriculum_states rows were modified.',
        'Not visible to parents or players.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return fail(`Failed to save readiness review draft: ${paError?.message ?? 'unknown'}`)
  }

  return { ok: true, error: null, draftId: proposedAction.id }
}
