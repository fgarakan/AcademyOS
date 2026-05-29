'use client'

// Sprint 625 — DONNA Cross-Page Session Context Provider V1
// Client component. In-memory only — no localStorage for sensitive data.
// Tracks route changes and provides session state to any consumer via useDonnaSessionContext().

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import {
  DonnaSessionContext,
  DEFAULT_DONNA_SESSION,
  routeToModuleLabel,
  type DonnaSessionState,
  type DonnaPlayerProfileContext,
} from '@/lib/donna/donnaSessionContext'

export function DonnaSessionContextProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [session, setSession] = useState<DonnaSessionState>(DEFAULT_DONNA_SESSION)
  // Sprint 686 — panel open state lifted from DonnaAssistantButton so it persists
  // across mounts and is readable by any consumer in the director layout tree.
  const [panelOpen, setPanelOpen] = useState(false)
  const openDonnaPanel = useCallback(() => setPanelOpen(true), [])
  const closeDonnaPanel = useCallback(() => setPanelOpen(false), [])

  // Sprint 745 — SSR-safe sessionStorage persistence for donnaPanelOpen.
  // Restores open state on mount; persists on every change.
  // Stores only the boolean — no transcripts, no user data, no DB rows.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (window.sessionStorage.getItem('donnaPanelOpen') === 'true') {
        setPanelOpen(true)
      }
    } catch { /* sessionStorage may be blocked in some browser configurations */ }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.setItem('donnaPanelOpen', panelOpen ? 'true' : 'false')
    } catch { /* sessionStorage may be full or blocked */ }
  }, [panelOpen])

  // Track route changes automatically
  useEffect(() => {
    if (!pathname) return
    setSession(prev => ({
      ...prev,
      lastRoute: pathname,
      lastModule: routeToModuleLabel(pathname),
    }))
  }, [pathname])

  const updateRoute = useCallback((route: string) => {
    setSession(prev => ({
      ...prev,
      lastRoute: route,
      lastModule: routeToModuleLabel(route),
    }))
  }, [])

  const updateModule = useCallback((module: string) => {
    setSession(prev => ({ ...prev, lastModule: module }))
  }, [])

  const updatePrompt = useCallback((prompt: string) => {
    // Truncate to 200 chars — safe summary only, no sensitive full content
    setSession(prev => ({ ...prev, lastPrompt: prompt.slice(0, 200) }))
  }, [])

  const updateObjectContext = useCallback((label: string, summary?: string) => {
    setSession(prev => ({
      ...prev,
      lastObjectLabel: label.slice(0, 100),
      lastSummary: summary ? summary.slice(0, 300) : prev.lastSummary,
    }))
  }, [])

  // Sprint 854 — Typed player profile context updater.
  // No falsy guard — allows explicit null clearing on unmount (prevents stale data).
  // Separate from updateObjectContext to avoid the summary ? ... : prev.lastSummary guard.
  const updatePlayerProfileContext = useCallback((ctx: DonnaPlayerProfileContext | null) => {
    setSession(prev => ({ ...prev, playerProfileContext: ctx }))
  }, [])

  const clearSession = useCallback(() => {
    setSession(DEFAULT_DONNA_SESSION)
  }, [])

  // Sprint 918 — Minimize: hides panel without clearing conversation thread state.
  // Distinct from closeDonnaPanel: minimize preserves the thread; close clears it.
  const [panelMinimized, setPanelMinimized] = useState(false)
  const [contextRefreshedAt, setContextRefreshedAt] = useState<number | null>(null)
  const [contextPageLabel, setContextPageLabel] = useState<string | null>(null)

  // Sprint 918 — sessionStorage persistence for minimized state
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (window.sessionStorage.getItem('donnaPanelMinimized') === 'true') {
        setPanelMinimized(true)
      }
    } catch { /* sessionStorage may be blocked */ }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.setItem('donnaPanelMinimized', panelMinimized ? 'true' : 'false')
    } catch { /* sessionStorage may be full or blocked */ }
  }, [panelMinimized])

  const minimizePanel = useCallback(() => {
    setPanelOpen(false)
    setPanelMinimized(true)
  }, [])

  const expandPanel = useCallback(() => {
    setPanelOpen(true)
    setPanelMinimized(false)
  }, [])

  // Sprint 918 — route-change context refresh signal:
  // when route changes while panel is open and not minimized, emit a refresh signal.
  useEffect(() => {
    if (!pathname || !panelOpen || panelMinimized) return
    const label = routeToModuleLabel(pathname)
    setContextPageLabel(label)
    setContextRefreshedAt(Date.now())
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DonnaSessionContext.Provider
      value={{
        session,
        updateRoute,
        updateModule,
        updatePrompt,
        updateObjectContext,
        clearSession,
        updatePlayerProfileContext,
        panelOpen,
        openDonnaPanel,
        closeDonnaPanel,
        panelMinimized,
        minimizePanel,
        expandPanel,
        contextRefreshedAt,
        contextPageLabel,
      }}
    >
      {children}
    </DonnaSessionContext.Provider>
  )
}
