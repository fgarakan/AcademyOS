// Sprint 767 — Director Home Consolidation: Today Command Center V1
// Pure UI component — no DB calls, no Supabase imports.
//
// Merges DirectorAttentionQueueHero (Sprint 763) + DonnaExecutiveCard into one calm surface.
// DONNA narrates the priority queue — no competing surfaces, no duplicate priority lists.
//
// Data: AttentionQueue from buildAttentionQueue() in parent server component.
// Props: queue (AttentionQueue), directorName (optional), showMax (default 5).
// Rendering: DONNA icon + personalized greeting + priority items + safety disclaimer footer.
// Safe actions only: Open Review / View Player / View Players / View Sessions /
//   View Curriculum / View Groups / View Details.

import Link from 'next/link'
import { Sparkles, ChevronRight, CheckCircle } from 'lucide-react'
import type {
  AttentionQueue,
  AttentionItem,
  AttentionSource,
  AttentionPriority,
} from '@/lib/director/attentionQueue'

// ── Props ───────────────────────────────────────────────────────────────────────

interface Props {
  queue: AttentionQueue
  directorName?: string
  /** Maximum items to show before "View all" footer. Default: 5 */
  showMax?: number
}

// ── Category metadata ────────────────────────────────────────────────────────────

interface CategoryMeta {
  label: string
  chipClass: string
}

const SOURCE_CATEGORY: Record<AttentionSource, CategoryMeta> = {
  pending_approval:    { label: 'Decision',    chipClass: 'bg-lime/10 border-lime/25 text-lime' },
  expiring_action:     { label: 'Decision',    chipClass: 'bg-status-red/10 border-status-red/25 text-status-red' },
  high_alert:          { label: 'Risk',        chipClass: 'bg-status-red/10 border-status-red/25 text-status-red' },
  at_risk_player:      { label: 'Risk',        chipClass: 'bg-status-red/10 border-status-red/25 text-status-red' },
  over_capacity_group: { label: 'Watch',       chipClass: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400' },
  no_session_coverage: { label: 'Watch',       chipClass: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400' },
  curriculum_gap:      { label: 'Opportunity', chipClass: 'bg-status-blue/10 border-status-blue/25 text-status-blue' },
}

// ── Priority left-border color ───────────────────────────────────────────────────

const PRIORITY_COLOR: Record<AttentionPriority, string> = {
  critical: '#FF3B30',
  high:     '#FF9500',
  medium:   '#FACC15',
  low:      '#333333',
}

// ── Safe action label derived from href ─────────────────────────────────────────

function getActionLabel(href: string): string {
  if (href.startsWith('/director/review')) return 'Open Review'
  if (href.includes('/director/players/') && href.length > '/director/players/'.length) return 'View Player'
  if (href.startsWith('/director/players')) return 'View Players'
  if (href.startsWith('/director/sessions')) return 'View Sessions'
  if (href.startsWith('/director/curriculum')) return 'View Curriculum'
  if (href.startsWith('/director/groups')) return 'View Groups'
  return 'View Details'
}

// ── Priority row ─────────────────────────────────────────────────────────────────

function PriorityRow({ item, idx }: { item: AttentionItem; idx: number }) {
  const cat = SOURCE_CATEGORY[item.source] ?? {
    label: 'FYI',
    chipClass: 'bg-surface-raised border-border text-text-muted',
  }
  const borderColor = PRIORITY_COLOR[item.priority] ?? '#333333'
  const actionLabel = getActionLabel(item.href)

  return (
    <li>
      {idx === 0 && (
        <p className="text-[9px] uppercase tracking-widest font-bold text-lime/50 px-1 mb-1">
          Do this first
        </p>
      )}
      <Link href={item.href} className="block group">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-raised/80 transition-colors"
          style={{
            borderTop:    '1px solid rgba(255,255,255,0.05)',
            borderRight:  '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            borderLeft:   `2px solid ${borderColor}`,
          }}
        >
          {/* Number ring */}
          <span className="shrink-0 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center font-mono text-[11px] font-bold text-text-muted bg-surface-raised">
            {idx + 1}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${cat.chipClass}`}>
                {cat.label}
              </span>
              <p className="text-sm font-medium text-text-primary leading-snug truncate">
                {item.label}
              </p>
            </div>
            <p className="text-[11px] text-text-muted leading-snug">
              {item.description}
            </p>
          </div>

          {/* Action chip */}
          <span className="shrink-0 text-[10px] font-semibold text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded-full whitespace-nowrap group-hover:text-lime group-hover:border-lime/30 transition-colors">
            {actionLabel}
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors shrink-0" />
        </div>
      </Link>
    </li>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────────

export function DirectorTodayCommandCenter({ queue, directorName, showMax = 5 }: Props) {
  const visibleItems = queue.items.slice(0, showMax)
  const hasMore = queue.totalCount > showMax

  const greeting = directorName
    ? `${directorName}, here`
    : 'Here'

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'linear-gradient(135deg, #111111 0%, #131313 100%)',
        border: '1px solid rgba(200,255,0,0.12)',
        boxShadow: '0 0 40px rgba(200,255,0,0.04)',
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)' }}
          >
            <Sparkles className="w-4 h-4 text-lime" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-lime/70">
              DONNA — Today&apos;s Command Center
            </p>
            <p className="text-sm font-semibold text-text-primary leading-tight mt-0.5">
              {queue.isEmpty
                ? `${directorName ? `${directorName}, all` : 'All'} clear — nothing urgent today.`
                : `${greeting} ${queue.totalCount === 1 ? 'is 1 item that needs' : `are ${queue.totalCount} items that need`} your attention.`}
            </p>
          </div>
        </div>

        {/* Priority count chips */}
        {queue.totalCount > 0 && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {queue.criticalCount > 0 && (
              <span className="font-mono text-[11px] font-bold text-status-red bg-status-red/10 border border-status-red/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                {queue.criticalCount} critical
              </span>
            )}
            {queue.highCount > 0 && (
              <span className="font-mono text-[11px] font-bold text-status-orange bg-status-orange/10 border border-status-orange/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                {queue.highCount} high
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Items or empty state ────────────────────────────── */}
      {queue.isEmpty ? (
        <div
          className="flex items-center gap-3 px-4 py-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <CheckCircle className="w-5 h-5 text-status-green shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Today looks clear</p>
            <p className="text-xs text-text-muted mt-0.5">
              DONNA sees no priority items right now. Items appear as your academy generates activity.
            </p>
          </div>
        </div>
      ) : (
        <ol className="space-y-2">
          {visibleItems.map((item, idx) => (
            <PriorityRow key={item.id} item={item} idx={idx} />
          ))}
        </ol>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-4 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <p className="text-[10px] text-text-muted leading-snug">
          DONNA flags items but takes no action without your explicit approval.
          All changes go through the review queue.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {hasMore && (
            <Link
              href="/director/review"
              className="text-[10px] text-text-muted hover:text-lime transition-colors font-medium whitespace-nowrap"
            >
              View all {queue.totalCount} items →
            </Link>
          )}
          <Link
            href="/director/donna"
            className="text-[10px] text-text-muted hover:text-lime transition-colors font-medium whitespace-nowrap"
          >
            Ask DONNA →
          </Link>
        </div>
      </div>
    </div>
  )
}
