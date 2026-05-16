'use client'

import { Shield, Clock, User, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { ReviewItemTargetModule } from '@/lib/wrap-up/wrapUpReviewQueueMapper'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditLogActorRole =
  | 'academy_director'
  | 'head_coach'
  | 'coach'
  | 'system'

export type AuditLogActionType =
  | 'wrap_up_submitted'
  | 'proposed_action_created'
  | 'proposed_action_approved'
  | 'proposed_action_rejected'
  | 'proposed_action_applied'
  | 'attendance_exception_created'
  | 'session_record_updated'
  | 'coach_observation_created'
  | 'coach_observation_promoted'
  | 'parent_message_drafted'
  | 'level_change_proposed'
  | 'level_change_applied'

export interface AuditLogEntry {
  id: string
  actionType: AuditLogActionType
  actorRole: AuditLogActorRole
  actorName: string | null
  targetModule: ReviewItemTargetModule | null
  playerName: string | null
  summary: string
  timestamp: string
  isOfficialWrite: boolean
}

// ── Config ────────────────────────────────────────────────────────────────────

const ACTION_TYPE_LABELS: Record<AuditLogActionType, string> = {
  wrap_up_submitted: 'Wrap-up submitted',
  proposed_action_created: 'Action created',
  proposed_action_approved: 'Action approved',
  proposed_action_rejected: 'Action rejected',
  proposed_action_applied: 'Action applied',
  attendance_exception_created: 'Attendance exception',
  session_record_updated: 'Session record updated',
  coach_observation_created: 'Observation created',
  coach_observation_promoted: 'Observation added to profile',
  parent_message_drafted: 'Parent message drafted',
  level_change_proposed: 'Level change proposed',
  level_change_applied: 'Level change applied',
}

const ACTOR_ROLE_LABELS: Record<AuditLogActorRole, string> = {
  academy_director: 'Director',
  head_coach: 'Head Coach',
  coach: 'Coach',
  system: 'System',
}

const OFFICIAL_WRITE_ACTIONS = new Set<AuditLogActionType>([
  'proposed_action_applied',
  'session_record_updated',
  'coach_observation_promoted',
  'level_change_applied',
])

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} · ${time}`
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function AuditEntryRow({ entry }: { entry: AuditLogEntry }) {
  const isWrite = OFFICIAL_WRITE_ACTIONS.has(entry.actionType)

  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0">
      {/* Icon */}
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isWrite
          ? 'bg-lime/10 border border-lime/20'
          : 'bg-surface-raised border border-border'
      }`}>
        {entry.actorRole === 'system'
          ? <Clock size={9} className={isWrite ? 'text-lime' : 'text-text-muted'} />
          : <User size={9} className={isWrite ? 'text-lime' : 'text-text-muted'} />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-text-primary">
            {ACTION_TYPE_LABELS[entry.actionType]}
          </span>
          {entry.playerName && (
            <span className="text-[10px] text-text-muted">· {entry.playerName}</span>
          )}
          {isWrite && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20">
              official write
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-muted leading-snug mt-0.5">{entry.summary}</p>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
          <span>{ACTOR_ROLE_LABELS[entry.actorRole]}{entry.actorName ? ` · ${entry.actorName}` : ''}</span>
          <span>·</span>
          <span>{formatTimestamp(entry.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface AuditTrailPlaceholderProps {
  entries: AuditLogEntry[]
  maxVisibleDefault?: number
  title?: string
  className?: string
}

export function AuditTrailPlaceholder({
  entries,
  maxVisibleDefault = 5,
  title = 'Audit trail',
  className,
}: AuditTrailPlaceholderProps) {
  const [expanded, setExpanded] = useState(false)

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  const visibleEntries = expanded ? sortedEntries : sortedEntries.slice(0, maxVisibleDefault)
  const hasMore = sortedEntries.length > maxVisibleDefault

  if (entries.length === 0) {
    return (
      <div className={`bg-surface border border-border rounded-2xl px-4 py-6 text-center ${className}`}>
        <Shield size={18} className="text-text-muted mx-auto mb-2" />
        <p className="text-[12px] text-text-muted">No audit entries yet.</p>
        <p className="text-[11px] text-text-muted mt-1">
          All approved and applied actions will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-text-muted" />
          <p className="text-sm font-medium text-text-primary">{title}</p>
        </div>
        <span className="text-[10px] text-text-muted">{entries.length} entries</span>
      </div>

      {/* Note banner */}
      <div className="mx-4 mt-3 mb-1 flex items-start gap-1.5 bg-surface-raised border border-border rounded-xl px-3 py-2">
        <p className="text-[10px] text-text-muted leading-snug">
          Read-only. This log reflects actions that have been approved or applied.
          Entries marked <span className="text-lime">official write</span> have modified production records.
        </p>
      </div>

      {/* Entries */}
      <div className="px-4 py-1">
        {visibleEntries.map(entry => (
          <AuditEntryRow key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Expand/collapse */}
      {hasMore && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            {expanded
              ? <><ChevronUp size={11} /> Show less</>
              : <><ChevronDown size={11} /> Show {sortedEntries.length - maxVisibleDefault} more</>
            }
          </button>
        </div>
      )}

      {/* Placeholder note */}
      <div className="px-4 py-3 border-t border-border bg-surface-raised">
        <p className="text-[10px] text-text-muted italic">
          Placeholder: in production, entries load from `audit_logs` table. Reads only — no mutations from this view.
        </p>
      </div>
    </div>
  )
}
