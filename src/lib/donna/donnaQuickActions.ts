// Sprint 1009 — DONNA Permission-Aware Quick Actions V1
// Role-scoped quick action definitions for all DONNA surfaces.
// Pure utility — no React, no DB, no API calls.
// Extends donnaRoleBoundaries.ts (role guards) and donnaProtectedActionRegistry.ts (blocked actions).
// Callers filter by role before rendering.

import { isTaskAllowedForRole, type DonnaRole } from './donnaRoleBoundaries'

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuickActionCategory =
  | 'safe_read'
  | 'draft_only'
  | 'requires_approval'
  | 'blocked_for_role'
  | 'future_capability'

export type QuickActionDomain =
  | 'session'
  | 'attendance'
  | 'observation'
  | 'template'
  | 'curriculum'
  | 'player_profile'
  | 'parent_message'
  | 'roster'
  | 'review_queue'
  | 'academy_health'

export interface DonnaQuickAction {
  id: string
  label: string
  description: string
  role: DonnaRole | 'all'
  category: QuickActionCategory
  domain: QuickActionDomain
  href?: string
  disabledReason?: string
}

// ── Director quick actions ────────────────────────────────────────────────────

export const DIRECTOR_QUICK_ACTIONS: DonnaQuickAction[] = [
  {
    id: 'summarize_today',
    label: 'Summarize today',
    description: 'See sessions, wrap-up coverage, and pending items for today.',
    role: 'director',
    category: 'safe_read',
    domain: 'academy_health',
    href: '/director',
  },
  {
    id: 'show_pending_reviews',
    label: 'Show pending reviews',
    description: 'Open the review queue and see all items awaiting director decision.',
    role: 'director',
    category: 'safe_read',
    domain: 'review_queue',
    href: '/director/review',
  },
  {
    id: 'academy_risks',
    label: 'Show academy risks',
    description: 'Surface attention flags, missing wrap-ups, and curriculum gaps.',
    role: 'director',
    category: 'safe_read',
    domain: 'academy_health',
    href: '/director/attention',
  },
  {
    id: 'inspect_player',
    label: 'Inspect player progress',
    description: 'View a player profile with development summary, observations, and gap guidance.',
    role: 'director',
    category: 'safe_read',
    domain: 'player_profile',
    href: '/director/players',
  },
  {
    id: 'review_templates',
    label: 'Review template drafts',
    description: 'Browse class and fitness templates awaiting approval.',
    role: 'director',
    category: 'safe_read',
    domain: 'template',
    href: '/director/templates',
  },
  {
    id: 'review_curriculum',
    label: 'Review curriculum',
    description: 'Explore curriculum levels, gates, and requirements.',
    role: 'director',
    category: 'safe_read',
    domain: 'curriculum',
    href: '/director/curriculum',
  },
  {
    id: 'donna_intelligence',
    label: 'Open DONNA Intelligence',
    description: 'Full COO intelligence panel with academy health, player risks, and coach coverage.',
    role: 'director',
    category: 'safe_read',
    domain: 'academy_health',
    href: '/director',
  },
]

// ── Coach quick actions ───────────────────────────────────────────────────────

export const COACH_QUICK_ACTIONS: DonnaQuickAction[] = [
  {
    id: 'start_session',
    label: 'Start session',
    description: 'Open the focused block-by-block execution view.',
    role: 'coach',
    category: 'safe_read',
    domain: 'session',
  },
  {
    id: 'capture_note',
    label: 'Capture a note',
    description: 'Draft a quick coach observation note. Goes to review queue.',
    role: 'coach',
    category: 'draft_only',
    domain: 'observation',
  },
  {
    id: 'mark_attendance',
    label: 'Mark attendance',
    description: 'Record attendance exceptions. Goes to review queue.',
    role: 'coach',
    category: 'draft_only',
    domain: 'attendance',
  },
  {
    id: 'wrap_up',
    label: 'Start wrap-up',
    description: 'Begin the DONNA 6-question guided wrap-up flow.',
    role: 'coach',
    category: 'safe_read',
    domain: 'session',
  },
  {
    id: 'adjust_session',
    label: 'Adjust session',
    description: 'Suggest adjustments to session difficulty or duration. Draft only.',
    role: 'coach',
    category: 'draft_only',
    domain: 'session',
  },
  {
    id: 'send_parent_message',
    label: 'Send parent message',
    description: 'Blocked — coaches cannot send parent messages directly.',
    role: 'coach',
    category: 'blocked_for_role',
    domain: 'parent_message',
    disabledReason: 'Parent communications require director approval. Use wrap-up to draft a parent-safe summary for review.',
  },
  {
    id: 'approve_level',
    label: 'Approve level movement',
    description: 'Blocked — level changes require director authorization.',
    role: 'coach',
    category: 'blocked_for_role',
    domain: 'curriculum',
    disabledReason: 'Level movement requires explicit director approval.',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns quick actions for the given role, excluding blocked actions if hideBlocked is true. */
export function getQuickActionsForRole(
  role: DonnaRole,
  hideBlocked = false,
): DonnaQuickAction[] {
  const all = role === 'director' ? DIRECTOR_QUICK_ACTIONS : COACH_QUICK_ACTIONS
  if (hideBlocked) return all.filter(a => a.category !== 'blocked_for_role')
  return all
}

/** Returns true if the given quick action is allowed for the given role. */
export function isQuickActionAllowed(action: DonnaQuickAction, role: DonnaRole): boolean {
  if (action.category === 'blocked_for_role') return false
  if (action.role === 'all') return true
  if (action.role === role) return true
  return isTaskAllowedForRole(action.id, role)
}

/** Returns safe_read and draft_only actions for a role (omits blocked + future). */
export function getSafeQuickActions(role: DonnaRole): DonnaQuickAction[] {
  return getQuickActionsForRole(role, true).filter(
    a => a.category === 'safe_read' || a.category === 'draft_only'
  )
}
