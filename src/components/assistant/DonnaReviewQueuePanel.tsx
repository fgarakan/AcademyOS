'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DonnaObjectResolverPanel } from './DonnaObjectResolverPanel'
import { resolveDonnaObjectAction } from '@/app/director/_actions/donnaObjectResolutionActions'
import {
  markVoiceNoteReviewedAction,
  routeVoiceNoteToPlayerAction,
  routeVoiceNoteToSessionAction,
} from '@/app/director/_actions/donnaReviewQueueActions'
import { explainReviewItem } from './donnaReviewQueueExplainer'
import type {
  DonnaReviewQueueSummary,
  DonnaReviewItem,
  DonnaReviewQueueActionType,
} from './donnaReviewQueueTypes'
import type { DonnaTaskId } from './donnaTaskContracts'
import type {
  DonnaObjectResolutionResult,
  DonnaResolvedObjectCandidate,
} from './donnaObjectResolutionTypes'

// ---------------------------------------------------------------------------
// Routing state — one active routing flow at a time
// ---------------------------------------------------------------------------

type RoutingPhase = 'searching' | 'confirming' | 'saving' | 'done' | 'error'

interface RoutingState {
  noteId: string
  routeType: 'player' | 'session'
  query: string
  phase: RoutingPhase
  resolutionResult: DonnaObjectResolutionResult | null
  isLoadingResolution: boolean
  selectedCandidate: DonnaResolvedObjectCandidate | null
  message: string | null
}

// ---------------------------------------------------------------------------
// Action label map
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<DonnaReviewQueueActionType, string> = {
  mark_reviewed: 'Mark Reviewed',
  route_to_player: 'Route to Player',
  route_to_session: 'Route to Session',
  start_populate_blocks: 'Populate Blocks',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DonnaReviewQueuePanelProps {
  data: DonnaReviewQueueSummary | null
  isLoading: boolean
  onRefresh: () => void
  onClose: () => void
  onStartTask: (taskId: DonnaTaskId) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DonnaReviewQueuePanel({
  data,
  isLoading,
  onRefresh,
  onClose,
  onStartTask,
}: DonnaReviewQueuePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [markStates, setMarkStates] = useState<Record<string, 'idle' | 'saving' | 'done' | 'error'>>({})
  const [markMessages, setMarkMessages] = useState<Record<string, string>>({})
  const [routing, setRouting] = useState<RoutingState | null>(null)

  // ── Mark reviewed ────────────────────────────────────────────────────────

  async function handleMarkReviewed(item: DonnaReviewItem) {
    setMarkStates(prev => ({ ...prev, [item.id]: 'saving' }))
    const result = await markVoiceNoteReviewedAction(item.sourceId)
    if (result.ok) {
      setMarkStates(prev => ({ ...prev, [item.id]: 'done' }))
      setMarkMessages(prev => ({ ...prev, [item.id]: result.message }))
      onRefresh()
    } else {
      setMarkStates(prev => ({ ...prev, [item.id]: 'error' }))
      setMarkMessages(prev => ({ ...prev, [item.id]: result.message }))
    }
  }

  // ── Routing flow ─────────────────────────────────────────────────────────

  function handleStartRouting(item: DonnaReviewItem, routeType: 'player' | 'session') {
    setRouting({
      noteId: item.sourceId,
      routeType,
      query: '',
      phase: 'searching',
      resolutionResult: null,
      isLoadingResolution: false,
      selectedCandidate: null,
      message: null,
    })
    setExpandedId(item.id)
  }

  async function handleRoutingSearch(query: string) {
    if (!routing) return
    setRouting(prev => prev ? { ...prev, query, isLoadingResolution: true, resolutionResult: null } : null)
    const objectType = routing.routeType === 'player' ? 'player' : 'session'
    const result = await resolveDonnaObjectAction(objectType, query)
    setRouting(prev => prev ? { ...prev, resolutionResult: result, isLoadingResolution: false } : null)
  }

  function handleSelectCandidate(candidate: DonnaResolvedObjectCandidate) {
    setRouting(prev => prev ? { ...prev, selectedCandidate: candidate, phase: 'confirming' } : null)
  }

  function handleCancelResolution() {
    setRouting(prev => prev ? { ...prev, resolutionResult: null, selectedCandidate: null, phase: 'searching' } : null)
  }

  async function handleConfirmRoute() {
    if (!routing?.selectedCandidate) return
    setRouting(prev => prev ? { ...prev, phase: 'saving' } : null)

    let result
    if (routing.routeType === 'player') {
      result = await routeVoiceNoteToPlayerAction(routing.noteId, routing.selectedCandidate.id)
    } else {
      result = await routeVoiceNoteToSessionAction(routing.noteId, routing.selectedCandidate.id)
    }

    if (result.ok) {
      setRouting(prev => prev ? { ...prev, phase: 'done', message: result.message } : null)
      onRefresh()
    } else {
      setRouting(prev => prev ? { ...prev, phase: 'error', message: result.message } : null)
    }
  }

  function handleCancelRouting() {
    setRouting(null)
  }

  // ── Populate blocks (start guided task) ──────────────────────────────────

  function handleStartPopulateBlocks(item: DonnaReviewItem) {
    onStartTask('populate_session_from_template')
    onClose()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
        <span className="ml-2 text-[12px] text-text-muted">Loading review queue…</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl px-3.5 py-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-[12px] text-text-muted">Could not load review queue.</p>
        <button onClick={onRefresh} className="mt-2 text-[11px] text-lime underline underline-offset-2">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* ── Header + counts ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            Review Queue
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {data.needsRoutingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30' }}>
                {data.needsRoutingCount} unlinked
              </span>
            )}
            {data.pendingReviewCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500' }}>
                {data.pendingReviewCount} pending review
              </span>
            )}
            {data.sessionNeedsBlocksCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: 'rgba(10,132,255,0.12)', color: '#0A84FF' }}>
                {data.sessionNeedsBlocksCount} need blocks
              </span>
            )}
            {data.totalCount === 0 && (
              <span className="text-[11px] text-status-green">All clear</span>
            )}
          </div>
        </div>
        <button
          onClick={onRefresh}
          title="Refresh"
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Items ── */}
      {data.items.length === 0 ? (
        <div className="rounded-xl px-3.5 py-4 text-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-[12px] text-text-muted">Nothing needs your attention right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map(item => {
            const explanation = explainReviewItem(item)
            const isExpanded = expandedId === item.id
            const markState = markStates[item.id] ?? 'idle'
            const markMsg = markMessages[item.id]
            const isActiveRouting = routing?.noteId === item.sourceId

            return (
              <div key={item.id}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                {/* Item header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-left px-3.5 py-3 hover:bg-surface-raised transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className={cn(
                          'text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded',
                          item.type === 'unlinked_voice_note'
                            ? 'bg-red-900/20 text-status-red'
                            : item.type === 'session_needs_blocks'
                              ? 'bg-blue-900/20 text-status-blue'
                              : 'bg-orange-900/20 text-status-orange',
                        )}>
                          {item.type === 'coach_note_pending_review' ? 'Pending Review'
                            : item.type === 'unlinked_voice_note' ? 'Needs Routing'
                            : 'Needs Blocks'}
                        </span>
                        {item.priority === 'high' && (
                          <span className="text-[9px] text-status-red font-semibold">High priority</span>
                        )}
                      </div>
                      <p className="text-[12px] font-semibold text-text-primary leading-snug truncate">
                        {item.title}
                      </p>
                      {item.previewText && !isExpanded && (
                        <p className="text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-1">
                          {item.previewText}
                        </p>
                      )}
                    </div>
                    <ArrowRight className={cn(
                      'w-3 h-3 shrink-0 text-text-muted transition-transform mt-1',
                      isExpanded && 'rotate-90',
                    )} />
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>

                    {/* Explanation */}
                    <div className="pt-2.5">
                      <p className="text-[11px] font-semibold text-text-primary mb-0.5">
                        {explanation.headline}
                      </p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {explanation.detail}
                      </p>
                      {explanation.safeMissingData && (
                        <p className="text-[10px] text-text-muted mt-1 leading-snug">
                          Note: {explanation.safeMissingData}
                        </p>
                      )}
                    </div>

                    {/* Preview text */}
                    {item.previewText && (
                      <div className="rounded-lg px-2.5 py-2"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">
                          Preview
                        </p>
                        <p className="text-[11px] text-text-secondary leading-relaxed italic">
                          &ldquo;{item.previewText}{item.previewText.length >= 120 ? '…' : ''}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* mark_reviewed result */}
                    {markState === 'done' && (
                      <div className="flex items-center gap-1.5 text-status-green">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[11px]">{markMsg}</p>
                      </div>
                    )}
                    {markState === 'error' && (
                      <div className="flex items-center gap-1.5 text-status-red">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[11px]">{markMsg}</p>
                      </div>
                    )}

                    {/* Routing result */}
                    {isActiveRouting && routing.phase === 'done' && (
                      <div className="flex items-center gap-1.5 text-status-green">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[11px]">{routing.message}</p>
                      </div>
                    )}
                    {isActiveRouting && routing.phase === 'error' && (
                      <div className="flex items-center gap-1.5 text-status-red">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[11px]">{routing.message}</p>
                      </div>
                    )}

                    {/* Routing flow — searching phase */}
                    {isActiveRouting && routing.phase === 'searching' && (
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                          Search for {routing.routeType}
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={routing.routeType === 'player' ? 'Player name…' : 'Session name or date…'}
                            className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                            value={routing.query}
                            onChange={e => setRouting(prev => prev ? { ...prev, query: e.target.value } : null)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRoutingSearch(routing.query) }}
                          />
                          <button
                            onClick={() => handleRoutingSearch(routing.query)}
                            disabled={!routing.query.trim() || routing.isLoadingResolution}
                            className="btn-lime text-xs px-2.5 py-1.5 disabled:opacity-50"
                          >
                            {routing.isLoadingResolution ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
                          </button>
                        </div>
                        {routing.resolutionResult && !routing.isLoadingResolution && (
                          <DonnaObjectResolverPanel
                            result={routing.resolutionResult}
                            isLoading={false}
                            onSelect={handleSelectCandidate}
                            onCancel={handleCancelResolution}
                          />
                        )}
                        <button
                          onClick={handleCancelRouting}
                          className="text-[10px] text-text-muted underline underline-offset-2 hover:text-text-secondary"
                        >
                          Cancel routing
                        </button>
                      </div>
                    )}

                    {/* Routing flow — confirming phase */}
                    {isActiveRouting && routing.phase === 'confirming' && routing.selectedCandidate && (
                      <div className="space-y-2.5">
                        <div className="rounded-lg px-2.5 py-2"
                          style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.18)' }}>
                          <p className="text-[10px] uppercase tracking-widest text-lime font-semibold mb-0.5">
                            Confirm route
                          </p>
                          <p className="text-[12px] text-text-primary font-semibold">
                            {routing.selectedCandidate.label}
                          </p>
                          <p className="text-[10px] text-text-muted mt-0.5 leading-snug">
                            This links an internal record only. The note will not be published or sent to anyone.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleConfirmRoute}
                            className="btn-lime text-xs px-3 py-1.5"
                          >
                            Confirm Route
                          </button>
                          <button
                            onClick={handleCancelRouting}
                            className="btn-ghost text-xs px-2.5 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Routing flow — saving phase */}
                    {isActiveRouting && routing.phase === 'saving' && (
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-[11px]">Routing…</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    {markState !== 'done' && !(isActiveRouting && (routing.phase === 'done' || routing.phase === 'saving')) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.allowedActions.map(action => {
                          if (action === 'mark_reviewed') {
                            return (
                              <button
                                key={action}
                                onClick={() => handleMarkReviewed(item)}
                                disabled={markState === 'saving'}
                                className="btn-ghost text-xs px-2.5 py-1.5 disabled:opacity-50"
                              >
                                {markState === 'saving' ? (
                                  <span className="flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Saving…
                                  </span>
                                ) : ACTION_LABELS[action]}
                              </button>
                            )
                          }
                          if (action === 'route_to_player') {
                            return (
                              <button
                                key={action}
                                onClick={() => handleStartRouting(item, 'player')}
                                disabled={isActiveRouting && routing.phase !== 'done' && routing.phase !== 'error'}
                                className="btn-ghost text-xs px-2.5 py-1.5 disabled:opacity-50"
                              >
                                {ACTION_LABELS[action]}
                              </button>
                            )
                          }
                          if (action === 'route_to_session') {
                            return (
                              <button
                                key={action}
                                onClick={() => handleStartRouting(item, 'session')}
                                disabled={isActiveRouting && routing.phase !== 'done' && routing.phase !== 'error'}
                                className="btn-ghost text-xs px-2.5 py-1.5 disabled:opacity-50"
                              >
                                {ACTION_LABELS[action]}
                              </button>
                            )
                          }
                          if (action === 'start_populate_blocks') {
                            return (
                              <button
                                key={action}
                                onClick={() => handleStartPopulateBlocks(item)}
                                className="btn-lime text-xs px-2.5 py-1.5"
                              >
                                {ACTION_LABELS[action]}
                              </button>
                            )
                          }
                          return null
                        })}
                      </div>
                    )}

                    {/* What Donna will not do */}
                    <p className="text-[10px] text-text-muted leading-snug pt-1"
                      style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      {explanation.whatDonnaWillNotDo}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="space-y-2 pt-1">
        <Link
          href="/director/review"
          onClick={onClose}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-all"
          style={{ border: '1px solid var(--border-subtle)' }}
        >
          Open full Review Queue
          <ArrowRight className="w-3 h-3 shrink-0" />
        </Link>
        <p className="text-[9px] text-text-muted text-center leading-snug px-1">
          Internal review only · Nothing is sent to parents or players · No level or curriculum changes
        </p>
        <p className="text-[9px] text-text-muted text-center">
          Fetched {new Date(data.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
