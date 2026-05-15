'use client'

// Sprint 369 — Donna Daily Brief Card V1
// Compact card showing daily brief sections.
// High-priority items highlighted in lime. "Full brief" expand option.

import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { DailyBrief } from './donnaDailyBrief'

interface Props {
  brief: DailyBrief
  onDismiss: () => void
}

export function DonnaDailyBriefCard({ brief, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false)

  const urgentSections = brief.sections.filter(s => s.priority === 'high')
  const normalSections = brief.sections.filter(s => s.priority !== 'high')
  const displaySections = expanded ? brief.sections : [...urgentSections, ...normalSections.slice(0, 1)]

  return (
    <div
      className="rounded-xl p-3.5 space-y-2.5"
      style={{ background: 'var(--surface-raised)', border: '1px solid rgba(200,255,0,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">
            Daily Brief
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">{brief.date}</p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss brief"
          className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {displaySections.map((section, i) => (
          <div key={i}>
            <p
              className="text-[10px] uppercase tracking-widest font-semibold mb-1"
              style={{ color: section.priority === 'high' ? 'var(--lime)' : 'var(--text-muted)' }}
            >
              {section.title}
              {section.priority === 'high' && (
                <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(200,255,0,0.1)', color: 'var(--lime)' }}>
                  Urgent
                </span>
              )}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item, j) => (
                <li key={j} className="flex items-start gap-1.5 text-[11px] text-text-secondary leading-snug">
                  <span className="shrink-0 mt-px" style={{ color: section.priority === 'high' ? 'var(--lime)' : 'var(--text-muted)' }}>·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Expand / collapse */}
      {brief.sections.length > displaySections.length && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
          Show full brief
        </button>
      )}
      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        >
          <ChevronUp className="w-3 h-3" />
          Show less
        </button>
      )}

      <p className="text-[9px] text-text-muted">
        Generated {new Date(brief.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}
