import { EyeOff, Lock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { RequirementEvidenceDetailRow } from './types'

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  coach_observation: 'Coach Observation',
  assessment:        'Assessment',
  attendance:        'Attendance',
  session_result:    'Session Result',
  app_homework:      'App Homework',
  match_result:      'Match Result',
  player_priority:   'Player Priority',
  manual_note:       'Manual Note',
}

const OBS_TYPE_LABELS: Record<string, string> = {
  general:            'General',
  technical:          'Technical',
  tactical:           'Tactical',
  movement:           'Movement',
  competition:        'Competition',
  behavioral:         'Behavioral',
  injury_concern:     'Injury Concern',
  positive_highlight: 'Positive Highlight',
}

interface Props {
  rows: RequirementEvidenceDetailRow[]
  evidenceCount: number
}

export function RequirementEvidenceDetailList({ rows, evidenceCount }: Props) {
  // evidence_count > 0 but no rows loaded — data inconsistency warning
  if (evidenceCount > 0 && rows.length === 0) {
    return (
      <p className="text-[11px] text-status-orange italic">
        Evidence count exists, but details could not be loaded.
      </p>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="text-[11px] text-text-muted italic">No official evidence linked yet.</p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1">
        <Lock className="w-3 h-3" />
        Internal evidence only. Not visible to parents or players.
      </p>
      {rows.map(row => (
        <EvidenceRow key={row.id} row={row} />
      ))}
    </div>
  )
}

function EvidenceRow({ row }: { row: RequirementEvidenceDetailRow }) {
  const typeLabel       = EVIDENCE_TYPE_LABELS[row.evidence_type] ?? row.evidence_type
  const confidencePct   = row.confidence != null ? Math.round(row.confidence * 100) : null
  const obsTypeLabel    = row.observation_type ? (OBS_TYPE_LABELS[row.observation_type] ?? row.observation_type) : null

  const snippet = row.observation_content
    ? row.observation_content.length > 250
      ? row.observation_content.slice(0, 250) + '…'
      : row.observation_content
    : null

  return (
    <div className="bg-surface border border-border/50 rounded p-3 space-y-2">
      {/* Type badge + confidence + date + internal indicator */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
        <span className="text-[11px] border border-border text-text-muted px-2 py-0.5 rounded">
          {typeLabel}
        </span>
        {confidencePct != null && (
          <span className="text-[11px] text-text-secondary">
            {confidencePct}% confidence
          </span>
        )}
        <span className="text-[11px] text-text-muted">{formatDate(row.created_at)}</span>
        {!row.is_parent_safe && (
          <span className="text-[11px] text-text-muted flex items-center gap-1">
            <EyeOff className="w-3 h-3" />
            Internal
          </span>
        )}
      </div>

      {/* Evidence summary */}
      {row.evidence_summary && (
        <p className="text-xs text-text-secondary leading-relaxed">{row.evidence_summary}</p>
      )}

      {/* Coach observation snippet */}
      {row.evidence_type === 'coach_observation' && snippet && (
        <div className="bg-surface-raised rounded p-2 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            {obsTypeLabel ?? 'Observation'}
            {row.observation_created_at && ` · ${formatDate(row.observation_created_at)}`}
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">{snippet}</p>
        </div>
      )}

      {/* Creator */}
      {row.creator_display_name && (
        <p className="text-[11px] text-text-muted">Added by {row.creator_display_name}</p>
      )}
    </div>
  )
}
