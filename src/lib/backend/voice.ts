import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, TablesUpdate, Json } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ── Voice pipeline ───────────────────────────────────────────

export async function submitVoiceCommand(
  db: DB,
  academyId: string,
  issuerId: string,
  issuerRole: string,
  rawInput: string
): Promise<string> {
  const { data, error } = await db
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: issuerId,
      issuer_role: issuerRole as any,
      raw_input: rawInput,
      transcript: rawInput,
      input_method: 'typed',
      processing_status: 'pending',
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function getPendingActions(db: DB, academyId: string) {
  const { data, error } = await db
    .from('v_pending_proposed_actions')
    .select('*')
    .eq('academy_id', academyId)

  if (error) throw error
  return data
}

export async function approveAction(
  db: DB,
  actionId: string,
  approverId: string,
  modifiedPayload?: object
) {
  const update: TablesUpdate<'proposed_actions'> = modifiedPayload
    ? {
        status: 'modified',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        modified_payload: modifiedPayload as Json,
      }
    : {
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      }

  const { error } = await db
    .from('proposed_actions')
    .update(update)
    .eq('id', actionId)

  if (error) throw error
}

export async function rejectAction(
  db: DB,
  actionId: string,
  rejectedBy: string,
  reason: string
) {
  const { error } = await db
    .from('proposed_actions')
    .update({
      status: 'rejected',
      rejected_by: rejectedBy,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', actionId)

  if (error) throw error
}

export async function executeApprovedAction(
  db: DB,
  actionId: string,
  executorId: string
) {
  const { data, error } = await db.rpc('execute_approved_action', {
    p_action_id: actionId,
    p_executor_id: executorId,
  })
  if (error) throw error
  return data
}
