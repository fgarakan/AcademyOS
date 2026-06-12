'use client'
// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// Explain Why Modal: reveals the full PriorityExplanation for any priority.
// No black box. Every recommendation is traceable.

import { X } from 'lucide-react'
import type { PriorityExplanation } from '@/lib/donna/operations/operatingPartnerExplainability'

interface Props {
  explanation:   PriorityExplanation | null
  priorityTitle: string
  isOpen:        boolean
  onClose:       () => void
}

function Section({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="label-xs text-text-muted mb-2">{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-text-secondary flex gap-2">
            <span className="text-lime mt-0.5 flex-shrink-0">›</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ExplainWhyModal({ explanation, priorityTitle, isOpen, onClose }: Props) {
  if (!isOpen || !explanation) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border sticky top-0 bg-surface z-10">
          <div>
            <p className="label-xs text-lime mb-1">DONNA EXPLAINS</p>
            <h2 className="text-base font-semibold text-text-primary leading-tight">{priorityTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Confidence */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              explanation.confidence === 'reliable'
                ? 'bg-status-green/20 text-status-green'
                : 'bg-status-orange/20 text-status-orange'
            }`}>
              {explanation.confidence === 'reliable' ? 'Reliable' : 'Provisional'}
            </span>
            <p className="text-sm text-text-secondary flex-1">{explanation.confidenceReason}</p>
          </div>

          {/* Why this priority today */}
          {explanation.tradeoffNarrative && (
            <div>
              <p className="label-xs text-text-muted mb-2">WHY THIS MATTERS</p>
              <p className="text-sm text-text-secondary leading-relaxed">{explanation.tradeoffNarrative}</p>
            </div>
          )}

          <Section label="EVIDENCE USED"    items={explanation.evidenceUsed} />
          <Section label="REALITY SIGNALS"  items={explanation.realityUsed} />
          <Section label="DECISION MEMORY"  items={explanation.memoryUsed} />
          <Section label="PHILOSOPHY"       items={explanation.philosophyUsed} />

          {explanation.missingData.length > 0 && (
            <div>
              <p className="label-xs text-status-orange mb-2">MISSING DATA</p>
              <ul className="space-y-1">
                {explanation.missingData.map((item, i) => (
                  <li key={i} className="text-sm text-text-secondary flex gap-2">
                    <span className="text-status-orange mt-0.5 flex-shrink-0">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
