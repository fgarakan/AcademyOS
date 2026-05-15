'use client'

// Sprint 375 — Donna Recommendation Card V1
// Displays a single DonnaRecommendation with priority badge and action button.
// Action buttons NEVER mutate data — they open workflows or navigate only.

import type { DonnaRecommendation } from './donnaRecommendationTypes'

interface Props {
  recommendation: DonnaRecommendation
  onAction: (rec: DonnaRecommendation) => void
}

const PRIORITY_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  critical: {
    bg: 'rgba(255,59,48,0.08)',
    border: 'rgba(255,59,48,0.25)',
    text: '#FF3B30',
    label: 'Critical',
  },
  high: {
    bg: 'rgba(255,149,0,0.08)',
    border: 'rgba(255,149,0,0.25)',
    text: '#FF9500',
    label: 'High',
  },
  normal: {
    bg: 'rgba(200,255,0,0.05)',
    border: 'rgba(200,255,0,0.18)',
    text: '#C8FF00',
    label: 'Normal',
  },
  low: {
    bg: 'rgba(85,85,85,0.12)',
    border: 'rgba(85,85,85,0.25)',
    text: '#555555',
    label: 'Low',
  },
}

export function DonnaRecommendationCard({ recommendation: rec, onAction }: Props) {
  const colors = PRIORITY_COLORS[rec.priority] ?? PRIORITY_COLORS.normal

  return (
    <div
      className="rounded-xl px-3.5 py-3"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      {/* Priority badge + category */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
          style={{ background: colors.border, color: colors.text }}
        >
          {colors.label}
        </span>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: '#555555' }}>
          {rec.category}
        </span>
      </div>

      {/* Title */}
      <p className="text-[13px] font-semibold text-text-primary leading-snug mb-1">
        {rec.title}
      </p>

      {/* Rationale */}
      <p className="text-[11px] text-text-muted leading-snug mb-2.5">
        {rec.rationale}
      </p>

      {/* Action button — never mutates, only opens/navigates */}
      {rec.action.type !== 'none' && (
        <button
          type="button"
          onClick={() => onAction(rec)}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
          style={{ background: colors.border, color: colors.text }}
        >
          {rec.action.label}
        </button>
      )}
    </div>
  )
}
