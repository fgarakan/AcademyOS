'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { triggerEntitySummaryAfterObservation } from '@/lib/donna/donnaEntitySummaryPopulator'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PlayerObservationInput {
  playerId: string
  playerName: string
  note: string
  observationType: 'general' | 'positive' | 'needs_attention'
}

export interface SaveWrapUpObservationsResult {
  ok: boolean
  savedCount: number
  error: string | null
}

export interface CoachObservationDraftPayload {
  draft_type: 'coach_observation_draft_v1'
  player_id: string
  player_name: string
  session_id: string
  session_title: string
  note: string
  observation_type: 'general' | 'positive' | 'needs_attention'
  is_private: true
  source: 'coach_wrap_up'
}

// ─────────────────────────────────────────────────────────────
// Server action
// Routes each observation through proposed_actions for director review.
// No coach_observations rows are created here — director must approve + apply.
// ─────────────────────────────────────────────────────────────

export async function saveWrapUpObservationsAction(
  sessionId: string,
  observations: PlayerObservationInput[],
  sessionTitle?: string,
): Promise<SaveWrapUpObservationsResult> {
  try { await assertNotPreviewMode() } catch {
    return { ok: false, savedCount: 0, error: 'Writes are disabled in preview mode.' }
  }

  if (observations.length === 0) return { ok: true, savedCount: 0, error: null }

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, savedCount: 0, error: 'Not authenticated.' }

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, savedCount: 0, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify role — coach or above
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (!role || !['academy_director', 'head_coach', 'coach'].includes(role)) {
    return { ok: false, savedCount: 0, error: 'Not authorized to submit player observations.' }
  }

  // 4. Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, savedCount: 0, error: 'Session not found or access denied.' }

  const resolvedSessionTitle = sessionTitle ?? session.name ?? 'Untitled Session'

  // 5. Verify each player belongs to this academy (never trust client-side player IDs)
  const playerIds = observations.map(o => o.playerId)
  const { data: validPlayers } = await supabase
    .from('players')
    .select('id')
    .in('id', playerIds)
    .eq('academy_id', academyId)
    .eq('is_active', true)
  const validPlayerIds = new Set((validPlayers ?? []).map(p => p.id))

  // 6. Create one voice_commands record for this observation batch (required FK for proposed_actions)
  const issuerRole = role === 'academy_director' ? 'academy_director'
    : role === 'head_coach' ? 'head_coach'
    : 'coach'

  const rawDb = supabase as any
  const { data: voiceCommand, error: vcError } = await rawDb
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole,
      input_method: 'typed',
      raw_input: `[Wrap-Up Observations] ${resolvedSessionTitle}`,
      transcript: `[Wrap-Up Observations] ${resolvedSessionTitle}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return { ok: false, savedCount: 0, error: `Failed to create command record: ${vcError?.message ?? 'unknown'}` }
  }

  // 7. Create one proposed_actions row per valid, non-empty observation.
  //    No coach_observations are written here — director review is required.
  let savedCount = 0
  for (const obs of observations) {
    if (!obs.note.trim()) continue
    if (!validPlayerIds.has(obs.playerId)) continue

    const payload: CoachObservationDraftPayload = {
      draft_type: 'coach_observation_draft_v1',
      player_id: obs.playerId,
      player_name: obs.playerName,
      session_id: sessionId,
      session_title: resolvedSessionTitle,
      note: obs.note.trim(),
      observation_type: obs.observationType,
      is_private: true,
      source: 'coach_wrap_up',
    }

    const { error: paError } = await rawDb
      .from('proposed_actions')
      .insert({
        academy_id: academyId,
        proposed_by_id: user.id,
        voice_command_id: voiceCommand.id,
        action_type: 'other',
        action_label: `Player Observation — ${obs.playerName} (${resolvedSessionTitle})`,
        target_module: 'coach_observation_draft_v1',
        target_object_id: obs.playerId,
        target_object_type: 'player',
        proposed_payload: payload,
        status: 'pending_review',
        risk_level: 'low',
        risk_notes: [
          'Internal coach observation — not visible to parent or player.',
          'Requires director review and explicit apply before writing to coach_observations.',
          'No player profile, curriculum record, or parent communication is modified by this draft.',
        ],
      })

    if (!paError) savedCount++
  }

  // Sprint 925 — fire-and-forget entity summary updates per observed player
  // Never throws, never blocks the return value above.
  if (savedCount > 0) {
    for (const obs of observations) {
      if (!validPlayerIds.has(obs.playerId) || !obs.note.trim()) continue
      void triggerEntitySummaryAfterObservation(supabase, {
        academyId,
        playerId: obs.playerId,
        playerName: obs.playerName,
        lastObservationDate: new Date().toISOString(),
      })
    }
  }

  return { ok: true, savedCount, error: null }
}
