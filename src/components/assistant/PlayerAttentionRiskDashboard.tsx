'use client'

// Sprint 499 — Player Attention Risk Dashboard V1
// Read-only director panel showing players flagged as needing attention.
// Props-only data — no DB calls. DONNA voice framing at the top.

import { AlertCircle, Heart, MessageSquare, User, ChevronRight } from 'lucide-react'
import { getNextBestAction } from '@/lib/donna/kpiNextBestActionMap'
import type { KPISeverity } from '@/lib/donna/kpiNextBestActionMap'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttentionFlagType =
  | 'player_support'
  | 'coach_observation_concern'
  | 'repeated_absence'
  | 'no_progress_note'
  | 'parent_concern_pending'

export type AttentionRiskLevel = 'high' | 'medium' | 'low'

export interface PlayerAttentionRiskData {
  playerId: string | null
  playerName: string
  groupName: string | null
  riskLevel: AttentionRiskLevel
  primaryFlag: AttentionFlagType
  flagSummary: string
  sessionsWithFlag: number
  lastFlaggedDate: string
  pendingProposedActions: number
}

export interface PlayerAttentionRiskDashboardProps {
  players: PlayerAttentionRiskData[]
  overallSeverity: KPISeverity
  onViewPlayer?: (playerId: string | null, playerName: string) => void
  onOpenReviewQueue?: () => void
  className?: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<AttentionRiskLevel, {
  label: string
  dotClass: string
  rowClass: string
  textClass: string
}> = {
  high: {
    label: 'High',
    dotClass: 'bg-status-red',
    rowClass: 'border-status-red/30 bg-status-red/5',
    textClass: 'text-status-red',
  },
  medium: {
    label: 'Medium',
    dotClass: 'bg-status-orange',
    rowClass: 'border-status-orange/20 bg-status-orange/5',
    textClass: 'text-status-orange',
  },
  low: {
    label: 'Low',
    dotClass: 'bg-status-blue',
    rowClass: 'border-border bg-surface-raised',
    textClass: 'text-status-blue',
  },
}

const FLAG_TYPE_CONFIG: Record<AttentionFlagType, {
  label: string
  icon: React.ReactNode
}> = {
  player_support: { label: 'Support flagged', icon: <Heart size={11} /> },
  coach_observation_concern: { label: 'Coach concern', icon: <AlertCircle size={11} /> },
  repeated_absence: { label: 'Repeated absence', icon: <User size={11} /> },
  no_progress_note: { label: 'No progress note', icon: <MessageSquare size={11} /> },
  parent_concern_pending: { label: 'Parent concern', icon: <MessageSquare size={11} /> },
}

// ── Player row ────────────────────────────────────────────────────────────────

function PlayerRiskRow({
  player,
  onViewPlayer,
}: {
  player: PlayerAttentionRiskData
  onViewPlayer?: (playerId: string | null, playerName: string) => void
}) {
  const risk = RISK_CONFIG[player.riskLevel]
  const flag = FLAG_TYPE_CONFIG[player.primaryFlag]

  return (
    <button
      onClick={() => onViewPlayer?.(player.playerId, player.playerName)}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left ${risk.rowClass} ${
        onViewPlayer ? 'hover:border-lime/30 cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Risk indicator dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${risk.dotClass}`} />

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-medium text-text-primary">{player.playerName}</span>
          {player.groupName && (
            <span className="text-[10px] text-text-muted">· {player.groupName}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] mt-0.5">
          <span className={risk.textClass}>{flag.icon}</span>
          <span className="text-text-muted">{flag.label}</span>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted truncate">{player.flagSummary}</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {player.pendingProposedActions > 0 && (
          <span className="text-[10px] bg-status-orange/10 text-status-orange border border-status-orange/30 px-1.5 py-0.5 rounded-full">
            {player.pendingProposedActions} pending
          </span>
        )}
        <span className={`text-[10px] font-medium ${risk.textClass}`}>{risk.label}</span>
        {onViewPlayer && <ChevronRight size={12} className="text-text-muted" />}
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlayerAttentionRiskDashboard({
  players,
  overallSeverity,
  onViewPlayer,
  onOpenReviewQueue,
  className,
}: PlayerAttentionRiskDashboardProps) {
  const nba = getNextBestAction('player_attention_risk', overallSeverity)

  const highPlayers = players.filter(p => p.riskLevel === 'high')
  const mediumPlayers = players.filter(p => p.riskLevel === 'medium')
  const lowPlayers = players.filter(p => p.riskLevel === 'low')

  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden ${className}`}>
      {/* DONNA header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border bg-surface-raised">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-lime text-[10px] font-bold">D</span>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Player Attention Risk</p>
          <p className="text-sm text-text-primary leading-snug">
            {nba?.donnaSummary ?? 'Reviewing player attention status.'}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {players.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-text-muted">
            {overallSeverity === 'no_data'
              ? "No wrap-up data yet. Submit wrap-ups to surface attention risks."
              : "No players flagged for attention. All clear."}
          </p>
        </div>
      )}

      {/* Player lists */}
      {players.length > 0 && (
        <div className="px-4 py-3 space-y-3">
          {highPlayers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-status-red">High priority</p>
              {highPlayers.map((p, i) => (
                <PlayerRiskRow key={i} player={p} onViewPlayer={onViewPlayer} />
              ))}
            </div>
          )}

          {mediumPlayers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-status-orange">Medium priority</p>
              {mediumPlayers.map((p, i) => (
                <PlayerRiskRow key={i} player={p} onViewPlayer={onViewPlayer} />
              ))}
            </div>
          )}

          {lowPlayers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Low priority</p>
              {lowPlayers.map((p, i) => (
                <PlayerRiskRow key={i} player={p} onViewPlayer={onViewPlayer} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* DONNA next best action CTA */}
      {nba && nba.actionCta && onOpenReviewQueue && (
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={onOpenReviewQueue}
            className="w-full flex items-center justify-center gap-1.5 text-sm py-2 rounded-xl border border-lime/30 text-lime hover:bg-lime/5 transition-colors"
          >
            {nba.actionCta}
            <ChevronRight size={14} />
          </button>
          {nba.requiresDirectorApproval && (
            <p className="text-[10px] text-text-muted text-center mt-1">
              Director approval required before any action is taken.
            </p>
          )}
        </div>
      )}

      {/* Read-only note */}
      <div className="px-4 py-2 border-t border-border">
        <p className="text-[10px] text-text-muted italic">Read-only. Data from coach wrap-up submissions.</p>
      </div>
    </div>
  )
}
