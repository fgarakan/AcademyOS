'use client'

// Sprint 1024 — Director Dashboard One-Primary-Action Redesign V1
// Surfaces the single highest-priority action at the top of the director dashboard.
// Addresses the `primary_action_focus` critical finding from Sprint 1023 UX audit.
//
// Design principle: one lime CTA, one clear message, no competing actions.
// This component is wired to the director page in Sprint 1026 (Golden Path UX).

import Link from 'next/link'
import { ArrowRight, CheckCircle2, AlertCircle, Clock, Users } from 'lucide-react'
import type { AttentionQueue } from '@/lib/director/attentionQueue'

// ── Primary action types ──────────────────────────────────────────────────────

interface PrimaryAction {
  headline: string
  subtext: string
  ctaLabel: string
  ctaHref: string
  urgency: 'critical' | 'high' | 'normal'
  icon: React.ReactNode
}

// ── Priority resolver ─────────────────────────────────────────────────────────

function resolvePrimaryAction(
  pendingReviewCount: number,
  attentionQueue: AttentionQueue | null,
  pendingPlacementCount: number,
): PrimaryAction {
  // Priority 1: Critical attention items (time-sensitive)
  const criticalItem = attentionQueue?.items.find(i => i.priority === 'critical')
  if (criticalItem) {
    return {
      headline: criticalItem.label,
      subtext: criticalItem.description,
      ctaLabel: 'Handle now',
      ctaHref: criticalItem.href,
      urgency: 'critical',
      icon: <AlertCircle className="w-5 h-5" />,
    }
  }

  // Priority 2: Pending review items
  if (pendingReviewCount > 0) {
    return {
      headline: pendingReviewCount === 1
        ? '1 item needs your decision'
        : `${pendingReviewCount} items need your decision`,
      subtext: 'Review and approve pending changes in the Review Queue.',
      ctaLabel: pendingReviewCount === 1 ? 'Review 1 item' : `Review ${pendingReviewCount} items`,
      ctaHref: '/director/review',
      urgency: pendingReviewCount >= 5 ? 'high' : 'normal',
      icon: <Clock className="w-5 h-5" />,
    }
  }

  // Priority 3: Players needing placement
  if (pendingPlacementCount > 0) {
    return {
      headline: pendingPlacementCount === 1
        ? '1 player is waiting for placement'
        : `${pendingPlacementCount} players are waiting for placement`,
      subtext: 'Assign curriculum levels to get these players started.',
      ctaLabel: 'Place players',
      ctaHref: '/director/players',
      urgency: 'high',
      icon: <Users className="w-5 h-5" />,
    }
  }

  // Priority 4: High attention items
  const highItem = attentionQueue?.items.find(i => i.priority === 'high')
  if (highItem) {
    return {
      headline: highItem.label,
      subtext: highItem.description,
      ctaLabel: 'Review',
      ctaHref: highItem.href,
      urgency: 'high',
      icon: <AlertCircle className="w-5 h-5" />,
    }
  }

  // Default: everything is good
  return {
    headline: 'Academy is on track',
    subtext: 'No urgent actions required. Review recent activity or check the curriculum.',
    ctaLabel: 'View curriculum',
    ctaHref: '/director/curriculum',
    urgency: 'normal',
    icon: <CheckCircle2 className="w-5 h-5" />,
  }
}

// ── Urgency styles ────────────────────────────────────────────────────────────

const URGENCY_STYLES = {
  critical: {
    border: 'border-status-red/40',
    bg: 'bg-status-red/5',
    iconColor: 'text-status-red',
    headlineColor: 'text-text-primary',
    ctaStyle: 'bg-status-red text-white hover:bg-status-red/90',
  },
  high: {
    border: 'border-status-orange/30',
    bg: 'bg-status-orange/5',
    iconColor: 'text-status-orange',
    headlineColor: 'text-text-primary',
    ctaStyle: 'bg-lime text-[#0A0A0A] hover:bg-lime/90',
  },
  normal: {
    border: 'border-border',
    bg: 'bg-surface',
    iconColor: 'text-lime',
    headlineColor: 'text-text-primary',
    ctaStyle: 'bg-lime text-[#0A0A0A] hover:bg-lime/90',
  },
} as const

// ── Component ─────────────────────────────────────────────────────────────────

export interface DirectorPrimaryActionHeroProps {
  pendingReviewCount: number
  attentionQueue?: AttentionQueue | null
  pendingPlacementCount?: number
  firstName?: string | null
}

export function DirectorPrimaryActionHero({
  pendingReviewCount,
  attentionQueue = null,
  pendingPlacementCount = 0,
  firstName,
}: DirectorPrimaryActionHeroProps) {
  const action = resolvePrimaryAction(pendingReviewCount, attentionQueue, pendingPlacementCount)
  const styles = URGENCY_STYLES[action.urgency]

  const greeting = firstName
    ? `Good morning, ${firstName}.`
    : 'Director Dashboard.'

  return (
    <div
      className={`rounded-xl border ${styles.border} ${styles.bg} px-4 py-4 flex items-start gap-3.5`}
    >
      {/* Icon */}
      <div className={`mt-0.5 shrink-0 ${styles.iconColor}`}>
        {action.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-0.5">
          {greeting}
        </p>
        <p className={`text-base font-semibold leading-snug ${styles.headlineColor}`}>
          {action.headline}
        </p>
        <p className="text-sm text-text-secondary mt-0.5 leading-snug">
          {action.subtext}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={action.ctaHref}
        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${styles.ctaStyle}`}
      >
        {action.ctaLabel}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
