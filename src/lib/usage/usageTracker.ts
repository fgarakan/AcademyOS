// Sprint 407 — AI/Voice Usage Metering V1
// Log-based usage tracker. Currently writes usage events to structured stdout.
// The in-process store enables per-instance summaries; NOT shared across serverless instances.
//
// Sprint 1007 — DB write path added via writeUsageEventToDb(supabase, event).
// Existing logUsageEvent() is unchanged — DB writes are additive and opt-in.
// The interface is stable so existing callers don't change.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { UsageEvent, UsageEventType } from './usageTypes'
import { logInfo } from '@/lib/observability/logger'

// In-process usage accumulator — not shared across serverless instances.
// Used only for local summaries and debugging, not billing enforcement.
const inProcessTotals = new Map<string, number>()

function usageBucketKey(academyId: string, eventType: UsageEventType): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${academyId}:${eventType}:${date}`
}

// Record a usage event. Call this after each AI or voice API call, successful or blocked.
export function logUsageEvent(event: UsageEvent): void {
  const occurredAt = event.occurredAt ?? new Date().toISOString()
  const bucket = usageBucketKey(event.academyId, event.eventType)
  inProcessTotals.set(bucket, (inProcessTotals.get(bucket) ?? 0) + 1)

  logInfo('usage_event', {
    eventType: event.eventType,
    academyId: event.academyId,
    userId: event.userId,
    sessionId: event.sessionId,
    requestId: event.requestId,
    provider: event.provider,
    model: event.model,
    inputTokens: event.inputTokens,
    outputTokens: event.outputTokens,
    latencyMs: event.latencyMs,
    blocked: event.blocked ?? false,
    blockedReason: event.blockedReason,
    occurredAt,
  })
}

// Returns the in-process daily count for a given event type and academy.
// This count resets on cold starts — use only for debugging, not enforcement.
export function getInProcessDailyCount(academyId: string, eventType: UsageEventType): number {
  return inProcessTotals.get(usageBucketKey(academyId, eventType)) ?? 0
}

// Convenience wrappers for the three highest-frequency event types.

export function logDonnaCall(params: {
  academyId: string
  userId: string | null
  requestId?: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  latencyMs?: number
  blocked?: boolean
  blockedReason?: UsageEvent['blockedReason']
}): void {
  logUsageEvent({
    eventType: 'donna_intelligence_call',
    provider: 'anthropic',
    ...params,
  })
}

export function logTranscriptionCall(params: {
  academyId: string
  userId: string | null
  requestId?: string
  latencyMs?: number
  blocked?: boolean
  blockedReason?: UsageEvent['blockedReason']
}): void {
  logUsageEvent({
    eventType: 'voice_transcription',
    provider: 'openai',
    model: 'whisper-1',
    ...params,
  })
}

export function logVoiceStructuringCall(params: {
  academyId: string
  userId: string | null
  requestId?: string
  model?: string
  latencyMs?: number
  blocked?: boolean
  blockedReason?: UsageEvent['blockedReason']
}): void {
  logUsageEvent({
    eventType: 'voice_structuring',
    provider: 'anthropic',
    ...params,
  })
}

// ── Sprint 1007 — DB-backed write path ────────────────────────────────────────

/**
 * Write a usage event to the persistent `usage_events` DB table.
 * Runs alongside logUsageEvent() — additive, never replaces it.
 * Call from server action context where a Supabase client is available.
 *
 * Safe fields written: event_type, academy_id, provider, model,
 *   input_tokens, output_tokens, latency_ms, blocked, blocked_reason, request_id.
 * Never written: raw prompts, raw responses, raw notes, player names, full UUIDs.
 *
 * Never throws — DB write failure is silently swallowed to protect callers.
 * The in-process log (logUsageEvent) is always the source of truth for the current instance.
 */
export async function writeUsageEventToDb(
  supabase: SupabaseClient,
  event: UsageEvent,
): Promise<void> {
  try {
    await supabase.from('usage_events').insert({
      academy_id:    event.academyId,
      event_type:    event.eventType,
      provider:      event.provider    ?? null,
      model:         event.model       ?? null,
      input_tokens:  event.inputTokens  ?? null,
      output_tokens: event.outputTokens ?? null,
      latency_ms:    event.latencyMs    ?? null,
      blocked:       event.blocked      ?? false,
      blocked_reason: event.blockedReason ?? null,
      request_id:    event.requestId    ?? null,
      occurred_at:   event.occurredAt   ?? new Date().toISOString(),
    })
  } catch {
    // DB write failure must never affect the caller or DONNA's response pipeline
  }
}
