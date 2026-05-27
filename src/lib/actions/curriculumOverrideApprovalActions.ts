'use server'

/**
 * Curriculum Override Approval Actions — Sprint 904
 *
 * Provides the controlled approve/reject server actions for
 * academy_curriculum_overrides rows. This is the final step in the
 * DONNA → Draft → Review → Apply curriculum change pipeline.
 *
 * Pipeline summary:
 *   createCurriculumContentItemDraft()    Sprint 901 — writes pending_review row
 *   Director sees queue                   Sprint 903 — live sidebar display
 *   approveCurriculumOverrideDraft()      Sprint 904 ← this file — approve + execute
 *   rejectCurriculumOverrideDraft()       Sprint 904 ← this file — reject
 *   rollbackAcademyCurriculumOverrideAction() — rolls back applied rows
 *
 * Approval flow (two-step, required by execute_curriculum_override()):
 *   1. Permission checks (auth → profile → membership → override ownership)
 *   2. UPDATE academy_curriculum_overrides SET status = 'approved'
 *      (execute_curriculum_override() requires status = 'approved' at Step 2)
 *   3. CALL execute_curriculum_override(overrideId, user.id) via Supabase RPC
 *      → on success: function marks row status = 'applied', mutates curriculum
 *      → on failure: row remains in status = 'approved' — see Sprint 905 risk note
 *
 * Rejection flow:
 *   1. Permission checks
 *   2. UPDATE status → 'rejected', store reason in override_reason
 *   3. Write audit_logs entry
 *   4. Does NOT call execute_curriculum_override()
 *
 * Architecture invariants enforced here:
 *   • Only academy_director or head_coach may approve/reject.
 *   • academy_id always resolved from profile — never from client input.
 *   • Global curriculum is never touched (execute_curriculum_override() enforces this
 *     via academy_id guard in the content_item update/remove branches).
 *   • Preview mode writes are blocked.
 *   • approveCurriculumOverrideDraft() is the ONLY place in TypeScript that calls
 *     execute_curriculum_override().
 *   • rejectCurriculumOverrideDraft() never calls execute_curriculum_override().
 *   • All mutations write to audit_logs (via the DB function on approve,
 *     and directly on reject).
 *
 * Risk: if execute_curriculum_override() fails after status is set to 'approved',
 *   the row is left in 'approved' state. The function writes a
 *   curriculum_override.apply_failed audit entry. A cleanup/retry path for
 *   stuck 'approved' rows is recommended for Sprint 905.
 *
 * Related:
 *   supabase/migrations/069_execute_curriculum_override.sql — execution function
 *   supabase/migrations/048_academy_curriculum_clone.sql — override table schema
 *   src/lib/actions/curriculumDraftActions.ts — writes pending_review rows
 *   src/lib/actions/rollbackCurriculumOverride.ts — rolls back applied rows
 *   docs/MIGRATION_READINESS_CURRICULUM_TABLES_AUDIT_899.md — architecture decision
 */

import { revalidatePath } from 'next/cache'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { getSupabaseServer } from '@/lib/supabase/server'

// ─── Result types ─────────────────────────────────────────────────────────────

export type ApproveCurriculumOverrideResult =
  | { ok: true; overrideId: string; appliedResult: unknown }
  | { ok: false; error: string; blocked: boolean }

export type RejectCurriculumOverrideResult =
  | { ok: true; overrideId: string }
  | { ok: false; error: string; blocked: boolean }

// ─── Constants ────────────────────────────────────────────────────────────────

/** Statuses that are eligible for director review decisions. */
const REVIEWABLE_STATUSES = ['pending_review', 'draft'] as const

/** Max chars for rejection reason stored in override_reason. */
const MAX_REASON_CHARS = 500

// ─── Helpers ─────────────────────────────────────────────────────────────────

function approveFail(error: string, blocked = false): ApproveCurriculumOverrideResult {
  return { ok: false, error, blocked }
}

function rejectFail(error: string, blocked = false): RejectCurriculumOverrideResult {
  return { ok: false, error, blocked }
}

// ─── approveCurriculumOverrideDraft ───────────────────────────────────────────

/**
 * Approves a pending_review or draft curriculum override and immediately
 * executes it via execute_curriculum_override().
 *
 * This is the ONLY TypeScript call-site for execute_curriculum_override().
 *
 * On success: override status = 'applied', curriculum_content_items mutated,
 *   audit_log written by the DB function.
 *
 * On RPC failure: override status remains 'approved'. The DB function writes
 *   a curriculum_override.apply_failed audit entry. The row will need manual
 *   cleanup or a retry path (Sprint 905).
 */
export async function approveCurriculumOverrideDraft(
  overrideId: string,
): Promise<ApproveCurriculumOverrideResult> {
  // ── Guard: preview mode ──────────────────────────────────────
  try {
    await assertNotPreviewMode()
  } catch {
    return approveFail('Writes are disabled in preview mode.', true)
  }

  // ── Guard: required input ────────────────────────────────────
  if (!overrideId?.trim()) {
    return approveFail('Override ID is required.', true)
  }

  // ── Auth ─────────────────────────────────────────────────────
  const supabase = await getSupabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return approveFail('Only authorized academy leaders can approve curriculum drafts.', true)
  }

  // ── Resolve academy_id from authenticated profile ─────────────
  // Never trust academy_id from the client — always read from DB.
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) {
    return approveFail('Only authorized academy leaders can approve curriculum drafts.', true)
  }
  const academyId = profile.academy_id

  // ── Role check: director or head_coach only ───────────────────
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return approveFail('Only authorized academy leaders can approve curriculum drafts.', true)
  }

  // ── rawDb: academy_curriculum_overrides not in generated types ──
  // Also used for the execute_curriculum_override() RPC since it was
  // added in migration 069 and types have not been regenerated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDb = supabase as any

  // ── Fetch override — verify ownership and eligibility ─────────
  const { data: override, error: fetchError } = await rawDb
    .from('academy_curriculum_overrides')
    .select('id,academy_id,status,target_type')
    .eq('id', overrideId)
    .single()

  if (fetchError || !override) {
    return approveFail("I couldn't approve this curriculum draft yet.", false)
  }
  // Academy scope guard — override must belong to the director's academy
  if (override.academy_id !== academyId) {
    return approveFail('Only authorized academy leaders can approve curriculum drafts.', true)
  }
  // Status guard — only reviewable statuses can be approved
  if (!(REVIEWABLE_STATUSES as readonly string[]).includes(override.status)) {
    return approveFail('This draft is no longer waiting for review.', false)
  }

  // ── Step 1: Mark as approved ──────────────────────────────────
  // execute_curriculum_override() validates status = 'approved' at its
  // Step 2. The two-step approach is required by the function's design.
  // approved_by and approved_at are stored here; applied_by / applied_at
  // are set by the DB function on successful execution.
  const { error: approveUpdateError } = await rawDb
    .from('academy_curriculum_overrides')
    .update({
      status:      'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', overrideId)
    .eq('academy_id', academyId)  // belt-and-suspenders academy scope

  if (approveUpdateError) {
    return approveFail("I couldn't approve this curriculum draft yet.", false)
  }

  // ── Step 2: Execute the approved override ─────────────────────
  // execute_curriculum_override() is a SECURITY DEFINER function that:
  //   • Validates status = 'approved'
  //   • Validates p_executor_id role via academy_memberships (explicit check)
  //   • Applies the proposed_change to curriculum_content_items
  //   • Sets status = 'applied', applied_by, applied_at, applied_change
  //   • Writes audit_log entry ('curriculum_override.applied')
  //   • On exception: writes 'curriculum_override.apply_failed' audit entry
  //     and returns { success: false, error: "..." }
  //
  // ⚠️ RISK: if this call fails, the row stays in status = 'approved'.
  //    The function always returns a JSONB result (WHEN OTHERS handler).
  //    rpcError would indicate a network/PostgREST-level failure only.
  //    Sprint 905 should add retry/cleanup for stuck 'approved' rows.
  const { data: rpcData, error: rpcError } = await rawDb.rpc(
    'execute_curriculum_override',
    {
      p_override_id: overrideId,
      p_executor_id: user.id,
    },
  )

  if (rpcError) {
    // Network or PostgREST-level failure — row is stuck in 'approved'
    return approveFail(
      "I couldn't approve this curriculum draft yet. The draft was marked approved but execution failed — please retry or contact support.",
      false,
    )
  }

  // The function always returns JSONB; cast to known shape
  const rpcResult = rpcData as { success: boolean; error?: string; result?: unknown } | null

  if (!rpcResult?.success) {
    return approveFail(
      rpcResult?.error
        ? `I couldn't approve this curriculum draft yet: ${rpcResult.error}`
        : "I couldn't approve this curriculum draft yet.",
      false,
    )
  }

  // ── Revalidate curriculum routes ─────────────────────────────
  // Matches pattern from curriculumSpineAction.ts and notes.ts.
  // Ensures level pages and the curriculum builder re-fetch updated data.
  revalidatePath('/director/curriculum')
  revalidatePath('/director/curriculum/builder')

  return {
    ok:            true,
    overrideId,
    appliedResult: rpcResult.result ?? null,
  }
}

// ─── rejectCurriculumOverrideDraft ────────────────────────────────────────────

/**
 * Rejects a pending_review or draft curriculum override.
 *
 * Sets status = 'rejected'. Stores the optional director rejection reason
 * in override_reason. Writes an audit_log entry.
 *
 * Does NOT call execute_curriculum_override().
 * Does NOT mutate curriculum_content_items.
 * The rejected row remains in academy_curriculum_overrides for audit trail.
 */
export async function rejectCurriculumOverrideDraft(
  overrideId: string,
  reason?: string,
): Promise<RejectCurriculumOverrideResult> {
  // ── Guard: preview mode ──────────────────────────────────────
  try {
    await assertNotPreviewMode()
  } catch {
    return rejectFail('Writes are disabled in preview mode.', true)
  }

  // ── Guard: required input ────────────────────────────────────
  if (!overrideId?.trim()) {
    return rejectFail('Override ID is required.', true)
  }
  if (reason && reason.length > MAX_REASON_CHARS) {
    return rejectFail(
      `Rejection reason must be ${MAX_REASON_CHARS} characters or fewer.`,
      true,
    )
  }

  // ── Auth ─────────────────────────────────────────────────────
  const supabase = await getSupabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return rejectFail('Only authorized academy leaders can approve curriculum drafts.', true)
  }

  // ── Resolve academy_id from authenticated profile ─────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) {
    return rejectFail('Only authorized academy leaders can approve curriculum drafts.', true)
  }
  const academyId = profile.academy_id

  // ── Role check: director or head_coach only ───────────────────
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return rejectFail('Only authorized academy leaders can approve curriculum drafts.', true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDb = supabase as any

  // ── Fetch override — verify ownership and eligibility ─────────
  const { data: override, error: fetchError } = await rawDb
    .from('academy_curriculum_overrides')
    .select('id,academy_id,status')
    .eq('id', overrideId)
    .single()

  if (fetchError || !override) {
    return rejectFail("I couldn't update this curriculum draft yet.", false)
  }
  if (override.academy_id !== academyId) {
    return rejectFail('Only authorized academy leaders can approve curriculum drafts.', true)
  }
  if (!(REVIEWABLE_STATUSES as readonly string[]).includes(override.status)) {
    return rejectFail('This draft is no longer waiting for review.', false)
  }

  // ── Reject: update status and store reason ────────────────────
  // schema (migration 048): override_reason TEXT (nullable) — stores rejection reason.
  // No rejected_by column exists in the schema; the audit_logs entry below
  // records actor_id = user.id as the authority for who rejected this draft.
  // approved_by / approved_at are intentionally left unchanged (not set on rejection)
  // since the override was never in the approved state.
  const { error: rejectUpdateError } = await rawDb
    .from('academy_curriculum_overrides')
    .update({
      status:          'rejected',
      override_reason: reason?.trim() ?? null,
    })
    .eq('id', overrideId)
    .eq('academy_id', academyId)

  if (rejectUpdateError) {
    return rejectFail("I couldn't update this curriculum draft yet.", false)
  }

  // ── Write audit log (non-fatal) ───────────────────────────────
  // Failure here is non-fatal — the rejection is already recorded.
  // audit_logs source_type CHECK: 'ui' | 'voice' | 'api' | 'system'
  await rawDb
    .from('audit_logs')
    .insert({
      academy_id:  academyId,
      actor_id:    user.id,
      action:      'curriculum_override.rejected',
      target_type: 'academy_curriculum_overrides',
      target_id:   overrideId,
      payload: {
        override_id:  overrideId,
        rejected_by:  user.id,
        reason:       reason?.trim() ?? null,
      },
      source_type: 'ui',
    })

  // ── Revalidate curriculum routes ─────────────────────────────
  revalidatePath('/director/curriculum')
  revalidatePath('/director/curriculum/builder')

  return { ok: true, overrideId }
}
