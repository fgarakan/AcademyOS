// Sprint 321 — Donna Failure Modes Library V1
// Pure TypeScript. No DB, no API, no async, no React.
//
// Standardized failure responses for every error scenario Donna can encounter.
// Each FailureMode has a userMessage (safe to display/speak), a developerMessage
// (console only), and a fallbackAction (what Donna should suggest doing next).
//
// Usage: call getFailureMode(key) to retrieve the appropriate FailureMode,
// then show failureMode.userMessage in the UI and log developerMessage to console.

// ── Types ──────────────────────────────────────────────────────────────────────

export type FailureModeKey =
  // Voice / audio failures
  | 'realtime_unavailable'
  | 'realtime_connect_failed'
  | 'realtime_token_expired'
  | 'realtime_sdp_failed'
  | 'browser_tts_stalled'
  | 'browser_tts_error'
  | 'browser_tts_unsupported'
  | 'mic_denied'
  | 'mic_unsupported'
  | 'speech_recognition_error'
  // Intent / routing failures
  | 'intent_unknown'
  | 'intent_low_confidence'
  | 'task_not_wired'
  | 'workflow_not_found'
  // Draft failures
  | 'draft_field_validation_failed'
  | 'draft_missing_required_fields'
  | 'draft_apply_failed'
  | 'draft_undo_empty_history'
  // Protected action failures
  | 'protected_voice_phrase'
  | 'always_listening_denied'
  | 'level_change_denied'
  | 'send_message_denied'
  | 'session_publish_denied'
  | 'curriculum_apply_denied'
  | 'roster_mutation_denied'
  | 'billing_denied'
  // Context / data failures
  | 'context_fetch_failed'
  | 'review_queue_empty'
  | 'review_queue_load_failed'
  | 'object_resolution_failed'
  | 'no_active_session'
  | 'no_active_player'
  // Server action failures
  | 'server_action_failed'
  | 'server_action_unauthorized'
  | 'server_action_validation_error'
  // Onboarding
  | 'onboarding_answer_empty'
  | 'onboarding_step_unknown'

export type FallbackAction =
  | 'try_again'
  | 'type_instead'
  | 'use_browser_voice'
  | 'use_screen_button'
  | 'open_review_queue'
  | 'navigate_to_player'
  | 'navigate_to_sessions'
  | 'contact_support'
  | 'none'

export interface FailureMode {
  key: FailureModeKey
  userMessage: string       // Director-safe. Never reveals system internals.
  developerMessage: string  // Console log only. May contain technical details.
  fallbackAction: FallbackAction
  /** True when Donna can recover without director action */
  autoRecoverable: boolean
}

// ── Failure mode definitions ───────────────────────────────────────────────────

const FAILURE_MODES: Record<FailureModeKey, FailureMode> = {

  // ── Voice / audio ──────────────────────────────────────────────────────────

  realtime_unavailable: {
    key: 'realtime_unavailable',
    userMessage:
      "Donna voice is not available on this server. You can continue with browser voice or type your answers.",
    developerMessage: 'Realtime API returned 503 — OPENAI_API_KEY not configured.',
    fallbackAction: 'use_browser_voice',
    autoRecoverable: false,
  },

  realtime_connect_failed: {
    key: 'realtime_connect_failed',
    userMessage:
      "Donna couldn't connect her voice. Try again, or switch to browser voice.",
    developerMessage: 'RTCPeerConnection or SDP exchange failed.',
    fallbackAction: 'use_browser_voice',
    autoRecoverable: false,
  },

  realtime_token_expired: {
    key: 'realtime_token_expired',
    userMessage:
      "The voice session expired. Click Play Donna voice to reconnect.",
    developerMessage: 'Ephemeral token expired before SDP exchange completed.',
    fallbackAction: 'try_again',
    autoRecoverable: false,
  },

  realtime_sdp_failed: {
    key: 'realtime_sdp_failed',
    userMessage:
      "Donna's voice connection failed. Try again or use browser voice.",
    developerMessage: 'SDP answer was rejected by setRemoteDescription.',
    fallbackAction: 'use_browser_voice',
    autoRecoverable: false,
  },

  browser_tts_stalled: {
    key: 'browser_tts_stalled',
    userMessage:
      "Donna's voice didn't start. Click Play Donna voice again or type instead.",
    developerMessage: 'Browser TTS watchdog fired — onstart did not fire within 1500ms.',
    fallbackAction: 'type_instead',
    autoRecoverable: false,
  },

  browser_tts_error: {
    key: 'browser_tts_error',
    userMessage:
      "Browser voice failed. Type your answer instead.",
    developerMessage: 'SpeechSynthesisUtterance onerror fired.',
    fallbackAction: 'type_instead',
    autoRecoverable: false,
  },

  browser_tts_unsupported: {
    key: 'browser_tts_unsupported',
    userMessage:
      "Voice isn't supported in this browser. Type your answers and Donna will still guide you.",
    developerMessage: 'window.speechSynthesis is undefined.',
    fallbackAction: 'type_instead',
    autoRecoverable: false,
  },

  mic_denied: {
    key: 'mic_denied',
    userMessage:
      "Donna couldn't hear your mic. Type your answer instead.",
    developerMessage: 'navigator.mediaDevices.getUserMedia() denied.',
    fallbackAction: 'type_instead',
    autoRecoverable: false,
  },

  mic_unsupported: {
    key: 'mic_unsupported',
    userMessage:
      "Voice input isn't supported in this browser. Type your answers instead.",
    developerMessage: 'SpeechRecognition API not available.',
    fallbackAction: 'type_instead',
    autoRecoverable: false,
  },

  speech_recognition_error: {
    key: 'speech_recognition_error',
    userMessage:
      "Donna had trouble hearing that. Try again or type your answer.",
    developerMessage: 'SpeechRecognition onerror fired.',
    fallbackAction: 'type_instead',
    autoRecoverable: true,
  },

  // ── Intent / routing ──────────────────────────────────────────────────────

  intent_unknown: {
    key: 'intent_unknown',
    userMessage:
      "I'm not sure what you're asking. Try saying something like 'create a coach note' or 'create a class template'.",
    developerMessage: 'classifyIntent returned intentType: unknown with confidence: low.',
    fallbackAction: 'none',
    autoRecoverable: true,
  },

  intent_low_confidence: {
    key: 'intent_low_confidence',
    userMessage:
      "I think I understood, but I'm not certain. Could you rephrase that?",
    developerMessage: 'classifyIntent returned confidence: low on a non-unknown intentType.',
    fallbackAction: 'try_again',
    autoRecoverable: true,
  },

  task_not_wired: {
    key: 'task_not_wired',
    userMessage:
      "I can collect the information for that, but saving it isn't available yet. Your answers are captured here for your review.",
    developerMessage: 'Task matched a contract-only DonnaTaskId with saveApplyMethodStatus: not_wired_yet.',
    fallbackAction: 'none',
    autoRecoverable: false,
  },

  workflow_not_found: {
    key: 'workflow_not_found',
    userMessage:
      "I didn't find a matching workflow for that. Try a more specific command.",
    developerMessage: 'getWorkflow() returned undefined for the resolved workflowId.',
    fallbackAction: 'try_again',
    autoRecoverable: true,
  },

  // ── Draft failures ─────────────────────────────────────────────────────────

  draft_field_validation_failed: {
    key: 'draft_field_validation_failed',
    userMessage:
      "I captured that, but I need a clearer answer for this field. Try again.",
    developerMessage: 'applyAnswerToField or updateDraft returned a field value that failed validation.',
    fallbackAction: 'try_again',
    autoRecoverable: true,
  },

  draft_missing_required_fields: {
    key: 'draft_missing_required_fields',
    userMessage:
      "A few required fields are still missing. Let me ask you about them.",
    developerMessage: 'Draft approval attempted while getMissingRequiredFieldIds returned non-empty array.',
    fallbackAction: 'none',
    autoRecoverable: true,
  },

  draft_apply_failed: {
    key: 'draft_apply_failed',
    userMessage:
      "Something went wrong while saving. The draft is still here — try approving again.",
    developerMessage: 'Server action threw an error or returned { error: true }.',
    fallbackAction: 'use_screen_button',
    autoRecoverable: false,
  },

  draft_undo_empty_history: {
    key: 'draft_undo_empty_history',
    userMessage:
      "There's nothing to undo — you're at the beginning of this section.",
    developerMessage: 'undoLastChange called when history.length === 0.',
    fallbackAction: 'none',
    autoRecoverable: true,
  },

  // ── Protected action failures ──────────────────────────────────────────────

  protected_voice_phrase: {
    key: 'protected_voice_phrase',
    userMessage:
      "Approval actions always require the on-screen button. " +
      "I never apply changes, send messages, or save data from voice alone.",
    developerMessage: 'isProtectedVoicePhrase() or checkProtectedAction() returned true.',
    fallbackAction: 'use_screen_button',
    autoRecoverable: false,
  },

  always_listening_denied: {
    key: 'always_listening_denied',
    userMessage:
      "Donna only listens when you click the microphone button. She never listens in the background.",
    developerMessage: 'Always-listening request detected and blocked.',
    fallbackAction: 'none',
    autoRecoverable: false,
  },

  level_change_denied: {
    key: 'level_change_denied',
    userMessage:
      "Player level changes always require the on-screen button. I never move a player by voice alone.",
    developerMessage: 'Level change phrase blocked by donnaProtectedActionRouter.',
    fallbackAction: 'use_screen_button',
    autoRecoverable: false,
  },

  send_message_denied: {
    key: 'send_message_denied',
    userMessage:
      "Sending messages always requires the on-screen button. Nothing is sent until you click Send.",
    developerMessage: 'Send message phrase blocked by donnaProtectedActionRouter.',
    fallbackAction: 'use_screen_button',
    autoRecoverable: false,
  },

  session_publish_denied: {
    key: 'session_publish_denied',
    userMessage:
      "Publishing a session requires the on-screen button. Nothing is sent to coaches until you confirm.",
    developerMessage: 'Session publish phrase blocked by donnaProtectedActionRouter.',
    fallbackAction: 'use_screen_button',
    autoRecoverable: false,
  },

  curriculum_apply_denied: {
    key: 'curriculum_apply_denied',
    userMessage:
      "Applying curriculum changes requires the on-screen button. No changes go live until you confirm.",
    developerMessage: 'Curriculum apply phrase blocked by donnaProtectedActionRouter.',
    fallbackAction: 'use_screen_button',
    autoRecoverable: false,
  },

  roster_mutation_denied: {
    key: 'roster_mutation_denied',
    userMessage:
      "Roster changes require the on-screen button. I never add or remove players from a session by voice.",
    developerMessage: 'Roster mutation phrase blocked by donnaProtectedActionRouter.',
    fallbackAction: 'use_screen_button',
    autoRecoverable: false,
  },

  billing_denied: {
    key: 'billing_denied',
    userMessage:
      "Enrollment and billing actions are not available through Donna. Use the admin panel for those.",
    developerMessage: 'Billing/enrollment phrase blocked by donnaProtectedActionRouter.',
    fallbackAction: 'none',
    autoRecoverable: false,
  },

  // ── Context / data failures ────────────────────────────────────────────────

  context_fetch_failed: {
    key: 'context_fetch_failed',
    userMessage:
      "I couldn't load the context for this page. Try refreshing or navigate to the page directly.",
    developerMessage: 'fetchDonnaContext server action threw an error.',
    fallbackAction: 'try_again',
    autoRecoverable: false,
  },

  review_queue_empty: {
    key: 'review_queue_empty',
    userMessage:
      "Your review queue is empty. There are no pending items waiting for approval.",
    developerMessage: 'getDonnaReviewQueueAction returned an empty or null queue.',
    fallbackAction: 'none',
    autoRecoverable: false,
  },

  review_queue_load_failed: {
    key: 'review_queue_load_failed',
    userMessage:
      "I couldn't load your review queue. Try again in a moment.",
    developerMessage: 'getDonnaReviewQueueAction threw an error.',
    fallbackAction: 'try_again',
    autoRecoverable: false,
  },

  object_resolution_failed: {
    key: 'object_resolution_failed',
    userMessage:
      "I couldn't find a matching player or session. Try using the full name or navigate to the record directly.",
    developerMessage: 'resolveDonnaObjectAction returned no candidates or threw an error.',
    fallbackAction: 'navigate_to_player',
    autoRecoverable: true,
  },

  no_active_session: {
    key: 'no_active_session',
    userMessage:
      "There's no session selected. Navigate to a session first, then ask me again.",
    developerMessage: 'Task requires a session context but getCurrentPageObject returned no session.',
    fallbackAction: 'navigate_to_sessions',
    autoRecoverable: false,
  },

  no_active_player: {
    key: 'no_active_player',
    userMessage:
      "There's no player selected. Navigate to a player profile first, then ask me again.",
    developerMessage: 'Task requires a player context but getCurrentPageObject returned no player.',
    fallbackAction: 'navigate_to_player',
    autoRecoverable: false,
  },

  // ── Server action failures ─────────────────────────────────────────────────

  server_action_failed: {
    key: 'server_action_failed',
    userMessage:
      "Something went wrong. The draft wasn't saved — try approving again.",
    developerMessage: 'Server action returned an error or threw an exception.',
    fallbackAction: 'use_screen_button',
    autoRecoverable: false,
  },

  server_action_unauthorized: {
    key: 'server_action_unauthorized',
    userMessage:
      "You don't have permission to perform that action.",
    developerMessage: 'Server action returned a 401/403 or RLS policy blocked the mutation.',
    fallbackAction: 'none',
    autoRecoverable: false,
  },

  server_action_validation_error: {
    key: 'server_action_validation_error',
    userMessage:
      "One or more fields didn't pass validation. Review the draft and try again.",
    developerMessage: 'Server action returned a validation error (Zod or manual field check).',
    fallbackAction: 'try_again',
    autoRecoverable: true,
  },

  // ── Onboarding ─────────────────────────────────────────────────────────────

  onboarding_answer_empty: {
    key: 'onboarding_answer_empty',
    userMessage:
      "I didn't catch an answer. Could you say that again?",
    developerMessage: 'Onboarding answer handler received empty or whitespace-only text.',
    fallbackAction: 'try_again',
    autoRecoverable: true,
  },

  onboarding_step_unknown: {
    key: 'onboarding_step_unknown',
    userMessage:
      "Something went wrong with the onboarding step. Let's start over.",
    developerMessage: 'handleOnboardingAnswer received an unrecognized step index.',
    fallbackAction: 'try_again',
    autoRecoverable: false,
  },
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Look up a failure mode by key.
 * Always returns a FailureMode — falls back to a generic error if the key
 * is somehow not in the registry (defensive).
 */
export function getFailureMode(key: FailureModeKey): FailureMode {
  return FAILURE_MODES[key] ?? {
    key: 'server_action_failed',
    userMessage: "Something went wrong. Please try again.",
    developerMessage: `Unknown failure mode key: ${key}`,
    fallbackAction: 'try_again',
    autoRecoverable: false,
  }
}

/**
 * Log a failure mode to the console for developer visibility.
 * Never logs userMessage to avoid leaking production details in browser console.
 */
export function logFailure(key: FailureModeKey, context?: Record<string, unknown>): void {
  const mode = getFailureMode(key)
  const extra = context ? JSON.stringify(context) : ''
  console.warn(`[DonnaFailure] ${key}: ${mode.developerMessage}${extra ? ` | ${extra}` : ''}`)
}

/** True when the failure is auto-recoverable without director action. */
export function isAutoRecoverable(key: FailureModeKey): boolean {
  return getFailureMode(key).autoRecoverable
}
