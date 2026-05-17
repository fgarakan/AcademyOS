'use client'

// Sprint 588 — Execution Audit Trail UI V1
// Director view of DONNA-proposed action execution events.
// Read-only — surfaces what was proposed, approved, applied.
// No DB connection in this file — accepts pre-fetched entries.

import { Shield, CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExecutionEventType =
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'applied'
  | 'failed'
  | 'rolled_back'
  | 'blocked'

export type ExecutionSourceType =
  | 'donna_voice'
  | 'donna_text'
  | 'coach_wrap_up'
  | 'director_manual'
  | 'system'

export interface ExecutionAuditEntry {
  id: string
  eventType: ExecutionEventType
  sourceType: ExecutionSourceType
  actionSummary: string
  actorRole: string
  actorName: string | null
  playerName: string | null
  sessionLabel: string | null
  timestamp: string
  isOfficialWrite: boolean
  payload?: Record<string, unknown>
}

// ── Config ────────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<
  ExecutionEventType,
  { label: string; icon: React.ReactNode; colorClass: string; bgClass: string }
> = {
  proposed: {
    label: 'Proposed',
    icon: <Clock className="w-2.5 h-2.5" />,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-raised',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle2 className="w-2.5 h-2.5" />,
    colorClass: 'text-status-blue',
    bgClass: 'bg-status-blue/5',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="w-2.5 h-2.5" />,
    colorClass: 'text-status-red',
    bgClass: 'bg-status-red/5',
  },
  applied: {
    label: 'Applied',
    icon: <CheckCircle2 className="w-2.5 h-2.5" />,
    colorClass: 'text-lime',
    bgClass: 'bg-lime/5',
  },
  failed: {
    label: 'Failed',
    icon: <AlertCircle className="w-2.5 h-2.5" />,
    colorClass: 'text-status-red',
    bgClass: 'bg-status-red/5',
  },
  rolled_back: {
    label: 'Rolled back',
    icon: <Clock className="w-2.5 h-2.5" />,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-raised',
  },
  blocked: {
    label: 'Blocked',
    icon: <Shield className="w-2.5 h-2.5" />,
    colorClass: 'text-status-orange',
    bgClass: 'bg-status-orange/5',
  },
}

const SOURCE_LABELS: Record<ExecutionSourceType, string> = {
  donna_voice: 'DONNA Voice',
  donna_text: 'DONNA Text',
  coach_wrap_up: 'Coach Wrap-Up',
  director_manual: 'Director',
  system: 'System',
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} · ${time}`
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function ExecutionEntryRow({ entry }: { entry: ExecutionAuditEntry }) {
  const cfg = EVENT_CONFIG[entry.eventType]

  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border/50 last:border-0">
      {/* Event badge */}
      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border shrink-0 mt-0.5 ${cfg.colorClass} ${cfg.bgClass} border-current/20`}>
        {cfg.icon}
        <span className="text-[9px] font-medium">{cfg.label}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-1.5 flex-wrap">
          <p className="text-[11px] text-text-primary leading-snug">{entry.actionSummary}</p>
          {entry.isOfficialWrite && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 shrink-0">
              write
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] text-text-muted">{SOURCE_LABELS[entry.sourceType]}</span>
          {entry.actorName && (
            <><span className="text-[10px] text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">{entry.actorName}</span></>
          )}
          {entry.playerName && (
            <><span className="text-[10px] text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">{entry.playerName}</span></>
          )}
          {entry.sessionLabel && (
            <><span className="text-[10px] text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">{entry.sessionLabel}</span></>
          )}
          <span className="text-[10px] text-text-muted">·</span>
          <span className="text-[10px] text-text-muted">{formatTimestamp(entry.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export interface ExecutionAuditTrailPanelProps {
  entries: ExecutionAuditEntry[]
  maxVisibleDefault?: number
  title?: string
  className?: string
}

export function ExecutionAuditTrailPanel({
  entries,
  maxVisibleDefault = 6,
  title = 'Execution audit trail',
  className = '',
}: ExecutionAuditTrailPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  const visible = expanded ? sorted : sorted.slice(0, maxVisibleDefault)
  const hasMore = sorted.length > maxVisibleDefault
  const officialWriteCount = entries.filter(e => e.isOfficialWrite).length

  if (entries.length === 0) {
    return (
      <div className={`rounded-xl border border-border bg-surface px-4 py-6 text-center ${className}`}>
        <Shield className="w-5 h-5 text-text-muted mx-auto mb-2" />
        <p className="text-xs text-text-muted">No execution events yet.</p>
        <p className="text-[11px] text-text-muted mt-1">
          Proposed, approved, and applied actions will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          {officialWriteCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20">
              {officialWriteCount} write{officialWriteCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-[10px] text-text-muted">{entries.length} events</span>
        </div>
      </div>

      {/* Read-only note */}
      <div className="mx-4 mt-2.5 mb-1 px-3 py-2 bg-surface-raised border border-border rounded-lg">
        <p className="text-[10px] text-text-muted leading-snug">
          Read-only. Events marked <span className="text-lime">write</span> have modified production records.
          All actions flow through the <code className="text-[9px]">proposed_actions</code> pipeline.
          DONNA proposes — directors approve — system executes.
        </p>
      </div>

      {/* Entries */}
      <div className="px-4 py-1">
        {visible.map(entry => (
          <ExecutionEntryRow key={entry.id} entry={entry} />
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
              ? <><ChevronUp className="w-3 h-3" /> Show less</>
              : <><ChevronDown className="w-3 h-3" /> Show {sorted.length - maxVisibleDefault} more</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
