'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import {
  createPlacementDraftAction,
  approvePlacementDraftAction,
} from '@/app/director/placement/placementDraftAction'

export interface OnboardingPlacementInput {
  playerId: string
  groupId: string
}

export interface OnboardingPlacementResult {
  ok: boolean
  recId: string | null
  groupName: string | null
  error: string | null
}

export async function onboardingPlacementAction(
  input: OnboardingPlacementInput,
): Promise<OnboardingPlacementResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, recId: null, groupName: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, recId: null, groupName: null, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, track')
    .eq('id', input.groupId)
    .eq('academy_id', academyId)
    .single()
  if (!group) return { ok: false, recId: null, groupName: null, error: 'Group not found in this academy' }

  const draftResult = await createPlacementDraftAction(
    input.playerId,
    academyId,
    group.id,
    group.track ?? 'skill',
    null,
    `Onboarding placement — group: ${group.name}`,
  )
  if (draftResult.error) return { ok: false, recId: null, groupName: null, error: draftResult.error }

  const recId = draftResult.id!
  const approveResult = await approvePlacementDraftAction(recId, academyId)
  if (approveResult.error) return { ok: false, recId: null, groupName: null, error: approveResult.error }

  revalidatePath(`/director/players/${input.playerId}/onboard`)
  revalidatePath(`/director/players/${input.playerId}`)

  return { ok: true, recId, groupName: group.name, error: null }
}
