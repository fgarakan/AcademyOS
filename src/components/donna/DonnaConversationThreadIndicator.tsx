'use client'

// Mega Sprint 2501–2530 — DONNA Conversational OS V2
// Thread indicator — shows the director what DONNA thinks is active in the current conversation.
// Low visual weight. Fable-compliant. No debug UI.

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConversationOperatingContext } from '@/lib/donna/conversation/donnaConversationOperatingContext'
import { isContextThreadActive } from '@/lib/donna/conversation/donnaConversationOperatingContext'

interface Props {
  ctx: ConversationOperatingContext | null
  onClear: () => void
}

export function DonnaConversationThreadIndicator({ ctx, onClear }: Props) {
  if (!ctx || !isContextThreadActive(ctx) || !ctx.currentEntityLabel) return null

  return (
    <div className="mx-4 mb-1 flex items-start justify-between rounded-lg border border-border bg-surface px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="label-xs text-text-muted mb-0.5">DISCUSSING</p>
        <p className="truncate text-[13px] font-medium text-text-primary leading-tight">
          {ctx.currentEntityLabel}
        </p>
        {ctx.currentRecommendationTitle && (
          <p className="mt-0.5 truncate text-[11px] text-text-secondary leading-tight">
            {ctx.currentRecommendationTitle}
          </p>
        )}
        {ctx.turnCount > 1 && (
          <p className="mt-0.5 text-[11px] text-text-muted">
            {ctx.turnCount} turns
          </p>
        )}
      </div>
      <button
        onClick={onClear}
        className={cn(
          'ml-2 mt-0.5 flex-shrink-0 rounded p-0.5 text-text-muted',
          'hover:text-text-secondary transition-colors',
        )}
        aria-label="Clear conversation thread"
        title="Clear conversation thread"
      >
        <X size={12} />
      </button>
    </div>
  )
}
