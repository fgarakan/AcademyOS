'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

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

// ─────────────────────────────────────────────────────────────
// Server action
// ─────────────────────────────────────────────────────────────

export async function saveWrapUpObservationsAction(
  sessionId: string,
  observations: PlayerObservationInput[],
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
    return { ok: false, savedCount: 0, error: 'Not authorized to save player observations.' }
  }

  // 4. Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, savedCount: 0, error: 'Session not found or access denied.' }

  // 5. Verify each player belongs to this academy (never trust client-side player IDs)
  const playerIds = observations.map(o => o.playerId)
  const { data: validPlayers } = await supabase
    .from('players')
    .select('id')
    .in('id', playerIds)
    .eq('academy_id', academyId)
    .eq('is_active', true)

  const validPlayerIds = new Set((validPlayers ?? []).map(p => p.id))

  // 6. Insert observations sequentially — is_private always true
  let savedCount = 0
  for (const obs of observations) {
    if (!obs.note.trim()) continue
    if (!validPlayerIds.has(obs.playerId)) continue

    const { error: insertError } = await supabase
      .from('coach_observations')
      .insert({
        academy_id: academyId,
        coach_id: user.id,
        player_id: obs.playerId,
        session_id: sessionId,
        observation_type: obs.observationType,
        content: obs.note.trim(),
        is_private: true,
      })

    if (!insertError) savedCount++
  }

  return { ok: true, savedCount, error: null }
}
