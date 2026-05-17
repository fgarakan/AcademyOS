'use client'

// Sprint 615 — DONNA Player Risk Surface V1
// Surfaces at-risk players from DONNA's COO context for director attention.
// Display only — no DB writes, no level changes, no sends.

import { AlertCircle, User, ArrowRight } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlayerRiskType =
  | 'attendance'
  | 'parent_engagement'
  | 'level_readiness'
  | 'coach_concern'

export interface PlayerRiskSignal {
  playerId: string
  playerName: string
  riskTypes: PlayerRiskType[]
  primaryRiskLabel: string
  riskNote: string | null
  lastSeenLabel: string | null
  profileHref?: string
  onViewProfile?: () => void
}

// ── Risk type config ──────────────────────────────────────────────────────────

const RISK_TYPE_LABELS: Record<PlayerRiskType, string> = {
  attendance: 'Attendance',
  parent_engagement: 'Parent',
  level_readiness: 'Readiness',
  coach_concern: 'Concern',
}

const RISK_TYPE_COLORS: Record<PlayerRiskType, string> = {
  attendance: 'text-status-red bg-status-red/10 border-status-red/20',
  parent_engagement: 'text-status-orange bg-status-orange/10 border-status-orange/20',
  level_readiness: 'text-status-blue bg-status-blue/10 border-status-blue/20',
  coach_concern: 'text-status-orange bg-status-orange/10 border-status-orange/20',
}

// ── Player row ────────────────────────────────────────────────────────────────

function PlayerRiskRow({ signal }: { signal: PlayerRiskSignal }) {
  const handleClick = () => {
    if (signal.onViewProfile) {
      signal.onViewProfile()
    } else if (signal.profileHref) {
      window.location.href = signal.profileHref
    }
  }

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
        <User className="w-3.5 h-3.5 text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-medium text-text-primary">{signal.playerName}</p>
          {signal.riskTypes.map(rt => (
            <span
              key={rt}
              className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${RISK_TYPE_COLORS[rt]}`}
            >
              {RISK_TYPE_LABELS[rt]}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-text-muted leading-snug">{signal.primaryRiskLabel}</p>
        {signal.riskNote && (
          <p className="text-[10px] text-text-muted leading-snug">{signal.riskNote}</p>
        )}
        {signal.lastSeenLabel && (
          <p className="text-[10px] text-text-muted mt-0.5">Last seen: {signal.lastSeenLabel}</p>
        )}
      </div>
      {(signal.onViewProfile || signal.profileHref) && (
        <button
          onClick={handleClick}
          className="flex items-center gap-0.5 text-[11px] text-lime hover:text-lime/80 transition-colors shrink-0 pt-0.5"
        >
          View
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export interface DONNAPlayerRiskSurfaceProps {
  signals: PlayerRiskSignal[]
  isLoading?: boolean
  className?: string
}

export function DONNAPlayerRiskSurface({
  signals,
  isLoading = false,
  className = '',
}: DONNAPlayerRiskSurfaceProps) {
  const criticalCount = signals.filter(s => s.riskTypes.includes('attendance')).length

  if (isLoading) {
    return (
      <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-text-primary">Players at risk</p>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-text-muted animate-pulse">Loading…</p>
        </div>
      </div>
    )
  }

  if (signals.length === 0) {
    return (
      <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary">Players at risk</p>
        </div>
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-text-muted">No players flagged at risk right now.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-status-red" />
          <p className="text-sm font-medium text-text-primary">Players at risk</p>
        </div>
        <span className="text-[10px] text-text-muted">{signals.length} flagged</span>
      </div>
      <div className="px-4 py-1">
        {signals.map(signal => (
          <PlayerRiskRow key={signal.playerId} signal={signal} />
        ))}
      </div>
      <div className="px-4 py-2 border-t border-border bg-surface-raised">
        <p className="text-[10px] text-text-muted">
          Surfaced by DONNA from attendance, observation, and parent engagement data.
          No action taken automatically — director decision required.
        </p>
      </div>
    </div>
  )
}
