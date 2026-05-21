// Sprint 463 — DONNA Academy Knowledge Context V1
// Organizational index for DONNA's academy knowledge layer.
// Defines safe context areas and re-exports context builder types.
// No DB calls here — context is assembled by the callers and passed in.

// ── Context area definitions ──────────────────────────────────────────────────

export type AcademyKnowledgeArea =
  | 'academy_settings'
  | 'staff'
  | 'groups'
  | 'players'
  | 'curriculum'
  | 'templates'
  | 'sessions'
  | 'attendance'
  | 'player_priorities'
  | 'coach_notes'
  | 'parent_summaries'
  | 'badges'
  | 'missions'
  | 'mental_performance'

export interface KnowledgeAreaMeta {
  area: AcademyKnowledgeArea
  label: string
  roles: ('academy_director' | 'head_coach' | 'coach' | 'player' | 'parent')[]
  isSensitive: boolean            // requires role-gate and compact summary
  requiresParentSafe: boolean     // content must pass parent-safe filter before parent can see
  requiresPlayerSafe: boolean     // content must pass player-safe filter before player can see
  isNoCache: boolean              // must always be fetched real-time (no cache)
}

export const KNOWLEDGE_AREA_META: Record<AcademyKnowledgeArea, KnowledgeAreaMeta> = {
  academy_settings: {
    area: 'academy_settings',
    label: 'Academy Settings',
    roles: ['academy_director'],
    isSensitive: false,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  staff: {
    area: 'staff',
    label: 'Staff',
    roles: ['academy_director'],
    isSensitive: true,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  groups: {
    area: 'groups',
    label: 'Training Groups',
    roles: ['academy_director', 'head_coach', 'coach'],
    isSensitive: false,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  players: {
    area: 'players',
    label: 'Players',
    roles: ['academy_director', 'head_coach', 'coach'],
    isSensitive: true,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  curriculum: {
    area: 'curriculum',
    label: 'Curriculum',
    roles: ['academy_director', 'head_coach', 'coach', 'player', 'parent'],
    isSensitive: false,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  templates: {
    area: 'templates',
    label: 'Session Templates',
    roles: ['academy_director', 'head_coach', 'coach'],
    isSensitive: false,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  sessions: {
    area: 'sessions',
    label: 'Sessions',
    roles: ['academy_director', 'head_coach', 'coach'],
    isSensitive: false,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  attendance: {
    area: 'attendance',
    label: 'Attendance',
    roles: ['academy_director', 'head_coach', 'coach'],
    isSensitive: false,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  player_priorities: {
    area: 'player_priorities',
    label: 'Player Priorities',
    roles: ['academy_director', 'head_coach', 'coach'],
    isSensitive: true,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: true,
  },
  coach_notes: {
    area: 'coach_notes',
    label: 'Coach Notes',
    roles: ['academy_director', 'head_coach', 'coach'],
    isSensitive: true,
    requiresParentSafe: true,
    requiresPlayerSafe: true,
    isNoCache: true,
  },
  parent_summaries: {
    area: 'parent_summaries',
    label: 'Parent Summaries',
    roles: ['academy_director', 'head_coach'],
    isSensitive: true,
    requiresParentSafe: true,
    requiresPlayerSafe: false,
    isNoCache: true,
  },
  badges: {
    area: 'badges',
    label: 'Badges',
    roles: ['academy_director', 'head_coach', 'coach', 'player', 'parent'],
    isSensitive: false,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  missions: {
    area: 'missions',
    label: 'Missions',
    roles: ['academy_director', 'head_coach', 'coach', 'player', 'parent'],
    isSensitive: false,
    requiresParentSafe: false,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
  mental_performance: {
    area: 'mental_performance',
    label: 'Mental Performance',
    roles: ['academy_director', 'head_coach', 'coach', 'player', 'parent'],
    isSensitive: false,
    requiresParentSafe: true,
    requiresPlayerSafe: false,
    isNoCache: false,
  },
}

// ── Context pack rules ────────────────────────────────────────────────────────

// Data classification: what can go to DONNA / AI calls
// Matches docs/data-classification.md
export type DataClassification = 'public' | 'internal' | 'sensitive' | 'restricted'

export function getDataClassification(area: AcademyKnowledgeArea): DataClassification {
  const meta = KNOWLEDGE_AREA_META[area]
  if (meta.isSensitive && meta.requiresParentSafe) return 'restricted'
  if (meta.isSensitive) return 'sensitive'
  return 'internal'
}

// Returns whether an area can be included in a DONNA context pack for a given role.
export function isAreaAvailableForRole(
  area: AcademyKnowledgeArea,
  role: 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent',
): boolean {
  return KNOWLEDGE_AREA_META[area].roles.includes(role)
}
