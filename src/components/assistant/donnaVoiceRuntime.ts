// Donna Voice Runtime — Mega Sprint 297–310
// Shared types and pure utilities for all Donna voice flows.
// No React, no DB, no API calls — safe to import anywhere.

// ── Voice mode ────────────────────────────────────────────────────────────────

/** Which voice output path is currently active for Floating Donna. */
export type DonnaVoiceMode =
  | 'realtime'  // OpenAI Realtime WebRTC — primary premium path (no mic required)
  | 'browser'   // browser speechSynthesis — fallback/debug
  | 'typed'     // no voice — director types answers

// ── Output status ─────────────────────────────────────────────────────────────

export type DonnaVoiceOutputStatus =
  | 'idle'
  | 'preparing'  // token fetch / connection in progress
  | 'ready'      // connected and ready to speak
  | 'speaking'   // currently producing audio
  | 'stalled'    // watchdog fired — audio did not start within timeout
  | 'failed'     // unrecoverable error in current mode
  | 'done'       // utterance completed cleanly

// ── Input status ──────────────────────────────────────────────────────────────

export type DonnaVoiceInputStatus =
  | 'idle'
  | 'listening'     // SpeechRecognition is active
  | 'transcribing'  // processing captured audio
  | 'reviewing'     // transcript shown, director editing before submit
  | 'failed'        // mic denied or recognition error

// ── Fallback reason ───────────────────────────────────────────────────────────

export type DonnaVoiceFallbackReason =
  | 'none'
  | 'realtime_unavailable'          // server returned 503 (no OPENAI_API_KEY)
  | 'realtime_not_heard'            // director clicked "I did not hear Donna"
  | 'realtime_connect_failed'       // SDP / token / network error
  | 'browser_tts_stalled'          // watchdog fired in browser TTS mode
  | 'browser_tts_error'            // browser TTS onerror
  | 'mic_denied'                    // navigator.mediaDevices denied
  | 'speech_recognition_unavailable' // SpeechRecognition not in this browser
  | 'user_selected_typed'          // director chose typed mode explicitly
  | 'timeout'                       // step stayed stuck too long

// ── Status labels (production-safe, no engineering terms) ─────────────────────

export function getVoiceModeLabel(mode: DonnaVoiceMode): string {
  switch (mode) {
    case 'realtime': return 'Donna is ready.'
    case 'browser': return 'Donna is ready (browser voice).'
    case 'typed': return 'Voice is unavailable, but Donna can still guide you.'
  }
}

export function getVoiceOutputStatusLabel(
  status: DonnaVoiceOutputStatus,
  mode: DonnaVoiceMode,
): string {
  if (mode === 'realtime') {
    switch (status) {
      case 'idle':     return 'Donna is ready.'
      case 'preparing': return 'Connecting Donna voice…'
      case 'ready':    return 'Donna is ready.'
      case 'speaking': return 'Donna is speaking.'
      case 'stalled':  return "Donna's voice did not start. Try again."
      case 'failed':   return 'Donna voice is unavailable.'
      case 'done':     return 'Donna spoke.'
    }
  }
  if (mode === 'browser') {
    switch (status) {
      case 'idle':     return 'Donna is ready.'
      case 'preparing': return 'Starting browser voice…'
      case 'ready':    return 'Donna is ready.'
      case 'speaking': return 'Donna is speaking.'
      case 'stalled':  return "Donna's voice did not start. Click Play Donna voice again or type instead."
      case 'failed':   return 'Browser voice is unavailable.'
      case 'done':     return 'Donna spoke.'
    }
  }
  return 'Voice is unavailable, but Donna can still guide you.'
}

export function getVoiceInputStatusLabel(status: DonnaVoiceInputStatus): string {
  switch (status) {
    case 'idle':        return 'Ask Donna a question or type your answer.'
    case 'listening':   return 'Donna is listening…'
    case 'transcribing': return 'Donna is transcribing…'
    case 'reviewing':   return 'Donna heard this. Review before using.'
    case 'failed':      return 'Donna could not hear your mic. Type your answer instead.'
  }
}

export function getFallbackMessage(reason: DonnaVoiceFallbackReason): string | null {
  switch (reason) {
    case 'none': return null
    case 'realtime_unavailable':
      return 'Donna voice is not configured on this server. Browser voice or typed setup is available.'
    case 'realtime_not_heard':
      return 'No problem. Switching to browser voice.'
    case 'realtime_connect_failed':
      return 'Donna could not start voice. Try Browser Voice or continue typed.'
    case 'browser_tts_stalled':
      return "Donna's voice did not start. Click Play Donna voice again or type instead."
    case 'browser_tts_error':
      return 'Browser voice failed. Type your answer instead.'
    case 'mic_denied':
      return 'Donna could not hear your mic. Type your answer instead.'
    case 'speech_recognition_unavailable':
      return 'Voice input is not supported in this browser. You can type your answers.'
    case 'user_selected_typed':
      return 'Continuing in typed mode. Donna will still guide you.'
    case 'timeout':
      return 'This step took too long. Restart this question.'
  }
}

// ── Protected workflow phrases ─────────────────────────────────────────────────
// Voice may never trigger saves, approvals, level changes, sends, or mutations.
// These phrases sound like approval commands but must always use the on-screen button.

export const VOICE_PROTECTED_PHRASES: readonly string[] = [
  'apply it', 'send it', 'move her up', 'move him up', 'move them up',
  'approve it', 'confirm it', 'save it now', 'do it',
  'go ahead and apply', 'go ahead and send', 'go ahead and save', 'execute it',
]

export function isProtectedVoicePhrase(lower: string): boolean {
  return VOICE_PROTECTED_PHRASES.some(p => lower.includes(p))
}

export const VOICE_PROTECTED_RESPONSE =
  'Approval actions always require the on-screen button. ' +
  'I never apply level changes, send messages, or save data from voice alone.'

// ── Onboarding routing phrases ─────────────────────────────────────────────────
// Donna explains and routes to onboarding — does not auto-start it.

export const ONBOARDING_ROUTING_PHRASES: readonly string[] = [
  'academy onboarding', 'academy setup', 'setup academy', 'help me onboard',
  'start onboarding', 'set up my academy', 'set up the academy',
  'onboard my academy', 'begin setup', 'start setup', 'onboarding wizard',
  'guide me through setup', 'walk me through setup',
]

export function isOnboardingRoutingPhrase(lower: string): boolean {
  return ONBOARDING_ROUTING_PHRASES.some(p => lower.includes(p))
}

export const ONBOARDING_ROUTING_RESPONSE =
  "Academy onboarding is a guided setup process. Click 'Start Academy Onboarding' and I'll walk you through it step by step. " +
  "I'll ask one question at a time and nothing saves until you confirm."

// ── Wake phrase detection ──────────────────────────────────────────────────────
// Only active while Donna panel is open. No global always-listening.

const WAKE_PHRASES: readonly string[] = [
  'hey donna', 'hi donna', 'okay donna', 'ok donna', 'yo donna',
  'hey, donna', 'hi, donna', 'donna',
]

export function detectWakePhrase(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim()
  // "donna" alone counts only if it's the entire utterance or starts it
  if (lower === 'donna' || lower.startsWith('donna,') || lower.startsWith('donna ')) return true
  return WAKE_PHRASES.filter(p => p !== 'donna').some(p => lower.includes(p))
}

export function extractCommandAfterWake(transcript: string): string {
  const lower = transcript.toLowerCase().trim()
  for (const phrase of WAKE_PHRASES) {
    const idx = lower.indexOf(phrase)
    if (idx !== -1) {
      const after = transcript.slice(idx + phrase.length).trim().replace(/^[,.]?\s*/, '')
      if (after.length > 0) return after
    }
  }
  return ''
}

// ── Failure escalation timeouts ────────────────────────────────────────────────

/** ms before a stalled voice step shows "Restart this question" */
export const STEP_STUCK_TIMEOUT_MS = 15_000

/** ms before showing "No transcript yet. Retry or type instead." */
export const TRANSCRIPT_TIMEOUT_MS = 10_000

// ── Demo mode routing ──────────────────────────────────────────────────────────
// Donna can explain and route to workflows. She never auto-starts them.

export const DEMO_ONBOARDING_INTRO =
  "I'm Donna, your Academy Operating Assistant. " +
  "I can walk you through Academy Setup, help you build class templates, " +
  "schedule sessions, review what needs attention, and draft parent updates. " +
  "Everything I do goes through you first — nothing saves without your approval. " +
  "What would you like to do first?"
