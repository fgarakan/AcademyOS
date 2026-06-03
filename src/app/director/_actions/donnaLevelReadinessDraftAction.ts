'use server'

// DONNA Level Readiness Draft Action
// Creates a proposed_action row for a level readiness review.
// Director approval required before any level movement.
// No automatic level change — this is a draft only.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface LevelReadinessDraftInput {
  playerId:         string
  playerName:       string | null
  currentLevelName: string | null
  readinessStatus:  string
  readinessScore:   number
  confidence:       number
  donnaExplanation: string
  missingCategories: string[]
}

export interface LevelReadinessDraftResult {
  ok:       boolean
  draftId:  string | null
  error:    string | null
}

export async function donnaLevelReadinessDraftAction(
  input: LevelReadinessDraftInput,
): Promise<LevelReadinessDraftResult> {
  await assertNotPreviewMode()

  if (!input.playerId) return { ok: false, draftId: null, error: 'Missing player ID.' }

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, draftId: null, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, draftId: null, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false, draftId: null, error: 'Director or Head Coach required.' }
  }

  // Verify player belongs to this academy
  const rawDb = supabase as any
  const { data: playerCheck } = await rawDb
    .from('players')
    .select('id')
    .eq('id', input.playerId)
    .eq('academy_id', profile.academy_id)
    .maybeSingle()

  if (!playerCheck) return { ok: false, draftId: null, error: 'Player not found in your academy.' }

  const actionLabel = input.currentLevelName
    ? `Level Readiness Review — ${input.playerName ?? 'Player'} at ${input.currentLevelName}`
    : `Level Readiness Review — ${input.playerName ?? 'Player'}`

  const { data: draft, error } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id:       profile.academy_id,
      target_module:    'level_readiness_review',
      target_object_id: input.playerId,
      action_label:     actionLabel,
      status:           'pending_review',
      proposed_payload: {
        player_id:         input.playerId,
        player_name:       input.playerName,
        current_level:     input.currentLevelName,
        readiness_status:  input.readinessStatus,
        readiness_score:   input.readinessScore,
        confidence:        input.confidence,
        donna_explanation: input.donnaExplanation,
        missing_categories: input.missingCategories,
        created_by_role:   role,
        source:            'donna_level_readiness_engine',
      },
    })
    .select('id')
    .single()

  if (error) return { ok: false, draftId: null, error: error.message }

  try {
    await rawDb.from('audit_logs').insert({
      academy_id: profile.academy_id,
      actor_id:   user.id,
      action:     'level_readiness.draft_created',
      target_id:  input.playerId,
      payload: {
        player_name:      input.playerName,
        readiness_status: input.readinessStatus,
        readiness_score:  input.readinessScore,
        proposed_action_id: draft?.id,
        role,
      },
    })
  } catch { /* audit log failure is non-blocking */ }

  revalidatePath(`/director/players/${input.playerId}`)
  revalidatePath('/director/review')
  return { ok: true, draftId: draft?.id ?? null, error: null }
}
