'use client'

// Sprint 918 — DONNA Persistent Conversation Mode V1
// Convenience hook: consolidates panel open/minimize/expand state for consumers.
// Wraps useDonnaSessionContext — no additional state.

import { useDonnaSessionContext } from '@/lib/donna/donnaSessionContext'

export interface UseDonnaPersistentPanelReturn {
  /** True when the panel is fully open (visible and interactive). */
  isPanelOpen: boolean
  /** True when conversation is preserved but panel is visually hidden. */
  isPanelMinimized: boolean
  /** True when panel is either open or minimized (conversation in progress). */
  hasActiveConversation: boolean
  /** Open the panel (clears minimized state). */
  openPanel: () => void
  /** Close the panel (clears thread — full close). */
  closePanel: () => void
  /** Hide panel without clearing thread. Director can re-expand to resume. */
  minimizePanel: () => void
  /** Restore minimized panel to full open state. */
  expandPanel: () => void
  /** Page label of the most recently refreshed context (null if never refreshed). */
  contextPageLabel: string | null
  /** Timestamp of last context refresh (route change while panel was open). */
  contextRefreshedAt: number | null
}

export function useDonnaPersistentPanel(): UseDonnaPersistentPanelReturn {
  const {
    panelOpen,
    panelMinimized,
    openDonnaPanel,
    closeDonnaPanel,
    minimizePanel,
    expandPanel,
    contextPageLabel,
    contextRefreshedAt,
  } = useDonnaSessionContext()

  return {
    isPanelOpen: panelOpen,
    isPanelMinimized: panelMinimized,
    hasActiveConversation: panelOpen || panelMinimized,
    openPanel: openDonnaPanel,
    closePanel: closeDonnaPanel,
    minimizePanel,
    expandPanel,
    contextPageLabel,
    contextRefreshedAt,
  }
}
