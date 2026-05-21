// Sprint 413 — Audit Log Application V1
// Typed helper for writing to the audit_logs table.
// Wraps the raw Supabase insert with intent-clear, type-safe arguments.
//
// All major mutations must call writeAuditLog() on success.
// Failures to write the audit log should be logged but must NOT block the mutation.
// See docs/audit-log-strategy.md for the full contract.
//
// Server-side only.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/database.types'
import { logError } from '@/lib/observability/logger'

type UserRole = Database['public']['Enums']['user_role']

export interface AuditLogParams {
  db: SupabaseClient<Database>
  academyId: string
  actorId: string | null
  actorRole: UserRole | null
  action: string
  targetType: string
  targetId?: string | null
  targetLabel?: string | null
  payload?: Json | null
  sourceType?: 'voice' | 'ui' | 'system' | 'api'
  voiceCommandId?: string | null
  requestId?: string
}

// Write a single audit log entry. Returns the new log ID on success, null on failure.
// Must NOT throw — callers should not be blocked by audit log failures.
export async function writeAuditLog(params: AuditLogParams): Promise<string | null> {
  const {
    db,
    academyId,
    actorId,
    actorRole,
    action,
    targetType,
    targetId,
    targetLabel,
    payload,
    sourceType = 'ui',
    voiceCommandId,
  } = params

  try {
    const { data, error } = await db
      .from('audit_logs')
      .insert({
        academy_id: academyId,
        actor_id: actorId ?? null,
        actor_role: actorRole ?? null,
        action,
        target_type: targetType,
        target_id: targetId ?? null,
        target_label: targetLabel ?? null,
        payload: payload ?? null,
        source_type: sourceType,
        voice_command_id: voiceCommandId ?? null,
      })
      .select('id')
      .single()

    if (error) {
      logError('audit_log_write_failed', {
        requestId: params.requestId,
        action,
        targetType,
        targetId,
        error: error.message,
      })
      return null
    }

    return data?.id ?? null
  } catch (err) {
    logError('audit_log_exception', {
      requestId: params.requestId,
      action,
      targetType,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

// Convenience wrapper for system-initiated audit log entries (no human actor).
export async function writeSystemAuditLog(
  params: Omit<AuditLogParams, 'actorId' | 'actorRole' | 'sourceType'>,
): Promise<string | null> {
  return writeAuditLog({
    ...params,
    actorId: null,
    actorRole: null,
    sourceType: 'system',
  })
}

// Convenience wrapper for voice-initiated audit log entries.
export async function writeVoiceAuditLog(
  params: Omit<AuditLogParams, 'sourceType'> & { voiceCommandId: string },
): Promise<string | null> {
  return writeAuditLog({
    ...params,
    sourceType: 'voice',
  })
}
