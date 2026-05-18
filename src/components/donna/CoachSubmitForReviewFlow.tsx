'use client'

// Sprint 1026 — Coach Submit For Review Flow V1
// UI panel for coaches to submit a DONNA draft to the director review queue.
// Shows: what's being submitted, safety note, confirmation, callback on submit.
// No DB writes directly — caller provides onSubmit handler.

import { CheckCircle2, Clock, Send, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui'
import type { DonnaDraftPayload } from '@/lib/donna/donnaDraftOnlyActions'
import { getDraftActionLabel, getDraftSafetyFooter } from '@/lib/donna/donnaDraftOnlyActions'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CoachSubmitForReviewFlowProps {
  draft: DonnaDraftPayload
  onSubmit: (draft: DonnaDraftPayload) => Promise<void> | void
  isSubmitting?: boolean
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CoachSubmitForReviewFlow({
  draft,
  onSubmit,
  isSubmitting = false,
  className = '',
}: CoachSubmitForReviewFlowProps) {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (isSubmitting || submitted) return
    setError(null)
    try {
      await onSubmit(draft)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-primary">Submitted for review</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                The director will review and take action. You will be notified once it is approved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">

        {/* Header */}
        <div className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">
              {getDraftActionLabel(draft.actionId)}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">{draft.actionLabel}</p>
          </div>
        </div>

        {/* What happens */}
        <div className="rounded-xl border border-border bg-surface-raised px-3.5 py-3 space-y-1.5">
          <p className="label-xs">What happens when you submit</p>
          <ul className="space-y-1">
            <li className="flex items-start gap-1.5 text-[11px] text-text-secondary">
              <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-status-blue" />
              Your draft is sent to the director review queue
            </li>
            <li className="flex items-start gap-1.5 text-[11px] text-text-secondary">
              <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-text-muted" />
              Nothing changes until the director approves
            </li>
            <li className="flex items-start gap-1.5 text-[11px] text-text-secondary">
              <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-text-muted" />
              You can see the status in your pending submissions
            </li>
          </ul>
        </div>

        {/* Safety note */}
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-muted leading-relaxed">{getDraftSafetyFooter()}</p>
        </div>

        {/* Safety notes from draft */}
        {draft.safetyNotes.length > 0 && (
          <div className="space-y-1">
            {draft.safetyNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-lime/60" />
                <p className="text-[11px] text-lime/70 leading-relaxed">{note}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-status-red">{error}</p>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-lime w-full text-xs py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          {isSubmitting ? 'Submitting...' : 'Submit for director review'}
        </button>

      </CardContent>
    </Card>
  )
}
