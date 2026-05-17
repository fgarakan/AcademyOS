'use client'

// Sprint 636 — Pilot Empty State Polish V1
// Polished empty state cards for pilot surfaces where data may be missing.
// Makes empty states feel intentional rather than broken during the pilot.
// Display only — no DB writes.

import { ClipboardList, Users, Activity, MessageSquare, CheckCircle2, Terminal } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type EmptyStateSurface =
  | 'review_queue'
  | 'player_list'
  | 'academy_health'
  | 'wrap_up_coverage'
  | 'conversation_history'
  | 'donna_command'
  | 'parent_drafts'

export interface DONNAEmptyStateSurfaceProps {
  surface: EmptyStateSurface
  /** Override the default title */
  title?: string
  /** Override the default description */
  description?: string
  /** Optional call-to-action label */
  actionLabel?: string
  onAction?: () => void
  className?: string
}

// ── Surface config ────────────────────────────────────────────────────────────

interface EmptyConfig {
  icon: React.ElementType
  title: string
  description: string
  tone: 'positive' | 'neutral' | 'informational'
}

const EMPTY_CONFIG: Record<EmptyStateSurface, EmptyConfig> = {
  review_queue: {
    icon: ClipboardList,
    title: 'Queue is clear',
    description: "No items pending director review. DONNA will surface new items as coaches submit wrap-ups and voice commands.",
    tone: 'positive',
  },
  player_list: {
    icon: Users,
    title: 'No players yet',
    description: "Players will appear here once they are added to the academy roster and placed in a curriculum group.",
    tone: 'neutral',
  },
  academy_health: {
    icon: Activity,
    title: 'Health data loading',
    description: "Academy Health Score requires session data, wrap-ups, and attendance records from today's sessions.",
    tone: 'informational',
  },
  wrap_up_coverage: {
    icon: CheckCircle2,
    title: 'No sessions today',
    description: "Wrap-up coverage will show here once coaches complete sessions and DONNA receives their wrap-ups.",
    tone: 'neutral',
  },
  conversation_history: {
    icon: MessageSquare,
    title: 'Conversation not started',
    description: "DONNA's conversation history will appear here once a coach or director begins a session.",
    tone: 'neutral',
  },
  donna_command: {
    icon: Terminal,
    title: 'Ready for your first command',
    description: "Ask DONNA about attendance, player risk, review queue, or academy health. Voice or text — your choice.",
    tone: 'informational',
  },
  parent_drafts: {
    icon: MessageSquare,
    title: 'No parent drafts',
    description: "Parent update drafts will appear here once coaches flag items for parent communication during wrap-ups.",
    tone: 'neutral',
  },
}

const TONE_CLASSES: Record<EmptyConfig['tone'], { icon: string; title: string }> = {
  positive:      { icon: 'text-status-green', title: 'text-status-green' },
  neutral:       { icon: 'text-text-muted',   title: 'text-text-secondary' },
  informational: { icon: 'text-status-blue',  title: 'text-text-secondary' },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAEmptyStateSurface({
  surface,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: DONNAEmptyStateSurfaceProps) {
  const cfg = EMPTY_CONFIG[surface]
  const tone = TONE_CLASSES[cfg.tone]
  const Icon = cfg.icon
  const displayTitle = title ?? cfg.title
  const displayDescription = description ?? cfg.description

  return (
    <div className={`flex flex-col items-center justify-center px-6 py-8 rounded-xl border border-border bg-surface text-center ${className}`}>
      <div className={`w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center mb-3 ${tone.icon}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className={`text-sm font-medium mb-1 ${tone.title}`}>{displayTitle}</p>
      <p className="text-xs text-text-muted max-w-xs leading-relaxed">{displayDescription}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-xs font-medium text-lime hover:text-lime/80 transition-colors px-3 py-1.5 rounded-lg border border-lime/20 bg-lime/5 hover:bg-lime/10"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
