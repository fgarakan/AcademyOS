'use client'

// Sprint 580 — Parent Draft Send-Blocked Safe State V1
// Clearly shows that external parent send is unavailable.
// Used on review cards and parent draft approval screens.

import { Lock, CheckCircle2, Info } from 'lucide-react'
import {
  getParentDraftStateLabel,
  isParentPortalVisible,
  getSendBlockedReason,
} from '@/lib/donna/parentDraftApprovalState'
import type { ParentDraftInternalState } from '@/lib/donna/parentDraftApprovalState'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ParentDraftSendBlockedBannerProps {
  state: ParentDraftInternalState
  compact?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ParentDraftSendBlockedBanner({
  state,
  compact = false,
}: ParentDraftSendBlockedBannerProps) {
  const blockedReason = getSendBlockedReason(state)
  const portalVisible = isParentPortalVisible(state)
  const label = getParentDraftStateLabel(state)

  // Only show banner when relevant
  if (state === 'draft' || state === 'rejected' || state === 'archived') return null

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Lock className="w-3 h-3 text-text-muted shrink-0" />
        <span className="text-[10px] text-text-muted">External send not available</span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface px-3.5 py-3 flex flex-col gap-2.5">

      {/* Status row */}
      <div className="flex items-center gap-2">
        {portalVisible ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
        ) : (
          <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
        )}
        <span className="text-xs font-medium text-text-primary">{label}</span>
      </div>

      {/* Portal visibility */}
      {portalVisible && (
        <p className="text-[11px] text-text-muted leading-snug">
          This update is visible in the parent portal. Parents can see it if they log in.
        </p>
      )}

      {/* Send blocked */}
      {blockedReason && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-border/50 bg-surface-raised">
          <Lock className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-medium text-text-secondary mb-0.5">
              External send unavailable
            </p>
            <p className="text-[11px] text-text-muted leading-snug">
              {blockedReason}. No email, SMS, or push notification will be sent to the parent.
              When an external send integration is configured, this will be re-evaluated.
            </p>
          </div>
        </div>
      )}

      {/* Reassurance */}
      <p className="text-[10px] text-text-muted italic">
        No communication will be sent to parents without explicit future approval through a configured integration.
      </p>
    </div>
  )
}
