'use client'

// Sprint 502 — Parent Trust Coverage Dashboard V1
// Read-only director panel showing parent communication coverage.
// Props-only data — no DB calls. DONNA framing at the top.

import { MessageSquare, ChevronRight, Shield } from 'lucide-react'
import { getNextBestAction } from '@/lib/donna/kpiNextBestActionMap'
import type { KPISeverity } from '@/lib/donna/kpiNextBestActionMap'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ParentCoverageStatus = 'covered' | 'at_risk' | 'not_started' | 'no_parent'

export type LastContactType = 'parent_message' | 'in_person_note' | 'none'

export interface ParentCoverageEntry {
  playerId: string | null
  playerName: string
  groupName: string | null
  parentName: string | null
  lastContactDate: string | null
  lastContactType: LastContactType
  daysSinceContact: number | null
  coverageStatus: ParentCoverageStatus
  pendingDraftCount: number
}

export interface ParentTrustCoverageDashboardProps {
  entries: ParentCoverageEntry[]
  overallSeverity: KPISeverity
  onDraftParentUpdate?: (playerId: string | null, playerName: string) => void
  className?: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const COVERAGE_CONFIG: Record<ParentCoverageStatus, {
  label: string
  dotClass: string
  rowClass: string
  textClass: string
}> = {
  covered: {
    label: 'Covered',
    dotClass: 'bg-status-green',
    rowClass: 'border-border bg-surface-raised',
    textClass: 'text-status-green',
  },
  at_risk: {
    label: 'At risk',
    dotClass: 'bg-status-orange',
    rowClass: 'border-status-orange/20 bg-status-orange/5',
    textClass: 'text-status-orange',
  },
  not_started: {
    label: 'No contact',
    dotClass: 'bg-status-red',
    rowClass: 'border-status-red/20 bg-status-red/5',
    textClass: 'text-status-red',
  },
  no_parent: {
    label: 'No parent on file',
    dotClass: 'bg-border',
    rowClass: 'border-border bg-surface-raised',
    textClass: 'text-text-muted',
  },
}

const CONTACT_TYPE_LABELS: Record<LastContactType, string> = {
  parent_message: 'Parent message',
  in_person_note: 'In-person note',
  none: 'No contact',
}

// ── Coverage row ──────────────────────────────────────────────────────────────

function CoverageRow({
  entry,
  onDraftParentUpdate,
}: {
  entry: ParentCoverageEntry
  onDraftParentUpdate?: (playerId: string | null, playerName: string) => void
}) {
  const coverage = COVERAGE_CONFIG[entry.coverageStatus]
  const canDraft = entry.coverageStatus !== 'no_parent' && onDraftParentUpdate

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${coverage.rowClass}`}>
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${coverage.dotClass}`} />

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-medium text-text-primary">{entry.playerName}</span>
          {entry.groupName && (
            <span className="text-[10px] text-text-muted">· {entry.groupName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-text-muted">
          {entry.parentName && <span>{entry.parentName}</span>}
          {entry.lastContactDate ? (
            <span>
              Last: {CONTACT_TYPE_LABELS[entry.lastContactType]}
              {entry.daysSinceContact !== null && ` (${entry.daysSinceContact}d ago)`}
            </span>
          ) : (
            <span className={coverage.textClass}>{CONTACT_TYPE_LABELS[entry.lastContactType]}</span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {entry.pendingDraftCount > 0 && (
          <span className="text-[10px] bg-status-blue/10 text-status-blue border border-status-blue/30 px-1.5 py-0.5 rounded-full">
            {entry.pendingDraftCount} draft{entry.pendingDraftCount > 1 ? 's' : ''}
          </span>
        )}
        <span className={`text-[10px] font-medium ${coverage.textClass}`}>{coverage.label}</span>
        {canDraft && (
          <button
            onClick={() => onDraftParentUpdate(entry.playerId, entry.playerName)}
            className="text-[10px] text-status-blue hover:text-status-blue/80 transition-colors flex items-center gap-0.5"
          >
            Draft
            <ChevronRight size={10} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function CoverageSummary({ entries }: { entries: ParentCoverageEntry[] }) {
  const covered = entries.filter(e => e.coverageStatus === 'covered').length
  const atRisk = entries.filter(e => e.coverageStatus === 'at_risk').length
  const notStarted = entries.filter(e => e.coverageStatus === 'not_started').length
  const total = entries.filter(e => e.coverageStatus !== 'no_parent').length
  const pct = total > 0 ? Math.round((covered / total) * 100) : null

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border">
      {pct !== null && (
        <span className={`text-[11px] font-mono font-semibold ${
          pct >= 80 ? 'text-status-green' : pct >= 60 ? 'text-status-orange' : 'text-status-red'
        }`}>{pct}% covered</span>
      )}
      {atRisk > 0 && (
        <span className="text-[11px] text-status-orange">{atRisk} at risk</span>
      )}
      {notStarted > 0 && (
        <span className="text-[11px] text-status-red">{notStarted} no contact</span>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ParentTrustCoverageDashboard({
  entries,
  overallSeverity,
  onDraftParentUpdate,
  className,
}: ParentTrustCoverageDashboardProps) {
  const nba = getNextBestAction('parent_trust_coverage', overallSeverity)

  const sortedEntries = [...entries].sort((a, b) => {
    const order = { not_started: 0, at_risk: 1, covered: 2, no_parent: 3 }
    return order[a.coverageStatus] - order[b.coverageStatus]
  })

  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden ${className}`}>
      {/* DONNA header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border bg-surface-raised">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-lime text-[10px] font-bold">D</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Parent Trust Coverage</p>
            <MessageSquare size={10} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-primary leading-snug">
            {nba?.donnaSummary ?? 'Reviewing parent communication coverage.'}
          </p>
        </div>
      </div>

      {/* Summary strip */}
      {entries.length > 0 && <CoverageSummary entries={entries} />}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-text-muted">
            {overallSeverity === 'no_data'
              ? 'Parent communication tracking will be available once parent message approvals are active.'
              : 'No parent entries to display.'}
          </p>
        </div>
      )}

      {/* Entry list */}
      {sortedEntries.length > 0 && (
        <div className="px-4 py-3 space-y-1.5">
          {sortedEntries.map((entry, i) => (
            <CoverageRow key={i} entry={entry} onDraftParentUpdate={onDraftParentUpdate} />
          ))}
        </div>
      )}

      {/* Draft safety note */}
      {onDraftParentUpdate && (
        <div className="mx-4 mb-3 flex items-start gap-1.5 bg-status-blue/5 border border-status-blue/20 rounded-xl px-3 py-2">
          <Shield size={11} className="text-status-blue mt-0.5 shrink-0" />
          <p className="text-[10px] text-status-blue leading-snug">
            Drafting a parent update creates a draft only. Nothing is sent until you review and approve.
          </p>
        </div>
      )}

      {/* DONNA recommendation */}
      {nba && nba.recommendedAction && nba.actionCta !== '' && (
        <div className="px-4 py-3 border-t border-border bg-surface-raised">
          <p className="text-[11px] text-text-muted">{nba.recommendedAction}</p>
        </div>
      )}

      {/* Read-only note */}
      <div className="px-4 py-2 border-t border-border">
        <p className="text-[10px] text-text-muted italic">
          Read-only view. Parent messages are draft-only — director approves all sends.
        </p>
      </div>
    </div>
  )
}
