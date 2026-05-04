'use client'

import { useState } from 'react'
import { CoachObservationsFeed, type CoachObservationRow } from './CoachObservationsFeed'
import { AIDraftPanel } from '@/components/player/AIDraftPanel'
import type { GenerateDraftResult } from '@/lib/actions/notes'
import type { PlayerDevelopmentSummary } from '@/lib/backend/notes'

interface Props {
  observations: CoachObservationRow[]
  existingSummary: PlayerDevelopmentSummary | null
  onGenerate: (noteText: string) => Promise<GenerateDraftResult>
  onApply: (formData: FormData) => Promise<void>
}

export function NotesAIDraftSection({ observations, existingSummary, onGenerate, onApply }: Props) {
  const [prefillText, setPrefillText] = useState<string | undefined>(undefined)

  return (
    <div className="space-y-6">
      <AIDraftPanel
        existingSummary={existingSummary}
        onGenerate={onGenerate}
        onApply={onApply}
        initialText={prefillText}
      />

      <div>
        <p className="label-xs mb-1">Internal Coach Observations</p>
        <p className="text-[11px] text-text-muted mb-4">
          Internal development evidence. Not parent-facing yet.
        </p>
        <CoachObservationsFeed
          observations={observations}
          onSelectForDraft={setPrefillText}
        />
      </div>
    </div>
  )
}
