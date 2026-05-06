'use client'

import Link from 'next/link'
import { ChevronRight, ShieldCheck, X, Info } from 'lucide-react'
import { useState } from 'react'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface AssistantActionCardProps {
  /** What is being suggested — shown as the card title */
  suggestedAction: string
  /** Why this matters — shown below the title */
  why: string
  /** What will actually change when the action is taken (optional) */
  whatWillChange?: string
  /** Who can see what as a result of this action */
  visibility?: string
  /** How consequential this action is */
  riskLevel?: RiskLevel
  /** The primary CTA — always navigates to a review/action page */
  primaryAction: {
    label: string
    href: string
  }
  /** Optional safety note shown with a lock icon */
  safetyNote?: string
  /** Called when the card is dismissed */
  onDismiss?: () => void
}

const RISK_STYLES: Record<RiskLevel, { badge: string; label: string }> = {
  low:    { badge: 'bg-surface-raised text-text-muted border-border',             label: 'Low risk' },
  medium: { badge: 'bg-status-orange/10 border-status-orange/20 text-status-orange', label: 'Review required' },
  high:   { badge: 'bg-status-red/10 border-status-red/20 text-status-red',       label: 'Director action' },
}

export function AssistantActionCard({
  suggestedAction,
  why,
  whatWillChange,
  visibility,
  riskLevel = 'low',
  primaryAction,
  safetyNote,
  onDismiss,
}: AssistantActionCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const risk = RISK_STYLES[riskLevel]

  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/3 px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-widest text-lime/60 mb-0.5">Suggested action</p>
          <p className="text-sm font-semibold text-text-primary leading-snug">{suggestedAction}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${risk.badge}`}>
            {risk.label}
          </span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-text-muted hover:text-text-secondary transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Why */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">Why it matters</p>
        <p className="text-xs text-text-secondary">{why}</p>
      </div>

      {/* Expandable details */}
      {(whatWillChange || visibility) && (
        <div>
          <button
            type="button"
            onClick={() => setDetailOpen(o => !o)}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          >
            <Info className="w-3 h-3" />
            {detailOpen ? 'Hide details' : 'What changes?'}
          </button>
          {detailOpen && (
            <div className="mt-2 space-y-1.5 text-xs text-text-secondary pl-4">
              {whatWillChange && (
                <p><span className="text-text-muted font-medium">Changes: </span>{whatWillChange}</p>
              )}
              {visibility && (
                <p><span className="text-text-muted font-medium">Visible to: </span>{visibility}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Safety note */}
      {safetyNote && (
        <div className="flex items-start gap-1.5 text-[10px] text-text-muted">
          <ShieldCheck className="w-3 h-3 text-lime/60 shrink-0 mt-0.5" />
          <span>{safetyNote}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <Link
          href={primaryAction.href}
          className="flex items-center gap-1.5 text-xs font-semibold text-lime hover:opacity-80 transition-opacity"
        >
          {primaryAction.label}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
