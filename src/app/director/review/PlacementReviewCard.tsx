'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Clock, Loader2, UserPlus, UserSearch, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import {
  dismissPlacementReviewDraftAction,
  startPlacementIntakeFromReviewAction,
  markPlacementReviewFollowUpLaterAction,
} from './actions'

export interface PlacementReviewPayload {
  source: string
  source_proposed_action_id: string
  session_id: string
  attendee_name: string
  reason: string
  recommended_next_step: string
  no_automatic_player_creation: boolean
}

export interface EnrichedPlacementReviewItem {
  id: string
  status: string
  createdAt: string
  sessionId: string | null
  sessionName: string | null
  sessionDate: string | null
  payload: PlacementReviewPayload
}

interface Props {
  item: EnrichedPlacementReviewItem
}

type ActiveAction = 'intake' | 'follow_up' | 'dismiss'

export function PlacementReviewCard({ item }: Props) {
  const { payload } = item
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null)
  const [result, setResult] = useState<{ ok: boolean; error: string | null; action: ActiveAction } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleIntake() {
    setResult(null)
    setActiveAction('intake')
    startTransition(async () => {
      const res = await startPlacementIntakeFromReviewAction(item.id)
      setResult({ ok: res.ok, error: res.error, action: 'intake' })
      if (res.ok) router.refresh()
    })
  }

  function handleFollowUp() {
    setResult(null)
    setActiveAction('follow_up')
    startTransition(async () => {
      const res = await markPlacementReviewFollowUpLaterAction(item.id)
      setResult({ ok: res.ok, error: res.error, action: 'follow_up' })
      if (res.ok) router.refresh()
    })
  }

  function handleDismiss() {
    setResult(null)
    setActiveAction('dismiss')
    startTransition(async () => {
      const res = await dismissPlacementReviewDraftAction(item.id)
      setResult({ ok: res.ok, error: res.error, action: 'dismiss' })
      if (res.ok) router.refresh()
    })
  }

  // Success state — shown briefly before router.refresh() unmounts the card
  if (result?.ok) {
    const successMessages: Record<ActiveAction, string> = {
      intake: 'Intake candidate created. No player record was created.',
      follow_up: 'Moved to Follow-Up Later. Item will appear in the follow-up section.',
      dismiss: 'Marked as Not a Fit. No player record was created.',
    }
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-xs text-status-green">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{successMessages[result.action]}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Follow-Up Later mode — read-only display, no action buttons
  if (item.status === 'clarification_needed') {
    return (
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <UserSearch className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Placement Review</p>
              </div>
              <p className="text-sm font-semibold text-text-primary">{payload.attendee_name}</p>
              {payload.reason && (
                <p className="text-xs text-text-muted">{payload.reason}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-status-blue/10 text-status-blue border-status-blue/30">
                Follow-Up Later
              </span>
              <p className="text-[10px] text-text-muted">
                {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {(item.sessionName || item.sessionDate) && (
            <div className="p-2.5 rounded-lg bg-surface-raised border border-border space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Session</p>
              {item.sessionName && (
                <p className="text-xs text-text-secondary">{item.sessionName}</p>
              )}
              {item.sessionDate && (
                <p className="text-[10px] text-text-muted">
                  {new Date(item.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          )}

          <p className="text-[10px] text-text-muted leading-snug">
            Parked for later review. Return to this item when ready to decide on placement. No player record has been created.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Pending review mode — full director decision UX
  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <UserSearch className="w-3.5 h-3.5 text-status-orange shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Placement Review</p>
            </div>
            <p className="text-sm font-semibold text-text-primary">{payload.attendee_name}</p>
            {payload.reason && (
              <p className="text-xs text-text-muted">{payload.reason}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-status-orange/10 text-status-orange border-status-orange/30">
              Needs Review
            </span>
            <p className="text-[10px] text-text-muted">
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Session context */}
        {(item.sessionName || item.sessionDate) && (
          <div className="p-2.5 rounded-lg bg-surface-raised border border-border space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Session</p>
            {item.sessionName && (
              <p className="text-xs text-text-secondary">{item.sessionName}</p>
            )}
            {item.sessionDate && (
              <p className="text-[10px] text-text-muted">
                {new Date(item.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* Coach note */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
          <p className="text-[11px] text-text-secondary">
            {payload.recommended_next_step || 'Review for placement / onboarding.'}
          </p>
        </div>

        {/* Safety notice */}
        <p className="text-[10px] text-text-muted leading-snug">
          No player profile, roster change, billing, or parent communication has been created.
          Choose a next step below.
        </p>

        {/* ── Decision controls ── */}
        <div className="pt-2 border-t border-border space-y-3">

          {/* Primary: Start Placement Intake */}
          <button
            type="button"
            onClick={handleIntake}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime/10 border border-lime/30 text-lime font-semibold text-xs hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeAction === 'intake' && isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <UserPlus className="w-3.5 h-3.5" />
            }
            {activeAction === 'intake' && isPending ? 'Creating intake candidate…' : 'Start Placement Intake'}
          </button>

          {/* Intake microcopy */}
          <p className="text-[10px] text-text-muted leading-snug px-1">
            Starting intake does not create a player, roster assignment, billing record, or parent account.
            It only creates a director-controlled intake candidate for further review.
          </p>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFollowUp}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:border-status-blue/40 hover:text-status-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activeAction === 'follow_up' && isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Clock className="w-3 h-3" />
              }
              {activeAction === 'follow_up' && isPending ? 'Saving…' : 'Follow-Up Later'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:border-status-red/40 hover:text-status-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activeAction === 'dismiss' && isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <X className="w-3 h-3" />
              }
              {activeAction === 'dismiss' && isPending ? 'Dismissing…' : 'Not a Fit / Dismiss'}
            </button>
          </div>

          {/* Secondary microcopy */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted leading-snug px-0.5">
            <p>Keeps as an operational follow-up for the director. No records changed.</p>
            <p>Dismisses this follow-up. No player record is created.</p>
          </div>
        </div>

        {result?.error && (
          <p className="text-xs text-status-red">{result.error}</p>
        )}
      </CardContent>
    </Card>
  )
}
