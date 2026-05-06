'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { CoachObservationsFeed, type CoachObservationRow } from './CoachObservationsFeed'
import { AIDraftPanel } from '@/components/player/AIDraftPanel'
import { AddObservationForm } from '@/components/player/AddObservationForm'
import { AddVoiceNoteForm } from '@/components/player/AddVoiceNoteForm'
import type { GenerateDraftResult } from '@/lib/actions/notes'
import type { PlayerDevelopmentSummary } from '@/lib/backend/notes'

interface Props {
  observations: CoachObservationRow[]
  existingSummary: PlayerDevelopmentSummary | null
  onGenerate: (noteText: string) => Promise<GenerateDraftResult>
  onApply: (formData: FormData) => Promise<void>
  onSubmitObservation: (formData: FormData) => Promise<void>
  onSubmitVoiceNote: (formData: FormData) => Promise<void>
}

export function NotesAIDraftSection({
  observations,
  existingSummary,
  onGenerate,
  onApply,
  onSubmitObservation,
  onSubmitVoiceNote,
}: Props) {
  const [prefillText, setPrefillText] = useState<string | undefined>(undefined)

  return (
    <div className="space-y-6">

      {/* Workflow header */}
      <div className="rounded-lg border border-border bg-surface-raised px-4 py-3 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="label-xs">Notes Workflow</span>
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-text-muted">
            <span className="text-lime font-medium">1 Capture</span>
            <span>→</span>
            <span>2 Structure</span>
            <span>→</span>
            <span>3 Review</span>
            <span>→</span>
            <span>4 Apply</span>
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-muted leading-relaxed">
            Internal only. Nothing in this workflow is shown to players or parents unless separately approved by a director.
          </p>
        </div>
      </div>

      {/* Step 1 — Capture */}
      <div className="space-y-4">
        <div>
          <p className="label-xs mb-0.5">Step 1 — Capture</p>
          <p className="text-[11px] text-text-muted">Add a manual observation or paste a voice transcript.</p>
        </div>
        <AddObservationForm onSubmit={onSubmitObservation} />
        <AddVoiceNoteForm onSubmit={onSubmitVoiceNote} />
      </div>

      {/* Step 2 — Structure */}
      <div className="space-y-3">
        <div>
          <p className="label-xs mb-0.5">Step 2 — Structure</p>
          <p className="text-[11px] text-text-muted">
            Select an observation to send to AI Draft. Click &ldquo;Use this note for AI Draft&rdquo; on any entry below.
          </p>
        </div>
        <CoachObservationsFeed
          observations={observations}
          onSelectForDraft={setPrefillText}
        />
      </div>

      {/* Step 3+4 — Review & Apply */}
      <div className="space-y-3">
        <div>
          <p className="label-xs mb-0.5">Step 3 — Review &amp; Apply</p>
          <p className="text-[11px] text-text-muted">
            Generate a structured draft, edit each field, then apply to the internal development summary.
          </p>
        </div>
        <AIDraftPanel
          existingSummary={existingSummary}
          onGenerate={onGenerate}
          onApply={onApply}
          initialText={prefillText}
        />
      </div>

    </div>
  )
}
