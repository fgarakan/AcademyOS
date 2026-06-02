'use server'

// Mega Sprint 1101-1110 — Friction Report Capture Action V1
//
// Any authenticated academy member can submit a friction report.
// Table: friction_reports (migration 077, not in generated types)
// Use rawDb = supabase as any for all writes to this table.

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'

export type FrictionType =
  | 'unclear_next_step'
  | 'too_many_clicks'
  | 'confusing_label'
  | 'wrong_data'
  | 'missing_action'
  | 'donna_misunderstood'
  | 'permission_blocked_unexpectedly'
  | 'parent_player_language_unclear'
  | 'mobile_issue'
  | 'other'

export type FrictionSeverity = 'low' | 'medium' | 'high' | 'blocker'

export interface ReportFrictionInput {
  pagePath: string
  frictionType: FrictionType
  severity?: FrictionSeverity
  comment?: string
  donnaContext?: string
}

export interface ReportFrictionResult {
  ok: boolean
  error: string | null
  reportId?: string | null
}

const VALID_FRICTION_TYPES: FrictionType[] = [
  'unclear_next_step', 'too_many_clicks', 'confusing_label', 'wrong_data',
  'missing_action', 'donna_misunderstood', 'permission_blocked_unexpectedly',
  'parent_player_language_unclear', 'mobile_issue', 'other',
]

const VALID_SEVERITIES: FrictionSeverity[] = ['low', 'medium', 'high', 'blocker']

export async function reportFrictionAction(
  input: ReportFrictionInput,
): Promise<ReportFrictionResult> {
  try {
    await assertNotPreviewMode()

    const supabase = await getSupabaseServer()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Not authenticated' }

    // Resolve academy_id server-side
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
    const academyId = profile.academy_id

    // Verify active membership (any role can report friction)
    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()
    if (!membership?.role) return { ok: false, error: 'No active membership in this academy' }

    // Validate inputs
    const pagePath = input.pagePath?.trim().slice(0, 500)
    if (!pagePath) return { ok: false, error: 'Page path is required' }
    if (!VALID_FRICTION_TYPES.includes(input.frictionType)) return { ok: false, error: 'Invalid friction type' }
    const severity = input.severity && VALID_SEVERITIES.includes(input.severity) ? input.severity : 'medium'
    const comment = input.comment?.trim().slice(0, 2000) || null
    const donnaContext = input.donnaContext?.trim().slice(0, 1000) || null

    const rawDb = supabase as any

    const { data: inserted, error: insertError } = await rawDb
      .from('friction_reports')
      .insert({
        academy_id:    academyId,
        reporter_id:   user.id,
        reporter_role: membership.role,
        page_path:     pagePath,
        friction_type: input.frictionType,
        severity,
        comment,
        donna_context: donnaContext,
        status:        'open',
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      if (
        insertError?.code === '42P01' ||
        (typeof insertError?.message === 'string' && insertError.message.includes('does not exist'))
      ) {
        return { ok: false, error: 'Migration 077 has not been applied. Apply friction_reports migration before using this action.' }
      }
      return { ok: false, error: insertError?.message ?? 'Failed to save friction report' }
    }

    return { ok: true, error: null, reportId: inserted.id as string }
  } catch {
    return { ok: false, error: 'An unexpected error occurred.' }
  }
}
