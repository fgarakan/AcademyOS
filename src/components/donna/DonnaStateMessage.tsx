'use client'

// Sprint 1010 — DONNA Empty/Error Safety States V1
// Inline state message component for DONNA panels.
// Different from DONNAEmptyStateSurface (Sprint 636) which is a full-surface empty state.
// DonnaStateMessage is compact and inline — used inside panels, cards, and sections.
// No DB writes. Display only.

import { AlertCircle, CheckCircle2, Clock, Database, Info, Lock, ShieldCheck, Sparkles, XCircle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DonnaStateKind =
  | 'no_data_yet'
  | 'backend_unavailable'
  | 'schema_missing'
  | 'no_pending_reviews'
  | 'no_sessions_today'
  | 'role_cannot_access'
  | 'draft_saved_locally'
  | 'requires_approval'
  | 'future_capability'
  | 'demo_fallback'
  | 'live_data'
  | 'stale_data'

export interface DonnaStateMessageProps {
  kind: DonnaStateKind
  message?: string
  detail?: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

// ── State configs ─────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<DonnaStateKind, {
  icon: React.ReactNode
  defaultMessage: string
  colorClass: string
  borderClass: string
  bgClass: string
}> = {
  no_data_yet: {
    icon: <Clock className="w-3.5 h-3.5" />,
    defaultMessage: 'No data yet — this will populate as coaches and players use the system.',
    colorClass: 'text-text-muted',
    borderClass: 'border-border',
    bgClass: 'bg-surface-raised',
  },
  backend_unavailable: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    defaultMessage: 'Backend unavailable — showing demo data.',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/20',
    bgClass: 'bg-status-orange/5',
  },
  schema_missing: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    defaultMessage: 'Schema migration pending — this feature will activate once the migration is applied.',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/20',
    bgClass: 'bg-status-orange/5',
  },
  no_pending_reviews: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    defaultMessage: 'All clear — nothing pending review.',
    colorClass: 'text-status-green',
    borderClass: 'border-status-green/20',
    bgClass: 'bg-status-green/5',
  },
  no_sessions_today: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    defaultMessage: 'No sessions scheduled for today.',
    colorClass: 'text-text-muted',
    borderClass: 'border-border',
    bgClass: 'bg-surface-raised',
  },
  role_cannot_access: {
    icon: <Lock className="w-3.5 h-3.5" />,
    defaultMessage: 'Your role does not have access to this section.',
    colorClass: 'text-text-muted',
    borderClass: 'border-border',
    bgClass: 'bg-surface-raised',
  },
  draft_saved_locally: {
    icon: <Database className="w-3.5 h-3.5" />,
    defaultMessage: 'Draft saved locally — will submit for review when you save.',
    colorClass: 'text-status-blue',
    borderClass: 'border-status-blue/20',
    bgClass: 'bg-status-blue/5',
  },
  requires_approval: {
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    defaultMessage: 'This requires director approval before it takes effect.',
    colorClass: 'text-lime',
    borderClass: 'border-lime/20',
    bgClass: 'bg-lime/5',
  },
  future_capability: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    defaultMessage: 'Coming in a future sprint — not yet available.',
    colorClass: 'text-text-muted',
    borderClass: 'border-border',
    bgClass: 'bg-surface-raised',
  },
  demo_fallback: {
    icon: <Info className="w-3.5 h-3.5" />,
    defaultMessage: 'Demo data — not from your live academy.',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/20',
    bgClass: 'bg-status-orange/5',
  },
  live_data: {
    icon: <Database className="w-3.5 h-3.5" />,
    defaultMessage: 'Live data from your academy.',
    colorClass: 'text-status-green',
    borderClass: 'border-status-green/20',
    bgClass: 'bg-status-green/5',
  },
  stale_data: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    defaultMessage: 'This data may be out of date. Refresh or re-check.',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/20',
    bgClass: 'bg-status-orange/5',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaStateMessage({
  kind,
  message,
  detail,
  actionLabel,
  actionHref,
  className = '',
}: DonnaStateMessageProps) {
  const config = STATE_CONFIG[kind]
  const displayMessage = message ?? config.defaultMessage

  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border ${config.borderClass} ${config.bgClass} ${className}`}>
      <span className={`shrink-0 mt-0.5 ${config.colorClass}`}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-relaxed ${config.colorClass}`}>{displayMessage}</p>
        {detail && (
          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{detail}</p>
        )}
        {actionLabel && actionHref && (
          <a href={actionHref} className="mt-1.5 inline-block text-[11px] text-lime hover:text-lime/80 transition-colors duration-100">
            {actionLabel} →
          </a>
        )}
      </div>
    </div>
  )
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export function DonnaDemoNotice({ className }: { className?: string }) {
  return <DonnaStateMessage kind="demo_fallback" className={className} />
}

export function DonnaApprovalRequired({ message, className }: { message?: string; className?: string }) {
  return <DonnaStateMessage kind="requires_approval" message={message} className={className} />
}

export function DonnaBackendUnavailable({ className }: { className?: string }) {
  return <DonnaStateMessage kind="backend_unavailable" className={className} />
}
