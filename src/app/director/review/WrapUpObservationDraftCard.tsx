import Link from 'next/link'
import { Calendar, Info, Lock, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import type { CoachObservationDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpObservationsAction'
import { WrapUpObservationDraftDecisionControls } from './WrapUpObservationDraftDecisionControls'
import { ApplyWrapUpObservationDraftControls } from './ApplyWrapUpObservationDraftControls'

export interface EnrichedObservationDraftItem {
  id: string
  status: string
  createdAt: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: CoachObservationDraftPayload
}

function ObservationTypeBadge({ type }: { type: CoachObservationDraftPayload['observation_type'] }) {
  if (type === 'positive') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-status-green/10 text-status-green border border-status-green/20">
        Positive
      </span>
    )
  }
  if (type === 'needs_attention') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-status-orange/10 text-status-orange border border-status-orange/20">
        Needs Attention
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-raised text-text-secondary border border-border">
      General
    </span>
  )
}

export function WrapUpObservationDraftCard({ draft }: { draft: EnrichedObservationDraftItem }) {
  const { payload } = draft

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-lime font-medium">
              Player Observation Draft ·{' '}
              {draft.status === 'approved'
                ? 'approved — ready to apply'
                : draft.status === 'clarification_needed'
                ? 'needs clarification'
                : draft.status === 'rejected'
                ? 'rejected'
                : 'pending review'}
            </p>
            {draft.playerName && (
              <p className="text-sm font-semibold text-text-primary mt-0.5">{draft.playerName}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              {payload.session_title && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {payload.session_title}
                </span>
              )}
              {draft.proposerName && <span>by {draft.proposerName}</span>}
              <span>
                {new Date(draft.createdAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          {draft.playerId && (
            <Link
              href={`/director/players/${draft.playerId}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-text-secondary border border-border hover:border-lime/30 hover:text-lime transition-colors shrink-0"
            >
              <User className="w-3 h-3" />
              View Player
            </Link>
          )}
        </div>

        {/* Observation type badge + content */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ObservationTypeBadge type={payload.observation_type} />
            <span className="flex items-center gap-1 text-[10px] text-text-muted">
              <Lock className="w-2.5 h-2.5" />
              Internal only
            </span>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
            <p className="text-xs text-text-primary leading-relaxed">"{payload.note}"</p>
          </div>
        </div>

        {/* Safety notice */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            This observation draft is not visible to the player or parent.
            Approving does not write to the player profile — use Apply to create the internal observation record.
            Rejecting records your decision only.
          </span>
        </div>

        {/* Decision controls */}
        {draft.status === 'pending_review' && (
          <WrapUpObservationDraftDecisionControls proposedActionId={draft.id} />
        )}
        {draft.status === 'approved' && (
          <ApplyWrapUpObservationDraftControls proposedActionId={draft.id} />
        )}
      </CardContent>
    </Card>
  )
}
