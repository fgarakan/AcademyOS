'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, Check, X, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { ImpactPreviewPanel, parseSuggestionImpactPreview } from './ImpactPreviewPanel'
import type { AcademySuggestionRow } from '@/lib/suggestions/suggestionTypes'
import {
  SUGGESTION_TYPE_LABELS,
  PRIORITY_LABEL,
  PRIORITY_CLASSES,
  CONFIDENCE_LABEL,
  CONFIDENCE_CLASSES,
} from '@/lib/suggestions/suggestionTypes'

interface Props {
  suggestion: AcademySuggestionRow
  onAccept: () => Promise<{ error?: string; nextStep?: string } | void>
  onDeny: (note?: string) => Promise<{ error?: string } | void>
  onDefer: (note?: string) => Promise<{ error?: string } | void>
}

type ReviewMode = null | 'deny' | 'defer'

export function SuggestionCard({ suggestion, onAccept, onDeny, onDefer }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null)
  const [note, setNote] = useState('')
  const [actionResult, setActionResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const impact = parseSuggestionImpactPreview(suggestion.impact_preview)
  const typeLabel = SUGGESTION_TYPE_LABELS[suggestion.suggestion_type] ?? suggestion.suggestion_type
  const isReviewed = suggestion.status !== 'pending'

  function handleAccept() {
    startTransition(async () => {
      const result = await onAccept()
      if (result && 'error' in result && result.error) {
        setActionResult(`Error: ${result.error}`)
      } else if (result && 'nextStep' in result && result.nextStep) {
        setActionResult(`Accepted — your decision is recorded. No data was changed automatically. Next step: ${result.nextStep}`)
      } else {
        setActionResult('Accepted — your decision is recorded. No player data was changed automatically.')
      }
    })
  }

  function handleDenyConfirm() {
    startTransition(async () => {
      const result = await onDeny(note || undefined)
      if (result && 'error' in result && result.error) {
        setActionResult(`Error: ${result.error}`)
      } else {
        setActionResult('Denied.')
        setReviewMode(null)
        setNote('')
      }
    })
  }

  function handleDeferConfirm() {
    startTransition(async () => {
      const result = await onDefer(note || undefined)
      if (result && 'error' in result && result.error) {
        setActionResult(`Error: ${result.error}`)
      } else {
        setActionResult('Deferred.')
        setReviewMode(null)
        setNote('')
      }
    })
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">

        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface-raised text-text-muted">
                {typeLabel}
              </span>
              <span className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-medium ${PRIORITY_CLASSES[suggestion.priority]}`}>
                {PRIORITY_LABEL[suggestion.priority]}
              </span>
              <span className={`text-[10px] ${CONFIDENCE_CLASSES[suggestion.confidence]}`}>
                {CONFIDENCE_LABEL[suggestion.confidence]}
              </span>
              {isReviewed && (
                <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface-raised text-text-muted">
                  {suggestion.status}
                </span>
              )}
            </div>

            {/* Title */}
            <p className="text-sm font-semibold text-text-primary leading-tight">
              {suggestion.title}
            </p>

            {/* Generated date */}
            <p className="text-[10px] text-text-muted mt-0.5">
              Generated{' '}
              {new Date(suggestion.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>

            {/* Summary */}
            {suggestion.summary && !expanded && (
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {suggestion.summary.length > 120
                  ? suggestion.summary.slice(0, 120).trimEnd() + '…'
                  : suggestion.summary}
              </p>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-raised transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="space-y-4 pt-1 border-t border-border">

            {/* Why this matters */}
            {suggestion.summary && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Why this matters</p>
                <p className="text-sm text-text-secondary leading-relaxed">{suggestion.summary}</p>
              </div>
            )}

            {/* Impact preview panel */}
            <ImpactPreviewPanel
              ifAccepted={impact.if_accepted}
              willNotChange={
                Array.isArray(suggestion.will_not_change)
                  ? (suggestion.will_not_change as string[])
                  : []
              }
              evidence={Array.isArray(suggestion.evidence) ? suggestion.evidence : []}
              confidence={suggestion.confidence}
              nextStep={impact.next_step}
            />

            {/* Review note if already reviewed */}
            {isReviewed && suggestion.review_note && (
              <div className="px-3 py-2 rounded-lg bg-surface-raised border border-border">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Review note</p>
                <p className="text-sm text-text-secondary">{suggestion.review_note}</p>
              </div>
            )}

            {/* Action result message */}
            {actionResult && (
              <div className="px-3 py-2 rounded-lg bg-lime/5 border border-lime/20">
                <p className="text-sm text-lime">{actionResult}</p>
              </div>
            )}

            {/* Actions — only show for pending suggestions */}
            {!isReviewed && !actionResult && (
              <div className="space-y-3">
                {reviewMode === null ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleAccept}
                      disabled={isPending}
                      className="btn-lime text-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => setReviewMode('defer')}
                      disabled={isPending}
                      className="btn-ghost text-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Defer
                    </button>
                    <button
                      onClick={() => setReviewMode('deny')}
                      disabled={isPending}
                      className="btn-ghost text-sm flex items-center gap-1.5 text-status-red hover:text-status-red disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Deny
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-text-muted">
                      {reviewMode === 'deny' ? 'Deny' : 'Defer'} — optional note:
                    </p>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder={reviewMode === 'deny' ? 'Reason for denying (optional)' : 'Reason for deferring (optional)'}
                      rows={2}
                      className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={reviewMode === 'deny' ? handleDenyConfirm : handleDeferConfirm}
                        disabled={isPending}
                        className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
                          reviewMode === 'deny'
                            ? 'bg-status-red/10 border-status-red/25 text-status-red hover:bg-status-red/20'
                            : 'bg-surface-raised border-border text-text-secondary hover:bg-surface'
                        }`}
                      >
                        {isPending ? 'Saving…' : reviewMode === 'deny' ? 'Confirm Deny' : 'Confirm Defer'}
                      </button>
                      <button
                        onClick={() => { setReviewMode(null); setNote('') }}
                        disabled={isPending}
                        className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </CardContent>
    </Card>
  )
}
