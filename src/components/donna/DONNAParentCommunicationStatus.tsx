'use client'

// Sprint 619 — DONNA Parent Communication Status V1
// Shows the state of parent communications across players.
// SEND IS ALWAYS BLOCKED — drafts only until director approves.
// Display only — no DB writes, no sends.

import { MessageSquare, Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import type { ParentDraftInternalState } from '@/lib/donna/parentDraftApprovalState'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParentCommunicationItem {
  playerId: string
  playerName: string
  parentName: string | null
  draftState: ParentDraftInternalState
  draftSummary: string | null
  daysSinceLastContact: number | null
  isHighPriority: boolean
}

// ── State config ──────────────────────────────────────────────────────────────

const STATE_CONFIG: Partial<Record<ParentDraftInternalState, {
  label: string; icon: React.ReactNode; colorClass: string
}>> = {
  draft: { label: 'Draft ready', icon: <MessageSquare className="w-3.5 h-3.5" />, colorClass: 'text-status-blue' },
  under_review: { label: 'Pending review', icon: <Clock className="w-3.5 h-3.5" />, colorClass: 'text-status-orange' },
  approved_internal: { label: 'Approved internally', icon: <CheckCircle2 className="w-3.5 h-3.5" />, colorClass: 'text-lime' },
  approved_for_send: { label: 'Ready to send', icon: <CheckCircle2 className="w-3.5 h-3.5" />, colorClass: 'text-lime' },
  send_blocked: { label: 'Send blocked', icon: <Shield className="w-3.5 h-3.5" />, colorClass: 'text-status-red' },
  rejected: { label: 'Rejected', icon: <AlertTriangle className="w-3.5 h-3.5" />, colorClass: 'text-status-red' },
  archived: { label: 'Archived', icon: <Clock className="w-3.5 h-3.5" />, colorClass: 'text-text-muted' },
}

// ── Row ───────────────────────────────────────────────────────────────────────

function ParentCommunicationRow({ item }: { item: ParentCommunicationItem }) {
  const cfg = STATE_CONFIG[item.draftState] ?? {
    label: item.draftState,
    icon: <Clock className="w-3.5 h-3.5" />,
    colorClass: 'text-text-muted',
  }

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className={`shrink-0 mt-0.5 ${cfg.colorClass}`}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs text-text-primary font-medium">{item.playerName}</p>
          {item.parentName && (
            <p className="text-[10px] text-text-muted">({item.parentName})</p>
          )}
          {item.isHighPriority && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-status-orange/10 text-status-orange border border-status-orange/20">
              Priority
            </span>
          )}
        </div>
        {item.draftSummary && (
          <p className="text-[10px] text-text-muted leading-snug mt-0.5">{item.draftSummary}</p>
        )}
        {item.daysSinceLastContact !== null && item.daysSinceLastContact > 0 && (
          <p className="text-[10px] text-text-muted">{item.daysSinceLastContact} days since last contact</p>
        )}
      </div>
      <span className={`text-[10px] font-medium shrink-0 ${cfg.colorClass}`}>{cfg.label}</span>
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export interface DONNAParentCommunicationStatusProps {
  items: ParentCommunicationItem[]
  className?: string
}

export function DONNAParentCommunicationStatus({
  items,
  className = '',
}: DONNAParentCommunicationStatusProps) {
  const pendingCount = items.filter(i =>
    i.draftState === 'under_review' || i.draftState === 'draft',
  ).length
  const noContactCount = items.filter(i =>
    (i.daysSinceLastContact ?? 0) > 14,
  ).length

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">Parent communication</p>
        </div>
        {pendingCount > 0 && (
          <span className="text-[10px] text-status-orange font-medium">{pendingCount} pending</span>
        )}
      </div>

      {/* Send blocked notice */}
      <div className="flex items-start gap-2 mx-4 mt-2.5 mb-1 px-3 py-2 bg-surface-raised border border-border rounded-lg">
        <Shield className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-snug">
          Parent messages are <span className="font-medium">never sent automatically</span>.
          Director approval required before any message can be sent.
        </p>
      </div>

      {/* Items */}
      {items.length > 0 ? (
        <div className="px-4 py-1">
          {items.map(item => <ParentCommunicationRow key={item.playerId} item={item} />)}
        </div>
      ) : (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-text-muted">No parent communication items.</p>
        </div>
      )}

      {/* Overdue contact note */}
      {noContactCount > 0 && (
        <div className="flex items-start gap-2 px-4 py-2.5 border-t border-status-orange/20 bg-status-orange/5">
          <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-orange leading-snug">
            {noContactCount} parent{noContactCount > 1 ? 's' : ''} not contacted in 14+ days.
          </p>
        </div>
      )}
    </div>
  )
}
