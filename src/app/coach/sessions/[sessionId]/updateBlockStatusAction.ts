'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { writeAuditLog } from '@/lib/audit/auditLogger'

export type BlockActualStatus = 'planned' | 'in_progress' | 'completed' | 'skipped' | 'modified'

export interface UpdateBlockStatusInput {
  sessionId: string
  blockId: string
  status: BlockActualStatus
}

export interface UpdateBlockStatusResult {
  ok: boolean
  error: string | null
}

export async function updateBlockStatusAction(
  input: UpdateBlockStatusInput
): Promise<UpdateBlockStatusResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }
  const academyId = profile.academy_id

  // 3. Verify session belongs to this academy and fetch coach_id
  const { data: session } = await supabase
    .from('sessions')
    .select('id, coach_id')
    .eq('id', input.sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.' }

  // 4. Verify coach access
  const isAssignedCoach = session.coach_id === user.id
  if (!isAssignedCoach) {
    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('academy_id', academyId)
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .in('role', ['coach', 'head_coach', 'academy_director'])
      .single()
    if (!membership) return { ok: false, error: 'Not authorized to update this session.' }
  }

  // 5. Verify the block belongs to this session
  const { data: block } = await rawDb
    .from('session_blocks')
    .select('id')
    .eq('id', input.blockId)
    .eq('session_id', input.sessionId)
    .single()
  if (!block) return { ok: false, error: 'Block not found or does not belong to this session.' }

  // 6. Validate status value server-side
  const validStatuses: BlockActualStatus[] = ['planned', 'in_progress', 'completed', 'skipped', 'modified']
  if (!validStatuses.includes(input.status)) {
    return { ok: false, error: `Invalid block status: ${input.status}` }
  }

  // 7. Write actual_status to session_blocks
  const { error: updateError } = await rawDb
    .from('session_blocks')
    .update({ actual_status: input.status })
    .eq('id', input.blockId)
    .eq('session_id', input.sessionId)

  if (updateError) {
    return { ok: false, error: `Failed to update block status: ${updateError.message}` }
  }

  // 8. Audit log
  await writeAuditLog({
    db: supabase,
    academyId,
    actorId: user.id,
    actorRole: null,
    action: 'session_block_status_updated',
    targetType: 'session_block',
    targetId: input.blockId,
    payload: { sessionId: input.sessionId, status: input.status },
  })

  return { ok: true, error: null }
}
