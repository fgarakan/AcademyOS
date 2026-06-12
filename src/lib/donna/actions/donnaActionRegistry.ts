// DONNA Action Registry — Mega Sprint 1991–2020
// Single registry of all executable DONNA actions.
// No duplicate execution systems. One standard.

import type {
  DonnaAction,
  DonnaActionId,
  DonnaActionTarget,
  DonnaActionEntityType,
} from './donnaActionContract'

// ── Registry ──────────────────────────────────────────────────────────────────

const REGISTRY: Record<DonnaActionId, DonnaAction> = {

  open_player: {
    id:                 'open_player',
    label:              'Open Player Profile',
    description:        'Navigate to player profile to review status, curriculum, and development.',
    entityType:         'players',
    requiredPermission: 'academy_director',
    approvalRequired:   false,
    executionType:      'navigation',
    baseRoute:          '/director/players/{entityId}',
  },

  open_curriculum: {
    id:                 'open_curriculum',
    label:              'Open Curriculum',
    description:        'Navigate to curriculum command center to review levels, health, and recommendations.',
    entityType:         'curriculum',
    requiredPermission: 'academy_director',
    approvalRequired:   false,
    executionType:      'navigation',
    baseRoute:          '/director/curriculum',
  },

  open_approval: {
    id:                 'open_approval',
    label:              'Review Approval Queue',
    description:        'Navigate to the approval queue to act on pending items.',
    entityType:         'approval',
    requiredPermission: 'academy_director',
    approvalRequired:   false,
    executionType:      'navigation',
    baseRoute:          '/director/review',
  },

  create_coach_note: {
    id:                 'create_coach_note',
    label:              'Create Coach Note',
    description:        'Open the player profile to add a coaching note.',
    entityType:         'coach',
    requiredPermission: 'academy_director',
    approvalRequired:   true,
    executionType:      'navigation',
    baseRoute:          '/director/players/{entityId}?tab=notes',
  },

  create_player_note: {
    id:                 'create_player_note',
    label:              'Create Player Note',
    description:        'Open the player profile to add a development note.',
    entityType:         'players',
    requiredPermission: 'academy_director',
    approvalRequired:   true,
    executionType:      'navigation',
    baseRoute:          '/director/players/{entityId}?tab=notes',
  },

  schedule_reassessment: {
    id:                 'schedule_reassessment',
    label:              'Schedule Reassessment',
    description:        'Open the player profile to schedule a formal reassessment.',
    entityType:         'assessment',
    requiredPermission: 'academy_director',
    approvalRequired:   true,
    executionType:      'navigation',
    baseRoute:          '/director/players/{entityId}?tab=skill-path',
  },

  draft_parent_message: {
    id:                 'draft_parent_message',
    label:              'Draft Parent Message',
    description:        'Navigate to the review queue to draft a parent communication.',
    entityType:         'parent_issue',
    requiredPermission: 'academy_director',
    approvalRequired:   true,
    executionType:      'navigation',
    baseRoute:          '/director/review?tab=parents',
  },

  create_session_draft: {
    id:                 'create_session_draft',
    label:              'Create Session Draft',
    description:        'Navigate to create a new session draft using an existing template.',
    entityType:         'session',
    requiredPermission: 'academy_director',
    approvalRequired:   true,
    executionType:      'navigation',
    baseRoute:          '/director/sessions',
  },

  review_advancement: {
    id:                 'review_advancement',
    label:              'Review Advancement Eligibility',
    description:        'Open the player skill-path tab to review advancement readiness.',
    entityType:         'players',
    requiredPermission: 'academy_director',
    approvalRequired:   false,
    executionType:      'navigation',
    baseRoute:          '/director/players/{entityId}?tab=skill-path',
  },

  review_curriculum_recommendation: {
    id:                 'review_curriculum_recommendation',
    label:              'Review Curriculum Recommendation',
    description:        'Open the curriculum builder to review DONNA evolution recommendations.',
    entityType:         'curriculum',
    requiredPermission: 'academy_director',
    approvalRequired:   false,
    executionType:      'navigation',
    baseRoute:          '/director/curriculum/builder',
  },
}

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getDonnaAction(id: DonnaActionId): DonnaAction {
  return REGISTRY[id]
}

export function getAllDonnaActions(): DonnaAction[] {
  return Object.values(REGISTRY)
}

export function getDonnaActionsByEntityType(entityType: DonnaActionEntityType): DonnaAction[] {
  return Object.values(REGISTRY).filter(a => a.entityType === entityType)
}

export function getDonnaActionsRequiringApproval(): DonnaAction[] {
  return Object.values(REGISTRY).filter(a => a.approvalRequired)
}

// ── Route resolver ────────────────────────────────────────────────────────────

export function resolveActionRoute(action: DonnaAction, entityId?: string | null): string {
  if (!entityId) return action.baseRoute.replace('/{entityId}', '')
  return action.baseRoute.replace('{entityId}', entityId)
}

// ── DonnaActionTarget builder ─────────────────────────────────────────────────
// Every action draft must carry a DonnaActionTarget.

export function buildActionTarget(
  action:       DonnaAction,
  entityId?:    string | null,
  entityLabel?: string | null,
): DonnaActionTarget {
  const route = resolveActionRoute(action, entityId)
  const label = entityLabel ? `${action.label} — ${entityLabel}` : action.label
  return {
    label,
    route,
    routeContext: action.description,
    entityType:  action.entityType as import('../operations/academyChangeEngine').ActionTargetEntityType,
  }
}

export { REGISTRY as DONNA_ACTION_REGISTRY }
