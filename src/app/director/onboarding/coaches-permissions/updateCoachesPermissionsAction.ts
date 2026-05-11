'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface UpdateCoachesPermissionsResult {
  ok: boolean
  error: string | null
}

const VALID_COACHING_TEAM_STRUCTURES = [
  'director_led',
  'head_coach_layers',
  'collaborative_team',
  'flexible_staffing',
] as const

const VALID_COACH_ACCESS_LEVELS = [
  'assigned_players_only',
  'assigned_groups_plus_context',
  'broad_academy_visibility',
] as const

const VALID_LEVEL_RECOMMENDATION_PERMISSIONS = [
  'coach_can_recommend_director_approves',
  'head_coach_can_approve',
  'director_only',
] as const

const VALID_COMMUNICATION_PERMISSIONS = [
  'drafts_only',
  'approved_templates_only',
  'director_only',
] as const

export async function updateCoachesPermissionsAction(
  coachingTeamStructure: string,
  coachAccessLevel: string,
  levelRecommendationPermission: string,
  communicationPermission: string,
  notes: string,
): Promise<UpdateCoachesPermissionsResult> {
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
    return { ok: false, error: 'Only academy directors can update coaches and permissions setup' }
  }

  if (!(VALID_COACHING_TEAM_STRUCTURES as readonly string[]).includes(coachingTeamStructure)) {
    return { ok: false, error: 'Invalid coaching team structure' }
  }
  if (!(VALID_COACH_ACCESS_LEVELS as readonly string[]).includes(coachAccessLevel)) {
    return { ok: false, error: 'Invalid coach access level' }
  }
  if (!(VALID_LEVEL_RECOMMENDATION_PERMISSIONS as readonly string[]).includes(levelRecommendationPermission)) {
    return { ok: false, error: 'Invalid level recommendation permission' }
  }
  if (!(VALID_COMMUNICATION_PERMISSIONS as readonly string[]).includes(communicationPermission)) {
    return { ok: false, error: 'Invalid communication permission' }
  }

  const rawDb = supabase as any

  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}

  const merged = {
    ...existing,
    coaches_permissions: {
      coaching_team_structure: coachingTeamStructure,
      coach_access_level: coachAccessLevel,
      level_recommendation_permission: levelRecommendationPermission,
      communication_permission: communicationPermission,
      notes: notes.trim(),
      updated_at: new Date().toISOString(),
    },
    coaches_permissions_completed: true,
    onboarding_state: (existing.onboarding_state as string) || 'coaches_permissions',
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) return { ok: false, error: error.message ?? 'Failed to save coaches and permissions setup' }

  revalidatePath('/director/onboarding')
  revalidatePath('/director/onboarding/coaches-permissions')
  revalidatePath('/director')
  return { ok: true, error: null }
}
