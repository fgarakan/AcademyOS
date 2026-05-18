'use client'

// Sprint 1038 — Director DONNA Shell Client
// Thin client wrapper: receives server-loaded DirectorDonnaContext and renders
// DonnaVoiceReadyShell. Kept separate so the director DONNA page stays a Server Component.

import { DonnaVoiceReadyShell } from '@/components/donna/DonnaVoiceReadyShell'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

interface Props {
  directorCtx: DirectorDonnaContext
}

export function DonnaDirectorShellClient({ directorCtx }: Props) {
  return (
    <DonnaVoiceReadyShell
      role="director"
      donnaRole="director"
      directorCtx={directorCtx}
      coachCtx={null}
      className="h-[580px] min-h-[420px]"
    />
  )
}
