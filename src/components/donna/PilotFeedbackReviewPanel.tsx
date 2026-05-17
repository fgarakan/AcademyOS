'use client'

// Sprint 642 — Pilot Feedback Review Queue V1
// Lightweight UI component for reviewing pilot feedback entries.
// Displays entries grouped by severity with category and status badges.
// Display only — no DB writes.

import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_SEVERITY_LABELS,
  FEEDBACK_SEVERITY_COLOR,
  FEEDBACK_STATUS_LABELS,
  isDemoBlocker,
  isOpenFeedback,
  countBySeverity,
} from '@/lib/donna/pilotFeedbackModel'
import type { PilotFeedbackEntry, PilotFeedbackSeverity } from '@/lib/donna/pilotFeedbackModel'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PilotFeedbackReviewPanelProps {
  entries: PilotFeedbackEntry[]
  className?: string
}

// ── Severity order for display ─────────────────────────────────────────────────

const SEVERITY_ORDER: PilotFeedbackSeverity[] = [
  'demo_blocker',
  'high',
  'medium',
  'low',
  'positive',
]

// ── Entry card ────────────────────────────────────────────────────────────────

function FeedbackEntryCard({ entry }: { entry: PilotFeedbackEntry }) {
  const [expanded, setExpanded] = useState(false)
  const colorClass = FEEDBACK_SEVERITY_COLOR[entry.severity]

  return (
    <div className={`rounded-lg border ${
      isDemoBlocker(entry) ? 'border-status-red/30 bg-status-red/5' : 'border-border bg-surface-raised'
    } overflow-hidden`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 px-3 py-2.5 text-left"
      >
        {/* Severity dot */}
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
          entry.severity === 'positive' ? 'bg-status-green' :
          entry.severity === 'demo_blocker' ? 'bg-status-red' :
          entry.severity === 'high' ? 'bg-status-orange' :
          entry.severity === 'medium' ? 'bg-status-orange/60' :
          'bg-text-muted'
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className={`text-[10px] font-medium ${colorClass}`}>
              {FEEDBACK_SEVERITY_LABELS[entry.severity]}
            </span>
            <span className="text-[9px] text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">{FEEDBACK_CATEGORY_LABELS[entry.category]}</span>
            <span className="text-[9px] text-text-muted">·</span>
            <span className="text-[10px] text-text-muted">{entry.sourceName}</span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full border border-border text-text-muted">
              {FEEDBACK_STATUS_LABELS[entry.status]}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-snug">{entry.description}</p>
        </div>

        <div className="shrink-0 text-text-muted">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-2.5 space-y-1.5 border-t border-border/40 pt-2">
          {entry.userQuote && (
            <div className="rounded bg-surface px-2.5 py-1.5">
              <p className="text-[10px] text-text-muted italic">"{entry.userQuote}"</p>
            </div>
          )}
          {entry.route && (
            <p className="text-[10px] text-text-muted">Route: <span className="font-mono text-text-secondary">{entry.route}</span></p>
          )}
          {entry.suggestedFix && (
            <p className="text-[10px] text-text-muted">Fix: <span className="text-text-secondary">{entry.suggestedFix}</span></p>
          )}
          {entry.sprintAssigned !== null && (
            <p className="text-[10px] text-text-muted">Sprint: <span className="text-lime font-medium">#{entry.sprintAssigned}</span></p>
          )}
          <p className="text-[9px] text-text-muted">{new Date(entry.capturedAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function PilotFeedbackReviewPanel({
  entries,
  className = '',
}: PilotFeedbackReviewPanelProps) {
  const counts = countBySeverity(entries)
  const blockers = entries.filter(isDemoBlocker)
  const openItems = entries.filter(isOpenFeedback)
  const positives = entries.filter(e => e.severity === 'positive')

  // Group by severity for display
  const grouped = SEVERITY_ORDER.reduce((acc, sev) => {
    const items = entries.filter(e => e.severity === sev)
    if (items.length > 0) acc[sev] = items
    return acc
  }, {} as Partial<Record<PilotFeedbackSeverity, PilotFeedbackEntry[]>>)

  if (entries.length === 0) {
    return (
      <div className={`rounded-xl border border-border bg-surface px-4 py-6 text-center ${className}`}>
        <ThumbsUp className="w-4 h-4 text-text-muted mx-auto mb-2" />
        <p className="text-xs text-text-muted">No feedback captured yet.</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-text-primary">Pilot feedback</p>
        <div className="flex items-center gap-2">
          {blockers.length > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-status-red" />
              <span className="text-[10px] text-status-red font-medium">{blockers.length} blocker{blockers.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {positives.length > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-status-green" />
              <span className="text-[10px] text-status-green">{positives.length} positive</span>
            </div>
          )}
          <span className="text-[10px] text-text-muted">{openItems.length} open</span>
        </div>
      </div>

      {/* Count summary */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50 flex-wrap">
        {SEVERITY_ORDER.map(sev => counts[sev] > 0 && (
          <div key={sev} className="flex items-center gap-1">
            <span className={`text-[10px] font-medium ${FEEDBACK_SEVERITY_COLOR[sev]}`}>
              {counts[sev]} {FEEDBACK_SEVERITY_LABELS[sev].toLowerCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Entries by severity */}
      <div className="px-4 py-3 space-y-4">
        {SEVERITY_ORDER.map(sev => {
          const items = grouped[sev]
          if (!items) return null
          return (
            <div key={sev}>
              <p className={`text-[10px] uppercase tracking-widest font-medium mb-2 ${FEEDBACK_SEVERITY_COLOR[sev]}`}>
                {FEEDBACK_SEVERITY_LABELS[sev]}
              </p>
              <div className="space-y-2">
                {items.map(entry => (
                  <FeedbackEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
