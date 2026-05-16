'use client'

// Sprint 495 — DONNA Daily Command Brief Integration V1
// COO-focused command brief that surfaces wrap-up and review queue data.
// Props-only, no DB calls. DONNA voice prompt always shown.

import { AlertCircle, CheckCircle, Clock, Users, Layers, Eye } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CommandBriefSessionSummary {
  sessionId: string
  groupName: string
  coachName: string | null
  wrapUpSubmitted: boolean
  wrapUpPendingItems: number
}

export interface CommandBriefAttentionFlag {
  type: 'player_support' | 'parent_update' | 'director_follow_up' | 'attendance_exception' | 'observation'
  playerName: string | null
  summary: string
  urgency: 'low' | 'medium' | 'high'
}

export interface DonnaCommandBriefData {
  date: string
  totalSessionsToday: number
  totalPlayersAttending: number
  wrapUpsSubmitted: number
  wrapUpsOutstanding: number
  itemsPendingDirectorReview: number
  itemsApprovedAwaitingExecution: number
  attentionFlags: CommandBriefAttentionFlag[]
  sessions: CommandBriefSessionSummary[]
  donnaPrompt: string
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({
  value,
  label,
  icon,
  highlight,
}: {
  value: number | string
  label: string
  icon: React.ReactNode
  highlight?: 'lime' | 'orange' | 'green' | 'muted'
}) {
  const valueClass =
    highlight === 'lime' ? 'text-lime'
    : highlight === 'orange' ? 'text-status-orange'
    : highlight === 'green' ? 'text-status-green'
    : 'text-text-primary'

  return (
    <div className="flex-1 flex flex-col items-center gap-1 py-3 bg-surface-raised border border-border rounded-xl">
      <div className="text-text-muted">{icon}</div>
      <span className={`text-xl font-mono font-bold ${valueClass}`}>{value}</span>
      <span className="text-[10px] text-text-muted text-center leading-tight px-1">{label}</span>
    </div>
  )
}

// ── Attention flag row ────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  high: 'text-status-red border-status-red/30 bg-status-red/5',
  medium: 'text-status-orange border-status-orange/30 bg-status-orange/5',
  low: 'text-text-muted border-border bg-surface-raised',
} as const

const FLAG_TYPE_LABELS: Record<CommandBriefAttentionFlag['type'], string> = {
  player_support: 'Player support',
  parent_update: 'Parent update',
  director_follow_up: 'Director follow-up',
  attendance_exception: 'Attendance exception',
  observation: 'Observation',
}

function AttentionFlagRow({ flag }: { flag: CommandBriefAttentionFlag }) {
  return (
    <div className={`flex items-start justify-between gap-2 px-3 py-2 rounded-xl border text-[12px] ${URGENCY_CONFIG[flag.urgency]}`}>
      <div className="flex-1 min-w-0">
        <span className="font-medium">{FLAG_TYPE_LABELS[flag.type]}</span>
        {flag.playerName && <span className="text-text-muted"> · {flag.playerName}</span>}
        <p className="text-text-muted mt-0.5 truncate">{flag.summary}</p>
      </div>
      <span className={`text-[10px] capitalize shrink-0 mt-0.5`}>{flag.urgency}</span>
    </div>
  )
}

// ── Session status row ────────────────────────────────────────────────────────

function SessionStatusRow({ session }: { session: CommandBriefSessionSummary }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-surface-raised border border-border rounded-xl text-[12px]">
      <div className="flex-1 min-w-0">
        <span className="text-text-primary font-medium">{session.groupName}</span>
        {session.coachName && (
          <span className="text-text-muted"> · {session.coachName}</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {session.wrapUpPendingItems > 0 && (
          <span className="text-[10px] text-status-orange">
            {session.wrapUpPendingItems} pending
          </span>
        )}
        {session.wrapUpSubmitted ? (
          <span className="flex items-center gap-0.5 text-[10px] text-status-green">
            <CheckCircle size={10} />
            Wrap-up done
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
            <Clock size={10} />
            No wrap-up
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface DonnaCommandBriefIntegrationProps {
  data: DonnaCommandBriefData
  onOpenReviewQueue?: () => void
  onDismiss?: () => void
  className?: string
}

export function DonnaCommandBriefIntegration({
  data,
  onOpenReviewQueue,
  onDismiss,
  className,
}: DonnaCommandBriefIntegrationProps) {
  const highFlags = data.attentionFlags.filter(f => f.urgency === 'high')
  const otherFlags = data.attentionFlags.filter(f => f.urgency !== 'high')
  const hasFlags = data.attentionFlags.length > 0

  return (
    <div className={`bg-surface border border-lime/20 rounded-2xl overflow-hidden ${className}`}>
      {/* DONNA header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-raised">
        <div className="w-8 h-8 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
          <span className="text-lime text-xs font-bold">D</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-text-muted uppercase tracking-widest">DONNA · Command Brief</p>
          <p className="text-sm font-medium text-text-primary leading-snug">{data.donnaPrompt}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-text-muted hover:text-text-secondary transition-colors text-[11px]"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Date */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[11px] text-text-muted">{data.date}</p>
      </div>

      {/* Stat grid */}
      <div className="flex items-stretch gap-2 px-4 py-3">
        <StatTile
          value={data.totalSessionsToday}
          label="Sessions today"
          icon={<Layers size={14} />}
          highlight="muted"
        />
        <StatTile
          value={data.totalPlayersAttending}
          label="Players on court"
          icon={<Users size={14} />}
          highlight="muted"
        />
        <StatTile
          value={data.itemsPendingDirectorReview}
          label="Pending review"
          icon={<AlertCircle size={14} />}
          highlight={data.itemsPendingDirectorReview > 0 ? 'orange' : 'muted'}
        />
        <StatTile
          value={data.itemsApprovedAwaitingExecution}
          label="Awaiting execution"
          icon={<CheckCircle size={14} />}
          highlight={data.itemsApprovedAwaitingExecution > 0 ? 'green' : 'muted'}
        />
      </div>

      {/* Wrap-up status */}
      {data.wrapUpsOutstanding > 0 && (
        <div className="mx-4 mb-3 flex items-center gap-2 bg-status-orange/5 border border-status-orange/20 rounded-xl px-3 py-2">
          <Clock size={12} className="text-status-orange shrink-0" />
          <p className="text-[11px] text-status-orange">
            {data.wrapUpsOutstanding} session{data.wrapUpsOutstanding > 1 ? 's' : ''} without a coach wrap-up today.
          </p>
        </div>
      )}

      {/* Attention flags */}
      {hasFlags && (
        <div className="px-4 pb-3 space-y-1.5">
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Needs attention</p>
          {[...highFlags, ...otherFlags].map((flag, i) => (
            <AttentionFlagRow key={i} flag={flag} />
          ))}
        </div>
      )}

      {/* Today's sessions */}
      {data.sessions.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Today's sessions</p>
          {data.sessions.map(session => (
            <SessionStatusRow key={session.sessionId} session={session} />
          ))}
        </div>
      )}

      {/* Footer CTA */}
      {onOpenReviewQueue && data.itemsPendingDirectorReview > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={onOpenReviewQueue}
            className="w-full flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-xl bg-lime text-black font-medium hover:bg-lime/90 transition-colors"
          >
            <Eye size={14} />
            Review {data.itemsPendingDirectorReview} pending item{data.itemsPendingDirectorReview > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* No action needed note */}
      {data.itemsPendingDirectorReview === 0 && data.attentionFlags.length === 0 && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[11px] text-status-green flex items-center gap-1.5">
            <CheckCircle size={11} />
            No items need your attention right now.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Default DONNA prompts ─────────────────────────────────────────────────────

export function buildDonnaCommandBriefPrompt(data: Pick<DonnaCommandBriefData, 'itemsPendingDirectorReview' | 'attentionFlags' | 'wrapUpsOutstanding'>): string {
  if (data.attentionFlags.filter(f => f.urgency === 'high').length > 0) {
    return "There are high-priority items that need your attention today."
  }
  if (data.itemsPendingDirectorReview > 0) {
    return `You have ${data.itemsPendingDirectorReview} item${data.itemsPendingDirectorReview > 1 ? 's' : ''} pending review.`
  }
  if (data.wrapUpsOutstanding > 0) {
    return "Some coaches haven't submitted their wrap-ups yet."
  }
  return "Here's what's happening today."
}
