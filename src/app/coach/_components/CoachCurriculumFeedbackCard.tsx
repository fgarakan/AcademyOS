'use client'

// Sprint 592 — Coach Curriculum Feedback Loop V1
// Shown after a coach submits a curriculum idea.
// Shows classification, linked level/pathway, who reviews it, director review status.
// Builds coach trust — makes the feedback loop transparent.

import { CheckCircle, BookOpen, Clock, Shield } from 'lucide-react'

interface Props {
  contentType: string
  stageTarget: string
  ideaSummary: string
  submittedAt: string
  onDismiss?: () => void
}

export function CoachCurriculumFeedbackCard({
  contentType,
  stageTarget,
  ideaSummary,
  submittedAt,
  onDismiss,
}: Props) {
  const submittedDate = new Date(submittedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-status-green/20 bg-status-green/5 px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-status-green/10 border border-status-green/20 flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 text-status-green" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-status-green">Curriculum idea submitted</p>
          <p className="text-[10px] text-text-muted">{submittedDate}</p>
        </div>
      </div>

      {/* Classification */}
      <div className="space-y-1.5 pl-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3 h-3 text-text-muted shrink-0" />
          <span className="text-[10px] text-text-muted">Type classified as:</span>
          <span className="text-[10px] font-medium text-text-secondary">{contentType}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-3 h-3 text-text-muted shrink-0" />
          <span className="text-[10px] text-text-muted">Target stage:</span>
          <span className="text-[10px] font-medium text-text-secondary">{stageTarget}</span>
        </div>
      </div>

      {/* Idea summary */}
      <div className="rounded-lg border border-border bg-surface px-3 py-2">
        <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">{ideaSummary}</p>
      </div>

      {/* Pipeline status */}
      <div className="space-y-1.5">
        <p className="text-[9px] uppercase tracking-widest text-text-muted">What happens next</p>

        <div className="flex items-start gap-2">
          <Clock className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-secondary">
            <span className="font-medium">Director review queue:</span> your idea is now visible to the academy director.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Shield className="w-3 h-3 text-lime shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-secondary">
            <span className="font-medium">Nothing official changed:</span> this is a draft proposal only. No curriculum was modified.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <CheckCircle className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted">
            If approved, the director will add it to the appropriate curriculum level. You may be asked to add more detail.
          </p>
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="w-full text-[11px] py-2 rounded-lg border border-border text-text-muted hover:border-lime/30 hover:text-text-secondary transition-colors"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
