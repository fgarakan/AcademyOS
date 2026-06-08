'use server'

// Mega Sprint 1265–1294 — DONNA Academy Setup Completion V1
//
// Saves the 10-field DONNA-collected setup draft to academies.settings.donna_setup_draft.
//
// Safety contract:
//   - Only callable by academy_director role.
//   - Writes ONLY to donna_setup_draft — never touches director_interview_completed,
//     curriculum_setup_completed, or any existing onboarding completion flags.
//   - No mutations without an explicit director confirmation (enforced at the call site).
//   - Returns a result compatible with WorkflowSubmitResult so the execution engine
//     can verify and build a completion summary.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export interface DonnaSaveAcademySetupDraftResult {
  ok: boolean
  /** Academy ID — serves as entityId for WorkflowSubmitResult */
  entityId: string | null
  entityType: string
  redirectTo: string | null
  error: string | null
}

/**
 * Save DONNA's 10-field academy setup answers as a draft in academies.settings.
 *
 * The draft is stored at settings.donna_setup_draft and never overwrites
 * existing setup completion flags. The director must confirm this payload
 * before this action is called — enforcement is the caller's responsibility.
 *
 * Accepts the raw answers map from WorkflowDraftPayload.answers.
 */
export async function donnaSaveAcademySetupDraftAction(
  answers: Record<string, string>,
  planId: string,
): Promise<DonnaSaveAcademySetupDraftResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, entityId: null, entityType: 'academy_setup', redirectTo: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) {
    return { ok: false, entityId: null, entityType: 'academy_setup', redirectTo: null, error: 'Academy context unavailable' }
  }

  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  if (membership?.role !== 'academy_director') {
    return { ok: false, entityId: null, entityType: 'academy_setup', redirectTo: null, error: 'Only academy directors can save academy setup drafts' }
  }

  const rawDb = supabase as any

  // Fetch current settings to merge — never overwrite the full object
  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}

  // Write ONLY to donna_setup_draft — all other settings keys are preserved untouched
  const merged = {
    ...existing,
    donna_setup_draft: {
      academy_name:                     (answers['academy_name'] ?? '').trim(),
      academy_timezone:                 (answers['academy_timezone'] ?? '').trim(),
      program_types:                    (answers['program_types'] ?? '').trim(),
      levels:                           (answers['levels'] ?? '').trim(),
      groups:                           (answers['groups'] ?? '').trim(),
      staff_plan:                       (answers['staff_plan'] ?? '').trim(),
      weekly_schedule:                  (answers['weekly_schedule'] ?? '').trim(),
      parent_communication_preferences: (answers['parent_communication_preferences'] ?? '').trim(),
      curriculum_starting_point:        (answers['curriculum_starting_point'] ?? '').trim(),
      setup_notes:                      (answers['setup_notes'] ?? '').trim(),
      plan_id:                          planId,
      saved_at:                         new Date().toISOString(),
      source:                           'donna_goal_session',
    },
  }

  const { error } = await rawDb
    .from('academies')
    .update({ settings: merged })
    .eq('id', academyId)

  if (error) {
    return {
      ok: false,
      entityId: null,
      entityType: 'academy_setup',
      redirectTo: null,
      error: error.message ?? 'Failed to save academy setup draft',
    }
  }

  revalidatePath('/director/setup')
  revalidatePath('/director/onboarding')
  revalidatePath('/director/onboarding/interview')
  revalidatePath('/director')

  return {
    ok: true,
    entityId: academyId,
    entityType: 'academy_setup',
    redirectTo: '/director/setup',
    error: null,
  }
}
