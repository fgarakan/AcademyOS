'use client'

/**
 * Sprint 804 — DONNA Dashboard Integration
 *
 * Inline DONNA entry card on the Director Dashboard. Surfaces DONNA's
 * recommended starting question for the day and opens the DONNA panel
 * pre-seeded with that question on click.
 *
 * No DB calls. No mutations. Pure UX bridge between dashboard and DONNA panel.
 * Uses the standard `donna:open` CustomEvent dispatched by the director layout.
 */

import { Sparkles } from 'lucide-react'

interface Props {
  /** Number of attention items — shown as a signal count if > 0 */
  attentionCount: number
  /** Director first name for personalisation (optional) */
  firstName?: string
}

function openDonnaWithPrompt(prompt: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('donna:open', { detail: { prompt } }))
  }
}

export function DonnaDashboardOpenCard({ attentionCount, firstName }: Props) {
  const greeting = firstName ? `${firstName}, ` : ''
  const hasSignals = attentionCount > 0

  return (
    <div
      className="rounded-2xl flex items-center justify-between gap-4 px-5 py-4 cursor-pointer group transition-all"
      style={{
        background: 'rgba(200,255,0,0.03)',
        border: '1px solid rgba(200,255,0,0.10)',
      }}
      onClick={() => openDonnaWithPrompt('What do I need to do today?')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          openDonnaWithPrompt('What do I need to do today?')
        }
      }}
    >
      {/* Left: DONNA identity + message */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
          style={{
            background: 'rgba(200,255,0,0.08)',
            border: '1px solid rgba(200,255,0,0.20)',
          }}
        >
          <Sparkles className="w-4 h-4 text-lime" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-text-primary leading-tight">
            {hasSignals
              ? `${greeting}${attentionCount} item${attentionCount !== 1 ? 's' : ''} may need your attention today`
              : `${greeting}DONNA is ready — ask what needs your attention`}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Click to open DONNA · Review-first · Nothing changes until you approve
          </p>
        </div>
      </div>

      {/* Right: open hint */}
      <span
        className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all group-hover:opacity-100 opacity-70"
        style={{
          background: 'rgba(200,255,0,0.08)',
          border: '1px solid rgba(200,255,0,0.18)',
          color: '#C8FF00',
        }}
      >
        Ask DONNA →
      </span>
    </div>
  )
}
