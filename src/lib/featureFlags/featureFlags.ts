// Sprint 414 — Feature Flags V1
// Environment-variable based feature flags for AcademyOS.
// All flags default to OFF (disabled) when the environment variable is absent or falsy.
// This implements the safe default protocol from docs/feature-flags-and-kill-switches.md.
//
// Server-side only — env vars with NEXT_PUBLIC_ prefix are safe to read from client
// but these flags are for server-side feature gating.
//
// Future: add DB-backed per-academy flags (requires academy_feature_flags migration, Sprint 421+).

function isEnabled(envVar: string | undefined): boolean {
  if (!envVar) return false
  const normalized = envVar.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

// AI and voice feature flags

// DONNA intelligence (Anthropic API) — requires ANTHROPIC_API_KEY
export function isDonnaEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

// Voice transcription (OpenAI Whisper) — requires OPENAI_API_KEY
export function isVoiceTranscriptionEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

// Realtime voice sessions (OpenAI Realtime) — requires OPENAI_REALTIME_API_KEY
export function isRealtimeVoiceEnabled(): boolean {
  return Boolean(process.env.OPENAI_REALTIME_API_KEY?.trim())
}

// TTS responses (text-to-speech) — requires OPENAI_API_KEY
export function isTtsEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

// Beta / experimental feature flags
// These are opt-in via env vars and default to OFF

// Enable the player development summary AI generation
export function isPlayerSummaryGenerationEnabled(): boolean {
  return isEnabled(process.env.FEATURE_PLAYER_SUMMARY_GENERATION)
}

// Enable the background job queue dispatcher
export function isBackgroundJobQueueEnabled(): boolean {
  return isEnabled(process.env.FEATURE_BACKGROUND_JOB_QUEUE)
}

// Enable persistent idempotency key checking (requires idempotency_keys table)
export function isPersistentIdempotencyEnabled(): boolean {
  return isEnabled(process.env.FEATURE_PERSISTENT_IDEMPOTENCY)
}

// Enable UTR data sync
export function isUtrSyncEnabled(): boolean {
  return Boolean(process.env.UTR_API_KEY?.trim())
}

// Dev-only: enable all dev routes — enforced at the middleware level, but guarded here too
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== 'production'
}

// Returns a map of all feature flags and their current state.
// Used by the diagnostics console (/dev/diagnostics).
export function getAllFeatureFlags(): Record<string, boolean> {
  return {
    donna: isDonnaEnabled(),
    voiceTranscription: isVoiceTranscriptionEnabled(),
    realtimeVoice: isRealtimeVoiceEnabled(),
    tts: isTtsEnabled(),
    playerSummaryGeneration: isPlayerSummaryGenerationEnabled(),
    backgroundJobQueue: isBackgroundJobQueueEnabled(),
    persistentIdempotency: isPersistentIdempotencyEnabled(),
    utrSync: isUtrSyncEnabled(),
    devEnvironment: isDevEnvironment(),
  }
}
