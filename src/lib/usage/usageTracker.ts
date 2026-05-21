// Sprint 407 — AI/Voice Usage Metering V1
// Log-based usage tracker. Currently writes usage events to structured stdout.
// The in-process store enables per-instance summaries; NOT shared across serverless instances.
//
// Future: replace logUsageEvent() with a DB-backed write to a `usage_events` table
// (requires Sprint 419+ migration). The interface is stable so callers don't change.

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
