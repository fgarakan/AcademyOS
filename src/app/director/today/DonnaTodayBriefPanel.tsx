// Sprint 922 — DONNA Director Brief 10/10 V1
// Priority-ordered daily brief for /director/today.
// Uses data already loaded on the page — no additional DB calls.
// No mutations, no approvals, no raw IDs.

import Link from 'next/link'
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import type { CommandBriefLiveResult } from '@/lib/donna/commandBriefLiveLoader'
import type { PlayerAttentionRiskResult } from '@/lib/donna/playerAttentionRiskLoader'

interface BriefItem {
  id: string
  label: string
  why: string
  urgency: 'high' | 'medium' | 'low'
  href: string
  actionLabel: string
}

function buildBriefItems(
  brief: CommandBriefLiveResult,
  risk: PlayerAttentionRiskResult,
): BriefItem[] {
  const items: BriefItem[] = []
  const d = brief.data

  const highRiskPlayers = risk.players.filter(p => p.riskLevel === 'high').length
  if (highRiskPlayers > 0) {
    items.push({
      id: 'high_risk_players',
      label: `${highRiskPlayers} player${highRiskPlayers !== 1 ? 's' : ''} flagged as high risk`,
      why: 'High-risk players may need a coach note, observation, or priority draft before the next session.',
      urgency: 'high',
      href: '/director/players',
      actionLabel: 'View Players',
    })
  }

  const highUrgencyFlags = d.attentionFlags.filter(f => f.urgency === 'high').length
  if (highUrgencyFlags > 0) {
    items.push({
      id: 'high_urgency_flags',
      label: `${highUrgencyFlags} high-urgency attention flag${highUrgencyFlags !== 1 ? 's' : ''}`,
      why: 'Concern observations from coaches are waiting for your review. Acting on these ensures player needs are addressed.',
      urgency: 'high',
      href: '/director/review',
      actionLabel: 'Review Queue',
    })
  }

  if (d.itemsPendingDirectorReview > 0) {
    items.push({
      id: 'pending_review',
      label: `${d.itemsPendingDirectorReview} item${d.itemsPendingDirectorReview !== 1 ? 's' : ''} pending your review`,
      why: 'Wrap-ups, observations, and curriculum drafts wait until you review them. Clearing the queue keeps your academy data current.',
      urgency: d.itemsPendingDirectorReview >= 5 ? 'high' : 'medium',
      href: '/director/review',
      actionLabel: 'Open Review Queue',
    })
  }

  if (d.wrapUpsOutstanding > 0) {
    const total = d.sessions.length
    items.push({
      id: 'missing_wrap_ups',
      label: `${d.wrapUpsOutstanding} of ${total} session${total !== 1 ? 's' : ''} missing wrap-ups`,
      why: 'Wrap-ups capture what happened on court. Without them, player observations and attendance are unrecorded.',
      urgency: d.wrapUpsOutstanding / Math.max(total, 1) > 0.5 ? 'medium' : 'low',
      href: '/director/sessions',
      actionLabel: 'View Sessions',
    })
  }

  const medRiskPlayers = risk.players.filter(p => p.riskLevel === 'medium').length
  if (medRiskPlayers > 0 && items.length < 3) {
    items.push({
      id: 'medium_risk_players',
      label: `${medRiskPlayers} player${medRiskPlayers !== 1 ? 's' : ''} showing medium-risk signals`,
      why: 'These players have some signals worth watching — not urgent yet, but worth checking before the week is over.',
      urgency: 'low',
      href: '/director/players',
      actionLabel: 'View Players',
    })
  }

  if (d.itemsApprovedAwaitingExecution > 0) {
    items.push({
      id: 'approved_awaiting',
      label: `${d.itemsApprovedAwaitingExecution} approved action${d.itemsApprovedAwaitingExecution !== 1 ? 's' : ''} ready to apply`,
      why: 'You have already approved these — applying them completes the action.',
      urgency: 'medium',
      href: '/director/review',
      actionLabel: 'Apply in Review Queue',
    })
  }

  const urgencyOrder = { high: 0, medium: 1, low: 2 }
  return items
    .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
    .slice(0, 4)
}

const URGENCY_STYLES = {
  high:   'bg-status-red/8 border-status-red/20 text-status-red',
  medium: 'bg-status-orange/8 border-status-orange/20 text-status-orange',
  low:    'bg-surface-raised border-border text-text-muted',
}

interface Props {
  brief: CommandBriefLiveResult
  risk: PlayerAttentionRiskResult
}

export function DonnaTodayBriefPanel({ brief, risk }: Props) {
  const items = buildBriefItems(brief, risk)

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-lime/5 border border-lime/15">
        <Sparkles className="w-4 h-4 text-lime shrink-0" />
        <div>
          <p className="text-xs font-semibold text-text-primary">All clear today</p>
          <p className="text-[11px] text-text-muted">No urgent items. DONNA will surface new signals as your academy generates activity.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-lime/12 bg-lime/3 px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-lime shrink-0" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">DONNA Priority Brief</p>
      </div>

      <ol className="space-y-2">
        {items.map((item, idx) => (
          <li key={item.id}>
            {idx === 0 && (
              <p className="text-[9px] uppercase tracking-widest font-bold text-lime/60 px-1 mb-1">
                Do this first
              </p>
            )}
            <div className={`px-3 py-2.5 rounded-xl border ${URGENCY_STYLES[item.urgency]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug">{item.label}</p>
                  <p className="text-[11px] opacity-80 leading-snug mt-0.5">{item.why}</p>
                </div>
                <Link
                  href={item.href}
                  className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold opacity-90 hover:opacity-100 transition-opacity mt-0.5 whitespace-nowrap"
                >
                  {item.actionLabel}
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-[10px] text-text-muted flex items-center gap-1.5 pt-1 border-t border-lime/10">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        DONNA surfaces priorities — you decide and approve.
      </p>
    </div>
  )
}
