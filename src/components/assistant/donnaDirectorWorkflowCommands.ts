// Sprint 381 — Director-Initiated Donna Workflows V1
// Unified command routing map for 7 COO-layer director workflow commands.
// matchDirectorWorkflowCommand() is used in handleCommandSubmit + handleVoiceTranscript
// to centralize phrase matching for the 2 new commands before falling through to
// existing per-phrase checks.

// ── Command IDs ────────────────────────────────────────────────────────────────

export type DirectorWorkflowCommandId =
  | 'what_needs_attention'
  | 'daily_brief'
  | 'draft_parent_update'
  | 'coach_brief'
  | 'show_review_queue'
  | 'attendance_exception_draft'
  | 'recommendation_summary'

// ── Command definitions ────────────────────────────────────────────────────────

interface DirectorWorkflowCommand {
  id: DirectorWorkflowCommandId
  label: string
  phrases: string[]
}

export const DIRECTOR_WORKFLOW_COMMANDS: DirectorWorkflowCommand[] = [
  {
    id: 'recommendation_summary',
    label: 'Show recommendations',
    phrases: [
      'show recommendations',
      'show me your recommendations',
      "what's your recommendation",
      'give me recommendations',
      'any recommendations',
      "what's recommended",
      'show my recommendations',
      'what do you recommend',
      'donna recommend',
      'what are your recommendations',
    ],
  },
  {
    id: 'attendance_exception_draft',
    label: 'Log an attendance exception',
    phrases: [
      'log attendance exception',
      'log an attendance exception',
      'attendance exception',
      'log an absence',
      'record an absence',
      'mark a player absent',
      'player was absent',
      'player came late',
      'log a late arrival',
      'late arrival',
      'early leave',
      'mark early leave',
      'log attendance issue',
      'record attendance',
    ],
  },
  {
    id: 'what_needs_attention',
    label: 'What needs attention',
    phrases: [
      'what needs attention',
      'anything urgent',
      'what should i do first',
      'what is urgent',
      "what's urgent",
      'whats urgent',
      'urgent items',
      'needs attention',
      'any urgent',
      'priority items',
    ],
  },
  {
    id: 'daily_brief',
    label: 'Daily brief',
    phrases: [
      "what's happening today",
      'daily brief',
      'morning brief',
      "what's going on today",
      'brief me',
      'give me a brief',
      'whats happening today',
      'today brief',
    ],
  },
  {
    id: 'draft_parent_update',
    label: 'Draft a parent update',
    phrases: [
      'draft a parent',
      'parent message',
      'parent update',
      'write to the parent',
      'send a parent update',
      'message to parent',
    ],
  },
  {
    id: 'coach_brief',
    label: 'Brief a coach',
    phrases: [
      'draft a coach',
      'coach brief',
      'brief the coach',
      'message to coach',
      'prepare coach brief',
      'brief for coach',
    ],
  },
  {
    id: 'show_review_queue',
    label: 'Show review queue',
    phrases: [
      'what needs my attention',
      'show review queue',
      'open review queue',
      'review queue',
      'show pending notes',
      'show pending',
      'notes needing routing',
      'unlinked notes',
      'needs my review',
      'pending approvals',
    ],
  },
]

// ── Matcher ────────────────────────────────────────────────────────────────────

/**
 * Match the first COO-layer director workflow command that matches the input text.
 * Returns null if no command matched.
 * Checks commands in definition order — recommendation_summary and
 * attendance_exception_draft are listed first so they are matched before the
 * broader attention/review phrases that already have dedicated handlers.
 */
export function matchDirectorWorkflowCommand(text: string): DirectorWorkflowCommandId | null {
  const lower = text.toLowerCase().trim()
  for (const cmd of DIRECTOR_WORKFLOW_COMMANDS) {
    for (const phrase of cmd.phrases) {
      if (lower.includes(phrase)) return cmd.id
    }
  }
  return null
}
