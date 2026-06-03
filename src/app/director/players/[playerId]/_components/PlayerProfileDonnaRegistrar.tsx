'use client'

// Sprint 854 — Player Priority Context Injection V1
// Sprint 1721 — Also renders DonnaActiveWorkflowBanner when a guided workflow is active.
// Thin client component. Registers player-profile priority context into DonnaSessionContext
// on mount, updates it when props change, and clears it to null on unmount.
//
// No DB reads. Data comes from the server component's existing activePriorities query.
// No player data stored in localStorage or sessionStorage — in-memory React context only.
// Director-only surface — DonnaSessionContext is only mounted in the director layout.

import { useEffect } from 'react'
import { useDonnaSessionContext } from '@/lib/donna/donnaSessionContext'
import type { DonnaPlayerProfileContext } from '@/lib/donna/donnaSessionContext'
import { DonnaActiveWorkflowBanner } from '@/components/donna/DonnaActiveWorkflowBanner'

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

  // Sprint 1721: render workflow banner alongside the (invisible) context registrar.
  // Banner only appears when a guided workflow is active and this route matches.
  return <DonnaActiveWorkflowBanner className="mb-4" />
}
