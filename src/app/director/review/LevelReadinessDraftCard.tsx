import Link from 'next/link'
import { AlertTriangle, CheckCircle, ExternalLink, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { LevelReadinessDraftDecisionControls } from './LevelReadinessDraftDecisionControls'
import { ApplyApprovedReadinessDraftControls } from './ApplyApprovedReadinessDraftControls'

const DOMAIN_LABELS: Record<string, string> = {
  skill:       'Skill',
  competition: 'Competition',
  fitness:     'Fitness',
}

const DOMAIN_COLORS: Record<string, string> = {
  skill:       'text-status-blue',
  competition: 'text-status-orange',
  fitness:     'text-status-green',
}

const READINESS_COLORS: Record<string, string> = {
  'Not Configured':            'text-text-muted',
  'Not Started':               'text-text-muted',
  'Building Foundation':       'text-status-blue',
  'Developing':                'text-status-blue',
  'Strong Progress':           'text-status-orange',
  'Nearly Ready':              'text-status-orange',
  'Ready for Director Review': 'text-lime',
}

interface DomainStatPayload {
  key: string
  total: number
  met: number
  in_progress: number
  evidence_needed: number
  blocked: number
  not_started: number
  evidence: number
}

export interface LevelReadinessDraftPayload {
  draft_type: string
  player_id: string
  current_level_name: string | null
  readiness_label: string
  met_count: number
  total_required: number
  evidence_count: number
  blocked_count: number
  evidence_needed_count: number
  domain_stats: DomainStatPayload[]
  snapshot_at: string
  warnings: string[]
}

export interface EnrichedReadinessDraftItem {
  id: string
  status: string
  createdAt: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: LevelReadinessDraftPayload
}

export function LevelReadinessDraftCard({ draft }: { draft: EnrichedReadinessDraftItem }) {
  const { payload } = draft
  const readinessColor = READINESS_COLORS[payload.readiness_label] ?? 'text-text-secondary'
  const domainStats = payload.domain_stats ?? []

  return (
    <Card>
      <CardContent className="py-4 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className={`text-[10px] uppercase tracking-widest font-medium ${draft.status === 'approved' ? 'text-lime' : 'text-status-orange'}`}>
              Level Readiness Review ·{' '}
              {draft.status === 'approved' ? 'approved — level movement plan pending' : 'pending review'}
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
              Readiness review approved. A level movement plan draft will be created in the next step.
              No level change has occurred.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-orange/5 border border-status-orange/20 text-xs text-status-orange">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p>Draft only. No level movement has occurred.</p>
              <p>Approval creates a level movement plan draft, not an immediate level change.</p>
            </div>
          </div>
        )}

        {/* Readiness snapshot */}
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Readiness</p>
            <p className={`text-sm font-mono font-bold ${readinessColor}`}>{payload.readiness_label}</p>
          </div>
          {payload.current_level_name && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Current Level</p>
              <p className="text-sm font-mono font-bold text-text-primary">{payload.current_level_name}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Requirements Met</p>
            <p className="text-lg font-mono font-bold text-lime">
              {payload.met_count}<span className="text-text-muted text-sm font-normal"> / {payload.total_required}</span>
            </p>
          </div>
          {payload.blocked_count > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Blocked</p>
              <p className="text-lg font-mono font-bold text-status-red">{payload.blocked_count}</p>
            </div>
          )}
          {payload.evidence_needed_count > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">Evidence Needed</p>
              <p className="text-lg font-mono font-bold text-status-orange">{payload.evidence_needed_count}</p>
            </div>
          )}
        </div>

        {/* Domain stats */}
        {domainStats.length > 0 && (
          <section className="space-y-1.5">
            <p className="label-xs flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              Domain Breakdown
            </p>
            <div className="space-y-1.5">
              {domainStats.map(d => (
                <div key={d.key} className="pl-3 border-l border-border space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-xs font-medium ${DOMAIN_COLORS[d.key] ?? 'text-text-secondary'}`}>
                      {DOMAIN_LABELS[d.key] ?? d.key}
                    </p>
                    <span className="text-[11px] text-lime font-mono">{d.met}/{d.total} met</span>
                    {d.blocked > 0 && (
                      <span className="text-[11px] text-status-red font-mono">{d.blocked} blocked</span>
                    )}
                    {d.evidence_needed > 0 && (
                      <span className="text-[11px] text-status-orange font-mono">{d.evidence_needed} evidence needed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Controls — decision buttons for pending; apply for approved (Sprint 45) */}
        {draft.status === 'approved' ? (
          <ApplyApprovedReadinessDraftControls proposedActionId={draft.id} />
        ) : draft.status === 'pending_review' ? (
          <LevelReadinessDraftDecisionControls proposedActionId={draft.id} />
        ) : null}

      </CardContent>
    </Card>
  )
}
