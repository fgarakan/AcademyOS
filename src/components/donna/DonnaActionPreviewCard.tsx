'use client'

// Sprint 1027 — DONNA Action Preview Before Submit V1
// Preview card shown before a DONNA action is submitted or approved.
// Displays: action type, what changes, source confidence, safety class, safety notes.
// Used by both coach submit flow and director approval flow.
// Pure display — no state mutations, no DB writes.

import { AlertCircle, CheckCircle2, Clock, Database, Eye, ShieldCheck, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import type { DonnaActionSafetyClass } from '@/lib/donna/donnaActionTypes'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'
import { getConfidenceLabel, getConfidenceColor } from '@/lib/donna/donnaConfidence'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaActionPreviewCardProps {
  actionId: string
  actionLabel: string
  safetyClass: DonnaActionSafetyClass
  riskLevel: 'high' | 'medium' | 'low' | 'none'
  summary: string
  whatChanges: string[]
  sourceLabel: string | null
  confidence: DONNAConfidence
  safetyNotes: string[]
  isBuilt?: boolean
  className?: string
}

// ── Safety class badge ────────────────────────────────────────────────────────

const SAFETY_CLASS_CONFIG: Record<DonnaActionSafetyClass, {
  icon: React.ReactNode
  label: string
  colorClass: string
  bgClass: string
  borderClass: string
}> = {
  safe_read: {
    icon: <Eye className="w-3 h-3" />,
    label: 'Safe read',
    colorClass: 'text-status-green',
    bgClass: 'bg-status-green/5',
    borderClass: 'border-status-green/20',
  },
  draft_only: {
    icon: <Clock className="w-3 h-3" />,
    label: 'Draft — awaits director review',
    colorClass: 'text-status-blue',
    bgClass: 'bg-status-blue/5',
    borderClass: 'border-status-blue/20',
  },
  requires_approval: {
    icon: <ShieldCheck className="w-3 h-3" />,
    label: 'Requires approval',
    colorClass: 'text-lime',
    bgClass: 'bg-lime/5',
    borderClass: 'border-lime/20',
  },
  blocked_for_role: {
    icon: <AlertCircle className="w-3 h-3" />,
    label: 'Blocked — role restriction',
    colorClass: 'text-status-red',
    bgClass: 'bg-status-red/5',
    borderClass: 'border-status-red/20',
  },
  future_capability: {
    icon: <Sparkles className="w-3 h-3" />,
    label: 'Coming soon',
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface-raised',
    borderClass: 'border-border',
  },
}

const RISK_COLORS: Record<'high' | 'medium' | 'low' | 'none', string> = {
  high: 'text-status-red',
  medium: 'text-status-orange',
  low: 'text-status-green',
  none: 'text-text-muted',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaActionPreviewCard({
  actionId: _actionId,
  actionLabel,
  safetyClass,
  riskLevel,
  summary,
  whatChanges,
  sourceLabel,
  confidence,
  safetyNotes,
  isBuilt = true,
  className = '',
}: DonnaActionPreviewCardProps) {
  const safetyConfig = SAFETY_CLASS_CONFIG[safetyClass]
  const confidenceColor = getConfidenceColor(confidence)
  const confidenceLabel = getConfidenceLabel(confidence)

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3.5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-text-primary leading-snug flex-1 min-w-0">
            {actionLabel}
          </p>
          {riskLevel !== 'none' && (
            <span className={`shrink-0 text-[11px] font-medium ${RISK_COLORS[riskLevel]}`}>
              {riskLevel} risk
            </span>
          )}
        </div>

        {/* Summary */}
        <p className="text-xs text-text-secondary leading-relaxed">{summary}</p>

        {/* Safety class badge */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${safetyConfig.colorClass} ${safetyConfig.bgClass} ${safetyConfig.borderClass}`}>
          {safetyConfig.icon}
          {safetyConfig.label}
        </div>

        {/* What changes */}
        {whatChanges.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-raised px-3 py-2.5">
            <p className="label-xs mb-1.5">What this changes</p>
            <ul className="space-y-1">
              {whatChanges.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                  <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-status-orange" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source confidence */}
        {sourceLabel && (
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-text-muted shrink-0" />
            <span className="text-[11px] text-text-muted">{sourceLabel}</span>
            <span className={`text-[11px] font-medium ${confidenceColor}`}>{confidenceLabel}</span>
          </div>
        )}

        {/* Safety notes */}
        {safetyNotes.length > 0 && (
          <div className="space-y-1.5 pt-0.5 border-t border-border">
            {safetyNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-lime shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-muted leading-relaxed">{note}</p>
              </div>
            ))}
          </div>
        )}

        {/* Not built notice */}
        {!isBuilt && (
          <div className="flex items-start gap-1.5 pt-1">
            <Sparkles className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-muted">
              This capability is not yet fully built — preview only.
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
