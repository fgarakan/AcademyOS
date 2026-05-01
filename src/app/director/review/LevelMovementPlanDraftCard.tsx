import Link from 'next/link'
import { AlertTriangle, CheckCircle, ExternalLink, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { LevelMovementPlanDraftDecisionControls } from './LevelMovementPlanDraftDecisionControls'

const READINESS_COLORS: Record<string, string> = {
  'Not Configured':            'text-text-muted',
  'Not Started':               'text-text-muted',
  'Building Foundation':       'text-status-blue',
  'Developing':                'text-status-blue',
  'Strong Progress':           'text-status-orange',
  'Nearly Ready':              'text-status-orange',
  'Ready for Director Review': 'text-lime',
}

export interface LevelMovementPlanPayload {
  draft_type: string
  player_id: string
  source_readiness_review_id: string
  current_level_id: string
  current_level_name: string | null
  current_level_number: number | null
  next_level_id: string
  next_level_name: string | null
  next_level_number: number | null
  readiness_label: string | null
  met_count: number | null
  total_required: number | null
  evidence_count: number | null
  warnings: string[]
}

export interface EnrichedLevelMovementPlanDraftItem {
  id: string
  status: string
  createdAt: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: LevelMovementPlanPayload
}

export function LevelMovementPlanDraftCard({ draft }: { draft: EnrichedLevelMovementPlanDraftItem }) {
  const { payload } = draft
  const readinessColor = payload.readiness_label
    ? (READINESS_COLORS[payload.readiness_label] ?? 'text-text-secondary')
    : 'text-text-muted'

  return (
    <Card>
      <CardContent className="py-4 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className={`text-[10px] uppercase tracking-widest font-medium ${draft.status === 'approved' ? 'text-lime' : 'text-status-orange'}`}>
              Level Movement Plan ·{' '}
              {draft.status === 'approved' ? 'approved — awaiting application' : 'pending review'}
            </p>
            {draft.playerName && (
              <p className="text-sm font-semibold text-text-primary mt-0.5">{draft.playerName}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              {draft.proposerName && <span>by {draft.proposerName}</span>}
              <span>
                Created{' '}
                {new Date(draft.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          {draft.playerId && (
            <Link
              href={`/director/players/${draft.playerId}`}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-lime transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Player Profile
            </Link>
          )}
        </div>

        {/* Status banner */}
        {draft.status === 'approved' ? (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20 text-xs text-lime">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Level movement plan approved. No level change has occurred yet.
              The application step will update the player&apos;s curriculum level.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p>Draft only. No level movement has occurred.</p>
              <p>Approval here does not update the player&apos;s curriculum level. A separate application step is required.</p>
            </div>
          </div>
        )}

        {/* Level movement arrow */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Current Level</p>
            <p className="text-sm font-mono font-bold text-text-primary">
              {payload.current_level_name ?? '—'}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-lime shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Proposed Next Level</p>
            <p className="text-sm font-mono font-bold text-lime">
              {payload.next_level_name ?? '—'}
            </p>
          </div>
        </div>

        {/* Readiness context */}
        {payload.readiness_label && (
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Readiness at Review</p>
              <p className={`text-sm font-mono font-bold ${readinessColor}`}>{payload.readiness_label}</p>
            </div>
            {payload.met_count != null && payload.total_required != null && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Requirements Met</p>
                <p className="text-lg font-mono font-bold text-lime">
                  {payload.met_count}<span className="text-text-muted text-sm font-normal"> / {payload.total_required}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Controls — decision buttons for pending; approved shows awaiting (Sprint 47 adds apply) */}
        {draft.status === 'pending_review' ? (
          <LevelMovementPlanDraftDecisionControls proposedActionId={draft.id} />
        ) : draft.status === 'approved' ? (
          <div className="pt-3 border-t border-border">
            <p className="text-[11px] text-text-muted">
              Approved. The level movement application will be available once the final approval workflow is enabled.
            </p>
          </div>
        ) : null}

      </CardContent>
    </Card>
  )
}
