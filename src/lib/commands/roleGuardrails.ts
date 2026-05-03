// Role-Aware Chat Guardrails — Sprint 221
// Pure utility module. No DB calls. No side effects. No writes.
// Governs which roles can use which command intents and what data they may see.

export type SupportedRole =
  | 'platform_owner'
  | 'academy_director'
  | 'head_coach'
  | 'coach'
  | 'parent'
  | 'player'

// ── Intent permission matrix ───────────────────────────────────────────────────
// Maps each role to the set of command intent types it is allowed to invoke.
// Intent types drawn from parseAcademyCommand + playerProgressQa.

const DIRECTOR_INTENTS = new Set([
  'show_players_missing_curriculum_level',
  'show_curriculum_gap_suggestions',
  'show_advancement_eligible',
  'create_session_draft',
  'create_group_draft',
  'record_director_note',
  'ask_curriculum_level_requirements',
  'summarize_reassessment_pipeline',
  'unknown',
])

const HEAD_COACH_INTENTS = new Set([
  'show_players_missing_curriculum_level',
  'show_curriculum_gap_suggestions',
  'show_advancement_eligible',
  'create_session_draft',
  'record_director_note',
  'ask_curriculum_level_requirements',
  'summarize_reassessment_pipeline',
  'unknown',
])

const COACH_INTENTS = new Set([
  'ask_curriculum_level_requirements',
  'unknown',
])

const PLAYER_INTENTS = new Set([
  'current_level',
  'next_level',
  'level_requirements',
  'what_to_practice',
  'level_meaning',
  'unknown',
])

const PARENT_INTENTS = new Set([
  'ask_child_current_focus',
  'ask_how_to_support',
  'ask_session_attendance',
  'unknown',
])

const ALL_KNOWN_INTENTS = new Set<string>([
  'show_players_missing_curriculum_level',
  'show_curriculum_gap_suggestions',
  'show_advancement_eligible',
  'create_session_draft',
  'create_group_draft',
  'record_director_note',
  'ask_curriculum_level_requirements',
  'summarize_reassessment_pipeline',
  'current_level',
  'next_level',
  'level_requirements',
  'what_to_practice',
  'level_meaning',
  'ask_child_current_focus',
  'ask_how_to_support',
  'ask_session_attendance',
  'unknown',
])

const ROLE_PERMISSIONS: Record<SupportedRole, Set<string>> = {
  platform_owner:   ALL_KNOWN_INTENTS,
  academy_director: DIRECTOR_INTENTS,
  head_coach:       HEAD_COACH_INTENTS,
  coach:            COACH_INTENTS,
  player:           PLAYER_INTENTS,
  parent:           PARENT_INTENTS,
}

// ── Intents that always require director approval before execution ──────────────

const APPROVAL_REQUIRED_INTENTS = new Set([
  'create_session_draft',
  'create_group_draft',
  'record_director_note',
])

// ── Field/category exposure matrix ────────────────────────────────────────────
// Governs which data categories each role may see.

const ROLE_FIELD_ACCESS: Record<SupportedRole, Set<string>> = {
  platform_owner: new Set(['all']),
  academy_director: new Set([
    'player_profile',
    'curriculum_level',
    'curriculum_gates',
    'curriculum_drills',
    'coach_language',
    'coach_observations',
    'session_data',
    'priorities',
    'recommendations',
    'attendance',
    'assessment_scores',
    'parent_safe_drafts',
    'voice_commands',
    'proposed_actions',
  ]),
  head_coach: new Set([
    'player_profile',
    'curriculum_level',
    'curriculum_gates',
    'curriculum_drills',
    'coach_language',
    'coach_observations',
    'session_data',
    'priorities',
    'attendance',
    'assessment_scores',
  ]),
  coach: new Set([
    'curriculum_level',
    'curriculum_gates',
    'curriculum_drills',
    'coach_language',
    'session_data',
    'attendance',
  ]),
  player: new Set([
    'curriculum_level',
    'curriculum_drills',
    'coach_language',
  ]),
  parent: new Set([
    'curriculum_level',
    'attendance',
    'parent_safe_drafts',
  ]),
}

// ── Blocked reasons per role+intent ───────────────────────────────────────────

const BLOCKED_REASON_TEMPLATES: Partial<Record<SupportedRole, Record<string, string>>> = {
  coach: {
    create_session_draft: 'Session creation drafts require director or head coach role.',
    create_group_draft: 'Group drafts require director or head coach role.',
    show_players_missing_curriculum_level: 'Player-list queries require director or head coach role.',
  },
  player: {
    create_session_draft: 'Players cannot create session drafts.',
    create_group_draft: 'Players cannot create group drafts.',
    show_players_missing_curriculum_level: 'Players cannot access academy-wide player data.',
    show_curriculum_gap_suggestions: 'Academy curriculum queries are not available to players.',
  },
  parent: {
    create_session_draft: 'Parents cannot create session drafts.',
    show_players_missing_curriculum_level: "Parents cannot access other players' data.",
    coach_observations: "Coach observations are internal and not parent-visible.",
  },
}

// ── Safe response boundaries per role ─────────────────────────────────────────

const SAFE_RESPONSE_BOUNDARIES: Record<SupportedRole, string> = {
  platform_owner:
    'Platform owner — full read access. All mutations require explicit confirmation.',
  academy_director:
    'Director — can query all academy data, create drafts, and approve actions through the review queue.',
  head_coach:
    'Head coach — can query player and session data, create session drafts. Approval required for level changes.',
  coach:
    'Coach — can view curriculum guidance, session data, and attendance. Cannot create drafts or access player records directly.',
  player:
    'Player — can ask questions about their own level, requirements, and what to practice. No access to other players or internal notes.',
  parent:
    "Parent — can ask about session attendance, skill focus, and how to support. No access to coach notes or other players' data.",
}

// ── Role display names ─────────────────────────────────────────────────────────

const ROLE_DISPLAY_NAMES: Record<SupportedRole, string> = {
  platform_owner:   'Platform Owner',
  academy_director: 'Academy Director',
  head_coach:       'Head Coach',
  coach:            'Coach',
  player:           'Player',
  parent:           'Parent',
}

// ── Exported functions ─────────────────────────────────────────────────────────

export function canRoleUseIntent(role: SupportedRole, intentType: string): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions.has(intentType) || permissions.has('all')
}

export function intentRequiresApproval(intentType: string): boolean {
  return APPROVAL_REQUIRED_INTENTS.has(intentType)
}

export function canExposeFieldToRole(role: SupportedRole, fieldOrCategory: string): boolean {
  const access = ROLE_FIELD_ACCESS[role]
  if (!access) return false
  if (access.has('all')) return true
  return access.has(fieldOrCategory)
}

export function getBlockedReason(role: SupportedRole, intentType: string): string | null {
  if (canRoleUseIntent(role, intentType)) return null
  const roleMap = BLOCKED_REASON_TEMPLATES[role]
  if (roleMap && roleMap[intentType]) return roleMap[intentType]
  return `The ${getRoleDisplayName(role)} role does not have permission to use the "${intentType}" command.`
}

export function getSafeResponseBoundary(role: SupportedRole): string {
  return SAFE_RESPONSE_BOUNDARIES[role] ?? 'Unknown role. No permissions granted.'
}

export function getRoleDisplayName(role: SupportedRole): string {
  return ROLE_DISPLAY_NAMES[role] ?? role
}
