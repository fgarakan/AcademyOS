'use client'

// Sprint 556 — DONNA Confidence and Missing Data UI V1
// Standalone confidence disclosure panel.
// Used when DONNA needs to explain why data is limited, blocked, or uncertain.

import { CheckCircle2, AlertCircle, Info, XCircle, Lock, Database } from 'lucide-react'
import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'

// ── Disclosure level types ────────────────────────────────────────────────────

export type ConfidenceLevel =
  | 'high'
  | 'partial'
  | 'insufficient'
  | 'blocked_missing'
  | 'blocked_rls'
  | 'blocked_schema'

// ── Config ────────────────────────────────────────────────────────────────────

interface DisclosureConfig {
  icon: React.ReactNode
  label: string
  description: string
  colorClass: string
  borderClass: string
  bgClass: string
}

const DISCLOSURE_CONFIG: Record<ConfidenceLevel, DisclosureConfig> = {
  high: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'High confidence',
    description: 'All data sources are live and complete.',
    colorClass: 'text-status-green',
    borderClass: 'border-status-green/20',
    bgClass: 'bg-status-green/5',
  },
  partial: {
    icon: <Info className="w-4 h-4" />,
    label: 'Partial data',
    description: 'Some data sources are available. This answer may be incomplete.',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/20',
    bgClass: 'bg-status-orange/5',
  },
  insufficient: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Insufficient data',
    description: 'Not enough data to give a reliable answer. More coach wrap-ups or player activity will help.',
    colorClass: 'text-text-muted',
    borderClass: 'border-border',
    bgClass: 'bg-surface',
  },
  blocked_missing: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Data missing',
    description: 'Required data has not been entered yet. Complete coach wrap-ups or player assessments.',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/20',
    bgClass: 'bg-status-orange/5',
  },
  blocked_rls: {
    icon: <Lock className="w-4 h-4" />,
    label: 'Access restricted',
    description: 'This data is protected by access controls and cannot be read from this role.',
    colorClass: 'text-status-red',
    borderClass: 'border-status-red/20',
    bgClass: 'bg-status-red/5',
  },
  blocked_schema: {
    icon: <Database className="w-4 h-4" />,
    label: 'Schema gap',
    description: 'This data source is not yet connected. A future migration will enable it.',
    colorClass: 'text-text-muted',
    borderClass: 'border-border',
    bgClass: 'bg-surface',
  },
}

// ── Status → level mapping ────────────────────────────────────────────────────

export function statusToConfidenceLevel(status: COOFieldStatus): ConfidenceLevel {
  switch (status) {
    case 'live': return 'high'
    case 'partial': return 'partial'
    case 'insufficient_data': return 'insufficient'
    case 'blocked_by_rls': return 'blocked_rls'
    case 'blocked_by_schema': return 'blocked_schema'
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DONNAConfidenceDisclosureProps {
  level: ConfidenceLevel
  context?: string  // extra context sentence shown after the description
  compact?: boolean // compact (inline) vs full (block)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAConfidenceDisclosure({
  level,
  context,
  compact = false,
}: DONNAConfidenceDisclosureProps) {
  const cfg = DISCLOSURE_CONFIG[level]

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${cfg.colorClass} ${cfg.borderClass} ${cfg.bgClass}`}
      >
        {cfg.icon}
        {cfg.label}
      </span>
    )
  }

  return (
    <div className={`rounded-xl border px-3.5 py-3 ${cfg.borderClass} ${cfg.bgClass}`}>
      <div className={`flex items-start gap-2.5 ${cfg.colorClass}`}>
        <div className="shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold mb-0.5">{cfg.label}</p>
          <p className="text-[11px] text-text-muted leading-snug">
            {cfg.description}
            {context && <span> {context}</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── XCircle import (for blocked states not yet used above) ────────────────────
// Re-export level type for consumer convenience
export type { ConfidenceLevel as DONNAConfidenceLevel }
