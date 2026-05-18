// Sprint 1024 — DONNA Blocked Actions by Role V1
// Comprehensive blocked action definitions: what's blocked, why, and what to do instead.
// Extends donnaRoleBoundaries (Sprint pre-1002) with full explanations for all surfaces.
// Used by DONNA to explain role boundaries clearly instead of silently failing.
// No DB calls. No DB writes.

import type { DonnaRole } from '@/lib/donna/donnaRoleBoundaries'

// ── Block definition ──────────────────────────────────────────────────────────

export interface DonnaRoleBlock {
  actionId: string
  actionLabel: string
  blockedFor: DonnaRole[]
  reason: string
  directorCopy: string
  alternativeForCoach: string | null
  alternativeHref: string | null
  isTemporary: boolean
  temporaryNote: string | null
}

// ── Block registry ────────────────────────────────────────────────────────────

export const DONNA_ROLE_BLOCKS: DonnaRoleBlock[] = [
  // ── Level movement ────────────────────────────────────────────────────────
  {
    actionId: 'approve_level_move',
    actionLabel: 'Approve level move',
    blockedFor: ['coach'],
    reason: 'Level movement is a consequential, irreversible-feeling decision that affects a player\'s development path, group assignment, and parent expectations. This requires director judgment.',
    directorCopy: 'Level moves require director approval — only directors can advance or hold a player\'s curriculum level.',
    alternativeForCoach: 'You can flag a player as potentially ready for level advancement, which sends a readiness signal to the director for their decision.',
    alternativeHref: '/coach/note',
    isTemporary: false,
    temporaryNote: null,
  },

  // ── Parent communications ─────────────────────────────────────────────────
  {
    actionId: 'send_parent_message',
    actionLabel: 'Send parent message',
    blockedFor: ['coach'],
    reason: 'Parent communications carry the academy\'s voice and can cause confusion or concern if uncoordinated. Directors approve all outbound parent messages.',
    directorCopy: 'Parent messages require director approval before sending. Coaches can draft observations — directors decide what parents see.',
    alternativeForCoach: 'You can draft a player observation that the director can convert into a parent-safe update.',
    alternativeHref: '/coach/note',
    isTemporary: false,
    temporaryNote: null,
  },

  // ── Roster changes ────────────────────────────────────────────────────────
  {
    actionId: 'roster_mutation',
    actionLabel: 'Move or modify roster',
    blockedFor: ['coach'],
    reason: 'Roster changes affect billing, group dynamics, and scheduling. Only directors can modify roster assignments.',
    directorCopy: 'Roster modifications require director authorization.',
    alternativeForCoach: 'Flag the situation to the director through a coach note. They can review and make the roster change.',
    alternativeHref: '/coach/note',
    isTemporary: false,
    temporaryNote: null,
  },

  // ── Template creation ─────────────────────────────────────────────────────
  {
    actionId: 'create_template',
    actionLabel: 'Create session template',
    blockedFor: ['coach'],
    reason: 'Templates define the academy\'s curriculum delivery and must be approved by the director to ensure alignment with the curriculum spine.',
    directorCopy: 'Template creation is director-controlled to maintain curriculum alignment.',
    alternativeForCoach: 'Coaches can suggest template modifications through the session wrap-up process.',
    alternativeHref: '/coach/wrap-up',
    isTemporary: false,
    temporaryNote: null,
  },

  // ── Curriculum modification ───────────────────────────────────────────────
  {
    actionId: 'modify_curriculum',
    actionLabel: 'Modify curriculum',
    blockedFor: ['coach'],
    reason: 'Curriculum structure, gates, and levels are managed by the director. Uncoordinated curriculum changes would break the development pathway for all players.',
    directorCopy: 'Curriculum changes require director authorization.',
    alternativeForCoach: 'Flag curriculum concerns through an observation. Directors review and decide on curriculum adjustments.',
    alternativeHref: '/coach/note',
    isTemporary: false,
    temporaryNote: null,
  },

  // ── Review queue management ───────────────────────────────────────────────
  {
    actionId: 'manage_review_queue',
    actionLabel: 'Manage review queue',
    blockedFor: ['coach'],
    reason: 'The director review queue is the director\'s decision space. Coaches can submit items for review, but cannot approve, reject, or modify pending items.',
    directorCopy: 'Review queue management is director-only.',
    alternativeForCoach: 'Submit a note, wrap-up, or observation for the director to review.',
    alternativeHref: '/coach/wrap-up',
    isTemporary: false,
    temporaryNote: null,
  },

  // ── Academy health view ───────────────────────────────────────────────────
  {
    actionId: 'view_academy_health',
    actionLabel: 'View full academy health',
    blockedFor: ['coach'],
    reason: 'Academy health data includes revenue, retention, and multi-player data that coaches should not see out of context.',
    directorCopy: 'Academy-wide health metrics are director-only.',
    alternativeForCoach: 'You can view your own sessions and players through the coach portal.',
    alternativeHref: '/coach/sessions',
    isTemporary: false,
    temporaryNote: null,
  },

  // ── Observation parent visibility ─────────────────────────────────────────
  {
    actionId: 'make_observation_parent_visible',
    actionLabel: 'Make observation visible to parent',
    blockedFor: ['coach'],
    reason: 'Parent-facing content requires a specific tone and context that the director must verify. Coaches cannot directly publish to parents.',
    directorCopy: 'Parent visibility for observations requires director approval.',
    alternativeForCoach: 'Submit the observation for director review. They can approve it for parent visibility.',
    alternativeHref: '/coach/note',
    isTemporary: false,
    temporaryNote: null,
  },

  // ── Curriculum evidence links ─────────────────────────────────────────────
  {
    actionId: 'link_curriculum_evidence',
    actionLabel: 'Link evidence to curriculum gate',
    blockedFor: ['coach'],
    reason: 'Curriculum gate evidence links affect the player\'s progression pathway and must be validated by the director.',
    directorCopy: 'Curriculum evidence links require director validation.',
    alternativeForCoach: 'Capture an observation tagged with the relevant skill area. The director can link it as evidence.',
    alternativeHref: '/coach/note',
    isTemporary: true,
    temporaryNote: 'Curriculum gate migrations (041-060) not yet applied — this will be available after migration.',
  },
]

// ── Lookups ───────────────────────────────────────────────────────────────────

const BLOCK_MAP = new Map<string, DonnaRoleBlock>(
  DONNA_ROLE_BLOCKS.map(b => [b.actionId, b]),
)

export function getRoleBlock(actionId: string): DonnaRoleBlock | undefined {
  return BLOCK_MAP.get(actionId)
}

export function isActionBlockedForRole(actionId: string, role: DonnaRole): boolean {
  const block = BLOCK_MAP.get(actionId)
  if (!block) return false
  return block.blockedFor.includes(role)
}

export function getBlockedActionsByRole(role: DonnaRole): DonnaRoleBlock[] {
  return DONNA_ROLE_BLOCKS.filter(b => b.blockedFor.includes(role))
}

// ── DONNA copy for blocked actions ────────────────────────────────────────────

export interface DonnaBlockedActionResponse {
  headline: string
  explanation: string
  alternative: string | null
  alternativeHref: string | null
}

export function buildBlockedActionResponse(
  actionId: string,
  role: DonnaRole,
): DonnaBlockedActionResponse {
  const block = BLOCK_MAP.get(actionId)

  if (!block) {
    return {
      headline: "That's not something I can do.",
      explanation: 'This action is not available.',
      alternative: null,
      alternativeHref: null,
    }
  }

  if (!block.blockedFor.includes(role)) {
    return {
      headline: 'Action available.',
      explanation: 'This action is available for your role.',
      alternative: null,
      alternativeHref: null,
    }
  }

  return {
    headline: `${block.actionLabel} requires director approval`,
    explanation: block.reason,
    alternative: block.alternativeForCoach,
    alternativeHref: block.alternativeHref,
  }
}

// ── Inline copy for quick surfaces ───────────────────────────────────────────

export function getBlockedActionShortCopy(actionId: string, role: DonnaRole): string {
  const block = BLOCK_MAP.get(actionId)
  if (!block || !block.blockedFor.includes(role)) return 'Not available.'
  if (role === 'coach') return `${block.actionLabel} — director approval required.`
  return `${block.actionLabel} — not available for your role.`
}
