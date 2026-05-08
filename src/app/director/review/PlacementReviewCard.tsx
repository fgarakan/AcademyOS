'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Loader2, UserSearch } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { dismissPlacementReviewDraftAction } from './actions'

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

export function PlacementReviewCard({ item }: Props) {
  const { payload } = item
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)

  function handleDismiss() {
    startTransition(async () => {
      const res = await dismissPlacementReviewDraftAction(item.id)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-xs text-status-green">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Marked reviewed. No changes were made to player records.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

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

        {/* Recommended next step */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
          <p className="text-[11px] text-text-secondary">
            {payload.recommended_next_step || 'Review for placement/onboarding.'}
          </p>
        </div>

        {/* Safety notice */}
        <p className="text-[10px] text-text-muted leading-snug">
          No player profile, roster change, billing, or parent communication has been created.
          Mark reviewed once you have decided on next steps for this individual.
        </p>

        {/* Action */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={handleDismiss}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-lime/10 text-lime border border-lime/30 hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <CheckCircle className="w-3.5 h-3.5" />
            }
            {isPending ? 'Marking reviewed…' : 'Mark Reviewed'}
          </button>
        </div>

        {result?.error && (
          <p className="text-xs text-status-red">{result.error}</p>
        )}
      </CardContent>
    </Card>
  )
}
