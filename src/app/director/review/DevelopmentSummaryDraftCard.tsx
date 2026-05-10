import Link from 'next/link'
import { User, Info, ListChecks } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import type { DevelopmentSummaryDraftPayload } from '@/app/director/players/[playerId]/draftSummaryUpdateAction'
import { DevelopmentSummaryDraftDecisionControls } from './DevelopmentSummaryDraftDecisionControls'
import { ApplyDevelopmentSummaryDraftControls } from './ApplyDevelopmentSummaryDraftControls'

export interface EnrichedSummaryDraftItem {
  id: string
  status: string
  createdAt: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: DevelopmentSummaryDraftPayload
}

export function DevelopmentSummaryDraftCard({ draft }: { draft: EnrichedSummaryDraftItem }) {
  const { payload } = draft

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-lime font-medium">
              Development Summary Draft ·{' '}
              {draft.status === 'approved'
                ? 'approved — ready to apply'
                : draft.status === 'rejected'
                ? 'rejected'
                : 'pending review'}
            </p>
            {draft.playerName && (
              <p className="text-sm font-semibold text-text-primary mt-0.5">{draft.playerName}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              {draft.proposerName && <span>by {draft.proposerName}</span>}
              <span>
                {new Date(draft.createdAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit',
                })}
              </span>
              <span>
                {payload.generated_from === 'placement_seed'
                  ? 'from placement assessment'
                  : `from ${payload.source_observation_count} observation${payload.source_observation_count !== 1 ? 's' : ''}`}
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

        {/* Proposed content */}
        <div className="space-y-3">
          {payload.proposed_strengths.length > 0 && (
            <div className="space-y-1">
              <p className="label-xs flex items-center gap-1.5">
                <ListChecks className="w-3 h-3 text-status-green" />
                Proposed Strengths
              </p>
              <div className="space-y-1">
                {payload.proposed_strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
                    <span className="text-status-green text-xs mt-0.5 shrink-0">+</span>
                    <p className="text-xs text-text-secondary leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payload.proposed_work_on.length > 0 && (
            <div className="space-y-1">
              <p className="label-xs flex items-center gap-1.5">
                <ListChecks className="w-3 h-3 text-status-orange" />
                Proposed Work-On Areas
              </p>
              <div className="space-y-1">
                {payload.proposed_work_on.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
                    <span className="text-status-orange text-xs mt-0.5 shrink-0">→</span>
                    <p className="text-xs text-text-secondary leading-relaxed">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payload.proposed_coach_summary && (
            <div className="space-y-1">
              <p className="label-xs">Proposed Coach Summary</p>
              <div className="px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
                <p className="text-xs text-text-secondary leading-relaxed">{payload.proposed_coach_summary}</p>
              </div>
            </div>
          )}
        </div>

        {/* Safety notice */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            This draft updates the internal development summary only. It is not shown to players or parents.
            No player level, curriculum, or parent communication is changed by applying this draft.
          </span>
        </div>

        {/* Controls */}
        {draft.status === 'pending_review' && (
          <DevelopmentSummaryDraftDecisionControls proposedActionId={draft.id} />
        )}
        {draft.status === 'approved' && (
          <ApplyDevelopmentSummaryDraftControls proposedActionId={draft.id} />
        )}
      </CardContent>
    </Card>
  )
}
