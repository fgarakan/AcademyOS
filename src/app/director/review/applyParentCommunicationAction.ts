'use server'

// Mega Sprint 1096-1100 — Parent Communication Apply Loop V1
//
// Applies an APPROVED parent_communication proposed_action:
//   1. Verifies proposed_action is approved, belongs to this academy, correct module.
//   2. Creates a parent_updates row (status: 'approved').
//   3. Updates player_development_summary.parent_summary + show_to_parent = true
//      so the parent portal's /updates page displays the content immediately.
//   4. Marks proposed_action as 'executed'.
//   5. Writes audit log.
//
// V1 delivery model: 'portal_published' (no email provider required).
// Parent sees the update on next load of their /updates page.
//
// Safety:
//   - Director only (not head_coach — parent communication is director-level).
//   - academyId always server-resolved.
//   - Player must belong to this academy.
//   - Raw coach notes never written to parent-visible fields.
//   - proposed_action must be status='approved' before apply is allowed.
//   - apply is idempotent: re-applying an already-executed action returns early.

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import type { Database } from '@/lib/supabase/database.types'
import type { ParentSummaryPayload } from '@/app/director/review/ParentSummaryReviewCard'

type UserRole = Database['public']['Enums']['user_role']
type ParentUpdateStatus = Database['public']['Enums']['parent_update_status']

export interface ApplyParentCommunicationResult {
  ok: boolean
  error: string | null
  parentUpdateId?: string | null
}

export async function applyParentCommunicationAction(
  proposedActionId: string,
): Promise<ApplyParentCommunicationResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  // 2. Resolve academy_id server-side
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable' }
  const academyId = profile.academy_id

  // 3. Director only — parent communication requires director approval to apply
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const actorRole = membership?.role as UserRole | undefined
  if (actorRole !== 'academy_director') {
    return { ok: false, error: 'Only the academy director can apply parent communications' }
  }

  // 4. Fetch the proposed_action — verify ownership, module, status
  const rawDb = supabase as any
  const { data: action } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload, actor_id, player_id')
    .eq('id', proposedActionId)
    .single()

  if (!action) return { ok: false, error: 'Proposed action not found' }
  if (action.academy_id !== academyId) return { ok: false, error: 'Access denied' }
  if (action.target_module !== 'parent_communication') {
    return { ok: false, error: 'This action is not a parent communication draft' }
  }

  // Idempotency: already executed
  if (action.status === 'executed') {
    return { ok: true, error: null }
  }

  if (action.status !== 'approved') {
    return { ok: false, error: `Cannot apply a draft with status '${action.status}'. It must be approved first.` }
  }

  // 5. Extract payload — use draft_text or assemble from draft_sections
  const payload = (action.proposed_payload ?? {}) as ParentSummaryPayload
  const playerId: string | null = (payload.player_id ?? action.player_id) as string | null

  if (!playerId) {
    return { ok: false, error: 'Parent communication has no player ID — cannot apply' }
  }

  // Build the content to surface to the parent
  let content = ''
  if (payload.draft_text) {
    content = payload.draft_text.trim()
  } else if (payload.draft_sections) {
    const sections = payload.draft_sections
    const parts: string[] = []
    if (sections.working_on) parts.push(`Working on: ${sections.working_on}`)
    if (sections.improved) parts.push(`Improved: ${sections.improved}`)
    if (sections.needs_support) parts.push(`Needs support: ${sections.needs_support}`)
    if (sections.parent_can_do) parts.push(`How you can help: ${sections.parent_can_do}`)
    if (sections.whats_next) parts.push(`What's next: ${sections.whats_next}`)
    content = parts.join('\n\n')
  }

  if (!content) {
    return { ok: false, error: 'Parent communication draft has no content to apply' }
  }

  // 6. Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id, full_name')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()

  if (!player) {
    return { ok: false, error: 'Player not found in this academy' }
  }

  const now = new Date().toISOString()

  // 7. Create parent_updates row
  const { data: parentUpdate, error: puError } = await rawDb
    .from('parent_updates')
    .insert({
      academy_id: academyId,
      player_id: playerId,
      author_id: action.actor_id ?? user.id,
      content,
      content_draft: payload.draft_text ?? null,
      status: 'approved' as ParentUpdateStatus,
      subject: payload.update_focus ?? 'Development Update',
      send_method: 'portal_published',
      sent_at: now,
      approved_by: user.id,
      approved_at: now,
      voice_command_id: null,
    })
    .select('id')
    .single()

  if (puError) {
    return { ok: false, error: puError.message ?? 'Failed to create parent update' }
  }

  const parentUpdateId = parentUpdate?.id as string | null

  // 8. Update player_development_summary.parent_summary + show_to_parent = true
  //    This makes the content visible on the parent portal /updates page immediately.
  //    Best-effort — does not block if summary row doesn't exist.
  const { data: existingSummary } = await rawDb
    .from('player_development_summary')
    .select('id')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (existingSummary?.id) {
    await rawDb
      .from('player_development_summary')
      .update({
        parent_summary: content,
        show_to_parent: true,
        updated_at: now,
      })
      .eq('id', existingSummary.id)
  }

  // 9. Mark proposed_action as executed
  await rawDb
    .from('proposed_actions')
    .update({
      status: 'executed',
      applied_at: now,
      applied_by: user.id,
    })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  // 10. Write audit log
  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole,
    action: 'parent_communication_applied',
    targetType: 'parent_updates',
    targetId: parentUpdateId,
    targetLabel: player.full_name ?? playerId,
    payload: {
      proposed_action_id: proposedActionId,
      parent_update_id: parentUpdateId,
      player_id: playerId,
      content_length: content.length,
      send_method: 'portal_published',
      development_summary_updated: !!existingSummary?.id,
    },
    sourceType: 'ui',
  })

  revalidatePath('/director/review')
  revalidatePath(`/director/players/${playerId}`)
  revalidatePath('/parent/updates')

  return { ok: true, error: null, parentUpdateId }
}
