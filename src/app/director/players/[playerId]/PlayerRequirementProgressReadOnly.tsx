'use client'

import { Card, CardHeader, CardContent } from '@/components/ui'
import { EyeOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { RequirementProgressConfirmationControls } from './RequirementProgressConfirmationControls'
import type { ConfirmRequirementProgressResult } from './requirementProgressConfirmationAction'

// Local interface — v_player_requirement_progress_detail not yet in database.types.ts.
// Types need regeneration after migrations 041–044 are applied to live DB.
export interface RequirementProgressRow {
  progress_id: string
  academy_id: string
  player_id: string
  curriculum_level_id: string
  requirement_id: string
  requirement_title: string
  requirement_description: string | null
  requirement_type: string
  requirement_domain_key: string
  requirement_domain_label: string
  level_display_name: string
  level_number: number | null
  status: string
  progress_value: number | null
  evidence_count: number
  last_evidence_at: string | null
  is_required: boolean
  is_parent_visible: boolean
  is_player_visible: boolean
  domain_display_order: number
  requirement_display_order: number
}

const STATUS_LABELS: Record<string, string> = {
  not_started:      'Not Started',
  in_progress:      'In Progress',
  evidence_needed:  'Evidence Needed',
  met:              'Met',
  waived:           'Waived',
  blocked:          'Blocked',
}

const STATUS_COLORS: Record<string, string> = {
  not_started:     'text-text-muted border-border',
  in_progress:     'text-status-blue border-status-blue/30',
  evidence_needed: 'text-status-orange border-status-orange/30',
  met:             'text-lime border-lime/30',
  waived:          'text-text-muted border-border',
  blocked:         'text-status-red border-status-red/30',
}

const TYPE_LABELS: Record<string, string> = {
  qualitative:     'Qualitative',
  quantitative:    'Quantitative',
  attendance:      'Attendance',
  assessment:      'Assessment',
  evidence_count:  'Evidence Count',
  coach_confirmed: 'Coach Confirmed',
}

const DOMAIN_ORDER = ['skill', 'competition', 'fitness'] as const

const DOMAIN_LABELS: Record<string, string> = {
  skill:       'Skill Path',
  competition: 'Competition Path',
  fitness:     'Fitness Path',
}

type ConfirmAction = (
  progressId: string,
  newStatus: string,
  note?: string
) => Promise<ConfirmRequirementProgressResult>

interface Props {
  rows: RequirementProgressRow[]
  hasCurriculumState: boolean
  isOrangeBallPlayer: boolean
  currentLevelName: string | null
  confirmAction?: ConfirmAction
}

function RequirementCard({
  row,
  confirmAction,
}: {
  row: RequirementProgressRow
  confirmAction?: ConfirmAction
}) {
  const statusLabel  = STATUS_LABELS[row.status]  ?? row.status
  const statusColors = STATUS_COLORS[row.status]  ?? 'text-text-muted border-border'
  const typeLabel    = TYPE_LABELS[row.requirement_type] ?? row.requirement_type

  return (
    <div className="bg-surface-raised border border-border rounded p-4 space-y-2">
      {/* Title + status + required/optional */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-text-primary font-medium leading-snug">
          {row.requirement_title}
        </p>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <span className={`text-[11px] border px-2 py-0.5 rounded ${statusColors}`}>
            {statusLabel}
          </span>
          <span className="text-[11px] border border-border text-text-muted px-2 py-0.5 rounded">
            {row.is_required ? 'Required' : 'Optional'}
          </span>
        </div>
      </div>

      {/* Description */}
      {row.requirement_description && (
        <p className="text-xs text-text-secondary leading-relaxed">
          {row.requirement_description}
        </p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-[11px] text-text-muted">
        <span>{typeLabel}</span>
        <span>Evidence: {row.evidence_count}</span>
        {row.last_evidence_at && (
          <span>Last evidence {formatDate(row.last_evidence_at)}</span>
        )}
        {!row.is_parent_visible && !row.is_player_visible && (
          <span className="flex items-center gap-1">
            <EyeOff className="w-3 h-3" />
            Internal only
          </span>
        )}
      </div>

      {/* Confirmation controls — director/head_coach only; not visible to parent/player */}
      {confirmAction && (
        <RequirementProgressConfirmationControls
          progressId={row.progress_id}
          currentStatus={row.status}
          confirmAction={confirmAction}
        />
      )}
    </div>
  )
}

function DomainSection({
  domainKey,
  rows,
  confirmAction,
}: {
  domainKey: string
  rows: RequirementProgressRow[]
  confirmAction?: ConfirmAction
}) {
  if (rows.length === 0) return null

  const metCount         = rows.filter(r => r.status === 'met').length
  const inProgressCount  = rows.filter(r => r.status === 'in_progress').length
  const notStartedCount  = rows.filter(r => r.status === 'not_started').length

  return (
    <div>
      {/* Domain header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-widest text-text-muted">
          {DOMAIN_LABELS[domainKey] ?? domainKey}
        </p>
        <div className="flex gap-2 text-[11px]">
          {metCount > 0 && (
            <span className="text-lime">{metCount} met</span>
          )}
          {inProgressCount > 0 && (
            <span className="text-status-blue">{inProgressCount} in progress</span>
          )}
          <span className="text-text-muted">{notStartedCount} not started</span>
        </div>
      </div>

      {/* Requirement cards */}
      <div className="space-y-2">
        {rows.map(row => (
          <RequirementCard key={row.progress_id} row={row} confirmAction={confirmAction} />
        ))}
      </div>
    </div>
  )
}

export function PlayerRequirementProgressReadOnly({
  rows,
  hasCurriculumState,
  isOrangeBallPlayer,
  currentLevelName,
  confirmAction,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <p className="label-xs">Level-Up Requirements</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">

        <p className="text-[11px] text-text-muted leading-relaxed">
          Read-only requirement progress. These rows do not move the player up, change priorities, or publish anything to parents.
        </p>

        {!hasCurriculumState ? (
          <p className="text-xs text-text-muted">
            No curriculum level has been assigned to this player yet. Assign a curriculum from the Skill Path tab first.
          </p>
        ) : rows.length === 0 ? (
          isOrangeBallPlayer ? (
            <p className="text-xs text-text-muted">
              No requirement progress rows have been created for this player yet. Orange Ball players receive requirement rows after the bootstrap migration is applied.
            </p>
          ) : (
            <p className="text-xs text-text-muted">
              Track requirements are currently configured for Orange Ball levels first. Other levels will be added in later curriculum sprints.
            </p>
          )
        ) : (
          <>
            {/* Current level context */}
            {currentLevelName && (
              <div className="bg-surface-raised border border-border rounded px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
                  Displaying requirements for
                </p>
                <p className="text-sm font-medium text-text-primary">{currentLevelName}</p>
              </div>
            )}

            {/* Domain sections */}
            <div className="space-y-6">
              {DOMAIN_ORDER.map(domainKey => (
                <DomainSection
                  key={domainKey}
                  domainKey={domainKey}
                  rows={rows.filter(r => r.requirement_domain_key === domainKey)}
                  confirmAction={confirmAction}
                />
              ))}
            </div>
          </>
        )}

      </CardContent>
    </Card>
  )
}
