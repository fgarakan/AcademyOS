'use client'

// Sprint 616 — DONNA Session Debrief Surface V1
// Post-session debrief card — shows what DONNA surfaced from a wrap-up.
// Display only — no DB writes, no mutations.

import { BookOpen, Users, AlertCircle, TrendingUp, MessageSquare } from 'lucide-react'
import { DONNA_PUBLIC_NAME } from '@/components/assistant/donnaAssistantCopy'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SessionDebriefSignalType =
  | 'attendance'
  | 'intensity'
  | 'player_observation'
  | 'level_readiness'
  | 'parent_flag'

export interface SessionDebriefSignal {
  type: SessionDebriefSignalType
  headline: string
  detail: string | null
  playerName: string | null
  requiresDirectorReview: boolean
}

export interface DONNASessionDebriefCardProps {
  sessionLabel: string
  date: string
  coachName: string | null
  attendedCount: number | null
  totalRosteredCount: number | null
  intensityLabel: string | null
  signals: SessionDebriefSignal[]
  hasWrapUp: boolean
  proposedActionCreated: boolean
}

// ── Signal type config ────────────────────────────────────────────────────────

const SIGNAL_CONFIG: Record<
  SessionDebriefSignalType,
  { icon: React.ReactNode; colorClass: string }
> = {
  attendance: { icon: <Users className="w-3.5 h-3.5" />, colorClass: 'text-status-blue' },
  intensity: { icon: <TrendingUp className="w-3.5 h-3.5" />, colorClass: 'text-lime' },
  player_observation: { icon: <BookOpen className="w-3.5 h-3.5" />, colorClass: 'text-text-secondary' },
  level_readiness: { icon: <TrendingUp className="w-3.5 h-3.5" />, colorClass: 'text-status-green' },
  parent_flag: { icon: <MessageSquare className="w-3.5 h-3.5" />, colorClass: 'text-status-orange' },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNASessionDebriefCard({
  sessionLabel,
  date,
  coachName,
  attendedCount,
  totalRosteredCount,
  intensityLabel,
  signals,
  hasWrapUp,
  proposedActionCreated,
}: DONNASessionDebriefCardProps) {
  const reviewSignals = signals.filter(s => s.requiresDirectorReview)

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between px-3.5 py-3 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-text-primary">{sessionLabel}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-text-muted">
            <span>{date}</span>
            {coachName && <><span>·</span><span>Coach: {coachName}</span></>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {proposedActionCreated && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20">
              In review queue
            </span>
          )}
          {!hasWrapUp && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/20">
              No wrap-up
            </span>
          )}
        </div>
      </div>

      {/* Attendance + intensity */}
      {(attendedCount !== null || intensityLabel) && (
        <div className="flex items-center gap-4 px-3.5 py-2.5 border-b border-border/50">
          {attendedCount !== null && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs text-text-primary font-medium">
                {attendedCount}{totalRosteredCount ? `/${totalRosteredCount}` : ''} attended
              </span>
            </div>
          )}
          {intensityLabel && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs text-text-primary font-medium">{intensityLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* Signals */}
      {signals.length > 0 && (
        <div className="px-3.5 py-2.5 border-b border-border/50 space-y-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">{DONNA_PUBLIC_NAME} signals</p>
          {signals.map((signal, i) => {
            const cfg = SIGNAL_CONFIG[signal.type]
            return (
              <div key={i} className="flex items-start gap-2">
                <span className={`shrink-0 mt-0.5 ${cfg.colorClass}`}>{cfg.icon}</span>
                <div>
                  <p className="text-[11px] text-text-primary leading-snug">{signal.headline}</p>
                  {signal.detail && (
                    <p className="text-[10px] text-text-muted leading-snug">{signal.detail}</p>
                  )}
                  {signal.playerName && (
                    <p className="text-[10px] text-text-muted">Player: {signal.playerName}</p>
                  )}
                  {signal.requiresDirectorReview && (
                    <span className="text-[9px] text-status-orange">→ Review queue</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No signals */}
      {signals.length === 0 && hasWrapUp && (
        <div className="px-3.5 py-3 border-b border-border/50">
          <p className="text-[11px] text-text-muted italic">No signals surfaced from this wrap-up.</p>
        </div>
      )}

      {/* Review needed */}
      {reviewSignals.length > 0 && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 bg-status-orange/5 border-t border-status-orange/20">
          <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-orange leading-snug">
            {reviewSignals.length} signal{reviewSignals.length > 1 ? 's' : ''} require director review.
          </p>
        </div>
      )}
    </div>
  )
}
