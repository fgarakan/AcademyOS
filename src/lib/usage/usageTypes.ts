// Sprint 407 — AI/Voice Usage Metering V1
// Defines usage event types for tracking AI and voice feature consumption.
// Server-side only.

export type UsageEventType =
  | 'donna_intelligence_call'
  | 'voice_transcription'
  | 'voice_structuring'
  | 'tts_response'
  | 'template_generation'
  | 'portal_ai_question'
  | 'coaching_message_generation'
  | 'recommendation_generation'
  // Sprint 1005 — DONNA orchestration usage tracking
  | 'donna_tool_call'                // Safe live context tool execution (get_academy_state, etc.)
  | 'donna_orchestration_fallback'   // Fallback path used (API key missing, validation fail, etc.)

export interface UsageEvent {
  eventType: UsageEventType
  academyId: string
  userId: string | null
  sessionId?: string | null
  requestId?: string
  // AI model metadata
  provider?: 'openai' | 'anthropic'
  model?: string
  // Token counts if available
  inputTokens?: number
  outputTokens?: number
  // Latency
  latencyMs?: number
  // Whether the event was blocked by a rate limit or kill switch
  blocked?: boolean
  blockedReason?: 'rate_limit' | 'kill_switch' | 'quota_exceeded'
  // ISO timestamp — defaults to now() in the tracker
  occurredAt?: string
}

export interface UsageSummary {
  academyId: string
  windowStart: string
  windowEnd: string
  events: Array<{
    eventType: UsageEventType
    count: number
    blockedCount: number
  }>
}
