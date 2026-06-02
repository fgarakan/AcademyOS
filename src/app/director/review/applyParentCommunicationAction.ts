'use server'

// Mega Sprint 1096-1100 — Parent Communication Apply Loop V1
// Mega Sprint 1101-1110 — Integrated with parentDeliveryService for typed delivery result.
//
// Applies an APPROVED parent_communication proposed_action:
//   1. Validates delivery method via parentDeliveryService
//   2. Verifies proposed_action is approved, belongs to this academy, correct module
//   3. Creates a parent_updates row (status: 'approved')
//   4. Updates player_development_summary.parent_summary + show_to_parent = true
//   5. Marks proposed_action as 'executed'
//   6. Writes audit log with typed delivery result

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'
import {
  getDefaultV1DeliveryMethod,
  getDeliveryMethodUnsupportedReason,
  buildPortalPublishedResult,
  buildFailedDeliveryResult,
  type ParentDeliveryResult,
} from '@/lib/delivery/parentDeliveryService'
import type { Database } from '@/lib/supabase/database.types'
import type { ParentSummaryPayload } from '@/app/director/review/ParentSummaryReviewCard'

type UserRole = Database['public']['Enums']['user_role']
type ParentUpdateStatus = Database['public']['Enums']['parent_update_status']

export interface ApplyParentCommunicationResult {
  ok: boolean
  error: string | null
  parentUpdateId?: string | null
  delivery?: ParentDeliveryResult | null
}

export async function applyParentCommunicationAction(
  proposedActionId: string,
): Promise<ApplyParentCommunicationResult> {
  await assertNotPreviewMode()

  // Validate delivery method before any DB work
  const deliveryMethod = getDefaultV1DeliveryMethod()
  const deliveryUnsupportedReason = getDeliveryMethodUnsupportedReason(deliveryMethod)
  if (deliveryUnsupportedReason) {
    return { ok: false, error: deliveryUnsupportedReason, delivery: null }
  }

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated', delivery: null }

  // 2. Resolve academy_id server-side
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable', delivery: null }
  const academyId = profile.academy_id

  // 3. Director only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const actorRole = membership?.role as UserRole | undefined
  if (actorRole !== 'academy_director') {
    return { ok: false, error: 'Only the academy director can apply parent communications', delivery: null }
  }

  // 4. Fetch the proposed_action
  const rawDb = supabase as any
  const { data: action } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, proposed_payload, actor_id, player_id')
    .eq('id', proposedActionId)
    .single()

  if (!action) return { ok: false, error: 'Proposed action not found', delivery: null }
  if (action.academy_id !== academyId) return { ok: false, error: 'Access denied', delivery: null }
  if (action.target_module !== 'parent_communication') {
    return { ok: false, error: 'This action is not a parent communication draft', delivery: null }
  }
  if (action.status === 'executed') return { ok: true, error: null, delivery: null }
  if (action.status !== 'approved') {
    return { ok: false, error: `Cannot apply a draft with status '${action.status}'. It must be approved first.`, delivery: null }
  }

  // 5. Extract content from payload
  const payload = (action.proposed_payload ?? {}) as ParentSummaryPayload
  const playerId: string | null = (payload.player_id ?? action.player_id) as string | null
  if (!playerId) return { ok: false, error: 'Parent communication has no player ID', delivery: null }

  let content = ''
  if (payload.draft_text) {
    content = payload.draft_text.trim()
  } else if (payload.draft_sections) {
    const s = payload.draft_sections
    const parts: string[] = []
    if (s.working_on) parts.push(`Working on: ${s.working_on}`)
    if (s.improved) parts.push(`Improved: ${s.improved}`)
    if (s.needs_support) parts.push(`Needs support: ${s.needs_support}`)
    if (s.parent_can_do) parts.push(`How you can help: ${s.parent_can_do}`)
    if (s.whats_next) parts.push(`What's next: ${s.whats_next}`)
    content = parts.join('\n\n')
  }
  if (!content) return { ok: false, error: 'Parent communication draft has no content to apply', delivery: null }

  // 6. Verify player belongs to this academy
  const { data: player } = await supabase
    .from('players')
    .select('id, full_name')
    .eq('id', playerId)
    .eq('academy_id', academyId)
    .single()
  if (!player) return { ok: false, error: 'Player not found in this academy', delivery: null }

  const now = new Date().toISOString()

  // 7. Create parent_updates row
  const { data: parentUpdate, error: puError } = await rawDb
    .from('parent_updates')
    .insert({
      academy_id:    academyId,
      player_id:     playerId,
      author_id:     action.actor_id ?? user.id,
      content,
      content_draft: payload.draft_text ?? null,
      status:        'approved' as ParentUpdateStatus,
      subject:       payload.update_focus ?? 'Development Update',
      send_method:   deliveryMethod,
      sent_at:       now,
      approved_by:   user.id,
      approved_at:   now,
    })
    .select('id')
    .single()

  if (puError) {
    const failedResult = buildFailedDeliveryResult(deliveryMethod, puError.message ?? 'Failed to create parent update')
    return { ok: false, error: puError.message ?? 'Failed to create parent update', delivery: failedResult }
  }

  const parentUpdateId = parentUpdate?.id as string | null

  // 8. Update player_development_summary — best-effort
  const { data: existingSummary } = await rawDb
    .from('player_development_summary')
    .select('id')
    .eq('player_id', playerId)
    .eq('academy_id', academyId)
    .maybeSingle()

  if (existingSummary?.id) {
    await rawDb
      .from('player_development_summary')
      .update({ parent_summary: content, show_to_parent: true, updated_at: now })
      .eq('id', existingSummary.id)
  }

  // 9. Mark proposed_action as executed
  await rawDb
    .from('proposed_actions')
    .update({ status: 'executed', applied_at: now, applied_by: user.id })
    .eq('id', proposedActionId)
    .eq('academy_id', academyId)

  // 10. Build typed delivery result
  const deliveryResult = buildPortalPublishedResult({
    parentUpdateId: parentUpdateId ?? '',
    developmentSummaryUpdated: !!existingSummary?.id,
    deliveredAt: now,
  })

  // 11. Write audit log
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
      send_method: deliveryMethod,
      delivery_status: deliveryResult.status,
      development_summary_updated: deliveryResult.developmentSummaryUpdated,
    },
    sourceType: 'ui',
  })

  revalidatePath('/director/review')
  revalidatePath(`/director/players/${playerId}`)
  revalidatePath('/parent/updates')

  return { ok: true, error: null, parentUpdateId, delivery: deliveryResult }
}
