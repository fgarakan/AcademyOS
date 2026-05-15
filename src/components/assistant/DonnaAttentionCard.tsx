'use client'

// Sprint 370 — Donna Attention Card V1
// Shows urgent items that need director attention.
// Urgency badge + optional link per item.

import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { AttentionReport, AttentionItem } from './donnaAttentionEngine'
import Link from 'next/link'

interface Props {
  report: AttentionReport
  onDismiss: () => void
  onClose?: () => void
}

const URGENCY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: '#FF3B30',
    bg: 'rgba(255,59,48,0.08)',
    border: 'rgba(255,59,48,0.25)',
    label: 'Critical',
  },
  high: {
    icon: AlertCircle,
    color: '#FF9500',
    bg: 'rgba(255,149,0,0.08)',
    border: 'rgba(255,149,0,0.25)',
    label: 'High',
  },
  normal: {
    icon: Info,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.06)',
    border: 'rgba(139,92,246,0.2)',
    label: 'Normal',
  },
}

function AttentionItemRow({ item, onClose }: { item: AttentionItem; onClose?: () => void }) {
  const cfg = URGENCY_CONFIG[item.urgency]
  const Icon = cfg.icon
  return (
    <div
      className="rounded-lg px-3 py-2.5 space-y-1"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
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
      </div>
    </div>
  )
}

export function DonnaAttentionCard({ report, onDismiss, onClose }: Props) {
  const urgentCount = report.items.filter(i => i.urgency === 'critical' || i.urgency === 'high').length

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
            <AttentionItemRow key={item.id} item={item} onClose={onClose} />
          ))}
        </div>
      )}

      <p className="text-[9px] text-text-muted">
        Checked {new Date(report.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}
