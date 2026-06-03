'use client'

// Sprint 1691 — DONNA Academy COO Brief Card V1
// Renders an AcademyAttentionReport as a COO-style brief card.
// Top action: lime highlight with full 5-field detail.
// Supporting items: compact numbered list.
// Health signal badge: clear / attention_needed / critical.
// Empty state: honest "academy clear" message.
// Dismissible. No mutations. Read-only display.

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, AlertCircle, AlertTriangle, ChevronDown, ChevronUp,
  X, ArrowRight, ShieldCheck, Clock,
} from 'lucide-react'
import type { AcademyAttentionReport, AcademyAttentionItem } from '@/lib/donna/proactive/academyAttentionEngine'

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaAcademyCOOBriefCardProps {
  report: AcademyAttentionReport
  onDismiss?: () => void
  /** If false, shows only top action + count summary (compact mode) */
  expanded?: boolean
  className?: string
}

// ─── Health signal badge ────────────────────────────────────────────────────────

function HealthBadge({ signal, summary }: { signal: AcademyAttentionReport['healthSignal']; summary: string }) {
  if (signal === 'clear') {
    return (
      <div className="flex items-center gap-1.5 text-status-green text-[11px]">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span>{summary}</span>
      </div>
    )
  }
  if (signal === 'critical') {
    return (
      <div className="flex items-center gap-1.5 text-status-red text-[11px] animate-pulse">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span>{summary}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 text-status-orange text-[11px]">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span>{summary}</span>
    </div>
  )
}

// ─── Supporting item row ────────────────────────────────────────────────────────

function SupportingItemRow({ item, rank }: { item: AcademyAttentionItem; rank: number }) {
  const severityColor =
    item.severity === 'critical' ? 'text-status-red' :
    item.severity === 'high'     ? 'text-status-orange' :
    item.severity === 'medium'   ? 'text-lime' :
    'text-text-muted'

  return (
    <div className="flex items-start gap-2 py-1.5 border-t border-border first:border-t-0">
      <span className={`text-[11px] font-mono shrink-0 mt-0.5 ${severityColor}`}>{rank}.</span>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[12px] text-text-primary leading-snug">{item.label}</p>
        <p className="text-[11px] text-text-secondary leading-snug truncate">{item.whyItMatters.split('.')[0]}.</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {item.requiresApproval && (
          <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
            <ShieldCheck className="w-3 h-3" aria-hidden />
            <span>Approval</span>
          </span>
        )}
        {item.href && (
          <Link
            href={item.href}
            className="text-[10px] text-lime hover:underline flex items-center gap-0.5"
            aria-label={`Go to ${item.label}`}
          >
            <ArrowRight className="w-3 h-3" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function DonnaAcademyCOOBriefCard({
  report,
  onDismiss,
  expanded: defaultExpanded = false,
  className = '',
}: DonnaAcademyCOOBriefCardProps) {
  const [showDetail, setShowDetail] = useState(defaultExpanded)

  const top = report.topAction
  const supporting = report.allItems.slice(1, 5)

  return (
    <div
      className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}
      data-donna-focus-id="academy-coo-brief"
      role="complementary"
      aria-label="DONNA Academy COO Brief"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <HealthBadge signal={report.healthSignal} summary={report.healthSummary} />
          {!report.isEmpty && (
            <span className="text-[10px] text-text-muted">
              · {report.sourceNote}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!report.isEmpty && (
            <button
              className="p-1 rounded hover:bg-surface-raised transition-colors text-text-muted"
              onClick={() => setShowDetail(v => !v)}
              aria-label={showDetail ? 'Collapse brief' : 'Expand brief'}
            >
              {showDetail
                ? <ChevronUp className="w-3.5 h-3.5" aria-hidden />
                : <ChevronDown className="w-3.5 h-3.5" aria-hidden />
              }
            </button>
          )}
          {onDismiss && (
            <button
              className="p-1 rounded hover:bg-surface-raised transition-colors text-text-muted"
              onClick={onDismiss}
              aria-label="Dismiss COO brief"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {report.isEmpty && (
        <div className="px-4 py-4 text-[12px] text-text-secondary">
          Academy is operating normally — no urgent signals to review right now.
        </div>
      )}

      {/* ── Top action (always shown when not empty) ────────────────────────── */}
      {top && (
        <div className="px-4 py-3 bg-lime/5 border-b border-lime/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-lime">
                  Top Priority
                </span>
                {top.requiresApproval && (
                  <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                    <ShieldCheck className="w-3 h-3" aria-hidden />
                    <span>Approval required</span>
                  </span>
                )}
              </div>
              <p className="text-[13px] font-semibold text-text-primary leading-snug">
                {top.label}
              </p>

              {/* 5-field detail (shown when expanded) */}
              {showDetail && (
                <div className="mt-2 space-y-2 text-[12px]">
                  <div>
                    <span className="text-text-muted">Why it matters: </span>
                    <span className="text-text-secondary">{top.whyItMatters}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Evidence: </span>
                    <span className="text-text-secondary">{top.evidence}</span>
                  </div>
                  <div className="flex items-center gap-1 text-lime">
                    <Clock className="w-3 h-3 shrink-0" aria-hidden />
                    <span>{top.bestNextAction}</span>
                  </div>
                  <div className="text-[11px] text-text-muted italic">
                    {top.donnaWillNotDo}
                  </div>
                </div>
              )}
            </div>
            {top.href && (
              <Link
                href={top.href}
                className="btn-lime shrink-0 text-[11px] px-3 py-1.5 flex items-center gap-1"
                aria-label={`Go to: ${top.label}`}
              >
                Go
                <ArrowRight className="w-3 h-3" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Supporting items (shown when expanded) ──────────────────────────── */}
      {showDetail && supporting.length > 0 && (
        <div className="px-4 py-2">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
            Also needs attention
          </p>
          <div className="divide-y divide-border">
            {supporting.map((item, i) => (
              <SupportingItemRow key={item.id} item={item} rank={i + 2} />
            ))}
          </div>
          {report.totalCount > 5 && (
            <p className="text-[11px] text-text-muted mt-2 italic">
              +{report.totalCount - 5} more item{report.totalCount - 5 !== 1 ? 's' : ''} in the attention queue.
            </p>
          )}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      {!report.isEmpty && (
        <div className="px-4 py-2 border-t border-border flex items-center justify-between">
          <Link
            href="/director/attention"
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
          >
            Full attention queue
            <ArrowRight className="w-3 h-3" aria-hidden />
          </Link>
          <span className="text-[11px] text-text-muted">
            Say "What should I focus on today?" for voice summary
          </span>
        </div>
      )}
    </div>
  )
}
