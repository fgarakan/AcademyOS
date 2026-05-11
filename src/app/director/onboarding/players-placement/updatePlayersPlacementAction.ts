'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface UpdatePlayersPlacementResult {
  ok: boolean
  error: string | null
}

const VALID_PLAYER_ADD_METHODS = [
  'manual_entry',
  'csv_import_later',
  'parent_registration_later',
  'mixed_import',
] as const

const VALID_PLACEMENT_APPROACHES = [
  'assessment_first',
  'director_review_first',
  'coach_judgment_first',
  'age_level_default',
] as const

const VALID_PLACEMENT_APPROVAL_MODELS = [
  'director_approves_all',
  'director_approves_exceptions',
  'coach_recommends_director_approves',
] as const

const VALID_INTAKE_INFORMATION = [
  'player_name_age',
  'ball_level',
  'current_training_history',
  'competition_experience',
  'technical_priorities',
  'fitness_readiness',
  'parent_goals',
  'scheduling_availability',
] as const

export async function updatePlayersPlacementAction(
  playerAddMethod: string,
  placementApproach: string,
  placementApprovalModel: string,
  intakeInformation: string[],
  notes: string,
): Promise<UpdatePlayersPlacementResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }

  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  if (membership?.role !== 'academy_director') {
    return { ok: false, error: 'Only academy directors can update players and placement setup' }
  }

  if (!(VALID_PLAYER_ADD_METHODS as readonly string[]).includes(playerAddMethod)) {
    return { ok: false, error: 'Invalid player add method' }
  }
  if (!(VALID_PLACEMENT_APPROACHES as readonly string[]).includes(placementApproach)) {
    return { ok: false, error: 'Invalid placement approach' }
  }
  if (!(VALID_PLACEMENT_APPROVAL_MODELS as readonly string[]).includes(placementApprovalModel)) {
    return { ok: false, error: 'Invalid placement approval model' }
  }

  const validIntake = VALID_INTAKE_INFORMATION as readonly string[]
  const sanitizedIntake = intakeInformation.filter(i => validIntake.includes(i))

  const rawDb = supabase as any

  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}

  const merged = {
    ...existing,
    players_placement: {
      player_add_method: playerAddMethod,
      placement_approach: placementApproach,
      placement_approval_model: placementApprovalModel,
      intake_information: sanitizedIntake,
      notes: notes.trim(),
      updated_at: new Date().toISOString(),
    },
    players_placement_completed: true,
    onboarding_state: (existing.onboarding_state as string) || 'players_placement',
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save players and placement setup' }

  revalidatePath('/director/onboarding')
  revalidatePath('/director/onboarding/players-placement')
  revalidatePath('/director')
  return { ok: true, error: null }
}
