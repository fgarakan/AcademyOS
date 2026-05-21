// Sprint 457 — UX State Patterns V1
// Typed configs for loading, error, and success states.
// Pure constants. No DB, no React.

// ── Loading state types ────────────────────────────────────────────────────────

export type LoadingContext =
  | 'page'
  | 'section'
  | 'card'
  | 'action'
  | 'donna_thinking'
  | 'voice_recording'
  | 'voice_transcribing'
  | 'voice_structuring'
  | 'save'
  | 'submit'

export interface LoadingState {
  context: LoadingContext
  label: string
  description?: string
  estimatedMs?: number
}

export const LOADING_STATES: Record<LoadingContext, LoadingState> = {
  page: {
    context: 'page',
    label: 'Loading',
    description: 'Fetching your data…',
  },
  section: {
    context: 'section',
    label: 'Loading',
    description: 'Fetching section…',
  },
  card: {
    context: 'card',
    label: 'Loading',
  },
  action: {
    context: 'action',
    label: 'Processing…',
    estimatedMs: 1500,
  },
  donna_thinking: {
    context: 'donna_thinking',
    label: 'DONNA is thinking…',
    description: 'Building a response with your academy context',
    estimatedMs: 3000,
  },
  voice_recording: {
    context: 'voice_recording',
    label: 'Recording…',
    description: 'Speak clearly into your mic',
  },
  voice_transcribing: {
    context: 'voice_transcribing',
    label: 'Transcribing…',
    description: 'Converting your voice to text',
    estimatedMs: 4000,
  },
  voice_structuring: {
    context: 'voice_structuring',
    label: 'Structuring…',
    description: 'DONNA is turning your voice note into a structured draft',
    estimatedMs: 5000,
  },
  save: {
    context: 'save',
    label: 'Saving…',
    estimatedMs: 1000,
  },
  submit: {
    context: 'submit',
    label: 'Submitting…',
    estimatedMs: 1500,
  },
}

// ── Error state types ─────────────────────────────────────────────────────────

export type ErrorContext =
  | 'page_load'
  | 'data_fetch'
  | 'action_failed'
  | 'donna_unavailable'
  | 'voice_failed'
  | 'permission_denied'
  | 'not_found'
  | 'network'
  | 'validation'

export interface ErrorState {
  context: ErrorContext
  heading: string
  body: string
  showRetry: boolean
  showRequestId: boolean
  recoveryHref?: string
  recoveryLabel?: string
}

export const ERROR_STATES: Record<ErrorContext, ErrorState> = {
  page_load: {
    context: 'page_load',
    heading: 'Something went wrong',
    body: 'This page could not be loaded. Refresh to try again.',
    showRetry: true,
    showRequestId: true,
  },
  data_fetch: {
    context: 'data_fetch',
    heading: 'Could not load data',
    body: 'There was a problem fetching this data. Please try again.',
    showRetry: true,
    showRequestId: true,
  },
  action_failed: {
    context: 'action_failed',
    heading: 'Action could not be completed',
    body: 'Something went wrong. Your change was not saved. Please try again.',
    showRetry: true,
    showRequestId: true,
  },
  donna_unavailable: {
    context: 'donna_unavailable',
    heading: 'DONNA is unavailable',
    body: 'The AI assistant is temporarily unavailable. Try again in a moment.',
    showRetry: true,
    showRequestId: false,
  },
  voice_failed: {
    context: 'voice_failed',
    heading: 'Voice capture failed',
    body: 'The recording could not be processed. Type your note instead, or try again.',
    showRetry: true,
    showRequestId: false,
  },
  permission_denied: {
    context: 'permission_denied',
    heading: 'Access denied',
    body: "You don't have permission to view or perform this action.",
    showRetry: false,
    showRequestId: false,
    recoveryHref: '/',
    recoveryLabel: 'Go home',
  },
  not_found: {
    context: 'not_found',
    heading: 'Not found',
    body: 'This page or item does not exist or has been removed.',
    showRetry: false,
    showRequestId: false,
    recoveryHref: '/',
    recoveryLabel: 'Go home',
  },
  network: {
    context: 'network',
    heading: 'Connection problem',
    body: 'Check your connection and try again.',
    showRetry: true,
    showRequestId: false,
  },
  validation: {
    context: 'validation',
    heading: 'Please check your input',
    body: 'Some required fields are missing or invalid.',
    showRetry: false,
    showRequestId: false,
  },
}

// ── Success state types ────────────────────────────────────────────────────────

export type SuccessContext =
  | 'draft_saved'
  | 'action_submitted'
  | 'action_approved'
  | 'action_rejected'
  | 'note_captured'
  | 'attendance_marked'
  | 'recap_submitted'
  | 'summary_approved'
  | 'badge_awarded'
  | 'template_saved'

export interface SuccessState {
  context: SuccessContext
  message: string
  durationMs: number
}

export const SUCCESS_STATES: Record<SuccessContext, SuccessState> = {
  draft_saved:      { context: 'draft_saved',      message: 'Draft saved',               durationMs: 2500 },
  action_submitted: { context: 'action_submitted',  message: 'Submitted for review',      durationMs: 3000 },
  action_approved:  { context: 'action_approved',   message: 'Action approved',           durationMs: 3000 },
  action_rejected:  { context: 'action_rejected',   message: 'Action rejected',           durationMs: 3000 },
  note_captured:    { context: 'note_captured',     message: 'Note captured',             durationMs: 2500 },
  attendance_marked:{ context: 'attendance_marked', message: 'Attendance marked',         durationMs: 2500 },
  recap_submitted:  { context: 'recap_submitted',   message: 'Wrap-up submitted',         durationMs: 3000 },
  summary_approved: { context: 'summary_approved',  message: 'Summary approved',          durationMs: 3000 },
  badge_awarded:    { context: 'badge_awarded',     message: 'Badge awarded! 🏅',         durationMs: 4000 },
  template_saved:   { context: 'template_saved',    message: 'Template saved',            durationMs: 2500 },
}

// ── Draft saved indicator ─────────────────────────────────────────────────────

export type DraftSavedStatus = 'unsaved' | 'saving' | 'saved' | 'error'

export function getDraftStatusLabel(status: DraftSavedStatus): string {
  if (status === 'unsaved') return 'Unsaved changes'
  if (status === 'saving') return 'Saving…'
  if (status === 'saved') return 'Draft saved'
  return 'Save failed'
}
