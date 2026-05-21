// Sprint 403 — Rate Limiting V1
// Rate limit policy definitions. No runtime dependency — pure config.
// Server-side only — never import from client components.
//
// IMPORTANT: These policies define INTENDED limits.
// The current in-process implementation (inProcessRateLimit.ts) is NOT reliable
// across serverless instances. Each Vercel function invocation may have its own
// in-memory state. True enforcement requires a database-backed store.
// See docs/RATE_LIMITING_IMPLEMENTATION_NOTES.md for the full strategy.

export type RateLimitScope = 'user' | 'academy' | 'ip'

export interface RateLimitPolicy {
  name: string
  scope: RateLimitScope
  windowMs: number
  limit: number
  userMessage: string
  logTag: string
}

// Convenience: 60s, 5min, 15min, 1hr in ms
const MIN = 60_000
const HR = 3_600_000

export const RATE_LIMIT_POLICIES = {
  // DONNA intelligence (highest cost path)
  DONNA_INTELLIGENCE: {
    name: 'donna_intelligence',
    scope: 'user',
    windowMs: 5 * MIN,
    limit: 5,
    userMessage: 'DONNA is receiving too many requests. Please wait a moment before asking again.',
    logTag: 'rateLimit/donna_intelligence',
  },

  // DONNA text actions (proposed action creation)
  DONNA_TEXT_ACTION: {
    name: 'donna_text_action',
    scope: 'user',
    windowMs: MIN,
    limit: 10,
    userMessage: 'Too many DONNA actions. Please wait before submitting another.',
    logTag: 'rateLimit/donna_text_action',
  },

  // Voice transcription (per user — Whisper API cost)
  VOICE_TRANSCRIPTION: {
    name: 'voice_transcription',
    scope: 'user',
    windowMs: 5 * MIN,
    limit: 20,
    userMessage: 'Voice transcription limit reached. Please type your answer or wait a few minutes.',
    logTag: 'rateLimit/voice_transcription',
  },

  // Voice session start (per academy — concurrent session cost)
  VOICE_SESSION_ACADEMY: {
    name: 'voice_session_academy',
    scope: 'academy',
    windowMs: HR,
    limit: 50,
    userMessage: 'Voice session limit reached for this academy. Contact your director.',
    logTag: 'rateLimit/voice_session_academy',
  },

  // Coach recap structuring (per user)
  COACH_RECAP_STRUCTURING: {
    name: 'coach_recap_structuring',
    scope: 'user',
    windowMs: 5 * MIN,
    limit: 10,
    userMessage: 'Recap structuring limit reached. Please wait before structuring another recap.',
    logTag: 'rateLimit/coach_recap_structuring',
  },

  // Template generation (per academy)
  TEMPLATE_GENERATION: {
    name: 'template_generation',
    scope: 'academy',
    windowMs: 15 * MIN,
    limit: 20,
    userMessage: 'Template generation limit reached. Please wait before generating more templates.',
    logTag: 'rateLimit/template_generation',
  },

  // Parent / player AI questions (per user)
  PORTAL_AI_QUESTION: {
    name: 'portal_ai_question',
    scope: 'user',
    windowMs: 5 * MIN,
    limit: 5,
    userMessage: 'You\'ve asked a lot of questions recently. Please wait a few minutes before asking more.',
    logTag: 'rateLimit/portal_ai_question',
  },

  // TTS / voice response generation (per user)
  TTS_RESPONSE: {
    name: 'tts_response',
    scope: 'user',
    windowMs: MIN,
    limit: 30,
    userMessage: 'Voice response limit reached. Responses will continue as text.',
    logTag: 'rateLimit/tts_response',
  },

  // Wrap-up draft save (per user per session — Sprint 401 has 30s guard; this adds minute-level)
  WRAP_UP_DRAFT: {
    name: 'wrap_up_draft',
    scope: 'user',
    windowMs: MIN,
    limit: 5,
    userMessage: 'Too many wrap-up submissions. Please wait before trying again.',
    logTag: 'rateLimit/wrap_up_draft',
  },
} as const satisfies Record<string, RateLimitPolicy>

export type RateLimitPolicyKey = keyof typeof RATE_LIMIT_POLICIES
