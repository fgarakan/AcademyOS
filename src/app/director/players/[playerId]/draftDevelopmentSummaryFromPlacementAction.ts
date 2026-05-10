'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { DevelopmentSummaryDraftPayload } from './draftSummaryUpdateAction'

export interface DraftSummaryFromPlacementResult {
  ok: boolean
  draftId: string | null
  error: string | null
  alreadyExists: boolean
}

export async function draftDevelopmentSummaryFromPlacementAction(
  playerId: string,
): Promise<DraftSummaryFromPlacementResult> {
  const fail = (error: string, alreadyExists = false): DraftSummaryFromPlacementResult =>
    ({ ok: false, draftId: null, error, alreadyExists })

  try { await assertNotPreviewMode() } catch {
    return fail('Writes are disabled in preview mode.')
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return fail('Academy context unavailable.')
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return fail('You do not have permission to draft development summary updates.')
  }

  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name, full_name')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  const playerName = player.full_name ?? `${player.first_name} ${player.last_name}`.trim()

  const rawDb = supabase as any

  // Duplicate prevention: block if a placement-seeded draft is already pending or approved
  const { data: existingDrafts } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload')
    .eq('academy_id', academyId)
    .eq('target_module', 'development_summary_draft_v1')
    .eq('target_object_id', playerId)
    .in('status', ['pending_review', 'approved'])

  const hasExisting = ((existingDrafts ?? []) as Array<{ proposed_payload: any }>)
    .some(row => row.proposed_payload?.generated_from === 'placement_seed')
  if (hasExisting) {
    return fail(
      'A placement-seeded development summary draft is already pending review or approved for this player.',
      true,
    )
  }

  // Find the executed placement_recommendation_draft that created this player
  const { data: execDrafts } = await rawDb
    .from('proposed_actions')
    .select('id, proposed_payload, created_at')
    .eq('academy_id', academyId)
    .eq('target_module', 'placement_recommendation_draft')
    .eq('status', 'executed')
    .order('created_at', { ascending: false })
    .limit(20)

  const placementAction = ((execDrafts ?? []) as Array<{ id: string; proposed_payload: any; created_at: string }>)
    .find(row => row.proposed_payload?.created_player_id === playerId)

  if (!placementAction) {
    return fail('No executed placement recommendation found for this player. Cannot seed development summary from placement.')
  }

  const p = placementAction.proposed_payload

  // Build proposed_strengths from assessment observations — no invention
  const proposed_strengths: string[] = []
  if (p?.assessment_summary?.skill_observations) {
    proposed_strengths.push(`Skills (from placement): ${p.assessment_summary.skill_observations}`)
  }
  if (p?.assessment_summary?.movement_observations) {
    proposed_strengths.push(`Movement (from placement): ${p.assessment_summary.movement_observations}`)
  }

  // Build proposed_work_on from first_skill_priority + standard early-stage prompts
  const proposed_work_on: string[] = []
  if (p?.first_skill_priority) proposed_work_on.push(p.first_skill_priority)
  proposed_work_on.push('Assign curriculum level from Skill Path tab')
  proposed_work_on.push('Observe first 2–3 sessions for confirmation')

  // Build coach summary from placement descriptor fields
  const summaryParts: string[] = []
  if (p?.starting_pathway)       summaryParts.push(`Starting pathway: ${p.starting_pathway}`)
  if (p?.suggested_group_type)   summaryParts.push(`Suggested group type: ${p.suggested_group_type}`)
  if (p?.recommended_group_name) summaryParts.push(`Assigned group: ${p.recommended_group_name}`)
  if (p?.confidence)             summaryParts.push(`Placement confidence: ${p.confidence}`)
  if (p?.assessment_summary?.competitive_readiness) {
    summaryParts.push(`Competitive readiness: ${p.assessment_summary.competitive_readiness}`)
  }
  const proposed_coach_summary = summaryParts.join(' | ')

  const assessmentFields = [
    p?.assessment_summary?.age_band,
    p?.assessment_summary?.ball_color,
    p?.assessment_summary?.skill_observations,
    p?.assessment_summary?.movement_observations,
    p?.assessment_summary?.competitive_readiness,
  ]
  const source_observation_count = assessmentFields.filter(Boolean).length

  const payload: DevelopmentSummaryDraftPayload = {
    draft_type: 'development_summary_draft_v1',
    player_id: playerId,
    player_name: playerName,
    proposed_strengths,
    proposed_work_on,
    proposed_coach_summary,
    source_observation_count,
    generated_from: 'placement_seed',
    source_proposed_action_id: placementAction.id,
    internal_notes: [
      'Source: placement_recommendation_draft (executed).',
      'current_level_id may still be NULL — assign from Skill Path tab.',
      'Not shown to parents or players.',
    ].join(' '),
  }

  const issuerRole: string = role === 'academy_director' ? 'academy_director' : 'head_coach'
  const { data: voiceCommand, error: vcError } = await rawDb
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole,
      input_method: 'typed',
      raw_input: `[Placement Seed] Development Summary Draft — ${playerName}`,
      transcript: `[Placement Seed] Development Summary Draft — ${playerName}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return fail(`Failed to create command record: ${vcError?.message ?? 'unknown'}`)
  }

  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Development Summary Draft — ${playerName} (from placement)`,
      target_module: 'development_summary_draft_v1',
      target_object_id: playerId,
      target_object_type: 'player',
      proposed_payload: payload,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Seeded from placement recommendation — no AI generation.',
        'Updates internal development summary only.',
        'Does not change player level, curriculum, or parent/player-facing communication.',
        'Requires director review and explicit apply before writing to player_development_summary.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return fail(`Failed to create draft: ${paError?.message ?? 'unknown'}`)
  }

  return { ok: true, draftId: proposedAction.id as string, error: null, alreadyExists: false }
}
