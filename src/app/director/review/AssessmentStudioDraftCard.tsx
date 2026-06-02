// Sprint 1196-1210: Assessment Studio Draft Review Card
// Director reviews coach-submitted assessment drafts from the review queue.
// Approve → inserts official assessment record.
// Reject → marks proposed_action rejected. No automatic level/blueprint/mission changes.

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ClipboardList, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { approveAssessmentDraftAction } from '@/app/director/players/[playerId]/assessmentStudioAction'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssessmentStudioDraftPayload {
  player_id:         string
  assessment_label:  string
  assessment_view:   string
  mode:              string
  db_type:           string
  technical_score:   number | null
  tactical_score:    number | null
  movement_score:    number | null
  competition_score: number | null
  behavioral_score:  number | null
  overall_score:     number | null
  notes:             string | null
  assessed_date:     string
  submitted_by:      string
  template_version:  string | null
  is_baseline:       boolean
  is_reassessment:   boolean
  role:              string
}

export interface EnrichedAssessmentStudioDraftItem {
  id:           string
  status:       string
  createdAt:    string
  playerId:     string | null
  playerName:   string | null
  proposerName: string | null
  payload:      AssessmentStudioDraftPayload
}

// ─── Reject action ────────────────────────────────────────────────────────────

async function rejectDraftAction(id: string): Promise<{ ok: boolean; error: string | null }> {
  'use server'
  const { getSupabaseServer } = await import('@/lib/supabase/server')
  const { revalidatePath } = await import('next/cache')
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any
  const { error } = await rawDb
    .from('proposed_actions')
    .update({ status: 'rejected' })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/director/review')
  return { ok: true, error: null }
}

// ─── Domain bar (mini) ────────────────────────────────────────────────────────

function DomainBar({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null
  const pct = Math.min(100, (score / 10) * 100)
  const color = score >= 7.5 ? 'bg-status-green' : score >= 5 ? 'bg-lime' : 'bg-status-orange'
  return (
    <div className="flex items-center gap-2">
      <p className="text-[10px] text-text-muted w-16 shrink-0">{label}</p>
      <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-text-secondary w-6 text-right shrink-0">{score.toFixed(1)}</span>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function AssessmentStudioDraftCard({ draft }: { draft: EnrichedAssessmentStudioDraftItem }) {
  const { payload } = draft
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [doneType, setDoneType] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const labelDisplay = payload.assessment_label?.replace(/_/g, ' ') ?? 'Assessment'
  const viewDisplay  = payload.assessment_view?.replace(/_/g, ' ') ?? ''
  const modeDisplay  = payload.mode ?? 'standard'

  function handleApprove() {
    startTransition(async () => {
      const res = await approveAssessmentDraftAction({ proposedActionId: draft.id })
      if (res.ok) { setDone(true); setDoneType('approved') }
      else setError(res.error)
    })
  }

  function handleReject() {
    startTransition(async () => {
      const res = await rejectDraftAction(draft.id)
      if (res.ok) { setDone(true); setDoneType('rejected') }
      else setError(res.error)
    })
  }

  if (done) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center gap-3">
          {doneType === 'approved'
            ? <CheckCircle className="w-4 h-4 text-status-green shrink-0" />
            : <XCircle className="w-4 h-4 text-text-muted shrink-0" />}
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {doneType === 'approved' ? 'Assessment approved and recorded' : 'Assessment draft rejected'}
            </p>
            <p className="text-xs text-text-muted">
              {doneType === 'approved'
                ? 'Official record created. No automatic level or blueprint changes.'
                : 'Coach will need to resubmit if needed.'}
            </p>
            {draft.playerId && (
              <Link href={`/director/players/${draft.playerId}`} className="text-xs text-lime hover:underline mt-1 inline-block">
                View player →
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] uppercase tracking-widest text-lime font-medium">
                Coach Assessment Draft
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted bg-surface-raised capitalize">
                {labelDisplay}
              </span>
              {viewDisplay && (
                <span className="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted bg-surface-raised capitalize">
                  {viewDisplay}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted bg-surface-raised capitalize">
                {modeDisplay}
              </span>
              {payload.is_baseline && (
                <span className="text-[10px] px-2 py-0.5 rounded border border-lime/20 text-lime bg-lime/8">
                  Baseline
                </span>
              )}
              {payload.is_reassessment && (
                <span className="text-[10px] px-2 py-0.5 rounded border border-status-blue/20 text-status-blue bg-status-blue/8">
                  Reassessment
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted flex-wrap">
              <ClipboardList className="w-3 h-3 shrink-0" />
              <span>{draft.proposerName ?? 'Coach'}</span>
              {draft.playerName && (
                <>
                  <span>·</span>
                  {draft.playerId
                    ? <Link href={`/director/players/${draft.playerId}`} className="text-lime hover:underline">{draft.playerName}</Link>
                    : <span>{draft.playerName}</span>}
                </>
              )}
              <span>·</span>
              <span>{new Date(draft.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          {payload.overall_score !== null && (
            <div className="text-right shrink-0">
              <p className="text-xl font-bold font-mono text-lime">{payload.overall_score.toFixed(1)}</p>
              <p className="text-[9px] text-text-muted">overall</p>
            </div>
          )}
        </div>

        {/* Domain scores */}
        <div className="space-y-1.5">
          <DomainBar label="Technical"   score={payload.technical_score} />
          <DomainBar label="Tactical"    score={payload.tactical_score} />
          <DomainBar label="Movement"    score={payload.movement_score} />
          <DomainBar label="Competition" score={payload.competition_score} />
          <DomainBar label="Mental"      score={payload.behavioral_score} />
        </div>

        {/* Coach notes */}
        {payload.notes && (
          <div className="px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Coach Notes</p>
            <p className="text-xs text-text-secondary leading-relaxed">{payload.notes}</p>
          </div>
        )}

        {/* Safety guardrail */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface border border-border">
          <AlertTriangle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed">
            Approving creates an official assessment record. No automatic level movement, blueprint change, or parent notification. All follow-up actions require separate director decisions.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-status-red">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="btn-lime flex items-center gap-1.5 text-xs px-4 py-2 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Approve &amp; Record
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={isPending}
            className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-2 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
          {draft.playerId && (
            <Link
              href={`/director/players/${draft.playerId}`}
              className="ml-auto text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              View player →
            </Link>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
