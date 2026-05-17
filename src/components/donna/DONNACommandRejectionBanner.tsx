'use client'

// Sprint 596 — DONNA Command Rejection and Cancel Flow V1
// Shown when a DONNA command is cancelled, rejected, or blocked.
// Communicates clearly why no action was taken.
// No DB. No execution.

import { XCircle, Ban, X } from 'lucide-react'
import { DONNA_PUBLIC_NAME } from '@/components/assistant/donnaAssistantCopy'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RejectionReason =
  | 'user_cancelled'
  | 'director_rejected'
  | 'blocked_by_guardrail'
  | 'insufficient_permissions'
  | 'input_too_short'
  | 'classification_failed'
  | 'no_context'

export interface DONNACommandRejectionBannerProps {
  reason: RejectionReason
  detail?: string
  actionLabel?: string
  onRetry?: () => void
  onDismiss?: () => void
}

// ── Config ────────────────────────────────────────────────────────────────────

const REASON_CONFIG: Record<
  RejectionReason,
  { title: string; body: string; icon: React.ReactNode; colorClass: string; bgClass: string; borderClass: string }
> = {
  user_cancelled: {
    title: 'Cancelled',
    body: 'No action was taken. You can start a new request at any time.',
    icon: <X className="w-3.5 h-3.5" />,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface',
    borderClass: 'border-border',
  },
  director_rejected: {
    title: 'Rejected by director',
    body: 'The director reviewed and rejected this proposal. It will not be applied. You can create a new proposal if circumstances change.',
    icon: <XCircle className="w-3.5 h-3.5" />,
    colorClass: 'text-status-red',
    bgClass: 'bg-status-red/5',
    borderClass: 'border-status-red/20',
  },
  blocked_by_guardrail: {
    title: 'Blocked by safety guardrail',
    body: 'This action was blocked before it could be submitted. A safety rule prevents this operation.',
    icon: <Ban className="w-3.5 h-3.5" />,
    colorClass: 'text-status-orange',
    bgClass: 'bg-status-orange/5',
    borderClass: 'border-status-orange/20',
  },
  insufficient_permissions: {
    title: 'Insufficient permissions',
    body: 'Your role does not allow this action. Contact your academy director.',
    icon: <Ban className="w-3.5 h-3.5" />,
    colorClass: 'text-status-orange',
    bgClass: 'bg-status-orange/5',
    borderClass: 'border-status-orange/20',
  },
  input_too_short: {
    title: 'Input too short',
    body: `Please provide more detail so ${DONNA_PUBLIC_NAME} can understand what you need.`,
    icon: <XCircle className="w-3.5 h-3.5" />,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface',
    borderClass: 'border-border',
  },
  classification_failed: {
    title: 'Could not classify request',
    body: `${DONNA_PUBLIC_NAME} was unable to determine what you needed. Try rephrasing or select a category manually.`,
    icon: <XCircle className="w-3.5 h-3.5" />,
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface',
    borderClass: 'border-border',
  },
  no_context: {
    title: 'Missing context',
    body: 'DONNA needs more context to proceed — the session or player context may not be set.',
    icon: <XCircle className="w-3.5 h-3.5" />,
    colorClass: 'text-status-orange',
    bgClass: 'bg-status-orange/5',
    borderClass: 'border-status-orange/20',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNACommandRejectionBanner({
  reason,
  detail,
  actionLabel,
  onRetry,
  onDismiss,
}: DONNACommandRejectionBannerProps) {
  const cfg = REASON_CONFIG[reason]

  return (
    <div className={`rounded-xl border overflow-hidden ${cfg.borderClass} ${cfg.bgClass}`}>
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        <div className={`shrink-0 mt-0.5 ${cfg.colorClass}`}>{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${cfg.colorClass}`}>{cfg.title}</p>
          <p className="text-[11px] text-text-muted leading-snug mt-0.5">{detail ?? cfg.body}</p>
          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-3 mt-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-[11px] text-lime hover:text-lime/80 transition-colors font-medium"
                >
                  {actionLabel ?? 'Try again'}
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
