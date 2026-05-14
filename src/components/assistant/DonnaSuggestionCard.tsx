'use client'

import { X, ArrowRight, Sparkles } from 'lucide-react'
import type { DonnaSuggestion } from './donnaPredictiveSuggestions'
import type { DonnaTaskId } from './donnaTaskContracts'
import { DONNA_TASK_CONTRACTS } from './donnaTaskContracts'

interface Props {
  suggestion: DonnaSuggestion
  onStartTask: (taskId: DonnaTaskId) => void
  onNavigate: (href: string) => void
  onDismiss: (id: string) => void
}

const CONFIDENCE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: 'High',   color: '#C8FF00', bg: 'rgba(200,255,0,0.08)' },
  medium: { label: 'Medium', color: '#FF9500', bg: 'rgba(255,149,0,0.06)' },
  low:    { label: 'Low',    color: '#666666', bg: 'rgba(102,102,102,0.06)' },
}

export function DonnaSuggestionCard({ suggestion, onStartTask, onNavigate, onDismiss }: Props) {
  const conf = CONFIDENCE_STYLES[suggestion.confidence] ?? CONFIDENCE_STYLES.low
  const taskLabel = suggestion.taskId
    ? DONNA_TASK_CONTRACTS[suggestion.taskId]?.label ?? 'Start Task'
    : null

  return (
    <div
      className="rounded-xl px-3.5 py-3 space-y-2"
      style={{
        background: conf.bg,
        border: `1px solid ${suggestion.confidence === 'high' ? 'rgba(200,255,0,0.2)' : 'rgba(255,149,0,0.15)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <Sparkles
            className="w-3 h-3 mt-0.5 shrink-0"
            style={{ color: conf.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p
                className="text-[12px] font-semibold leading-tight"
                style={{ color: conf.color }}
              >
                {suggestion.label}
              </p>
              <span
                className="text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded"
                style={{ color: conf.color, background: `${conf.color}18` }}
              >
                {conf.label}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
              {suggestion.reason}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(suggestion.id)}
          aria-label="Dismiss suggestion"
          className="shrink-0 text-text-muted hover:text-text-primary transition-colors mt-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Evidence bullets */}
      {suggestion.evidencePoints.length > 0 && (
        <ul className="space-y-0.5 pl-1">
          {suggestion.evidencePoints.map((point, i) => (
            <li
              key={i}
              className="flex items-start gap-1 text-[10px] text-text-muted leading-snug"
            >
              <span className="shrink-0 mt-px" style={{ color: conf.color }}>·</span>
              {point}
            </li>
          ))}
        </ul>
      )}

      {/* Action button */}
      {(suggestion.taskId || suggestion.navigationHref) && (
        <button
          onClick={() => {
            if (suggestion.taskId) {
              onStartTask(suggestion.taskId)
            } else if (suggestion.navigationHref) {
              onNavigate(suggestion.navigationHref)
            }
          }}
          className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
          style={{ color: conf.color }}
        >
          {suggestion.taskId ? taskLabel : 'Go there'}
          <ArrowRight className="w-3 h-3 shrink-0" />
        </button>
      )}
    </div>
  )
}
