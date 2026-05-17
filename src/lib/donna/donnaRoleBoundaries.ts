// Role boundary definitions for DONNA.
// Pure utility. No React, no DB, no API.
// Determines which DONNA tasks and modes each role may access.

export type DonnaRole = 'director' | 'coach'

// Task IDs a coach is permitted to initiate.
// Everything not in this set requires director authorization.
export const COACH_ALLOWED_TASK_IDS: ReadonlySet<string> = new Set([
  'capture_coach_note',
  'draft_player_note',
])

// Assistant modes a coach may use.
// 'create_template' and 'review_queue' are director-only.
export const COACH_ALLOWED_MODES: ReadonlySet<string> = new Set([
  'guide',
  'explain',
  'find',
  'capture',
  'guided_task',
])

// Navigation quick-links shown in DONNA's "find" mode for coaches.
export const COACH_QUICK_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'My Sessions', href: '/coach/sessions' },
  { label: 'My Players', href: '/coach/players' },
]

// Copy shown when a coach attempts a director-only action.
export const DIRECTOR_REQUIRED_COPY =
  "That requires director approval. I can help you capture a note for review."

/**
 * Returns true if the given task ID may be started by the given role.
 * Directors can start any task. Coaches are restricted to COACH_ALLOWED_TASK_IDS.
 */
export function isTaskAllowedForRole(taskId: string, role: DonnaRole): boolean {
  if (role === 'director') return true
  return COACH_ALLOWED_TASK_IDS.has(taskId)
}

/**
 * Returns true if the given assistant mode is accessible for the given role.
 */
export function isModeAllowedForRole(mode: string, role: DonnaRole): boolean {
  if (role === 'director') return true
  return COACH_ALLOWED_MODES.has(mode)
}
