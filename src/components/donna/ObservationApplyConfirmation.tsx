'use client'

// Sprint 576 — Coach Observation Apply Confirmation UI V1
// Confirmation step before applying a coach observation draft to player profile.
// Review-first. Does not apply — delegates to existing ApplyWrapUpObservationDraftControls.

import { Eye, EyeOff, Star, AlertCircle, Minus, X } from 'lucide-react'
import type { ObservationType, ObservationVisibility } from './ObservationPlayerProfilePreview'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ObservationApplyConfirmationProps {
  playerName: string
  observationType: ObservationType
  visibility: ObservationVisibility
  isParentSafeCandidate: boolean
  onConfirm: () => void
  onCancel: () => void
  isApplying?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ObservationApplyConfirmation({
  playerName,
  observationType,
  visibility,
  isParentSafeCandidate,
  onConfirm,
  onCancel,
  isApplying = false,
}: ObservationApplyConfirmationProps) {
  const typeIcon =
    observationType === 'positive' ? <Star className="w-3.5 h-3.5 text-status-green" />
    : observationType === 'concern' ? <AlertCircle className="w-3.5 h-3.5 text-status-orange" />
    : <Minus className="w-3.5 h-3.5 text-text-muted" />

  const typeLabel =
    observationType === 'positive' ? 'positive standout'
    : observationType === 'concern' ? 'concern'
    : 'neutral observation'

  const visibilityLabel =
    visibility === 'coach_only' ? 'internal (coach only)'
    : visibility === 'director' ? 'internal (director visible)'
    : 'marked as parent-safe candidate (still requires director approval to send)'

  const isParentVisible = visibility === 'parent_safe'

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        {typeIcon}
        <p className="text-xs font-semibold text-text-secondary">Confirm observation apply</p>
        <button
          onClick={onCancel}
          className="ml-auto text-text-muted hover:text-text-secondary transition-colors"
          disabled={isApplying}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Summary ── */}
      <div className="px-3.5 py-3 flex flex-col gap-2">
        <p className="text-sm text-text-primary leading-snug">
          Apply a <span className="font-semibold">{typeLabel}</span> to{' '}
          <span className="font-semibold">{playerName}'s</span> profile.
        </p>

        {/* Visibility */}
        <div className="flex items-center gap-2">
          {visibility === 'coach_only' ? (
            <EyeOff className="w-3.5 h-3.5 text-text-muted shrink-0" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-text-muted shrink-0" />
          )}
          <p className="text-xs text-text-muted">
            This observation will be <span className="font-medium text-text-secondary">{visibilityLabel}</span>.
          </p>
        </div>

        {/* Parent-visible warning */}
        {isParentVisible && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-status-orange/20 bg-status-orange/5">
            <Eye className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
            <p className="text-xs text-status-orange leading-snug">
              This observation is marked as parent-safe but will still require a separate director approval before any parent communication is sent.
            </p>
          </div>
        )}

        {/* Candidate note */}
        {isParentSafeCandidate && !isParentVisible && (
          <p className="text-[11px] text-text-muted leading-snug">
            This observation is flagged as a parent-safe candidate. It will remain internal until a parent update draft is created and approved separately.
          </p>
        )}

        <p className="text-[11px] text-text-muted leading-snug border-t border-border/50 pt-2">
          Observations applied to player profiles cannot be automatically removed.
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 px-3.5 py-3 border-t border-border">
        <button
          onClick={onCancel}
          disabled={isApplying}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isApplying}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-lime text-base text-sm font-semibold hover:bg-lime/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isApplying ? 'Applying…' : `Apply to ${playerName}'s profile`}
        </button>
      </div>
    </div>
  )
}
