'use server'

// Sprint 41 — Voice Intake Execution Routing V1
// Executes approved voice intake drafts for safe, internal-only action types.
// Human approval required before this action can be called.
// No parent/player exposure. No automatic level changes.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'

const EXECUTABLE_INTENTS = new Set([
  'create_player_observation',
  'record_director_note',
  'create_session_recap',
  'create_gap_signal',
  'alert_director',
])

export interface ExecuteVoiceIntakeDraftResult {
  ok: boolean
  error: string | null
  executedType: string | null
  noteId?: string
}

export async function executeVoiceIntakeDraftAction(
  proposedActionId: string,
): Promise<ExecuteVoiceIntakeDraftResult> {
  const fail = (error: string): ExecuteVoiceIntakeDraftResult =>
    ({ ok: false, error, executedType: null })

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

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
  if (!membership?.role || !['academy_director', 'head_coach'].includes(membership.role)) {
    return fail('Insufficient permissions.')
  }

  // Fetch the approved voice intake draft
  const { data: action } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload, approved_by')
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)
    .single()

  if (!action) return fail('Draft not found.')
  if (action.academy_id !== academyId) return fail('Access denied.')
  if (action.target_module !== 'voice_intake') return fail('Not a voice intake draft.')
  if (action.status !== 'approved') return fail('Draft must be approved before execution.')

  const payload = action.proposed_payload as Record<string, unknown>
  if (payload?.draft_type !== 'voice_intake_v1') return fail('Unsupported draft type.')

  const detectedIntents = (payload.extracted_entities as unknown[]) ?? []
  const intents: string[] = Array.isArray(payload.detected_intents)
    ? (payload.detected_intents as string[])
    : []
  const primaryIntent = intents.find(i => EXECUTABLE_INTENTS.has(i))

  if (!primaryIntent) {
    return {
      ok: false,
      error: `No executable intent found. Detected: ${intents.join(', ') || 'none'}. This draft type requires manual handling.`,
      executedType: null,
    }
  }

  const transcript = (payload.raw_transcript as string) ?? ''
  const summary = (payload.cleaned_summary as string) || transcript
  const ctx = (payload.context as Record<string, string | undefined>) ?? {}
  const sessionId: string | undefined = ctx.session_id
  const affectedPlayers: string[] = Array.isArray(payload.affected_players)
    ? (payload.affected_players as string[])
    : []

  // Build observation content
  const playerContext = affectedPlayers.length > 0
    ? ` [Mentioned players: ${affectedPlayers.join(', ')}]`
    : ''
  const content = `${summary}${playerContext}`

  if (
    primaryIntent === 'create_player_observation' ||
    primaryIntent === 'record_director_note' ||
    primaryIntent === 'create_gap_signal' ||
    primaryIntent === 'alert_director'
  ) {
    // Create an internal coach_observation — is_private=true, no parent/player exposure
    const obsType = primaryIntent === 'create_gap_signal' ? 'gap_signal' :
                    primaryIntent === 'alert_director' ? 'concern' : 'general'

    const { data: obs, error: obsErr } = await rawDb
      .from('coach_observations')
      .insert({
        academy_id: academyId,
        coach_id: user.id,
        player_id: null,
        session_id: sessionId ?? null,
        content,
        observation_type: obsType,
        is_private: true,
        ai_entities: detectedIntents,
      })
      .select('id')
      .single()

    if (obsErr) return fail(`Failed to create observation: ${obsErr.message}`)

    // Mark proposed_action as applied
    await rawDb
      .from('proposed_actions')
      .update({ status: 'applied', applied_at: new Date().toISOString() })
      .eq('id', proposedActionId)
      .eq('academy_id', academyId)

    revalidatePath('/director/review')
    return { ok: true, error: null, executedType: primaryIntent, noteId: obs?.id }
  }

  if (primaryIntent === 'create_session_recap') {
    if (!sessionId) {
      return fail('Cannot create session note — no session context found in this draft.')
    }

    // Verify session belongs to this academy
    const { data: session } = await supabase
      .from('sessions')
      .select('id, academy_id')
      .eq('id', sessionId)
      .eq('academy_id', academyId)
      .single()
    if (!session) return fail('Session not found in this academy.')

    const { data: note, error: noteErr } = await supabase
      .from('voice_notes')
      .insert({
        academy_id: academyId,
        session_id: sessionId,
        player_id: null,
        coach_id: user.id,
        raw_input: transcript,
        processing_status: 'parsed',
      } as any)
      .select('id')
      .single()

    if (noteErr) return fail(`Failed to create session note: ${noteErr.message}`)

    await rawDb
      .from('proposed_actions')
      .update({ status: 'applied', applied_at: new Date().toISOString() })
      .eq('id', proposedActionId)
      .eq('academy_id', academyId)

    revalidatePath('/director/review')
    return { ok: true, error: null, executedType: primaryIntent, noteId: (note as any)?.id }
  }

  return fail(`Intent "${primaryIntent}" is not yet supported for execution.`)
}
