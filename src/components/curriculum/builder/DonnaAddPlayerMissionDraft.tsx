'use client'

/**
 * DonnaAddPlayerMissionDraft — Sprint 909
 *
 * Neutralized stub. Player mission drafts are not yet connected to the
 * academy_curriculum_overrides review pipeline.
 *
 * Previous version showed a false-positive "Mission draft queued for review"
 * success state after calling setSubmitted(true) with no server action behind it.
 * That has been removed (BUG-1 fix from QA_CURRICULUM_DRAFT_PIPELINE_908.md).
 *
 * When player mission drafts are wired to a real server action this component
 * should be replaced with the full textarea + submit flow, following the pattern
 * in DonnaAddDrillDraft.tsx.
 *
 * Does NOT mutate any rows.
 * Does NOT call createCurriculumContentItemDraft.
 * Does NOT call execute_curriculum_override.
 */

import { Sparkles, X, Clock } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  level: CurriculumLevel
  onClose: () => void
}

export function DonnaAddPlayerMissionDraft({ level, onClose }: Props) {
  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/[0.03] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">
            Player missions — {level.display_name}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-lime transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Unavailable notice */}
      <div
        className="rounded-xl px-3 py-3 space-y-1.5"
        style={{
          border:     '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Not available yet
          </p>
        </div>
        <p className="text-[11px] text-text-muted leading-relaxed">
          Player mission drafts are not connected to review yet.
        </p>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="text-[11px] text-lime hover:text-lime/80 transition-colors"
      >
        Close
      </button>
    </div>
  )
}
