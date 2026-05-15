'use client'

// Sprint 375 — Donna Recommendation Card V1
// Sprint 382 — Added "Show evidence" toggle + approval boundary per recommendation
// Action buttons NEVER mutate data — they open workflows or navigate only.

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
  const [showEvidence, setShowEvidence] = useState(false)

  return (
    <div
      className="rounded-xl px-3.5 py-3 space-y-2"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      {/* Priority badge + category */}
      <div className="flex items-center gap-2">
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
      <p className="text-[13px] font-semibold text-text-primary leading-snug">
        {rec.title}
      </p>

      {/* Rationale — collapsed into "Show evidence" */}
      <p className="text-[11px] text-text-muted leading-snug">
        {rec.rationale}
      </p>

      {/* Evidence panel */}
      {showEvidence && (
        <div
          className="rounded-lg px-2.5 py-2 space-y-1.5"
          style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${colors.border}` }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: colors.text }}>
            Evidence
          </p>
          <p className="text-[11px] text-text-secondary leading-snug">
            {rec.rationale}
          </p>
          {rec.signalKey && (
            <p className="text-[11px] text-text-muted leading-snug">
              Signal: <span className="text-text-secondary font-mono">{rec.signalKey}</span>
              {rec.signalValue !== undefined && (
                <span className="text-text-primary font-semibold"> = {String(rec.signalValue)}</span>
              )}
            </p>
          )}
          <div
            className="rounded px-2 py-1.5"
            style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.12)' }}
          >
            <p className="text-[10px] text-text-muted leading-snug">
              Donna recommends but does not act. All actions require your explicit approval.
            </p>
          </div>
        </div>
      )}

      {/* Action area */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        {/* Primary action — never mutates */}
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

        {/* Show evidence toggle */}
        <button
          type="button"
          onClick={() => setShowEvidence(p => !p)}
          className="flex items-center gap-0.5 text-[10px] font-medium transition-colors"
          style={{ color: showEvidence ? colors.text : '#555555' }}
        >
          {showEvidence ? (
            <><ChevronUp className="w-3 h-3" />Hide evidence</>
          ) : (
            <><ChevronDown className="w-3 h-3" />Show evidence</>
          )}
        </button>
      </div>
    </div>
  )
}
