'use server'

// Template Approval Action — Sprint 979
// Director-only server action for approving template review requests.
//
// Approval flow (when migration 067 is applied):
//   1. Verify caller is academy_director (head_coach cannot approve).
//   2. For create_template requests: INSERT into templates with status='ready'.
//   3. For update_template requests: UPDATE existing template row.
//   4. Set review request status='approved', reviewed_by, reviewed_at.
//   5. INSERT into template_version_history (append-only snapshot).
//   6. Return new or updated template ID.
//
// Rejection flow:
//   1. Verify caller is academy_director.
//   2. Set review request status='rejected', reviewed_by, reviewed_at, review_notes.
//   3. No template mutation.
//
// Safety rules enforced:
//   - Director-only. head_coach cannot approve/reject.
//   - Schema-missing detection. Returns safe error if migration not applied.
//   - No curriculum mutation.
//   - No parent sends. No external sends.
//   - All state changes are explicit (no side effects beyond the rows touched).

import { getSupabaseServer } from '@/lib/supabase/server'

// ── Result type ────────────────────────────────────────────────────────────

export interface TemplateApprovalResult {
  success: boolean
  templateId?: string
  error?: string
  isSchemaMissing?: boolean
}

// ── Director-only guard ────────────────────────────────────────────────────

async function assertDirectorOnly(
  db: Awaited<ReturnType<typeof getSupabaseServer>>
): Promise<{ userId: string; academyId: string } | null> {
  const rawDb = db as any
  const { data: { user } } = await db.auth.getUser()
  if (!user) return null

  const { data: profile } = await rawDb
    .from('profiles')
    .select('id, role, academy_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'academy_director') return null
  return { userId: profile.id as string, academyId: profile.academy_id as string }
}

function detectSchemaMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as Record<string, unknown>
  if (e['code'] === '42P01' || e['code'] === '42703') return true
  const msg = typeof e['message'] === 'string' ? e['message'] as string : ''
  return msg.includes('does not exist') && (msg.includes('column') || msg.includes('relation') || msg.includes('table'))
}

// ── Approve review request ─────────────────────────────────────────────────
// Applies the draft snapshot to the templates table and marks the review
// request approved. Writes a version history snapshot.

export async function approveTemplateReviewRequestAction(
  reviewRequestId: string
): Promise<TemplateApprovalResult> {
  if (!reviewRequestId) {
    return { success: false, error: 'Review request ID is required.' }
  }

  let db: Awaited<ReturnType<typeof getSupabaseServer>>
  try {
    db = await getSupabaseServer()
  } catch {
    return { success: false, error: 'Could not connect to database.' }
  }

  let auth: { userId: string; academyId: string } | null
  try {
    auth = await assertDirectorOnly(db)
  } catch {
    return { success: false, error: 'Authentication failed.' }
  }
  if (!auth) {
    return { success: false, error: 'Only academy directors can approve template requests.' }
  }

  const rawDb = db as any

  // Load the review request
  let reviewRequest: Record<string, unknown>
  try {
    const { data, error } = await rawDb
      .from('template_review_requests')
      .select('*')
      .eq('id', reviewRequestId)
      .eq('academy_id', auth.academyId)
      .single()

    if (error) {
      if (detectSchemaMissing(error)) {
        return { success: false, error: 'Template backend migration has not been applied yet.', isSchemaMissing: true }
      }
      if ((error as any).code === 'PGRST116') {
        return { success: false, error: 'Review request not found.' }
      }
      return { success: false, error: error.message ?? 'Failed to load review request.' }
    }
    reviewRequest = data as Record<string, unknown>
  } catch {
    return { success: false, error: 'Unexpected error loading review request.' }
  }

  if (reviewRequest['status'] !== 'pending') {
    return { success: false, error: `Review request is already ${reviewRequest['status']}.` }
  }

  const draft = (reviewRequest['template_draft'] as Record<string, unknown> | null) ?? {}
  const requestType = reviewRequest['request_type'] as string
  const now = new Date().toISOString()

  let resultTemplateId: string

  // ── create_template: INSERT new template row ───────────────────────────
  if (requestType === 'create_template') {
    try {
      const { data: newTemplate, error: insertError } = await rawDb
        .from('templates')
        .insert({
          academy_id: auth.academyId,
          name: (draft['name'] as string | undefined) ?? 'Untitled Template',
          description: (draft['description'] as string | null | undefined) ?? null,
          total_duration_min: (draft['total_duration_min'] as number | null | undefined) ?? null,
          tags: (draft['tags'] as string[] | undefined) ?? [],
          is_active: true,
          is_default: false,
          created_by: auth.userId,
          // Draft migration 067 columns (present after migration is applied)
          template_type: draft['template_type'] ?? null,
          status: 'ready',
          curriculum_stage_key: draft['curriculum_stage_key'] ?? null,
          curriculum_level_key: draft['curriculum_level_key'] ?? null,
          curriculum_source_label: draft['curriculum_source_label'] ?? null,
          template_goal: draft['template_goal'] ?? null,
          pathway_focus: draft['pathway_focus'] ?? null,
          approved_by: auth.userId,
          approved_at: now,
        })
        .select('id')
        .single()

      if (insertError) {
        if (detectSchemaMissing(insertError)) {
          return { success: false, error: 'Template schema columns not available. Apply migration 067 first.', isSchemaMissing: true }
        }
        return { success: false, error: insertError.message ?? 'Failed to create template.' }
      }

      resultTemplateId = (newTemplate as { id: string }).id
    } catch {
      return { success: false, error: 'Unexpected error creating template.' }
    }

  // ── update_template: UPDATE existing template row ──────────────────────
  } else if (requestType === 'update_template') {
    const existingTemplateId = reviewRequest['template_id'] as string | null
    if (!existingTemplateId) {
      return { success: false, error: 'Update request is missing template_id reference.' }
    }

    try {
      const { error: updateError } = await rawDb
        .from('templates')
        .update({
          name: (draft['name'] as string | undefined) ?? undefined,
          description: (draft['description'] as string | null | undefined) ?? undefined,
          total_duration_min: (draft['total_duration_min'] as number | null | undefined) ?? undefined,
          tags: (draft['tags'] as string[] | undefined) ?? undefined,
          template_goal: draft['template_goal'] ?? undefined,
          pathway_focus: draft['pathway_focus'] ?? undefined,
          curriculum_source_label: draft['curriculum_source_label'] ?? undefined,
          approved_by: auth.userId,
          approved_at: now,
          updated_at: now,
        })
        .eq('id', existingTemplateId)
        .eq('academy_id', auth.academyId)

      if (updateError) {
        if (detectSchemaMissing(updateError)) {
          return { success: false, error: 'Template schema columns not available. Apply migration 067 first.', isSchemaMissing: true }
        }
        return { success: false, error: updateError.message ?? 'Failed to update template.' }
      }

      resultTemplateId = existingTemplateId
    } catch {
      return { success: false, error: 'Unexpected error updating template.' }
    }

  } else {
    return { success: false, error: `Unsupported request type for approval: ${requestType}.` }
  }

  // ── Write version history snapshot ────────────────────────────────────
  try {
    await rawDb
      .from('template_version_history')
      .insert({
        academy_id: auth.academyId,
        template_id: resultTemplateId,
        change_type: requestType,
        snapshot: { ...draft, review_request_id: reviewRequestId, approved_by: auth.userId, approved_at: now },
        changed_by: auth.userId,
      })
  } catch {
    // Non-fatal — version history failure should not roll back the approval
    // Log silently; the template is already saved
  }

  // ── Mark review request approved ──────────────────────────────────────
  try {
    await rawDb
      .from('template_review_requests')
      .update({
        status: 'approved',
        reviewed_by: auth.userId,
        reviewed_at: now,
      })
      .eq('id', reviewRequestId)
  } catch {
    // Non-fatal — approval already applied to template row
  }

  return { success: true, templateId: resultTemplateId }
}

// ── Reject review request ──────────────────────────────────────────────────
// Director-only. No template mutation. Adds review_notes.

export async function rejectTemplateReviewRequestAction(
  reviewRequestId: string,
  reviewNotes: string
): Promise<TemplateApprovalResult> {
  if (!reviewRequestId) {
    return { success: false, error: 'Review request ID is required.' }
  }

  let db: Awaited<ReturnType<typeof getSupabaseServer>>
  try {
    db = await getSupabaseServer()
  } catch {
    return { success: false, error: 'Could not connect to database.' }
  }

  let auth: { userId: string; academyId: string } | null
  try {
    auth = await assertDirectorOnly(db)
  } catch {
    return { success: false, error: 'Authentication failed.' }
  }
  if (!auth) {
    return { success: false, error: 'Only academy directors can reject template requests.' }
  }

  const rawDb = db as any
  const now = new Date().toISOString()

  try {
    const { error } = await rawDb
      .from('template_review_requests')
      .update({
        status: 'rejected',
        reviewed_by: auth.userId,
        reviewed_at: now,
        review_notes: reviewNotes || null,
      })
      .eq('id', reviewRequestId)
      .eq('academy_id', auth.academyId)

    if (error) {
      if (detectSchemaMissing(error)) {
        return { success: false, error: 'Template backend migration has not been applied yet.', isSchemaMissing: true }
      }
      return { success: false, error: error.message ?? 'Failed to reject review request.' }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error rejecting review request.' }
  }
}
