'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ClipboardList, Loader2, ShieldCheck, UserPlus, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { dismissIntakeCandidateAction, startPlacementAssessmentDraftAction } from './actions'

export interface PlacementIntakeCandidatePayload {
  draft_type: 'placement_intake_candidate_v1'
  source: string
  source_proposed_action_id: string
  attendee_name: string
  session_id: string | null
  coach_note: string | null
  recommended_next_step: string | null
  no_player_created: boolean
  no_roster_change: boolean
  no_billing: boolean
  no_parent_communication: boolean
}

export interface EnrichedIntakeCandidateItem {
  id: string
  status: string
  createdAt: string
  sessionName: string | null
  sessionDate: string | null
  payload: PlacementIntakeCandidatePayload
}

interface Props {
  item: EnrichedIntakeCandidateItem
}

const SAFETY_BADGES = [
  'No player record',
  'No roster entry',
  'No billing',
  'No parent comms',
] as const

export function PlacementIntakeCandidateCard({ item }: Props) {
  const { payload } = item
  const router = useRouter()
  type ActiveAction = 'assess' | 'dismiss'
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null)
  const [result, setResult] = useState<{ ok: boolean; error: string | null; action: ActiveAction } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAssess() {
    setResult(null)
    setActiveAction('assess')
    startTransition(async () => {
      const res = await startPlacementAssessmentDraftAction(item.id)
      setResult({ ok: res.ok, error: res.error, action: 'assess' })
      if (res.ok) router.refresh()
    })
  }

  function handleDismiss() {
    setResult(null)
    setActiveAction('dismiss')
    startTransition(async () => {
      const res = await dismissIntakeCandidateAction(item.id)
      setResult({ ok: res.ok, error: res.error, action: 'dismiss' })
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    const successMessages: Record<ActiveAction, string> = {
      assess: 'Assessment draft started. Fill in details in the Placement Assessment section.',
      dismiss: 'Intake candidate dismissed. No player record was created.',
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

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Intake Candidate</p>
            </div>
            <p className="text-sm font-semibold text-text-primary">{payload.attendee_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-lime/10 text-lime border-lime/30">
              Pending Intake
            </span>
            <p className="text-[10px] text-text-muted">
              {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Session context */}
        {(item.sessionName || item.sessionDate) && (
          <div className="p-2.5 rounded-lg bg-surface-raised border border-border space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Source Session</p>
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
        {payload.coach_note && (
          <div className="px-3 py-2 rounded-lg bg-surface-raised border border-border">
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Coach Note</p>
            <p className="text-[11px] text-text-secondary">{payload.coach_note}</p>
          </div>
        )}

        {/* Safety badges */}
        <div className="flex flex-wrap gap-1.5">
          {SAFETY_BADGES.map(badge => (
            <div key={badge} className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-surface-raised border-border">
              <ShieldCheck className="w-2.5 h-2.5 text-status-green shrink-0" />
              <span className="text-[9px] text-text-muted">{badge}</span>
            </div>
          ))}
        </div>

        {/* Safety notice */}
        <p className="text-[10px] text-text-muted leading-snug">
          Director-controlled intake candidate only. No player profile, billing record, or parent account has been created. Proceed through placement assessment to create an official player record.
        </p>

        {/* ── Actions ── */}
        <div className="pt-2 border-t border-border space-y-3">
          {/* Primary: Start Placement Assessment */}
          <button
            type="button"
            onClick={handleAssess}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime/10 border border-lime/30 text-lime font-semibold text-xs hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeAction === 'assess' && isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ClipboardList className="w-3.5 h-3.5" />
            }
            {activeAction === 'assess' && isPending ? 'Starting assessment…' : 'Start Placement Assessment'}
          </button>
          <p className="text-[10px] text-text-muted leading-snug px-1">
            Creates an editable assessment draft in the Placement Assessment section below. No player record is created.
          </p>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-secondary hover:border-status-red/40 hover:text-status-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeAction === 'dismiss' && isPending
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <X className="w-3 h-3" />
            }
            {activeAction === 'dismiss' && isPending ? 'Dismissing…' : 'Dismiss Candidate'}
          </button>
          <p className="text-[10px] text-text-muted leading-snug px-0.5">
            Marks this candidate as dismissed. No player record is created.
          </p>
        </div>

        {result?.error && (
          <p className="text-xs text-status-red">{result.error}</p>
        )}
      </CardContent>
    </Card>
  )
}
