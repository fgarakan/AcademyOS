'use client'

// Sprint 591 — Coach Player Observation Draft Review V1
// Coach reviews structured observations before submitting.
// Shows player, pathway, observation, suggested priority, visibility level.
// No direct parent/player publishing from this component.

import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'

export type ObservationVisibility = 'director_only' | 'coach_director' | 'parent_safe' | 'player_safe'
export type ObservationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface ObservationDraft {
  id: string
  playerName: string
  playerLevel: string | null
  observationType: 'positive' | 'needs_attention' | 'readiness_flag' | 'assessment_note' | 'parent_followup'
  observation: string
  suggestedPriority: ObservationPriority
  visibilityLevel: ObservationVisibility
  isParentSafe: boolean
  isPlayerSafe: boolean
  evidenceLink: string | null
  confidence: 'high' | 'medium' | 'low'
  capturedAt: string
}

interface Props {
  observations: ObservationDraft[]
  onSubmit?: (approved: ObservationDraft[]) => void
}

const VISIBILITY_LABELS: Record<ObservationVisibility, string> = {
  director_only: 'Director only',
  coach_director: 'Coach & Director',
  parent_safe: 'Parent safe',
  player_safe: 'Player safe',
}

const PRIORITY_LABELS: Record<ObservationPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

const PRIORITY_COLOUR: Record<ObservationPriority, string> = {
  low: 'text-text-muted border-border',
  medium: 'text-status-blue border-status-blue/30',
  high: 'text-status-orange border-status-orange/30',
  urgent: 'text-status-red border-status-red/30',
}

const OBS_TYPE_LABELS: Record<ObservationDraft['observationType'], string> = {
  positive: 'Positive',
  needs_attention: 'Needs attention',
  readiness_flag: 'Readiness flag',
  assessment_note: 'Assessment note',
  parent_followup: 'Parent follow-up idea',
}

const OBS_TYPE_COLOUR: Record<ObservationDraft['observationType'], string> = {
  positive: 'text-status-green',
  needs_attention: 'text-status-orange',
  readiness_flag: 'text-status-red',
  assessment_note: 'text-lime',
  parent_followup: 'text-status-blue',
}

export function CoachObservationDraftReviewPanel({ observations, onSubmit }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [approved, setApproved] = useState<Set<string>>(new Set())
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  const pending = observations.filter(o => !approved.has(o.id) && !excluded.has(o.id))
  const approvedList = observations.filter(o => approved.has(o.id))

  function toggleApprove(id: string) {
    setApproved(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else {
        next.add(id)
        setExcluded(e => { const n = new Set(e); n.delete(id); return n })
      }
      return next
    })
  }

  function toggleExclude(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else {
        next.add(id)
        setApproved(e => { const n = new Set(e); n.delete(id); return n })
      }
      return next
    })
  }

  function handleSubmit() {
    onSubmit?.(approvedList)
    setSubmitted(true)
  }

  if (observations.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Eye className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span className="text-[12px] font-medium text-text-secondary">
            Observation Drafts ({observations.length})
          </span>
          {approved.size > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-lime/10 text-lime border border-lime/20">
              {approved.size} approved
            </span>
          )}
        </div>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <p className="text-[10px] text-text-muted leading-relaxed">
            Review each observation draft. Mark as approved to include in the director review queue.
            Parent-safe and player-safe items are clearly labelled — the director controls what reaches families.
          </p>

          {submitted ? (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-lime/20 bg-lime/5">
              <CheckCircle className="w-4 h-4 text-lime shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-lime">Observations submitted for review</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {approvedList.length} draft{approvedList.length !== 1 ? 's' : ''} sent. Director reviews before anything reaches players or parents.
                </p>
              </div>
            </div>
          ) : (
            <>
              {observations.map(obs => (
                <ObservationCard
                  key={obs.id}
                  obs={obs}
                  isApproved={approved.has(obs.id)}
                  isExcluded={excluded.has(obs.id)}
                  onApprove={() => toggleApprove(obs.id)}
                  onExclude={() => toggleExclude(obs.id)}
                />
              ))}

              {pending.length > 0 && (
                <p className="text-[10px] text-text-muted text-center">
                  {pending.length} observation{pending.length !== 1 ? 's' : ''} not yet reviewed
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={approved.size === 0}
                className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit {approved.size > 0 ? `${approved.size} ` : ''}Approved Draft{approved.size !== 1 ? 's' : ''} for Director Review
              </button>

              <p className="text-[10px] text-text-muted/60 text-center">
                Nothing is sent to players or parents. Director reviews all observations first.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ObservationCard({
  obs,
  isApproved,
  isExcluded,
  onApprove,
  onExclude,
}: {
  obs: ObservationDraft
  isApproved: boolean
  isExcluded: boolean
  onApprove: () => void
  onExclude: () => void
}) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 space-y-2 transition-all ${
      isApproved
        ? 'border-lime/20 bg-lime/5'
        : isExcluded
          ? 'border-border bg-surface opacity-50'
          : 'border-border bg-surface'
    }`}>
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-text-primary">{obs.playerName}</span>
            {obs.playerLevel && (
              <span className="text-[9px] text-text-muted">{obs.playerLevel}</span>
            )}
            <span className={`text-[9px] font-medium ${OBS_TYPE_COLOUR[obs.observationType]}`}>
              {OBS_TYPE_LABELS[obs.observationType]}
            </span>
          </div>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_COLOUR[obs.suggestedPriority]}`}>
          {PRIORITY_LABELS[obs.suggestedPriority]}
        </span>
      </div>

      {/* Observation text */}
      <p className="text-[12px] text-text-secondary leading-relaxed">{obs.observation}</p>

      {/* Visibility + safety row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] text-text-muted border border-border px-1.5 py-0.5 rounded">
          {VISIBILITY_LABELS[obs.visibilityLevel]}
        </span>
        {obs.isParentSafe && (
          <span className="flex items-center gap-0.5 text-[9px] text-status-blue">
            <Eye className="w-2.5 h-2.5" /> Parent safe
          </span>
        )}
        {!obs.isParentSafe && (
          <span className="flex items-center gap-0.5 text-[9px] text-text-muted">
            <EyeOff className="w-2.5 h-2.5" /> Not parent safe
          </span>
        )}
        {obs.observationType === 'readiness_flag' && (
          <span className="flex items-center gap-0.5 text-[9px] text-status-red">
            <AlertTriangle className="w-2.5 h-2.5" /> Readiness flag
          </span>
        )}
      </div>

      {/* Evidence link */}
      {obs.evidenceLink && (
        <p className="text-[10px] text-text-muted">Evidence: {obs.evidenceLink}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onApprove}
          className={`flex-1 text-[10px] py-1.5 rounded-lg border transition-colors ${
            isApproved
              ? 'border-lime/30 bg-lime/10 text-lime'
              : 'border-border text-text-muted hover:border-lime/30 hover:text-lime'
          }`}
        >
          {isApproved ? '✓ Approved' : 'Approve'}
        </button>
        <button
          onClick={onExclude}
          className={`flex-1 text-[10px] py-1.5 rounded-lg border transition-colors ${
            isExcluded
              ? 'border-status-red/30 bg-status-red/5 text-status-red'
              : 'border-border text-text-muted hover:border-status-red/30 hover:text-status-red'
          }`}
        >
          {isExcluded ? 'Excluded' : 'Exclude'}
        </button>
      </div>
    </div>
  )
}
