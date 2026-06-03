'use client'

// Sprint 1681 — Curriculum DONNA Context Registrar V1
// Thin client component that registers the current curriculum level into
// DonnaSessionContext so "Hey Donna" can reference it by name.
//
// Mirrors PlayerProfileDonnaRegistrar (Sprint 854) pattern exactly.
// No visual output. Renders null. Mounts when curriculum level is selected.
// Clears context to null on unmount (prevents stale label persisting after navigation).
//
// Safety:
//   - No DB calls. No mutations. No player data.
//   - Only registers safe string labels (level name, workflow label).
//   - Director-only surface — DonnaSessionContext only mounts in director layout.

import { useEffect } from 'react'
import { useDonnaSessionContext } from '@/lib/donna/donnaSessionContext'

interface Props {
  /** e.g. "orange_ball_2" */
  levelKey:   string
  /** e.g. "Orange Ball 2" */
  levelLabel: string
}

export function CurriculumDonnaRegistrar({ levelKey, levelLabel }: Props) {
  const { updateObjectContext, updateModule } = useDonnaSessionContext()

  useEffect(() => {
    updateObjectContext(levelLabel, `Curriculum level: ${levelLabel}`)
    updateModule(`Curriculum: ${levelLabel}`)

    return () => {
      // Clear on unmount — prevents stale label persisting after navigation
      updateObjectContext('Curriculum')
      updateModule('Curriculum')
    }
  // levelKey included so re-registration fires when the level changes without a full remount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelKey, levelLabel])

  return null
}
