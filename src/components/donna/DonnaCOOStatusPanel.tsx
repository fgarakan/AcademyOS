'use client'

// Sprint 1661 — DONNA COO Status Panel V1
// Compact, non-intrusive panel showing DONNA's live operating status.
// Renders: current page context, active entity, pending work indicators,
// active workflow (if any), and a single focused suggested action.
//
// Design rules:
//   - Non-intrusive. Collapsed by default, expands on hover/focus.
//   - Never shows raw player notes, private coach data, or PII.
//   - Dismissible. Does not auto-refresh on every render — reads from context.
//   - Uses design system tokens only: surface, border, lime, text-secondary.

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronUp, Zap, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useDonnaSessionContext } from '@/lib/donna/donnaSessionContext'
import { buildDonnaLiveContext } from '@/lib/donna/context/donnaContextEngine'
import { getWorkflowStatusLabel } from '@/lib/donna/workflow/workflowMemory'
import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaCOOStatusPanelProps {
  directorCtx: DirectorDonnaContext | null
  /** Optional: director's first name for personalization */
  directorName?: string | null
  className?: string
}

// ─── Urgency badge ─────────────────────────────────────────────────────────────

function UrgencyDot({ count, threshold }: { count: number; threshold: number }) {
  if (count === 0) return <span className="w-2 h-2 rounded-full bg-text-muted inline-block" />
  if (count >= threshold) return <span className="w-2 h-2 rounded-full bg-status-red inline-block animate-pulse" />
  return <span className="w-2 h-2 rounded-full bg-status-orange inline-block" />
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function DonnaCOOStatusPanel({ directorCtx, directorName, className = '' }: DonnaCOOStatusPanelProps) {
  const pathname = usePathname() ?? '/director'
  const { session } = useDonnaSessionContext()
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const liveCtx = buildDonnaLiveContext({
    pathname,
    role:              'director',
    directorCtx,
    playerProfileCtx:  session.playerProfileContext,
    moduleLabel:       session.lastModule,
    objectLabel:       session.lastObjectLabel,
  })

  const workflowLabel = getWorkflowStatusLabel()

  const pendingTotal = liveCtx.pendingReviews + liveCtx.attendanceExceptions

  // Determine overall status signal
  const hasUrgent = liveCtx.pendingReviews >= 5 || liveCtx.highRiskPlayerCount >= 3
  const hasAttention = pendingTotal > 0 || liveCtx.highRiskPlayerCount > 0 || liveCtx.advancementEligibleCount > 0
  const statusColor = hasUrgent
    ? 'text-status-red'
    : hasAttention
      ? 'text-status-orange'
      : 'text-status-green'
  const StatusIcon = hasUrgent ? AlertCircle : hasAttention ? Clock : CheckCircle2

  return (
    <div
      className={`rounded-lg border border-border bg-surface text-text-secondary text-[11px] select-none ${className}`}
      role="status"
      aria-label="DONNA operating status"
    >
      {/* ── Collapsed header ───────────────────────────────────────────────── */}
      <button
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-surface-raised transition-colors rounded-lg"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap className="w-3 h-3 text-lime shrink-0" aria-hidden />
          <span className="font-medium text-text-primary truncate">DONNA</span>
          <span className="text-text-muted">·</span>
          <span className={`truncate ${statusColor}`}>
            <StatusIcon className="w-3 h-3 inline mr-0.5" aria-hidden />
            {liveCtx.pageLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {liveCtx.entityLabel && (
            <span className="px-1.5 py-0.5 rounded bg-surface-raised text-text-secondary truncate max-w-[120px]">
              {liveCtx.entityLabel}
            </span>
          )}
          {expanded
            ? <ChevronUp className="w-3 h-3 text-text-muted" aria-hidden />
            : <ChevronDown className="w-3 h-3 text-text-muted" aria-hidden />
          }
        </div>
      </button>

      {/* ── Expanded detail ─────────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border space-y-2">

          {/* Entity context */}
          {liveCtx.entitySummary && (
            <div className="text-text-secondary">
              {liveCtx.entitySummary}
            </div>
          )}

          {/* Attention signals */}
          {(liveCtx.pendingReviews > 0 || liveCtx.highRiskPlayerCount > 0 || liveCtx.advancementEligibleCount > 0 || liveCtx.attendanceExceptions > 0) && (
            <div className="space-y-1">
              <div className="label-xs text-text-muted mb-1">ATTENTION</div>
              {liveCtx.pendingReviews > 0 && (
                <div className="flex items-center gap-1.5">
                  <UrgencyDot count={liveCtx.pendingReviews} threshold={5} />
                  <span>{liveCtx.pendingReviews} pending review{liveCtx.pendingReviews !== 1 ? 's' : ''}</span>
                </div>
              )}
              {liveCtx.attendanceExceptions > 0 && (
                <div className="flex items-center gap-1.5">
                  <UrgencyDot count={liveCtx.attendanceExceptions} threshold={5} />
                  <span>{liveCtx.attendanceExceptions} attendance exception{liveCtx.attendanceExceptions !== 1 ? 's' : ''}</span>
                </div>
              )}
              {liveCtx.highRiskPlayerCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <UrgencyDot count={liveCtx.highRiskPlayerCount} threshold={3} />
                  <span>{liveCtx.highRiskPlayerCount} high-risk player signal{liveCtx.highRiskPlayerCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {liveCtx.advancementEligibleCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-lime inline-block" />
                  <span>{liveCtx.advancementEligibleCount} eligible for advancement</span>
                </div>
              )}
            </div>
          )}

          {/* Active workflow */}
          {workflowLabel && (
            <div className="flex items-center gap-1.5 text-status-orange">
              <Clock className="w-3 h-3 shrink-0" aria-hidden />
              <span className="truncate">{workflowLabel}</span>
            </div>
          )}

          {/* No items */}
          {!liveCtx.hasPendingWork && !workflowLabel && !liveCtx.entityLabel && (
            <div className="text-text-muted italic">No urgent items — academy on track.</div>
          )}

          {/* Suggested DONNA command */}
          <div className="pt-1 border-t border-border text-text-muted">
            {workflowLabel
              ? 'Say "Continue where we left off" to resume.'
              : liveCtx.hasPendingWork
                ? 'Say "What needs attention?" to get a full briefing.'
                : 'Say "Hey Donna" for context-aware guidance.'}
          </div>

          {/* Dismiss */}
          <button
            className="text-text-muted hover:text-text-secondary transition-colors"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss DONNA status panel"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
