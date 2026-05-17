'use client'

// Sprint 559 — Player Profile COO Context Integration V1
// Compact COO context panel for the player profile page.
// Shows attendance risk, parent update recency, observation status,
// readiness blockers, and next best action.

import { AlertCircle, CheckCircle2, Clock, BookOpen, ArrowRight } from 'lucide-react'
import {
  getAttendanceRiskLabel,
  getAttendanceRiskColor,
  getParentUpdateLabel,
  getReadinessBlockerLabel,
} from '@/lib/donna/playerCOOContext'
import { DONNAConfidenceDisclosure } from './DONNAConfidenceDisclosure'
import type { PlayerCOOContext } from '@/lib/donna/playerCOOContext'
import type { ConfidenceLevel } from './DONNAConfidenceDisclosure'

// ── Confidence mapping ────────────────────────────────────────────────────────

function toConfidenceLevel(c: 'high' | 'partial' | 'insufficient' | 'blocked'): ConfidenceLevel {
  if (c === 'blocked') return 'blocked_rls'
  return c
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PlayerCOOContextPanelProps {
  context: PlayerCOOContext
  onActionClick?: (route: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlayerCOOContextPanel({
  context,
  onActionClick,
}: PlayerCOOContextPanelProps) {
  const {
    attendanceRisk,
    parentUpdateRecency,
    recentObservations,
    readinessBlockers,
    nextBestAction,
  } = context

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-lime shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">DONNA COO Context</p>
      </div>

      {/* ── Rows ── */}
      <div className="px-3.5 py-1 divide-y divide-border/50">

        {/* Attendance */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-xs text-text-muted">Attendance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${getAttendanceRiskColor(attendanceRisk.level)}`}>
              {getAttendanceRiskLabel(attendanceRisk.level)}
            </span>
            {attendanceRisk.recentAbsences > 0 && (
              <span className="text-[10px] text-text-muted">
                {attendanceRisk.recentAbsences} absence{attendanceRisk.recentAbsences === 1 ? '' : 's'} / {attendanceRisk.absencePeriodDays}d
              </span>
            )}
            <DONNAConfidenceDisclosure
              level={toConfidenceLevel(attendanceRisk.confidence)}
              compact
            />
          </div>
        </div>

        {/* Parent updates */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-xs text-text-muted">Parent updates</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${
              parentUpdateRecency.status === 'recent' ? 'text-status-green'
              : parentUpdateRecency.status === 'overdue' ? 'text-status-orange'
              : 'text-text-muted'
            }`}>
              {getParentUpdateLabel(parentUpdateRecency.status)}
            </span>
            {parentUpdateRecency.daysSinceLastUpdate !== null && (
              <span className="text-[10px] text-text-muted">
                {parentUpdateRecency.daysSinceLastUpdate}d ago
              </span>
            )}
            <DONNAConfidenceDisclosure
              level={toConfidenceLevel(parentUpdateRecency.confidence)}
              compact
            />
          </div>
        </div>

        {/* Observations */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-xs text-text-muted">Observations</span>
          </div>
          <div className="flex items-center gap-2">
            {recentObservations.count === 0 ? (
              <span className="text-xs text-text-muted">None recorded</span>
            ) : (
              <>
                <span className="text-xs text-text-primary">{recentObservations.count} recent</span>
                {recentObservations.hasPositive && (
                  <CheckCircle2 className="w-3 h-3 text-status-green" />
                )}
                {recentObservations.hasConcern && (
                  <AlertCircle className="w-3 h-3 text-status-orange" />
                )}
              </>
            )}
            <DONNAConfidenceDisclosure
              level={toConfidenceLevel(recentObservations.confidence)}
              compact
            />
          </div>
        </div>

        {/* Readiness blockers */}
        {readinessBlockers.length > 0 && (
          <div className="py-2.5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
              Readiness blockers
            </p>
            <div className="flex flex-wrap gap-1.5">
              {readinessBlockers.map(b => (
                <span
                  key={b}
                  className="inline-flex items-center px-2 py-0.5 rounded-full border border-status-orange/20 bg-status-orange/5 text-[10px] text-status-orange"
                >
                  {getReadinessBlockerLabel(b)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Next best action ── */}
      {nextBestAction && (
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 border-t border-border bg-surface">
          <ArrowRight className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-lime mb-0.5">{nextBestAction.title}</p>
            <p className="text-[11px] text-text-muted leading-snug">{nextBestAction.reason}</p>
          </div>
          {nextBestAction.actionRoute && onActionClick && (
            <button
              onClick={() => onActionClick(nextBestAction.actionRoute!)}
              className="text-[10px] text-lime hover:text-lime/80 transition-colors whitespace-nowrap"
            >
              Go →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
