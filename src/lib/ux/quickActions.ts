// Sprint 458 — Global Quick Action System V1
// Typed quick action definitions per role.
// Actions that are not yet implemented are marked isAvailable=false with a reason.
// Pure constants. No DB, no React.

export type AcademyRole = 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent'

export type QuickActionId =
  | 'ask_donna'
  | 'add_player'
  | 'create_session'
  | 'capture_note'
  | 'add_curriculum_idea'
  | 'review_approvals'
  | 'create_template'
  | 'start_recap'
  | 'find_player'
  | 'mark_attendance'
  | 'view_kpi'
  | 'add_curriculum_voice'

export interface QuickAction {
  id: QuickActionId
  label: string
  description: string
  iconKey: string
  href?: string         // navigation target if applicable
  action?: string       // action type if triggered in-place
  isAvailable: boolean
  unavailableReason?: string
  roles: AcademyRole[]
  shortcutKey?: string  // keyboard shortcut letter for command palette
}

const ALL_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'ask_donna',
    label: 'Ask DONNA',
    description: 'Ask anything about the academy',
    iconKey: 'donna',
    action: 'open_donna',
    isAvailable: true,
    roles: ['academy_director', 'head_coach', 'coach'],
    shortcutKey: 'd',
  },
  {
    id: 'add_player',
    label: 'Add player',
    description: 'Add a new player to the roster',
    iconKey: 'players',
    href: '/director/players/new',
    isAvailable: true,
    roles: ['academy_director'],
    shortcutKey: 'p',
  },
  {
    id: 'create_session',
    label: 'Create session',
    description: 'Schedule a new training session',
    iconKey: 'sessions',
    href: '/director/sessions',
    isAvailable: true,
    roles: ['academy_director'],
    shortcutKey: 's',
  },
  {
    id: 'capture_note',
    label: 'Capture note',
    description: 'Add a quick coach note or observation',
    iconKey: 'voice',
    action: 'open_capture',
    isAvailable: true,
    roles: ['head_coach', 'coach'],
    shortcutKey: 'n',
  },
  {
    id: 'add_curriculum_idea',
    label: 'Curriculum idea',
    description: 'Add a curriculum idea to the inbox',
    iconKey: 'curriculum',
    action: 'open_curriculum_capture',
    isAvailable: true,
    roles: ['academy_director', 'head_coach', 'coach'],
    shortcutKey: 'c',
  },
  {
    id: 'review_approvals',
    label: 'Review approvals',
    description: 'Open the pending approvals queue',
    iconKey: 'review',
    href: '/director/review',
    isAvailable: true,
    roles: ['academy_director'],
    shortcutKey: 'r',
  },
  {
    id: 'create_template',
    label: 'Create template',
    description: 'Build a new session template',
    iconKey: 'templates',
    href: '/director/templates/new',
    isAvailable: true,
    roles: ['academy_director'],
    shortcutKey: 't',
  },
  {
    id: 'start_recap',
    label: 'Start recap',
    description: 'Begin a session wrap-up',
    iconKey: 'voice',
    href: '/coach/recap',
    isAvailable: true,
    roles: ['head_coach', 'coach'],
    shortcutKey: 'w',
  },
  {
    id: 'find_player',
    label: 'Find player',
    description: 'Search for a player',
    iconKey: 'players',
    href: '/director/players',
    isAvailable: true,
    roles: ['academy_director', 'head_coach', 'coach'],
    shortcutKey: 'f',
  },
  {
    id: 'mark_attendance',
    label: 'Mark attendance',
    description: 'Mark attendance for a session',
    iconKey: 'sessions',
    action: 'open_attendance',
    isAvailable: true,
    roles: ['head_coach', 'coach'],
    shortcutKey: 'a',
  },
  {
    id: 'view_kpi',
    label: 'View KPIs',
    description: 'Open the academy KPI dashboard',
    iconKey: 'kpi',
    href: '/director/kpi',
    isAvailable: true,
    roles: ['academy_director'],
    shortcutKey: 'k',
  },
  {
    id: 'add_curriculum_voice',
    label: 'Add via voice',
    description: 'Speak a curriculum idea to DONNA',
    iconKey: 'voice',
    action: 'open_voice_curriculum',
    isAvailable: true,
    roles: ['head_coach', 'coach'],
  },
]

// Returns available quick actions for a role, ordered for display.
export function getQuickActionsForRole(role: AcademyRole): QuickAction[] {
  return ALL_QUICK_ACTIONS.filter(a => a.roles.includes(role))
}

// Returns actions suitable for a mobile floating action button (top 1).
export function getPrimaryFabAction(role: AcademyRole): QuickAction | null {
  if (role === 'head_coach' || role === 'coach') {
    return ALL_QUICK_ACTIONS.find(a => a.id === 'capture_note') ?? null
  }
  if (role === 'academy_director') {
    return ALL_QUICK_ACTIONS.find(a => a.id === 'ask_donna') ?? null
  }
  return null
}

// Returns actions for the command palette (desktop, keyboard-friendly).
export function getCommandPaletteActions(role: AcademyRole): QuickAction[] {
  return getQuickActionsForRole(role).filter(a => a.shortcutKey !== undefined)
}
