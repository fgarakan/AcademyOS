'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { loadAssessmentFormConfigByName } from '@/lib/assessment/assessmentTemplateLoader'
import {
  resolveAssessmentTemplate,
  type AssessmentPurpose,
  type AssessmentTemplateResolution,
} from '@/lib/assessment/assessmentTemplateResolver'
import type { AssessmentFormConfig } from '@/lib/assessment/assessmentTemplateTypes'

export interface LoadTemplateResult {
  ok: boolean
  formConfig: (AssessmentFormConfig & { fallbackUsed: boolean; fallbackReason: string | null }) | null
  resolution: AssessmentTemplateResolution | null
  error: string | null
}

export async function loadTemplateForPurposeAction(input: {
  assessmentPurpose: AssessmentPurpose
  playerStage: string | null
  playerStatus: string | null
  playerFirstName: string | null
  existingAssessmentCount: number
  academyId: string
}): Promise<LoadTemplateResult> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, formConfig: null, resolution: null, error: 'Not authenticated.' }

  // Verify user is staff for this academy
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', input.academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!membership?.role) {
    return { ok: false, formConfig: null, resolution: null, error: 'Access denied.' }
  }

  const resolution = resolveAssessmentTemplate({
    playerStage:             input.playerStage,
    playerStatus:            input.playerStatus,
    playerFirstName:         input.playerFirstName,
    existingAssessmentCount: input.existingAssessmentCount,
    requestedPurpose:        input.assessmentPurpose,
  })

  try {
    const formConfig = await loadAssessmentFormConfigByName(
      supabase,
      input.academyId,
      resolution.templateName,
      resolution.mode,
    )
    return { ok: true, formConfig, resolution, error: null }
  } catch (e) {
    return {
      ok: false,
      formConfig: null,
      resolution,
      error: e instanceof Error ? e.message : 'Failed to load template.',
    }
  }
}
