'use client'

// Sprint 1040 — DONNA Context Summary Card
// Shows DONNA's current context frame: what it knows, data sources, confidence.
// Displayed above or below the chat thread to set expectations.
// Read-only presentational component — no state, no mutations.

import { Sparkles, Database, AlertCircle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContextSummaryItem {
  label: string
  value: string | number
  note?: string
}

export interface ContextSourceLabel {
  field: string
  status: 'live' | 'partial' | 'insufficient_data' | 'blocked_by_schema'
  label: string
}

export interface DonnaContextSummaryCardProps {
  role: 'director' | 'coach'
  contextItems: ContextSummaryItem[]
  sourceLabels?: ContextSourceLabel[]
  confidence?: 'high' | 'partial' | 'insufficient' | 'blocked'
  isLive: boolean
  className?: string
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ContextSourceLabel['status'] }) {
  const color =
    status === 'live' ? 'bg-status-green' :
    status === 'partial' ? 'bg-status-orange' :
    status === 'blocked_by_schema' ? 'bg-text-muted' :
    'bg-text-muted/40'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: DonnaContextSummaryCardProps['confidence'] }) {
  if (!confidence) return null
  const config: Record<string, { label: string; color: string }> = {
    high:        { label: 'High confidence', color: 'text-status-green border-status-green/20 bg-status-green/10' },
    partial:     { label: 'Partial data',    color: 'text-status-orange border-status-orange/20 bg-status-orange/10' },
    insufficient:{ label: 'Demo data',       color: 'text-text-muted border-border bg-surface-raised' },
    blocked:     { label: 'Limited data',    color: 'text-text-muted border-border bg-surface-raised' },
  }
  const c = config[confidence]
  if (!c) return null
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${c.color}`}>
      {c.label}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaContextSummaryCard({
  role,
  contextItems,
  sourceLabels,
  confidence,
  isLive,
  className = '',
}: DonnaContextSummaryCardProps) {
  const roleColor = role === 'director' ? 'text-lime' : 'text-status-blue'
  const roleBorder = role === 'director' ? 'border-lime/15 bg-lime/3' : 'border-status-blue/15 bg-status-blue/3'

  return (
    <div className={`rounded-2xl border ${roleBorder} p-3 space-y-2.5 ${className}`}>

      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className={`w-3.5 h-3.5 ${roleColor}`} />
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest">
            What DONNA can see
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ConfidenceBadge confidence={confidence} />
          {!isLive && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border border-status-orange/20 bg-status-orange/10 text-status-orange">
              <AlertCircle className="w-2.5 h-2.5" />
              Demo
            </span>
          )}
        </div>
      </div>

      {/* Context items */}
      {contextItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {contextItems.map((item, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-surface text-[10px]">
              <span className="text-text-muted">{item.label}:</span>
              <span className="text-text-secondary font-medium">{item.value}</span>
              {item.note && <span className="text-text-muted/70">({item.note})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Source labels (collapsed, show on hover via CSS) */}
      {sourceLabels && sourceLabels.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[9px] text-text-muted uppercase tracking-widest">
            <Database className="w-2.5 h-2.5" />
            Data sources
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {sourceLabels.map((src, i) => (
              <div key={i} className="flex items-center gap-1 text-[9px] text-text-muted">
                <StatusDot status={src.status} />
                <span>{src.field}:</span>
                <span className={
                  src.status === 'live' ? 'text-status-green' :
                  src.status === 'partial' ? 'text-status-orange' :
                  'text-text-muted'
                }>{src.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
