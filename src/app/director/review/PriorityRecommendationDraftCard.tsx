import Link from 'next/link'
import { AlertTriangle, CheckCircle, ExternalLink, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { PriorityDraftDecisionControls } from './PriorityDraftDecisionControls'
import { ApplyPriorityRecommendationControls } from './ApplyPriorityRecommendationControls'

const CATEGORY_LABELS: Record<string, string> = {
  technical_skill:      'Technical Skill',
  tactical_skill:       'Tactical Skill',
  physical_fitness:     'Physical Fitness',
  competition_exposure: 'Competition Exposure',
  behavioral:           'Behavioral',
  load_management:      'Load Management',
  reassessment:         'Reassessment',
  promotion_readiness:  'Promotion Readiness',
}

const PRIORITY_LEVEL_COLORS: Record<string, string> = {
  high:   'text-status-red',
  medium: 'text-status-orange',
  low:    'text-text-muted',
}

const URGENCY_COLORS: Record<string, string> = {
  immediate: 'text-status-red',
  high:      'text-status-orange',
  normal:    'text-text-secondary',
  low:       'text-text-muted',
}

interface RecommendedPriority {
  title: string
  description: string
  category: string
  priority_level: string
  urgency: string
}

interface Evidence {
  observation_count: number
  top_tags: string[]
  top_observation_types: string[]
  from_recap_count: number
}

export interface PriorityRecommendationPayload {
  draft_type: string
  recommended_priority: RecommendedPriority
  evidence: Evidence
  active_priority_overlap_warning: string | null
}

export interface EnrichedPriorityDraftItem {
  id: string
  status: string
  createdAt: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: PriorityRecommendationPayload
}

export function PriorityRecommendationDraftCard({ draft }: { draft: EnrichedPriorityDraftItem }) {
  const { payload } = draft
  const rec = payload.recommended_priority
  const evidence = payload.evidence

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className={`text-[10px] uppercase tracking-widest font-medium ${draft.status === 'approved' ? 'text-lime' : 'text-status-orange'}`}>
              Priority Recommendation · {draft.status === 'approved' ? 'approved — ready to apply' : 'pending review'}
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
            <span>Approved. No active priority created yet — click below to apply.</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Draft only. No active priority has been created.</span>
          </div>
        )}

        {/* Recommended priority */}
        <section className="space-y-2">
          <p className="label-xs flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            Recommended Priority
          </p>
          <p className="text-sm font-semibold text-text-primary leading-snug">{rec.title}</p>
          {rec.description && (
            <p className="text-xs text-text-secondary leading-relaxed">{rec.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {rec.category && (
              <span className="text-[11px] bg-surface border border-border text-text-secondary px-2 py-0.5 rounded">
                {CATEGORY_LABELS[rec.category] ?? rec.category}
              </span>
            )}
            <span className={`text-[11px] uppercase tracking-wide font-medium ${PRIORITY_LEVEL_COLORS[rec.priority_level] ?? 'text-text-muted'}`}>
              {rec.priority_level} priority
            </span>
            <span className={`text-[11px] uppercase tracking-wide ${URGENCY_COLORS[rec.urgency] ?? 'text-text-muted'}`}>
              {rec.urgency} urgency
            </span>
          </div>
        </section>

        {/* Evidence */}
        <section className="space-y-2">
          <p className="label-xs">Evidence</p>
          <div className="flex items-start gap-6 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Observations</p>
              <p className="text-lg font-mono font-bold text-lime">{evidence.observation_count}</p>
            </div>
            {evidence.from_recap_count > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">From Recap</p>
                <p className="text-lg font-mono font-bold text-text-secondary">{evidence.from_recap_count}</p>
              </div>
            )}
          </div>
          {evidence.top_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {evidence.top_tags.slice(0, 5).map(tag => (
                <span
                  key={tag}
                  className="text-[11px] bg-surface border border-border text-text-muted px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Overlap warning */}
        {payload.active_priority_overlap_warning && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{payload.active_priority_overlap_warning}</span>
          </div>
        )}

        {/* Controls — apply for approved drafts, decision buttons for pending */}
        {draft.status === 'approved' ? (
          <ApplyPriorityRecommendationControls proposedActionId={draft.id} />
        ) : (
          <PriorityDraftDecisionControls proposedActionId={draft.id} />
        )}
      </CardContent>
    </Card>
  )
}
