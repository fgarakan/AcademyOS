'use server'

// Placement Decision Action — Director Accepts / Overrides / Trials / Defers DONNA Recommendation
//
// Called after director reviews a DONNA placement recommendation in the review queue.
// Director has final authority on all placements — no placement is official until approved here.
//
// Override flow:
//   - director chooses different level/group than DONNA recommendation
//   - override_reason is REQUIRED (typed enum, 11 options)
//   - director_note is optional but recommended
//   - override_reason and director_note written to audit_logs (always)
//
// Outcome tracking:
//   - The recommendation record stores the final decision
//   - Next assessment can be linked as outcome_assessment_id for retrospective analysis

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'

type UserRole = Database['public']['Enums']['user_role']

// ── Override reason typed enum ────────────────────────────────────────────────

export type PlacementOverrideReason =
  | 'athletic_upside'
  | 'maturity'
  | 'competitive_toughness'
  | 'coach_observation'
  | 'family_schedule'
  | 'sibling_placement'
  | 'group_availability'
  | 'social_fit'
  | 'trial_placement'
  | 'director_judgment'
  | 'other'

export const OVERRIDE_REASON_LABELS: Record<PlacementOverrideReason, string> = {
  athletic_upside:         'Athletic Upside',
  maturity:                'Maturity',
  competitive_toughness:   'Competitive Toughness',
  coach_observation:       'Coach Observation',
  family_schedule:         'Family Schedule',
  sibling_placement:       'Sibling Placement',
  group_availability:      'Group Availability',
  social_fit:              'Social Fit',
  trial_placement:         'Trial Placement',
  director_judgment:       'Director Judgment',
  other:                   'Other',
}

const VALID_OVERRIDE_REASONS: PlacementOverrideReason[] = Object.keys(OVERRIDE_REASON_LABELS) as PlacementOverrideReason[]

// ── Accept input ──────────────────────────────────────────────────────────────

export interface AcceptPlacementDecisionInput {
  recommendationId: string
  playerId: string
  decision: 'accepted'
}

// ── Override input ────────────────────────────────────────────────────────────

export interface OverridePlacementDecisionInput {
  recommendationId: string
  playerId: string
  decision: 'overridden' | 'trial'
  overrideReason: PlacementOverrideReason
  directorNote?: string | null
  finalLevelId?: string | null
  finalLevelName?: string | null
  finalGroupId?: string | null
  finalGroupName?: string | null
}

// ── Defer input ───────────────────────────────────────────────────────────────

export interface DeferPlacementDecisionInput {
  recommendationId: string
  playerId: string
  decision: 'deferred'
  directorNote?: string | null
}

export type PlacementDecisionInput =
  | AcceptPlacementDecisionInput
  | OverridePlacementDecisionInput
  | DeferPlacementDecisionInput

export interface PlacementDecisionResult {
  ok: boolean
  error: string | null
}

// ── Main action ───────────────────────────────────────────────────────────────

export async function placementDecisionAction(
  input: PlacementDecisionInput,
): Promise<PlacementDecisionResult> {
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

  // Director only — placement decisions require director authority
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role as UserRole | undefined
  if (role !== 'academy_director') {
    return { ok: false, error: 'Only the academy director can make official placement decisions' }
  }

  // Validate override reason when required
  if ((input.decision === 'overridden' || input.decision === 'trial')) {
    const overrideInput = input as OverridePlacementDecisionInput
    if (!overrideInput.overrideReason || !VALID_OVERRIDE_REASONS.includes(overrideInput.overrideReason)) {
      return { ok: false, error: `An override reason is required when overriding a recommendation. Valid reasons: ${VALID_OVERRIDE_REASONS.join(', ')}` }
    }
  }

  const rawDb = supabase as any

  // Fetch the recommendation — verify belongs to this academy
  const { data: rec } = await rawDb
    .from('donna_placement_recommendations')
    .select('id, academy_id, player_id, status, recommended_level_name, recommended_group_name, confidence_score, proposed_action_id')
    .eq('id', input.recommendationId)
    .eq('academy_id', academyId)
    .single()

  if (!rec) return { ok: false, error: 'Placement recommendation not found' }
  if (rec.academy_id !== academyId) return { ok: false, error: 'Access denied' }
  if (rec.status !== 'pending_director_review' && rec.status !== 'deferred') {
    return { ok: false, error: `Recommendation is in status '${rec.status as string}' — cannot update decision` }
  }

  const now = new Date().toISOString()

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    decision:    input.decision,
    decided_by:  user.id,
    decided_at:  now,
    status:      input.decision,
  }

  if (input.decision === 'overridden' || input.decision === 'trial') {
    const overrideInput = input as OverridePlacementDecisionInput
    updatePayload.override_reason  = overrideInput.overrideReason
    updatePayload.director_note    = overrideInput.directorNote?.trim() ?? null
    updatePayload.final_level_id   = overrideInput.finalLevelId ?? null
    updatePayload.final_level_name = overrideInput.finalLevelName ?? null
    updatePayload.final_group_id   = overrideInput.finalGroupId ?? null
    updatePayload.final_group_name = overrideInput.finalGroupName ?? null
  }

  if (input.decision === 'deferred') {
    const deferInput = input as DeferPlacementDecisionInput
    updatePayload.director_note = deferInput.directorNote?.trim() ?? null
    updatePayload.status        = 'deferred'
  }

  if (input.decision === 'accepted') {
    updatePayload.final_level_name = rec.recommended_level_name
    updatePayload.final_group_name = rec.recommended_group_name
  }

  // Update recommendation
  const { error: updateError } = await rawDb
    .from('donna_placement_recommendations')
    .update(updatePayload)
    .eq('id', input.recommendationId)
    .eq('academy_id', academyId)

  if (updateError) {
    return { ok: false, error: updateError.message ?? 'Failed to record placement decision' }
  }

  // Mark proposed_action as executed (if linked)
  if (rec.proposed_action_id) {
    await rawDb
      .from('proposed_actions')
      .update({
        status:     input.decision === 'deferred' ? 'clarification_needed' : 'executed',
        applied_at: now,
        applied_by: user.id,
      })
      .eq('id', rec.proposed_action_id)
      .eq('academy_id', academyId)
  }

  // Audit log — always written, override reason explicitly captured
  const auditPayload: Record<string, unknown> = {
    recommendation_id:    input.recommendationId,
    player_id:            input.playerId,
    decision:             input.decision,
    recommended_level:    rec.recommended_level_name,
    confidence_score:     rec.confidence_score,
    proposed_action_id:   rec.proposed_action_id,
  }

  if (input.decision === 'overridden' || input.decision === 'trial') {
    const overrideInput = input as OverridePlacementDecisionInput
    auditPayload.override_reason   = overrideInput.overrideReason
    auditPayload.override_reason_label = OVERRIDE_REASON_LABELS[overrideInput.overrideReason]
    auditPayload.director_note     = overrideInput.directorNote ?? null
    auditPayload.final_level_name  = overrideInput.finalLevelName ?? null
    auditPayload.final_group_name  = overrideInput.finalGroupName ?? null
  }

  await writeAuditLog({
    db: supabase,
    academyId,
    actorId:     user.id,
    actorRole:   role,
    action:      `placement_decision_${input.decision}`,
    targetType:  'donna_placement_recommendations',
    targetId:    input.recommendationId,
    targetLabel: rec.recommended_level_name as string ?? 'Placement Recommendation',
    payload:     auditPayload as unknown as import('@/lib/supabase/database.types').Json,
    sourceType:  'ui',
  })

  revalidatePath(`/director/players/${input.playerId}`)
  revalidatePath('/director/review')
  revalidatePath('/director/placement')

  return { ok: true, error: null }
}
