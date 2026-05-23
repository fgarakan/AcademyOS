// Sprint 625 — DONNA Cross-Page Session Context V1
// Defines the in-memory session context shape and React context.
// No localStorage for sensitive data. No raw coach notes. No player private data.
// Safe strings only: routes, module labels, last prompt, last safe summary.

import { createContext, useContext } from 'react'

// ── Session context shape ─────────────────────────────────────────────────────

export interface DonnaSessionState {
  lastRoute: string | null
  lastModule: string | null
  lastPrompt: string | null
  lastObjectLabel: string | null
  lastSummary: string | null
}

export interface DonnaSessionContextValue {
  session: DonnaSessionState
  updateRoute: (route: string) => void
  updateModule: (module: string) => void
  updatePrompt: (prompt: string) => void
  updateObjectContext: (label: string, summary?: string) => void
  clearSession: () => void
  // Sprint 686 — panel open state lifted to provider so it survives across mounts
  panelOpen: boolean
  openDonnaPanel: () => void
  closeDonnaPanel: () => void
}

// ── Default / empty state ─────────────────────────────────────────────────────

export const DEFAULT_DONNA_SESSION: DonnaSessionState = {
  lastRoute: null,
  lastModule: null,
  lastPrompt: null,
  lastObjectLabel: null,
  lastSummary: null,
}

// ── React context ─────────────────────────────────────────────────────────────

export const DonnaSessionContext = createContext<DonnaSessionContextValue>({
  session: DEFAULT_DONNA_SESSION,
  updateRoute: () => {},
  updateModule: () => {},
  updatePrompt: () => {},
  updateObjectContext: () => {},
  clearSession: () => {},
  panelOpen: false,
  openDonnaPanel: () => {},
  closeDonnaPanel: () => {},
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
  if (route.startsWith('/director')) return 'Director Dashboard'
  return 'Academy OS'
}
