'use client'
// Reusable inline explain panel — designed for use by DecisionCenter, WhatChanged,
// Alerts, and future Coach/Parent OS surfaces. Never shows raw technical strings.

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react'

export interface DonnaExplainPopoverProps {
  reasoning:        string   // Why this matters — DONNA analytical voice
  recommendedStep:  string   // What to do — DONNA directive voice
  evidence:         string[] // Supporting signals (human-readable)
  triggerLabel?:    string   // default: "Ask DONNA"
  className?:       string
}

export function DonnaExplainPopover({
  reasoning,
  recommendedStep,
  evidence,
  triggerLabel = 'Ask DONNA',
  className = '',
}: DonnaExplainPopoverProps) {
  const [open, setOpen] = useState(false)
  const readableEvidence = evidence.map(formatEvidenceItem).filter(Boolean)

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-lime hover:text-lime/80 transition-colors min-h-[44px] py-2"
      >
        <Sparkles size={14} className="shrink-0" />
        {triggerLabel}
        {open ? <ChevronUp size={12} className="shrink-0" /> : <ChevronDown size={12} className="shrink-0" />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl bg-surface border border-lime/20 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-widest font-semibold text-lime">
              DONNA explains
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close DONNA explanation"
              className="text-text-secondary hover:text-text-primary transition-colors p-1"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-base text-text-secondary leading-relaxed">
            {reasoning}
          </p>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest font-medium text-text-secondary">
              Recommended action
            </p>
            <p className="text-base font-medium text-text-primary leading-snug">
              {recommendedStep}
            </p>
          </div>

          {readableEvidence.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest font-medium text-text-secondary">
                Evidence ({readableEvidence.length} signal{readableEvidence.length !== 1 ? 's' : ''})
              </p>
              <ul className="space-y-1.5">
                {readableEvidence.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-lime/60 shrink-0 mt-2" />
                    <span className="text-sm text-text-secondary leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Evidence translator ────────────────────────────────────────────────────────
// Converts technical signal strings to operator-readable language.
// Never shows raw key=value notation to the director.

function formatEvidenceItem(raw: string): string {
  if (!raw || raw.trim() === '') return ''

  let s = raw.trim()

  // Already human-readable patterns (from the engine)
  const readable = [' pending', ' overdue', ' days old', ' days', ' players', ' coaches', ' sessions', ' parent', ' have ', ' has ', ' items', ' signals', ' score']
  if (readable.some(p => s.toLowerCase().includes(p))) {
    return capitalizeFirst(s)
  }

  // Technical key:value → readable
  s = s.replace(/situation:\s*unclear_cause_requires_review/gi, 'Academy situation requires investigation')
  s = s.replace(/situation:\s*(\w+)/gi, (_, t) => `Situation: ${t.replace(/_/g, ' ')}`)
  s = s.replace(/completeness score:\s*(\d+)\/100/i, 'Data completeness: $1%')
  s = s.replace(/_count:\s*(\d+)/gi, ' count: $1')
  s = s.replace(/_/g, ' ')

  return capitalizeFirst(s)
}

function capitalizeFirst(s: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}
