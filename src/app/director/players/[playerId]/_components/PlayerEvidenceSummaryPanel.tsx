// Player Evidence Summary Panel — Server Component
// Shows top 5 evidence signals + DONNA rollup summary.
// Director and coach only — never exposed to parent/player.
// Reads from player_evidence_records (graceful fallback to existing tables).

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, Lightbulb } from 'lucide-react'
import { getPlayerEvidenceRecords } from '@/lib/evidence/playerEvidenceAggregator'
import { computeProgressRollup } from '@/lib/evidence/playerProgressRollup'
import type { EvidenceRecord, ProgressStatus } from '@/lib/evidence/playerEvidenceTypes'

interface Props {
  playerId:    string
  academyId:   string
  playerFirstName: string | null
  currentLevelName: string | null
  nextLevelName: string | null
  activePriorityCount: number
}

function ProgressStatusBadge({ status }: { status: ProgressStatus }) {
  const configs: Record<ProgressStatus, { label: string; color: string }> = {
    on_track:         { label: 'On Track',          color: 'text-status-green bg-status-green/8 border-status-green/20' },
    needs_attention:  { label: 'Needs Attention',   color: 'text-status-orange bg-status-orange/8 border-status-orange/20' },
    ready_for_review: { label: 'Ready for Review',  color: 'text-lime bg-lime/8 border-lime/25' },
    missing_data:     { label: 'Missing Data',      color: 'text-status-blue bg-status-blue/8 border-status-blue/20' },
    stalled:          { label: 'Stalled',           color: 'text-status-red bg-status-red/8 border-status-red/20' },
  }
  const { label, color } = configs[status]
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${color}`}>
      {label}
    </span>
  )
}

function EvidenceSignalRow({ record }: { record: EvidenceRecord }) {
  const sourceColors: Record<string, string> = {
    assessment_score:       'text-lime',
    reassessment_change:    'text-status-blue',
    mission_assigned:       'text-status-green',
    mission_completed:      'text-status-green',
    placement_decision:     'text-text-secondary',
    level_readiness_signal: 'text-status-orange',
    coach_observation:      'text-text-muted',
    parent_update_approved: 'text-status-blue',
    default:                'text-text-muted',
  }
  const color = sourceColors[record.source_type] ?? sourceColors.default
  const strengthIcon = record.evidence_strength === 'strong'
    ? <TrendingUp className="w-3 h-3 text-status-green shrink-0" />
    : record.evidence_strength === 'weak'
      ? <TrendingDown className="w-3 h-3 text-status-orange shrink-0" />
      : <Minus className="w-3 h-3 text-text-muted shrink-0" />

  const daysAgo = Math.floor((Date.now() - new Date(record.created_at).getTime()) / (1000 * 60 * 60 * 24))
  const dateLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`

  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
      {strengthIcon}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
          {record.evidence_summary}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[9px] uppercase tracking-wide font-semibold ${color}`}>
            {record.source_type.replace(/_/g, ' ')}
          </span>
          {record.pathway && record.pathway !== 'general' && (
            <span className="text-[9px] text-text-muted">{record.pathway.replace(/_/g, ' ')}</span>
          )}
          <span className="text-[9px] text-text-muted ml-auto shrink-0">{dateLabel}</span>
        </div>
      </div>
    </div>
  )
}

export async function PlayerEvidenceSummaryPanel({
  playerId,
  academyId,
  playerFirstName,
  currentLevelName,
  nextLevelName,
  activePriorityCount,
}: Props) {
  const supabase = await getSupabaseServer()

  const result = await getPlayerEvidenceRecords(supabase, playerId, academyId, { limit: 20 })
  const records = result.records

  const rollup = computeProgressRollup(playerId, records, {
    activePriorityCount,
    currentLevelName,
    nextLevelName,
  })

  const topSignals = records.slice(0, 5)
  const remainingCount = Math.max(0, records.length - 5)
  const isFallback = result.source === 'fallback_tables'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="label-xs">DONNA Evidence Summary</p>
          </div>
          <ProgressStatusBadge status={rollup.progressStatus} />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">

        {/* DONNA summary line */}
        <p className="text-xs text-text-secondary leading-relaxed">
          {rollup.donnaSummary}
        </p>

        {/* Recommended action */}
        {rollup.recommendedNextAction && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-lime/5 border border-lime/15">
            <CheckCircle className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
            <p className="text-[11px] text-lime leading-relaxed">{rollup.recommendedNextAction}</p>
          </div>
        )}

        {/* Top blockers */}
        {rollup.readinessBlockers.filter(b => b.severity === 'high').slice(0, 2).map((b, i) => (
          <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/15">
            <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
            <p className="text-[11px] text-status-orange leading-relaxed">{b.description}</p>
          </div>
        ))}

        {/* Pathway quick stats */}
        {rollup.pathwaySignals.filter(s => s.evidenceCount > 0).length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {rollup.pathwaySignals.filter(s => s.evidenceCount > 0).slice(0, 4).map(s => (
              <div key={s.pathway} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-raised border border-border">
                <p className="text-[10px] text-text-muted capitalize">{s.pathway.replace(/_/g, ' ')}</p>
                <p className="text-[10px] font-mono text-text-secondary">{s.evidenceCount}</p>
              </div>
            ))}
          </div>
        )}

        {/* Top 5 evidence signals */}
        {topSignals.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <Clock className="w-6 h-6 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted">
              {isFallback
                ? 'Apply migration 083 to enable full evidence tracking. Showing fallback data.'
                : 'No evidence on record yet. Run an assessment or assign a mission to begin.'}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
              Recent evidence signals
            </p>
            <div>
              {topSignals.map(record => (
                <EvidenceSignalRow key={record.id} record={record} />
              ))}
            </div>
            {remainingCount > 0 && (
              <p className="text-[10px] text-text-muted mt-2 text-center">
                +{remainingCount} more signal{remainingCount !== 1 ? 's' : ''} — open Evidence Hub to see all
              </p>
            )}
          </div>
        )}

        {/* Missing evidence */}
        {rollup.missingEvidence.length > 0 && (
          <div className="pt-1 border-t border-border">
            <p className="text-[10px] text-text-muted mb-1">Missing evidence</p>
            <div className="flex flex-wrap gap-1">
              {rollup.missingEvidence.slice(0, 4).map((m, i) => (
                <span key={i} className="text-[9px] text-text-muted bg-surface-raised border border-border rounded px-2 py-0.5">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {isFallback && (
          <p className="text-[9px] text-text-muted border-t border-border pt-2">
            Source: fallback tables (migration 083 not yet applied)
          </p>
        )}

      </CardContent>
    </Card>
  )
}
