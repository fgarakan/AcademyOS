// Sprint 453 — Role-Based Navigation Config V1
// Typed navigation item definitions per role.
// These are the single source of truth for what each role should see.
// Pure constants. No DB. No React.

export type NavItemId =
  | 'dashboard' | 'donna' | 'today' | 'players' | 'coaches' | 'sessions'
  | 'review_queue' | 'signals' | 'kpi' | 'curriculum' | 'templates'
  | 'settings' | 'onboarding' | 'command_center' | 'groups'
  | 'coach_home' | 'coach_sessions' | 'coach_recap' | 'coach_voice'
  | 'player_home' | 'player_missions' | 'player_progress' | 'player_badges' | 'player_donna'
  | 'parent_home' | 'parent_progress' | 'parent_updates' | 'parent_wins'

export interface NavItem {
  id: NavItemId
  label: string
  href: string
  iconKey: string
  description: string
  exact?: boolean
}

// ── Director nav ──────────────────────────────────────────────────────────────

export const DIRECTOR_PRIMARY_NAV: NavItem[] = [
  { id: 'dashboard',       label: 'Dashboard',          href: '/director',                      iconKey: 'dashboard',  description: 'Academy health and at-a-glance status', exact: true },
  { id: 'donna',           label: 'DONNA',              href: '/director/donna',                iconKey: 'donna',      description: 'Academy AI COO — ask anything, review proposals' },
  { id: 'today',           label: "Today's Academy",    href: '/director/today',                iconKey: 'today',      description: "Live view of today's sessions and activity" },
  { id: 'review_queue',    label: 'Review Queue',       href: '/director/review',               iconKey: 'review',     description: 'Pending approvals and actions requiring attention' },
  { id: 'players',         label: 'Players',            href: '/director/players',              iconKey: 'players',    description: 'Player roster, profiles, and development' },
  { id: 'coaches',         label: 'Coaches',            href: '/director/coaches',              iconKey: 'coaches',    description: 'Coach profiles and performance' },
  { id: 'sessions',        label: 'Sessions',           href: '/director/sessions',             iconKey: 'sessions',   description: 'Session calendar, recaps, and attendance' },
  { id: 'signals',         label: 'Signals',            href: '/director/signals',              iconKey: 'signals',    description: 'Player development signals and alerts' },
  { id: 'kpi',             label: 'KPI',                href: '/director/kpi',                  iconKey: 'kpi',        description: 'Academy health KPIs and trend analysis' },
  { id: 'curriculum',      label: 'Curriculum',         href: '/director/curriculum/builder',   iconKey: 'curriculum', description: 'Curriculum levels, requirements, badges, missions' },
  { id: 'templates',       label: 'Templates',          href: '/director/templates',            iconKey: 'templates',  description: 'Session template library and builder' },
]

export const DIRECTOR_SYSTEM_NAV: NavItem[] = [
  { id: 'settings',        label: 'Settings',           href: '/director/settings',             iconKey: 'settings',   description: 'Academy settings and configuration' },
  { id: 'onboarding',      label: 'Onboarding',         href: '/director/onboarding',           iconKey: 'onboarding', description: 'Academy setup checklist' },
  { id: 'command_center',  label: 'Command Center',     href: '/director/command-center',       iconKey: 'terminal',   description: 'DONNA command center — voice and text' },
]

// ── Coach nav ─────────────────────────────────────────────────────────────────

// Primary bottom tabs (max 5 for mobile readability)
export const COACH_BOTTOM_TABS: NavItem[] = [
  { id: 'coach_home',     label: 'Home',      href: '/coach',            iconKey: 'home',     description: 'Coach home and upcoming sessions', exact: true },
  { id: 'coach_sessions', label: 'Sessions',  href: '/coach/sessions',   iconKey: 'sessions', description: 'Session planner and history' },
  { id: 'coach_recap',    label: 'Recap',     href: '/coach/recap',      iconKey: 'recap',    description: 'Session wrap-up and voice recap' },
  { id: 'players',        label: 'Players',   href: '/coach/players',    iconKey: 'players',  description: 'Player profiles and watch-fors' },
  { id: 'donna',          label: 'DONNA',     href: '/coach/donna',      iconKey: 'donna',    description: 'Ask DONNA or add curriculum idea' },
]

// ── Player nav ────────────────────────────────────────────────────────────────

export const PLAYER_BOTTOM_TABS: NavItem[] = [
  { id: 'player_home',      label: 'Home',      href: '/player',                  iconKey: 'home',     description: 'Player home and current focus', exact: true },
  { id: 'player_missions',  label: 'Missions',  href: '/player/missions',         iconKey: 'missions', description: 'Active missions and mission map' },
  { id: 'player_progress',  label: 'Progress',  href: '/player/skill-path',       iconKey: 'progress', description: 'Skill path and level progress' },
  { id: 'player_donna',     label: 'Ask',       href: '/player/ask-donna',        iconKey: 'donna',    description: 'Ask a question or get guidance' },
]

// ── Parent nav ────────────────────────────────────────────────────────────────

export const PARENT_BOTTOM_TABS: NavItem[] = [
  { id: 'parent_home',     label: 'Home',      href: '/parent',              iconKey: 'home',     description: 'Parent home and child summary', exact: true },
  { id: 'parent_progress', label: 'Progress',  href: '/parent/progress',     iconKey: 'progress', description: 'Development progress and milestones' },
  { id: 'parent_updates',  label: 'Updates',   href: '/parent/updates',      iconKey: 'updates',  description: 'Coach updates and messages' },
  { id: 'parent_wins',     label: 'Wins',      href: '/parent/wins',         iconKey: 'wins',     description: 'Achievements and recent wins' },
]

// ── Helper ───────────────────────────────────────────────────────────────────

export type AcademyRole = 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent'

export function getBottomTabsForRole(role: AcademyRole): NavItem[] {
  if (role === 'academy_director') return []  // director uses sidebar
  if (role === 'head_coach' || role === 'coach') return COACH_BOTTOM_TABS
  if (role === 'player') return PLAYER_BOTTOM_TABS
  return PARENT_BOTTOM_TABS
}
