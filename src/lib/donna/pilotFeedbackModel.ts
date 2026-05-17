// Sprint 641 — Pilot Feedback Capture Model V1
// Defines the model for capturing and categorizing pilot feedback.
// Used to structure feedback from Brian and the Dabul team during the pilot.
// Pure TypeScript — no DB writes in this module.

// ── Feedback categories ────────────────────────────────────────────────────────

export type PilotFeedbackCategory =
  | 'wrap_up_friction'
  | 'donna_conversation'
  | 'review_queue'
  | 'player_profile'
  | 'academy_health'
  | 'voice_input'
  | 'mobile_experience'
  | 'navigation'
  | 'missing_feature'
  | 'data_accuracy'
  | 'other'

export type PilotFeedbackSeverity =
  | 'demo_blocker'   // stops the demo / breaks the pilot experience
  | 'high'           // significantly impacts usability
  | 'medium'         // friction but workable
  | 'low'            // nice to have
  | 'positive'       // something that's working well

export type PilotFeedbackSource =
  | 'director'
  | 'head_coach'
  | 'coach'
  | 'internal_observer'

export type PilotFeedbackStatus =
  | 'new'
  | 'triaged'
  | 'in_sprint'
  | 'fixed'
  | 'wont_fix'
  | 'deferred'

// ── Core feedback model ────────────────────────────────────────────────────────

export interface PilotFeedbackEntry {
  id: string
  capturedAt: string           // ISO date string
  source: PilotFeedbackSource
  sourceName: string           // e.g. "Brian", "Coach Martinez"
  category: PilotFeedbackCategory
  severity: PilotFeedbackSeverity
  status: PilotFeedbackStatus
  route: string | null         // URL where the feedback occurred (e.g. "/director/review")
  description: string          // what happened or was said
  userQuote: string | null     // verbatim quote from Brian/coach if available
  suggestedFix: string | null  // internal note on how to address
  sprintAssigned: number | null // sprint that addresses this
}

// ── Category labels ────────────────────────────────────────────────────────────

export const FEEDBACK_CATEGORY_LABELS: Record<PilotFeedbackCategory, string> = {
  wrap_up_friction:    'Wrap-up friction',
  donna_conversation:  'DONNA conversation',
  review_queue:        'Review queue',
  player_profile:      'Player profile',
  academy_health:      'Academy health',
  voice_input:         'Voice input',
  mobile_experience:   'Mobile experience',
  navigation:          'Navigation',
  missing_feature:     'Missing feature',
  data_accuracy:       'Data accuracy',
  other:               'Other',
}

export const FEEDBACK_SEVERITY_LABELS: Record<PilotFeedbackSeverity, string> = {
  demo_blocker: 'Demo blocker',
  high:         'High',
  medium:       'Medium',
  low:          'Low',
  positive:     'Positive',
}

export const FEEDBACK_SEVERITY_COLOR: Record<PilotFeedbackSeverity, string> = {
  demo_blocker: 'text-status-red',
  high:         'text-status-orange',
  medium:       'text-status-orange',
  low:          'text-text-muted',
  positive:     'text-status-green',
}

export const FEEDBACK_STATUS_LABELS: Record<PilotFeedbackStatus, string> = {
  new:              'New',
  triaged:          'Triaged',
  in_sprint:        'In sprint',
  fixed:            'Fixed',
  wont_fix:         "Won't fix",
  deferred:         'Deferred',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function isDemoBlocker(entry: PilotFeedbackEntry): boolean {
  return entry.severity === 'demo_blocker' && entry.status !== 'fixed'
}

export function isOpenFeedback(entry: PilotFeedbackEntry): boolean {
  return entry.status === 'new' || entry.status === 'triaged'
}

export function groupByCategory(
  entries: PilotFeedbackEntry[],
): Record<PilotFeedbackCategory, PilotFeedbackEntry[]> {
  const groups = {} as Record<PilotFeedbackCategory, PilotFeedbackEntry[]>
  for (const entry of entries) {
    if (!groups[entry.category]) groups[entry.category] = []
    groups[entry.category].push(entry)
  }
  return groups
}

export function countBySeverity(entries: PilotFeedbackEntry[]): Record<PilotFeedbackSeverity, number> {
  const counts: Record<PilotFeedbackSeverity, number> = {
    demo_blocker: 0,
    high: 0,
    medium: 0,
    low: 0,
    positive: 0,
  }
  for (const entry of entries) {
    counts[entry.severity]++
  }
  return counts
}
