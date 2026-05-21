// Sprint 456 — Role-Aware Empty State Configs V1
// Typed configs for all important empty states across roles.
// All empty states are action-oriented and role-specific.
// Pure constants. No DB, no React.

export type AcademyRole = 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent'

export interface EmptyStateConfig {
  id: string
  heading: string
  body: string
  primaryAction?: {
    label: string
    href?: string
    ariaLabel?: string
  }
  secondaryAction?: {
    label: string
    href?: string
  }
  iconKey?: string
  role: AcademyRole | 'all'
}

// ── Director empty states ─────────────────────────────────────────────────────

export const DIRECTOR_EMPTY_STATES: EmptyStateConfig[] = [
  {
    id: 'no_players',
    heading: 'No players yet',
    body: 'Add your first player to begin building the academy roster.',
    primaryAction: { label: 'Add your first player', href: '/director/players/new', ariaLabel: 'Add first player' },
    iconKey: 'players',
    role: 'academy_director',
  },
  {
    id: 'no_templates',
    heading: 'No session templates yet',
    body: 'Create your first class template so coaches can plan consistent sessions.',
    primaryAction: { label: 'Create a template', href: '/director/templates/new', ariaLabel: 'Create first session template' },
    iconKey: 'templates',
    role: 'academy_director',
  },
  {
    id: 'no_recaps',
    heading: 'No session recaps yet',
    body: "When coaches complete sessions, their recaps will appear here.",
    iconKey: 'sessions',
    role: 'academy_director',
  },
  {
    id: 'no_pending_approvals',
    heading: 'Queue is clear',
    body: 'No actions need your review right now. DONNA will surface new items as they arrive.',
    iconKey: 'review',
    role: 'academy_director',
  },
  {
    id: 'no_curriculum',
    heading: 'Curriculum not set up yet',
    body: 'Define the levels and requirements that will guide player development.',
    primaryAction: { label: 'Set up curriculum', href: '/director/curriculum/builder', ariaLabel: 'Open curriculum builder' },
    secondaryAction: { label: 'Ask DONNA', href: '/director/donna' },
    iconKey: 'curriculum',
    role: 'academy_director',
  },
  {
    id: 'no_badges',
    heading: 'No badges yet',
    body: 'Badges come from curriculum requirements. Set up curriculum first, then generate badges.',
    primaryAction: { label: 'Open curriculum', href: '/director/curriculum/builder' },
    iconKey: 'badges',
    role: 'academy_director',
  },
  {
    id: 'no_missions',
    heading: 'No missions yet',
    body: 'Missions are created from curriculum requirements. Ask DONNA to add a mission from a requirement.',
    primaryAction: { label: 'Ask DONNA', href: '/director/donna' },
    iconKey: 'missions',
    role: 'academy_director',
  },
  {
    id: 'no_curriculum_ideas',
    heading: 'No curriculum ideas yet',
    body: "When coaches submit curriculum ideas by voice, they'll appear here for your review.",
    iconKey: 'curriculum',
    role: 'academy_director',
  },
  {
    id: 'no_groups',
    heading: 'No training groups yet',
    body: 'Create training groups so coaches can be assigned and sessions can be planned.',
    primaryAction: { label: 'Create a group', href: '/director/groups/new' },
    iconKey: 'groups',
    role: 'academy_director',
  },
]

// ── Coach empty states ─────────────────────────────────────────────────────────

export const COACH_EMPTY_STATES: EmptyStateConfig[] = [
  {
    id: 'no_sessions_today',
    heading: 'No sessions today',
    body: 'No sessions scheduled. Enjoy the break — or create an ad-hoc session.',
    iconKey: 'sessions',
    role: 'coach',
  },
  {
    id: 'no_players_in_group',
    heading: 'No players in this group yet',
    body: 'Players are assigned by the director. Check back after roster setup.',
    iconKey: 'players',
    role: 'coach',
  },
  {
    id: 'no_recaps_to_complete',
    heading: 'All caught up',
    body: 'No sessions waiting for a recap. Well done.',
    iconKey: 'sessions',
    role: 'coach',
  },
]

// ── Player empty states ────────────────────────────────────────────────────────

export const PLAYER_EMPTY_STATES: EmptyStateConfig[] = [
  {
    id: 'no_missions',
    heading: 'No missions yet',
    body: "Your coach hasn't set up missions yet. Check back soon.",
    iconKey: 'missions',
    role: 'player',
  },
  {
    id: 'no_badges',
    heading: 'No badges earned yet',
    body: "Keep training — badges are earned by completing requirements. You're just getting started.",
    iconKey: 'badges',
    role: 'player',
  },
  {
    id: 'no_feedback',
    heading: 'No coach feedback yet',
    body: "Your coach will share approved feedback here after sessions.",
    iconKey: 'messages',
    role: 'player',
  },
]

// ── Parent empty states ────────────────────────────────────────────────────────

export const PARENT_EMPTY_STATES: EmptyStateConfig[] = [
  {
    id: 'no_progress_visible',
    heading: 'Progress not shared yet',
    body: "Your child's coach hasn't shared progress updates yet. This will update after sessions.",
    iconKey: 'progress',
    role: 'parent',
  },
  {
    id: 'no_development_summary',
    heading: 'No development summary yet',
    body: "The coaching team will share a development summary when it's ready.",
    iconKey: 'messages',
    role: 'parent',
  },
  {
    id: 'no_updates',
    heading: 'No updates yet',
    body: "Coach updates and approved summaries will appear here.",
    iconKey: 'updates',
    role: 'parent',
  },
]

// ── Lookup helper ─────────────────────────────────────────────────────────────

const ALL_EMPTY_STATES: EmptyStateConfig[] = [
  ...DIRECTOR_EMPTY_STATES,
  ...COACH_EMPTY_STATES,
  ...PLAYER_EMPTY_STATES,
  ...PARENT_EMPTY_STATES,
]

export function getEmptyStateConfig(id: string): EmptyStateConfig | null {
  return ALL_EMPTY_STATES.find(e => e.id === id) ?? null
}

export function getEmptyStatesForRole(role: AcademyRole): EmptyStateConfig[] {
  return ALL_EMPTY_STATES.filter(e => e.role === role || e.role === 'all')
}
