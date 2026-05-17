'use client'

// Sprint 601 — Academy Health Action Application Links V1
// Links from academy health items to the correct action surfaces.
// Navigation/display only — no DB writes, no mutations.

import { ArrowRight, ClipboardList, User, BookOpen, MessageSquare, TrendingUp } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type HealthActionType =
  | 'open_review_queue'
  | 'view_player_profile'
  | 'start_wrap_up'
  | 'view_curriculum'
  | 'draft_parent_update'
  | 'view_level_readiness'

export interface HealthActionLink {
  actionType: HealthActionType
  label: string
  description: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  disabledReason?: string
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const ACTION_ICONS: Record<HealthActionType, React.ReactNode> = {
  open_review_queue: <ClipboardList className="w-4 h-4" />,
  view_player_profile: <User className="w-4 h-4" />,
  start_wrap_up: <BookOpen className="w-4 h-4" />,
  view_curriculum: <BookOpen className="w-4 h-4" />,
  draft_parent_update: <MessageSquare className="w-4 h-4" />,
  view_level_readiness: <TrendingUp className="w-4 h-4" />,
}

// ── Link builders ─────────────────────────────────────────────────────────────

export function buildReviewQueueLink(onClick?: () => void): HealthActionLink {
  return {
    actionType: 'open_review_queue',
    label: 'Open review queue',
    description: 'See all items pending director approval.',
    href: '/director/review',
    onClick,
  }
}

export function buildPlayerProfileLink(
  playerId: string,
  playerName: string,
  onClick?: () => void,
): HealthActionLink {
  return {
    actionType: 'view_player_profile',
    label: `View ${playerName}`,
    description: 'Open player profile and history.',
    href: `/director/players/${playerId}`,
    onClick,
  }
}

export function buildWrapUpLink(
  sessionId: string,
  sessionLabel: string,
  onClick?: () => void,
): HealthActionLink {
  return {
    actionType: 'start_wrap_up',
    label: `Wrap up: ${sessionLabel}`,
    description: 'Start the coach wrap-up flow for this session.',
    href: `/coach/sessions/${sessionId}`,
    onClick,
  }
}

export function buildParentDraftLink(
  playerId: string,
  playerName: string,
  onClick?: () => void,
): HealthActionLink {
  return {
    actionType: 'draft_parent_update',
    label: `Draft update for ${playerName}'s parent`,
    description: 'Create a parent message draft (not sent until approved).',
    href: `/director/players/${playerId}`,
    onClick,
  }
}

export function buildLevelReadinessLink(
  playerId: string,
  playerName: string,
  onClick?: () => void,
): HealthActionLink {
  return {
    actionType: 'view_level_readiness',
    label: `${playerName} — readiness review`,
    description: 'Review level readiness evidence for this player.',
    href: `/director/players/${playerId}`,
    onClick,
  }
}

// ── Single link row ───────────────────────────────────────────────────────────

function HealthActionLinkRow({ link }: { link: HealthActionLink }) {
  const icon = ACTION_ICONS[link.actionType]

  const content = (
    <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-colors ${
      link.disabled
        ? 'border-border bg-surface opacity-50 cursor-not-allowed'
        : 'border-border bg-surface hover:border-lime/30 hover:bg-lime/5 cursor-pointer group'
    }`}>
      <div className="text-text-muted group-hover:text-lime transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-primary group-hover:text-lime transition-colors">
          {link.label}
        </p>
        {link.description && (
          <p className="text-[10px] text-text-muted leading-snug">{link.description}</p>
        )}
        {link.disabled && link.disabledReason && (
          <p className="text-[10px] text-status-orange leading-snug">{link.disabledReason}</p>
        )}
      </div>
      {!link.disabled && <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors shrink-0" />}
    </div>
  )

  if (link.disabled) return content

  if (link.href && !link.onClick) {
    return <a href={link.href} className="block">{content}</a>
  }

  return (
    <button
      onClick={link.onClick ?? (link.href ? () => { window.location.href = link.href! } : undefined)}
      className="block w-full text-left"
    >
      {content}
    </button>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export interface AcademyHealthActionLinksProps {
  links: HealthActionLink[]
  title?: string
  className?: string
}

export function AcademyHealthActionLinks({
  links,
  title = 'Actions',
  className = '',
}: AcademyHealthActionLinksProps) {
  if (links.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      {title && (
        <p className="text-[10px] text-text-muted uppercase tracking-wider">{title}</p>
      )}
      <div className="space-y-1.5">
        {links.map((link, i) => (
          <HealthActionLinkRow key={i} link={link} />
        ))}
      </div>
    </div>
  )
}
