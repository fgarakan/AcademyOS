'use client'

// Sprint 1681 — DONNA COO Status Wrapper V1
// Client wrapper for the DONNA COO Status Panel, mountable from the server layout.
// Accepts layout-available props (pendingCount, directorName) and enriches them
// with live session context (entity, page, workflow) from useDonnaSessionContext.
//
// Position: compact top-of-content strip inside the main content area.
// Collapsed by default. Non-intrusive. Dismissible for the session.
// Never shows raw player data, coach notes, or parent-visible data.

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Zap, ChevronDown, ChevronUp, AlertCircle, Clock, CheckCircle2, X } from 'lucide-react'
import { useDonnaSessionContext } from '@/lib/donna/donnaSessionContext'
import { buildDonnaLiveContext } from '@/lib/donna/context/donnaContextEngine'
import { getWorkflowStatusLabel } from '@/lib/donna/workflow/workflowMemory'

export interface DonnaCOOStatusWrapperProps {
  /** Live pending count from layout DB query */
  pendingCount: number
  directorName?: string | null
}

export function DonnaCOOStatusWrapper({ pendingCount, directorName }: DonnaCOOStatusWrapperProps) {
  const pathname = usePathname() ?? '/director'
  const { session } = useDonnaSessionContext()
  const [expanded, setExpanded]   = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [workflowLabel, setWorkflowLabel] = useState<string | null>(null)

  // Read workflow label client-side only (sessionStorage is unavailable during SSR)
  useEffect(() => {
    setWorkflowLabel(getWorkflowStatusLabel())
  }, [pathname])

  if (dismissed) return null

  const liveCtx = buildDonnaLiveContext({
    pathname,
    role:             'director',
    directorCtx:      null,          // not available at layout level
    playerProfileCtx: session.playerProfileContext,
    moduleLabel:      session.lastModule,
    objectLabel:      session.lastObjectLabel,
  })

  const hasUrgent     = pendingCount >= 5
  const hasAttention  = pendingCount > 0 || liveCtx.highRiskPlayerCount > 0

  const statusColor = hasUrgent
    ? 'text-status-red'
    : hasAttention
      ? 'text-status-orange'
      : 'text-text-muted'

  const StatusIcon = hasUrgent ? AlertCircle : hasAttention ? Clock : CheckCircle2

  const firstName = directorName ? directorName.split(' ')[0] : null

  return (
    <div
      className="border-b border-border bg-surface text-[11px] select-none"
      role="status"
      aria-label="DONNA operating status"
    >
      {/* ── Collapsed bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 gap-2">
        {/* Left: DONNA indicator + page context */}
        <button
          className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          aria-label="Toggle DONNA status detail"
        >
          <Zap className="w-3 h-3 text-lime shrink-0" aria-hidden />
          <span className="font-medium text-text-primary">DONNA</span>
          <span className="text-text-muted">·</span>
          <span className={`flex items-center gap-1 ${statusColor}`}>
            <StatusIcon className="w-3 h-3" aria-hidden />
            <span className="truncate max-w-[140px]">
              {liveCtx.entityLabel ?? liveCtx.pageLabel}
            </span>
          </span>
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-orange/20 text-status-orange">
              {pendingCount}
            </span>
          )}
          {workflowLabel && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-status-blue/20 text-status-blue truncate max-w-[120px]">
              {workflowLabel.split('—')[0].trim()}
            </span>
          )}
        </button>

        {/* Right: toggle + dismiss */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="p-1 rounded hover:bg-surface-raised transition-colors text-text-muted hover:text-text-secondary"
            onClick={() => setExpanded(v => !v)}
            aria-label={expanded ? 'Collapse DONNA status' : 'Expand DONNA status'}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            className="p-1 rounded hover:bg-surface-raised transition-colors text-text-muted hover:text-text-secondary"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss DONNA status bar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Expanded detail ─────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-4 pb-2 pt-1 border-t border-border flex flex-wrap gap-x-6 gap-y-1 text-text-secondary">
          {/* Page */}
          <div>
            <span className="text-text-muted">Page: </span>
            <span>{liveCtx.pageLabel}</span>
          </div>
          {/* Entity */}
          {liveCtx.entityLabel && (
            <div>
              <span className="text-text-muted">Context: </span>
              <span>{liveCtx.entityLabel}</span>
            </div>
          )}
          {/* Pending */}
          {pendingCount > 0 && (
            <div className={hasUrgent ? 'text-status-red' : 'text-status-orange'}>
              <span>{pendingCount} item{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} review</span>
            </div>
          )}
          {/* Workflow */}
          {workflowLabel && (
            <div className="text-status-blue">
              <Clock className="w-3 h-3 inline mr-1" aria-hidden />
              <span>{workflowLabel}</span>
            </div>
          )}
          {/* No activity */}
          {pendingCount === 0 && !workflowLabel && !liveCtx.entityLabel && (
            <div className="text-text-muted italic">
              {firstName ? `Good to see you, ${firstName}.` : 'Academy operating normally.'}
              {' '}Say "Hey Donna" for context.
            </div>
          )}
          {/* Hint */}
          <div className="w-full text-text-muted">
            {workflowLabel
              ? 'Say "Continue where we left off" to resume.'
              : pendingCount > 0
                ? 'Say "What needs attention?" for a full briefing.'
                : 'Say "Hey Donna" for context-aware guidance.'}
          </div>
        </div>
      )}
    </div>
  )
}
