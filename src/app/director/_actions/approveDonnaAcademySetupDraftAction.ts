'use server'

// Mega Sprint 1295–1324 — DONNA Setup Completion Authority V1
//
// Approves the saved donna_setup_draft and marks two setup steps complete:
//   - academy_identity_completed (requires academy_name + academy_timezone)
//   - director_interview_completed (mapped from DONNA answers)
//
// Safety contract:
//   - Director-only. Re-fetches draft from DB — never trusts client input.
//   - Validates minimum field requirements before writing anything.
//   - If missing fields: returns missingFields[] for Evidence Reasoning display.
//   - Updates academies.name + academies.timezone to match the approved draft.
//   - Stores approval metadata in settings.donna_setup_approval.
//   - Never touches unrelated settings keys (merge, not replace).

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { getSetupCompletionStatus } from '@/lib/donna/setup/donnaAcademySetupCompletionEngine'

// Approval requires academy_name + academy_timezone (hard) + at least 6/10 total
const APPROVAL_MIN_TOTAL = 6
const APPROVAL_HARD_REQUIRED = ['academy_name', 'academy_timezone'] as const

export interface ApproveDonnaAcademySetupDraftResult {
  ok: boolean
  entityId: string | null
  entityType: string
  redirectTo: string | null
  /** Field IDs missing from the draft — populated when ok: false due to insufficient data */
  missingFields: string[]
  error: string | null
}

export async function approveDonnaAcademySetupDraftAction(): Promise<ApproveDonnaAcademySetupDraftResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, entityId: null, entityType: 'academy_setup_approval', redirectTo: null, missingFields: [], error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) {
    return { ok: false, entityId: null, entityType: 'academy_setup_approval', redirectTo: null, missingFields: [], error: 'Academy context unavailable' }
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
    return { ok: false, entityId: null, entityType: 'academy_setup_approval', redirectTo: null, missingFields: [], error: 'Only academy directors can approve academy setup' }
  }

  const rawDb = supabase as any

  const { data: current } = await rawDb
    .from('academies')
    .select('settings')
    .eq('id', academyId)
    .single()

  const existing = (current?.settings as Record<string, unknown>) ?? {}
  const draft = (existing.donna_setup_draft as Record<string, string>) ?? {}

  // Hard-required fields (needed to update academy identity)
  const missingHard = APPROVAL_HARD_REQUIRED.filter(id => !(draft[id] ?? '').trim())
  if (missingHard.length > 0) {
    const status = getSetupCompletionStatus(draft)
    return {
      ok: false,
      entityId: null,
      entityType: 'academy_setup_approval',
      redirectTo: null,
      missingFields: Array.from(new Set([...missingHard, ...status.missingFieldIds])),
      error: 'Academy name and timezone are required to approve setup',
    }
  }

  // Minimum total field count
  const status = getSetupCompletionStatus(draft)
  if (status.filledCount < APPROVAL_MIN_TOTAL) {
    return {
      ok: false,
      entityId: null,
      entityType: 'academy_setup_approval',
      redirectTo: null,
      missingFields: status.missingFieldIds,
      error: `At least ${APPROVAL_MIN_TOTAL} of 10 setup fields must be filled. Currently ${status.filledCount} filled.`,
    }
  }

  // Map DONNA draft → settings.director_interview fields
  // The interview asks philosophical questions; DONNA collected operational answers.
  // Director explicitly approves this mapping when clicking "Approve & Apply Setup".
  const playerFocusParts = [
    draft.levels?.trim(),
    draft.groups?.trim(),
  ].filter(Boolean)

  const ninetyDayParts = [
    draft.weekly_schedule?.trim() ? `Schedule: ${draft.weekly_schedule.trim()}` : '',
    draft.setup_notes?.trim() || '',
  ].filter(Boolean)

  const director_interview = {
    philosophy:                  draft.setup_notes?.trim() || '',
    player_focus:                playerFocusParts.join(' | '),
    development_priorities:      draft.curriculum_starting_point?.trim() || draft.levels?.trim() || '',
    competition_approach:        draft.program_types?.trim() || '',
    parent_communication_style:  draft.parent_communication_preferences?.trim() || '',
    coach_operating_style:       draft.staff_plan?.trim() || '',
    ninety_day_success:          ninetyDayParts.join(' | '),
    updated_at:                  new Date().toISOString(),
    source:                      'donna_setup_draft',
  }

  const now = new Date().toISOString()
  const fieldsApplied = ['academy_identity_completed', 'director_interview_completed']

  const merged = {
    ...existing,
    director_interview,
    director_interview_completed:  true,
    academy_identity_completed:    true,
    academy_identity_updated_at:   now,
    donna_setup_approval: {
      approved_by:    user.id,
      approved_at:    now,
      source:         'donna_setup_draft',
      plan_id:        (draft.plan_id as string) ?? null,
      fields_applied: fieldsApplied,
    },
  }

  const academyName     = draft.academy_name.trim()
  const academyTimezone = draft.academy_timezone.trim() || 'UTC'

  const { error } = await rawDb
    .from('academies')
    .update({
      name:     academyName,
      timezone: academyTimezone,
      settings: merged,
    })
    .eq('id', academyId)

  if (error) {
    return {
      ok: false,
      entityId: null,
      entityType: 'academy_setup_approval',
      redirectTo: null,
      missingFields: [],
      error: error.message ?? 'Failed to apply setup approval',
    }
  }

  revalidatePath('/director/setup')
  revalidatePath('/director/onboarding')
  revalidatePath('/director/onboarding/interview')
  revalidatePath('/director/settings')
  revalidatePath('/director')

  return {
    ok: true,
    entityId: academyId,
    entityType: 'academy_setup_approval',
    redirectTo: '/director/setup',
    missingFields: [],
    error: null,
  }
}
