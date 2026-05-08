'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface DraftSummaryUpdateResult {
  ok: boolean
  draftId: string | null
  error: string | null
  observationCount: number
}

export interface DevelopmentSummaryDraftPayload {
  draft_type: 'development_summary_draft_v1'
  player_id: string
  player_name: string
  proposed_strengths: string[]
  proposed_work_on: string[]
  proposed_coach_summary: string
  source_observation_count: number
  generated_from: 'recent_observations'
}

// Deterministic — no AI. Assembles from approved coach_observations already on file.
export async function draftSummaryUpdateAction(
  playerId: string,
  academyId: string,
): Promise<DraftSummaryUpdateResult> {
  const fail = (error: string): DraftSummaryUpdateResult =>
    ({ ok: false, draftId: null, error, observationCount: 0 })

  try { await assertNotPreviewMode() } catch {
    return fail('Writes are disabled in preview mode.')
  }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('Not authenticated.')

  // Verify profile academy_id — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id || profile.academy_id !== academyId) {
    return fail('Academy context mismatch.')
  }

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

  // Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name, full_name')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return fail('Player not found or access denied.')

  const playerName = player.full_name ?? `${player.first_name} ${player.last_name}`.trim()

  // Fetch recent coach_observations (is_private = true, ordered newest first)
  const { data: observations } = await supabase
    .from('coach_observations')
    .select('id, content, observation_type, is_private, created_at')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .eq('is_private', true)
    .order('created_at', { ascending: false })
    .limit(10)

  const obs = observations ?? []
  if (obs.length === 0) {
    return fail('No internal observations found for this player. Add coach observations before drafting a summary update.')
  }

  // Deterministic assembly from observation types
  const strengths = obs
    .filter(o => o.observation_type === 'positive' || o.observation_type === 'positive_highlight')
    .slice(0, 3)
    .map(o => o.content)

  const workOn = obs
    .filter(o => o.observation_type === 'needs_attention')
    .slice(0, 3)
    .map(o => o.content)

  const summaryParts = obs.slice(0, 5).map(o => o.content)
  const proposedCoachSummary = summaryParts.join(' | ')

  const payload: DevelopmentSummaryDraftPayload = {
    draft_type: 'development_summary_draft_v1',
    player_id: playerId,
    player_name: playerName,
    proposed_strengths: strengths,
    proposed_work_on: workOn,
    proposed_coach_summary: proposedCoachSummary,
    source_observation_count: obs.length,
    generated_from: 'recent_observations',
  }

  const rawDb = supabase as any

  // Create voice_commands record (required FK for proposed_actions)
  const issuerRole = role === 'academy_director' ? 'academy_director' : 'head_coach'
  const { data: voiceCommand, error: vcError } = await rawDb
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole,
      input_method: 'typed',
      raw_input: `[Summary Draft] ${playerName}`,
      transcript: `[Summary Draft] ${playerName}`,
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
      action_label: `Development Summary Update — ${playerName}`,
      target_module: 'development_summary_draft_v1',
      target_object_id: playerId,
      target_object_type: 'player',
      proposed_payload: payload,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
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

  return { ok: true, draftId: proposedAction.id as string, error: null, observationCount: obs.length }
}
