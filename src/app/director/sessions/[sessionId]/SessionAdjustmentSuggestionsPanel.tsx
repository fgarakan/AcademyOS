'use client'

import { useState, useTransition } from 'react'
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { createSessionAdjustmentSuggestionsAction } from './createSessionAdjustmentSuggestionsAction'
import { approveSuggestionAction, rejectSuggestionAction, dismissSuggestionAction } from './sessionAdjustmentReviewActions'
import { applyApprovedSessionAdjustmentAction } from './applyApprovedSessionAdjustmentAction'

export interface SuggestionRow {
  id: string
  suggestion_type: string
  suggested_change: string
  reason: string
  players_supported: string[]
  player_needs_considered: string[]
  risk_level: 'low' | 'medium' | 'high'
  confidence: 'low' | 'medium' | 'high'
  status: string
  target_session_block_id: string | null
  target_block_name: string | null
  target_block_current_notes: string | null
  curriculum_context: Record<string, string>
}

interface Props {
  sessionId: string
  initialSuggestions: SuggestionRow[]
  hasGroup: boolean
}

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  add_constraint: 'Add Constraint',
  simplify_drill: 'Simplify Drill',
  increase_challenge: 'Increase Challenge',
  adjust_scoring: 'Adjust Scoring',
  add_recovery_requirement: 'Recovery Break',
  add_target_zone: 'Add Target Zone',
  adjust_partner_grouping: 'Adjust Grouping',
  extend_block: 'Extend Block',
  shorten_block: 'Shorten Block',
  add_assessment_moment: 'Assessment Moment',
  add_watch_for_cue: 'Watch-For Cue',
  add_progression: 'Add Progression',
  add_regression: 'Add Regression',
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-status-green',
  medium: 'text-status-orange',
  high: 'text-status-red',
}

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-status-blue/10 text-status-blue border-status-blue/30',
  approved: 'bg-status-green/10 text-status-green border-status-green/30',
  rejected: 'bg-surface-raised text-text-muted border-border',
  dismissed: 'bg-surface-raised text-text-muted border-border',
  applied: 'bg-lime/10 text-lime border-lime/30',
}

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-surface-raised text-text-muted border-border'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider ${style}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function SuggestionCard({ row, onStatusChange }: { row: SuggestionRow; onStatusChange: (id: string, status: string, updatedAt?: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isDone = row.status === 'rejected' || row.status === 'dismissed' || row.status === 'applied'
  const typeLabel = SUGGESTION_TYPE_LABELS[row.suggestion_type] ?? row.suggestion_type.replace(/_/g, ' ')

  function act(action: () => Promise<{ ok: boolean; error?: string }>, nextStatus: string) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setError(result.error ?? 'Action failed.')
      } else {
        onStatusChange(row.id, nextStatus)
      }
    })
  }

  return (
    <div className={`rounded-xl border bg-surface-raised transition-opacity ${isDone ? 'opacity-50' : ''} ${
      row.status === 'approved' ? 'border-status-green/40' : 'border-border'
    }`}>
      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-medium uppercase tracking-widest text-lime">{typeLabel}</span>
              {row.target_block_name && (
                <span className="text-[10px] text-text-muted">→ {row.target_block_name}</span>
              )}
              <StatusPill status={row.status} />
            </div>
            <p className="text-sm text-text-primary leading-snug">{row.suggested_change}</p>
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors mt-0.5"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Reason */}
        <p className="text-xs text-text-secondary mt-2 leading-relaxed">{row.reason}</p>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            {/* Diff preview */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-2">What Would Change</p>
              <div className="rounded-lg overflow-hidden border border-border text-xs">
                <div className="px-3 py-2 bg-surface border-b border-border">
                  <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">
                    {row.target_block_name ? `Block: ${row.target_block_name} — current notes` : 'Session notes — current'}
                  </p>
                  <p className="text-text-muted italic">
                    {row.target_block_current_notes
                      ? row.target_block_current_notes.slice(0, 120) + (row.target_block_current_notes.length > 120 ? '…' : '')
                      : '(no existing notes)'}
                  </p>
                </div>
                <div className="px-3 py-2 bg-status-green/5 border-l-2 border-status-green">
                  <p className="text-[9px] uppercase tracking-widest text-status-green mb-1">After applying</p>
                  <p className="text-text-secondary">+ [Adaptive Adjustment] {row.suggested_change.slice(0, 120)}{row.suggested_change.length > 120 ? '…' : ''}</p>
                </div>
              </div>
            </div>

            {row.players_supported.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Players Supported</p>
                <p className="text-xs text-text-secondary">{row.players_supported.join(', ')}</p>
              </div>
            )}
            {row.player_needs_considered.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Needs Addressed</p>
                <p className="text-xs text-text-secondary">{row.player_needs_considered.join(', ')}</p>
              </div>
            )}
            <div className="flex gap-6">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Risk</p>
                <p className={`text-xs font-medium capitalize ${RISK_COLORS[row.risk_level]}`}>{row.risk_level}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Confidence</p>
                <p className="text-xs text-text-secondary capitalize">{row.confidence}</p>
              </div>
            </div>
            {row.curriculum_context.override && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">Academy Emphasis</p>
                <p className="text-xs text-text-secondary">{row.curriculum_context.override}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-status-red">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Actions — only show for active statuses */}
        {!isDone && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border flex-wrap">
            {row.status === 'pending_review' && (
              <button
                onClick={() => act(() => approveSuggestionAction(row.id), 'approved')}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-status-green/10 text-status-green border border-status-green/30 hover:bg-status-green/20 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
            )}
            {row.status === 'approved' && (
              <button
                onClick={() => act(() => applyApprovedSessionAdjustmentAction(row.id), 'applied')}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-lime text-base font-semibold hover:bg-lime/90 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apply to Session
              </button>
            )}
            {row.status === 'pending_review' && (
              <button
                onClick={() => act(() => rejectSuggestionAction(row.id), 'rejected')}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-status-red/10 text-status-red border border-status-red/30 hover:bg-status-red/20 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            )}
            <button
              onClick={() => act(() => dismissSuggestionAction(row.id), 'dismissed')}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg text-text-muted hover:text-text-secondary border border-transparent hover:border-border transition-colors disabled:opacity-50 ml-auto"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function SessionAdjustmentSuggestionsPanel({ sessionId, initialSuggestions, hasGroup }: Props) {
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>(initialSuggestions)
  const [isGenerating, startGenerateTransition] = useTransition()
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generateWarnings, setGenerateWarnings] = useState<string[]>([])
  const [lastGeneratedCount, setLastGeneratedCount] = useState<number | null>(null)

  function handleStatusChange(id: string, newStatus: string) {
    setSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, status: newStatus } : s)
    )
  }

  function handleGenerate() {
    setGenerateError(null)
    setGenerateWarnings([])
    setLastGeneratedCount(null)
    startGenerateTransition(async () => {
      const result = await createSessionAdjustmentSuggestionsAction(sessionId)
      if (!result.ok) {
        setGenerateError(result.error ?? 'Failed to generate suggestions.')
      } else {
        setLastGeneratedCount(result.created)
        setGenerateWarnings(result.warnings)
        // Reload page to get fresh suggestions
        window.location.reload()
      }
    })
  }

  const activeSuggestions = suggestions.filter(s => s.status !== 'dismissed' && s.status !== 'rejected')
  const pendingCount = suggestions.filter(s => s.status === 'pending_review').length
  const approvedCount = suggestions.filter(s => s.status === 'approved').length
  const appliedCount = suggestions.filter(s => s.status === 'applied').length

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 && (
            <span className="text-xs text-status-blue">
              {pendingCount} pending review
            </span>
          )}
          {approvedCount > 0 && (
            <span className="text-xs text-status-green">
              {approvedCount} approved
            </span>
          )}
          {appliedCount > 0 && (
            <span className="text-xs text-lime">
              {appliedCount} applied
            </span>
          )}
        </div>
        {hasGroup && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-lime text-base font-semibold hover:bg-lime/90 transition-colors disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'Generating…' : suggestions.length === 0 ? 'Generate Suggestions' : 'Regenerate'}
          </button>
        )}
      </div>

      {/* Inline messages */}
      {generateError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-status-red/10 border border-status-red/30 text-sm text-status-red">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {generateError}
        </div>
      )}
      {generateWarnings.length > 0 && (
        <div className="px-4 py-3 rounded-lg bg-status-orange/10 border border-status-orange/30 space-y-1">
          {generateWarnings.map((w, i) => (
            <p key={i} className="text-xs text-status-orange">{w}</p>
          ))}
        </div>
      )}
      {lastGeneratedCount === 0 && !generateError && (
        <p className="text-sm text-text-muted">No suggestions generated — class data may not have enough active focus areas.</p>
      )}

      {/* Empty state */}
      {!hasGroup && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-text-muted">Assign a group to this session to generate adaptive suggestions.</p>
          </CardContent>
        </Card>
      )}

      {hasGroup && suggestions.length === 0 && !isGenerating && !generateError && (
        <Card>
          <CardContent className="py-8 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-text-muted mx-auto" />
            <p className="text-sm text-text-primary font-medium">No suggestions yet</p>
            <p className="text-xs text-text-muted">Click "Generate Suggestions" to analyse this class roster and get coaching recommendations.</p>
          </CardContent>
        </Card>
      )}

      {/* Suggestion cards */}
      {activeSuggestions.length > 0 && (
        <div className="space-y-3">
          {activeSuggestions.map(row => (
            <SuggestionCard key={row.id} row={row} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      {/* Dismissed/rejected count */}
      {suggestions.length > activeSuggestions.length && (
        <p className="text-xs text-text-muted text-center">
          {suggestions.length - activeSuggestions.length} suggestion{suggestions.length - activeSuggestions.length > 1 ? 's' : ''} dismissed or rejected
        </p>
      )}

      <p className="text-[10px] text-text-muted pt-2 border-t border-border">
        Suggestions are deterministic — based on real player data. No AI. Not visible to players or parents.
      </p>
    </div>
  )
}
