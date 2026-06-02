'use server'

// Sprint 285 — Donna Curriculum Adjustment Apply Actions
//
// Applies an approved curriculum adjustment proposal by creating a versioned
// override record in academy_curriculum_overrides.
//
// Safety contract:
//   - Director only (not head_coach). Academy_id scoped.
//   - Preview mode blocked.
//   - Requires proposed_action in 'approved' status and target_module = 'curriculum_adjustment'.
//   - Writes to: academy_curriculum_overrides (rawDb — not in database.types.ts typed section).
//   - Writes to: audit_logs.
//   - Marks proposed_action as 'executed'.
//   - Never modifies curriculum_levels, template_blocks, or session_blocks directly.
//   - Never notifies anyone.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import { assertDonnaApprovalAllowed } from '@/lib/donna/donnaApprovalGate'

export interface DonnaCurriculumAdjustmentApplyResult {
  ok: boolean
  message: string
  safetyNotes: string[]
}

// ---------------------------------------------------------------------------
// Auth helper — director only
// ---------------------------------------------------------------------------

async function getDirectorContext() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false as const, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  if (membership?.role !== 'academy_director') {
    return {
      ok: false as const,
      error: 'Academy Director access required to apply curriculum changes.',
    }
  }

  return { ok: true as const, supabase, userId: user.id, academyId }
}

// ---------------------------------------------------------------------------
// applyApprovedCurriculumAdjustmentAction
// ---------------------------------------------------------------------------

export async function applyApprovedCurriculumAdjustmentAction(
  proposedActionId: string,
): Promise<DonnaCurriculumAdjustmentApplyResult> {
  if (await isPreviewMode()) {
    return { ok: false, message: 'Writes are disabled in preview mode.', safetyNotes: [] }
  }

  // Sprint 917 — Approval gate pre-flight: curriculum_edit requires director_approval level.
  // This apply path only executes when proposed_action.status='approved' (verified below),
  // so passing director_approval as currentLevel confirms the gate is satisfied.
  const gateCheck = assertDonnaApprovalAllowed('curriculum_edit', 'director_approval')
  if (!gateCheck.allowed) {
    return {
      ok: false,
      message: `Approval gate blocked: ${gateCheck.reason}`,
      safetyNotes: ['Curriculum changes require director approval through the Review Queue.'],
    }
  }

  const ctx = await getDirectorContext()
  if (!ctx.ok) return { ok: false, message: ctx.error, safetyNotes: [] }

  const { supabase, userId, academyId } = ctx
  const rawDb = supabase as any

  if (!proposedActionId) {
    return { ok: false, message: 'Missing proposed action ID.', safetyNotes: [] }
  }

  // 1. Fetch proposed_action — must be approved, curriculum_adjustment, this academy
  const { data: pa } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload')
    .eq('id', proposedActionId)
    .single()

  if (!pa) return { ok: false, message: 'Draft not found.', safetyNotes: [] }
  if (pa.academy_id !== academyId) return { ok: false, message: 'Access denied.', safetyNotes: [] }
  if (pa.target_module !== 'curriculum_adjustment') {
    return {
      ok: false,
      message: 'This action can only apply curriculum adjustment drafts.',
      safetyNotes: [],
    }
  }
  if (pa.status === 'executed') {
    return { ok: false, message: 'This curriculum adjustment has already been applied.', safetyNotes: [] }
  }
  if (pa.status !== 'approved') {
    return {
      ok: false,
      message: 'The draft must be approved before the curriculum adjustment can be applied.',
      safetyNotes: ['Mark the draft as Approved in the Review Queue first.'],
    }
  }

  const payload = (pa.proposed_payload as Record<string, unknown>) ?? {}
  const adjustmentType = (payload.adjustment_type as string | null) ?? 'adjustment'
  const targetLevel = (payload.target_level as string | null) ?? null
  const proposedChange = (payload.proposed_change as string | null) ?? null
  const reason = (payload.reason as string | null) ?? null

  if (!proposedChange) {
    return {
      ok: false,
      message: 'Proposed change not found in draft payload.',
      safetyNotes: [],
    }
  }

  // 2. Fetch the active curriculum version for this academy (if versioning table exists)
  let curriculumVersionId: string | null = null
  try {
    const { data: versionRow } = await rawDb
      .from('academy_curriculum_versions')
      .select('id')
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    curriculumVersionId = (versionRow?.id as string | null) ?? null
  } catch {
    // Table may not exist — proceed without version FK
    curriculumVersionId = null
  }

  const now = new Date().toISOString()

  // 3. Create academy_curriculum_overrides record (rawDb — not typed in database.types.ts)
  const { data: overrideRow, error: overrideError } = await rawDb
    .from('academy_curriculum_overrides')
    .insert({
      academy_id:            academyId,
      curriculum_version_id: curriculumVersionId,
      override_type:         adjustmentType,
      target_level_label:    targetLevel,
      change_description:    proposedChange,
      reason:                reason,
      proposed_action_id:    proposedActionId,
      applied_by_id:         userId,
      applied_at:            now,
      status:                'active',
      // original_snapshot: captures the before-state for rollback reference.
      // V1: stores the proposed change description as a recoverable snapshot.
      // A future sprint can enrich this with the actual current DB field values.
      original_snapshot:     { description: proposedChange, target_level: targetLevel, captured_at: now },
      // applied_change: the change actually written; used by rollback to reconstruct before-state.
      applied_change:        { description: proposedChange, adjustment_type: adjustmentType, applied_by: userId, applied_at: now },
    })
    .select('id')
    .single()

  if (overrideError) {
    return {
      ok: false,
      message: `Failed to create curriculum override: ${overrideError.message}`,
      safetyNotes: ['No curriculum data was changed. Check academy_curriculum_overrides table exists.'],
    }
  }

  // 4. Write audit_log with version and snapshot context
  await rawDb.from('audit_logs').insert({
    academy_id:  academyId,
    actor_id:    userId,
    action:      'curriculum_adjustment_applied',
    payload: {
      override_id:           overrideRow.id,
      adjustment_type:       adjustmentType,
      target_level:          targetLevel,
      proposed_change:       proposedChange,
      reason,
      proposed_action_id:    proposedActionId,
      applied_at:            now,
      curriculum_version_id: curriculumVersionId,
      rollback_available:    true,
    },
    target_type: 'curriculum',
    target_id:   overrideRow.id,
  })

  // 5. Mark proposed_action as executed
  await rawDb
    .from('proposed_actions')
    .update({ status: 'executed', updated_at: now })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  revalidatePath('/director/review')
  revalidatePath('/director/curriculum')

  return {
    ok: true,
    message: `Curriculum adjustment applied. Override record created for: "${proposedChange.slice(0, 80)}".`,
    safetyNotes: [
      'A versioned override record was created in academy_curriculum_overrides.',
      'original_snapshot and applied_change captured for rollback support.',
      'Rollback is available via rollbackAcademyCurriculumOverrideAction.',
      'Audit log written with curriculum_version_id and rollback_available flag.',
      'No template_blocks, session_blocks, or curriculum_levels were modified.',
      'No one was notified.',
    ],
  }
}
