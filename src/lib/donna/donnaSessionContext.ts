// Sprint 625 — DONNA Cross-Page Session Context V1
// Defines the in-memory session context shape and React context.
// No localStorage for sensitive data. No raw coach notes. No player private data.
// Safe strings only: routes, module labels, last prompt, last safe summary.

import { createContext, useContext } from 'react'

// ── Session context shape ─────────────────────────────────────────────────────

// Sprint 854 — Typed player profile context for DONNA chip awareness.
// Injected by PlayerProfileDonnaRegistrar (client component) on player profile mount.
// Cleared to null on unmount — prevents stale data after navigation away.
// Contains only safe, non-sensitive summary data (counts, title strings, level labels).
// No raw coach notes, no private player data, no parent-visible data.
export interface DonnaPlayerProfileContext {
  activePriorityCount: number
  topPriorityTitle: string | null
  topPriorityLevel: string | null
}

export interface DonnaSessionState {
  lastRoute: string | null
  lastModule: string | null
  lastPrompt: string | null
  lastObjectLabel: string | null
  lastSummary: string | null
  // Sprint 854 — per-player profile context; null when not on a player profile page
  playerProfileContext: DonnaPlayerProfileContext | null
}

export interface DonnaSessionContextValue {
  session: DonnaSessionState
  updateRoute: (route: string) => void
  updateModule: (module: string) => void
  updatePrompt: (prompt: string) => void
  updateObjectContext: (label: string, summary?: string) => void
  clearSession: () => void
  // Sprint 854 — typed player profile context updater; no falsy guard, allows explicit null clearing
  updatePlayerProfileContext: (ctx: DonnaPlayerProfileContext | null) => void
  // Sprint 686 — panel open state lifted to provider so it survives across mounts
  panelOpen: boolean
  openDonnaPanel: () => void
  closeDonnaPanel: () => void
  // Sprint 918 — persistent conversation: minimize preserves thread state; expand restores
  panelMinimized: boolean
  minimizePanel: () => void
  expandPanel: () => void
  // Sprint 918 — context refresh signal: set when route changes while panel is open
  contextRefreshedAt: number | null
  contextPageLabel: string | null
}

// ── Default / empty state ─────────────────────────────────────────────────────

export const DEFAULT_DONNA_SESSION: DonnaSessionState = {
  lastRoute: null,
  lastModule: null,
  lastPrompt: null,
  lastObjectLabel: null,
  lastSummary: null,
  playerProfileContext: null,
}

// ── React context ─────────────────────────────────────────────────────────────

export const DonnaSessionContext = createContext<DonnaSessionContextValue>({
  session: DEFAULT_DONNA_SESSION,
  updateRoute: () => {},
  updateModule: () => {},
  updatePrompt: () => {},
  updateObjectContext: () => {},
  clearSession: () => {},
  updatePlayerProfileContext: () => {},
  panelOpen: false,
  openDonnaPanel: () => {},
  closeDonnaPanel: () => {},
  // Sprint 918
  panelMinimized: false,
  minimizePanel: () => {},
  expandPanel: () => {},
  contextRefreshedAt: null,
  contextPageLabel: null,
})

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDonnaSessionContext(): DonnaSessionContextValue {
  return useContext(DonnaSessionContext)
}

// ── Safe label builders ───────────────────────────────────────────────────────
// These convert route paths to human-readable module labels for session context.

export function routeToModuleLabel(route: string): string {
  if (route.includes('/director/kpi')) return 'KPI Dashboard'
  if (route.includes('/director/players')) return 'Player Directory'
  if (route.includes('/director/review')) return 'Review Queue'
  if (route.includes('/director/signals')) return 'Signals'
  if (route.includes('/director/curriculum/builder')) return 'Curriculum Builder'
  if (route.includes('/director/curriculum')) return 'Curriculum'
  if (route.includes('/director/sessions')) return 'Sessions'
  if (route.includes('/director/coaches')) return 'Coaches'
  if (route.includes('/director/placement')) return 'Placement'
  if (route.includes('/director/level-up')) return 'Level Up'
  if (route.includes('/director/templates')) return 'Templates'
  if (route.includes('/director/donna')) return 'DONNA Hub'
  if (route.includes('/director/settings')) return 'Settings'
  if (route.includes('/director/today')) return "Today's Academy"
  if (route.startsWith('/director')) return 'Director Dashboard'
  if (route.startsWith('/parent')) return 'Parent Portal'
  if (route.startsWith('/player')) return 'Player Portal'
  if (route.startsWith('/coach')) return 'Coach Hub'
  return 'Academy OS'
}
