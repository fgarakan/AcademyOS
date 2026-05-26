'use client'

// Sprint 854 — Player Priority Context Injection V1
// Thin client component. Registers player-profile priority context into DonnaSessionContext
// on mount, updates it when props change, and clears it to null on unmount.
//
// Renders null — no visual output. Placed inside the player profile server component
// return tree so it mounts when the player profile loads and unmounts on navigation away.
//
// No DB reads. Data comes from the server component's existing activePriorities query.
// No player data stored in localStorage or sessionStorage — in-memory React context only.
// Director-only surface — DonnaSessionContext is only mounted in the director layout.

import { useEffect } from 'react'
import { useDonnaSessionContext } from '@/lib/donna/donnaSessionContext'
import type { DonnaPlayerProfileContext } from '@/lib/donna/donnaSessionContext'

interface Props {
  activePriorityCount: number
  topPriorityTitle: string | null
  topPriorityLevel: string | null
}

export function PlayerProfileDonnaRegistrar({
  activePriorityCount,
  topPriorityTitle,
  topPriorityLevel,
}: Props) {
  const { updatePlayerProfileContext } = useDonnaSessionContext()

  useEffect(() => {
    const ctx: DonnaPlayerProfileContext = {
      activePriorityCount,
      topPriorityTitle,
      topPriorityLevel,
    }
    updatePlayerProfileContext(ctx)

    return () => {
      // Clear on unmount — prevents stale priority data leaking into context
      // after the director navigates away from this player profile.
      updatePlayerProfileContext(null)
    }
  }, [activePriorityCount, topPriorityTitle, topPriorityLevel, updatePlayerProfileContext])

  return null
}
