'use client'

// Sprint 370 — Donna Attention Card V1
// Sprint 382 — Added "Ask Donna why?" toggle + "Open review queue" CTA

import { useState } from 'react'
import { X, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import type { AttentionReport, AttentionItem } from './donnaAttentionEngine'
import Link from 'next/link'

interface Props {
  report: AttentionReport
  onDismiss: () => void
  onClose?: () => void
  onOpenReviewQueue?: () => void
}

const URGENCY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: '#FF3B30',
    bg: 'rgba(255,59,48,0.08)',
    border: 'rgba(255,59,48,0.25)',
    label: 'Critical',
    whyPrefix: 'This is a critical item that requires immediate director action.',
  },
  high: {
    icon: AlertCircle,
    color: '#FF9500',
    bg: 'rgba(255,149,0,0.08)',
    border: 'rgba(255,149,0,0.25)',
    label: 'High',
    whyPrefix: 'This is a high-priority item that should be addressed today.',
  },
  normal: {
    icon: Info,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.06)',
    border: 'rgba(139,92,246,0.2)',
    label: 'Normal',
    whyPrefix: 'This item is on Donna\'s radar for your awareness.',
  },
}

function AttentionItemRow({
  item,
  onClose,
  isExpanded,
  onToggleExpand,
}: {
  item: AttentionItem
  onClose?: () => void
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const cfg = URGENCY_CONFIG[item.urgency]
  const Icon = cfg.icon
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {/* Main row */}
      <div className="px-3 py-2.5 space-y-1">
        <div className="flex items-start gap-2">
          <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[12px] font-semibold text-text-primary leading-tight">{item.title}</p>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-snug mt-0.5">{item.description}</p>
            {item.link && item.action && (
              <Link
                href={item.link}
                onClick={onClose}
                className="inline-block mt-1 text-[10px] font-semibold underline underline-offset-2 transition-colors"
                style={{ color: cfg.color }}
              >
                {item.action} →
              </Link>
            )}
          </div>
          {/* "Ask Donna why?" toggle */}
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Collapse explanation' : 'Ask Donna why'}
            className="shrink-0 text-text-muted hover:text-text-secondary transition-colors mt-0.5"
          >
            {isExpanded
              ? <ChevronUp className="w-3 h-3" />
              : <ChevronDown className="w-3 h-3" />
            }
          </button>
        </div>
      </div>

      {/* Expanded: "Ask Donna why?" explanation */}
      {isExpanded && (
        <div
          className="px-3 py-2.5 space-y-2"
          style={{ borderTop: `1px solid ${cfg.border}`, background: 'rgba(0,0,0,0.15)' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: cfg.color }}>
            Why this needs attention
          </p>
          <p className="text-[11px] text-text-secondary leading-snug">
            {cfg.whyPrefix} {item.description}
          </p>
          {item.action && (
            <p className="text-[11px] text-text-secondary leading-snug">
              Suggested next step: <span className="text-text-primary font-medium">{item.action}</span>
            </p>
          )}
          <div
            className="rounded px-2 py-1.5"
            style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.12)' }}
          >
            <p className="text-[10px] text-text-muted leading-snug">
              Donna flags items but takes no action without your explicit approval.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function DonnaAttentionCard({ report, onDismiss, onClose, onOpenReviewQueue }: Props) {
  const urgentCount = report.items.filter(i => i.urgency === 'critical' || i.urgency === 'high').length
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  function toggleItem(id: string) {
    setExpandedItemId(prev => prev === id ? null : id)
  }

  return (
    <div
      className="rounded-xl p-3.5 space-y-2.5"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
            Needs Attention
          </p>
          {urgentCount > 0 && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500', border: '1px solid rgba(255,149,0,0.25)' }}
            >
              {urgentCount} urgent
            </span>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Items */}
      {report.items.length === 0 ? (
        <p className="text-[11px] text-text-muted italic">No urgent items found. All clear.</p>
      ) : (
        <div className="space-y-1.5">
          {report.items.map(item => (
            <AttentionItemRow
              key={item.id}
              item={item}
              onClose={onClose}
              isExpanded={expandedItemId === item.id}
              onToggleExpand={() => toggleItem(item.id)}
            />
          ))}
        </div>
      )}

      {/* Footer CTAs */}
      <div className="flex items-center justify-between pt-0.5">
        <p className="text-[9px] text-text-muted">
          Checked {new Date(report.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {onOpenReviewQueue && (
          <button
            type="button"
            onClick={onOpenReviewQueue}
            className="flex items-center gap-1 text-[10px] font-semibold transition-colors"
            style={{ color: '#FF9500' }}
          >
            Open review queue
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
