// Sprint 452 — Responsive App Shell Patterns V1
// Defines the breakpoint system, layout types, and role-to-shell mapping.
// Pure constants and types. No DB. No React. No async.

// ── Breakpoints (matches Tailwind defaults) ──────────────────────────────────

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

// ── Shell types ───────────────────────────────────────────────────────────────

// Desktop: fixed sidebar (w-60) + flex-1 main area.
// Mobile: full-width + bottom tab bar (h-16 safe area).
// Tablet: no sidebar (nav becomes top banner or drawer), full-width main.

export type ShellVariant = 'director-desktop' | 'coach-mobile' | 'player-mobile' | 'parent-mobile'

export interface ShellConfig {
  variant: ShellVariant
  hasSidebar: boolean
  hasBottomTabBar: boolean
  hasFloatingDonna: boolean
  mainMaxWidth: string | null    // null = full-width
  mainPadding: string
  sidebarWidth: string | null    // null = no sidebar
  bottomPadding: string          // space reserved for bottom bar
}

export const SHELL_CONFIGS: Record<ShellVariant, ShellConfig> = {
  'director-desktop': {
    variant: 'director-desktop',
    hasSidebar: true,
    hasBottomTabBar: false,
    hasFloatingDonna: true,
    mainMaxWidth: null,
    mainPadding: 'p-6',
    sidebarWidth: 'w-60',
    bottomPadding: 'pb-0',
  },
  'coach-mobile': {
    variant: 'coach-mobile',
    hasSidebar: false,
    hasBottomTabBar: true,
    hasFloatingDonna: true,
    mainMaxWidth: 'max-w-2xl',
    mainPadding: 'p-4',
    sidebarWidth: null,
    bottomPadding: 'pb-24',
  },
  'player-mobile': {
    variant: 'player-mobile',
    hasSidebar: false,
    hasBottomTabBar: true,
    hasFloatingDonna: false,
    mainMaxWidth: 'max-w-2xl',
    mainPadding: 'p-4',
    sidebarWidth: null,
    bottomPadding: 'pb-24',
  },
  'parent-mobile': {
    variant: 'parent-mobile',
    hasSidebar: false,
    hasBottomTabBar: true,
    hasFloatingDonna: false,
    mainMaxWidth: 'max-w-2xl',
    mainPadding: 'p-4',
    sidebarWidth: null,
    bottomPadding: 'pb-24',
  },
}

// ── Role-to-shell mapping ─────────────────────────────────────────────────────

export type AcademyRole = 'academy_director' | 'head_coach' | 'coach' | 'player' | 'parent'

export function getShellVariantForRole(role: AcademyRole): ShellVariant {
  if (role === 'academy_director') return 'director-desktop'
  if (role === 'head_coach' || role === 'coach') return 'coach-mobile'
  if (role === 'player') return 'player-mobile'
  return 'parent-mobile'
}

// ── Responsive annotation helpers (pure) ─────────────────────────────────────

// Returns true if the viewport width suggests a mobile layout should be active.
// Used for server-side UA hints or client breakpoint logic — not a React hook.
export function isMobileWidth(widthPx: number): boolean {
  return widthPx < BREAKPOINTS.md
}

export function isTabletWidth(widthPx: number): boolean {
  return widthPx >= BREAKPOINTS.md && widthPx < BREAKPOINTS.lg
}

export function isDesktopWidth(widthPx: number): boolean {
  return widthPx >= BREAKPOINTS.lg
}
