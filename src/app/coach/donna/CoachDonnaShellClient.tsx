'use client'

// Sprint 1039 — Coach DONNA Shell Client
// Thin client wrapper: receives server-loaded CoachDonnaContext and renders
// DonnaVoiceReadyShell with coach role. Kept separate so the page stays a Server Component.

import { DonnaVoiceReadyShell } from '@/components/donna/DonnaVoiceReadyShell'
import type { CoachDonnaContext } from '@/lib/donna/coachDonnaContext'

interface Props {
  coachCtx: CoachDonnaContext
}

export function CoachDonnaShellClient({ coachCtx }: Props) {
  return (
    <DonnaVoiceReadyShell
      role="coach"
      donnaRole="coach"
      directorCtx={null}
      coachCtx={coachCtx}
      className="h-[540px] min-h-[380px]"
    />
  )
}
