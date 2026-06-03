'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, AlertCircle, Clock, Info } from 'lucide-react'
import type { AttentionItem, AttentionFilter, AttentionCategory } from './buildAttentionItems'
import { CATEGORY_LABELS, FILTER_LABELS, filterAttentionItems } from './buildAttentionItems'

// ── Priority badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: AttentionItem['priority'] }) {
  const styles = {
    high:   'bg-status-red/10 text-status-red border-status-red/25',
    medium: 'bg-status-orange/10 text-status-orange border-status-orange/25',
    low:    'bg-surface-raised text-text-muted border-border',
  }
  const labels = { high: 'High', medium: 'Medium', low: 'Low' }
  return (
    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[priority]}`}>
      {labels[priority]}
    </span>
  )
}

// ── Category badge ────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: AttentionCategory }) {
  return (
    <span className="shrink-0 text-[10px] font-medium text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded-full">
      {CATEGORY_LABELS[category]}
    </span>
  )
}

// ── Inline drawer ─────────────────────────────────────────────────────────────

function AttentionDrawer({ item }: { item: AttentionItem }) {
  return (
    <div className="border-t border-border bg-surface-raised rounded-b-xl px-5 py-4 space-y-4">
      {/* Player context */}
      {item.playerName && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Player</p>
            <p className="text-sm font-semibold text-text-primary">{item.playerName}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {item.currentLevel && (
                <span className="text-[11px] font-mono text-lime">{item.currentLevel}</span>
              )}
              {item.groupName && (
                <span className="text-[11px] text-text-muted">{item.groupName}</span>
              )}
              {item.coachName && (
                <span className="text-[11px] text-text-muted">Coach: {item.coachName}</span>
              )}
            </div>
          </div>
          {item.playerId && (
            <Link
              href={`/director/players/${item.playerId}`}
              className="shrink-0 text-xs text-lime hover:opacity-80 font-medium flex items-center gap-1"
            >
              Profile <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Reason */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold mb-1">Reason</p>
        <p className="text-sm text-text-secondary">{item.reason}</p>
      </div>

      {/* Recommended action */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold mb-1">Recommended Action</p>
        <p className="text-sm font-semibold text-text-primary">{item.recommendedAction}</p>
      </div>

      {/* DONNA explanation */}
      <div className="rounded-xl border border-lime/15 bg-lime/5 px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-lime font-semibold mb-1">DONNA</p>
        <p className="text-sm text-text-secondary italic">{item.donnaExplanation}</p>
      </div>

      {/* Action link */}
      <Link
        href={item.href}
        className="inline-flex items-center gap-1.5 text-xs text-lime hover:opacity-80 font-medium transition-opacity"
      >
        {item.category === 'placement_review_needed' || item.category === 'coach_followup_needed' || item.category === 'parent_update_pending'
          ? 'Open Review Queue'
          : item.playerName
          ? `Go to ${item.playerName}'s profile`
          : 'View in workflow'}
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

// ── Queue row ─────────────────────────────────────────────────────────────────

function AttentionRow({
  item,
  isOpen,
  onToggle,
}: {
  item: AttentionItem
  isOpen: boolean
  onToggle: () => void
}) {
  const priorityIcon = {
    high:   <AlertCircle className="w-4 h-4 text-status-red shrink-0" />,
    medium: <Clock className="w-4 h-4 text-status-orange shrink-0" />,
    low:    <Info className="w-4 h-4 text-text-muted shrink-0" />,
  }

  return (
    <div className={`rounded-xl border transition-colors ${isOpen ? 'border-border' : 'border-border hover:border-border'} bg-surface`}>
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
        aria-expanded={isOpen}
      >
        {priorityIcon[item.priority]}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {item.playerName && (
              <span className="text-sm font-semibold text-text-primary">{item.playerName}</span>
            )}
            <PriorityBadge priority={item.priority} />
            <CategoryBadge category={item.category} />
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{item.reason}</p>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && <AttentionDrawer item={item} />}
    </div>
  )
}

// ── Filter chips ──────────────────────────────────────────────────────────────

const ALL_FILTERS: AttentionFilter[] = ['all', 'players', 'reassessment', 'onboarding', 'placements', 'parent-updates', 'coach']

function FilterChips({
  activeFilter,
  items,
  onFilter,
}: {
  activeFilter: AttentionFilter
  items: AttentionItem[]
  onFilter: (f: AttentionFilter) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ALL_FILTERS.map(f => {
        const count = f === 'all' ? items.length : filterAttentionItems(items, f).length
        if (count === 0 && f !== 'all') return null
        const isActive = activeFilter === f
        return (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
              isActive
                ? 'bg-lime text-base border-lime'
                : 'bg-surface border-border text-text-muted hover:border-text-muted'
            }`}
          >
            {FILTER_LABELS[f]}
            {count > 0 && (
              <span className={`ml-1.5 font-mono ${isActive ? 'text-base' : ''}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyAttentionState({ filter }: { filter: AttentionFilter }) {
  return (
    <div className="rounded-xl border border-status-green/20 bg-status-green/5 px-6 py-10 text-center space-y-3">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-status-green/10 border border-status-green/20 mx-auto">
        <span className="text-status-green text-lg">✓</span>
      </div>
      <div>
        {filter === 'all' ? (
          <>
            <p className="text-sm font-semibold text-text-primary">No urgent academy issues today.</p>
            <p className="text-xs text-text-muted mt-1">
              Recommended focus: curriculum execution and coach development.
            </p>
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            No items in this category. Select <strong>All</strong> to see the full queue.
          </p>
        )}
      </div>
      {filter === 'all' && (
        <div className="rounded-xl border border-lime/15 bg-lime/5 px-4 py-3 text-left max-w-sm mx-auto">
          <p className="text-[10px] uppercase tracking-widest text-lime font-semibold mb-1">DONNA</p>
          <p className="text-xs text-text-secondary italic">
            No urgent academy issues today. Recommended focus: curriculum execution and coach development.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

interface AttentionQueueClientProps {
  items: AttentionItem[]
  initialFilter: AttentionFilter
}

export function AttentionQueueClient({ items, initialFilter }: AttentionQueueClientProps) {
  const [activeFilter, setActiveFilter] = useState<AttentionFilter>(initialFilter)
  const [openItemId, setOpenItemId] = useState<string | null>(null)

  const visibleItems = filterAttentionItems(items, activeFilter)

  const highCount = visibleItems.filter(i => i.priority === 'high').length
  const medCount = visibleItems.filter(i => i.priority === 'medium').length

  function toggleItem(id: string) {
    setOpenItemId(prev => (prev === id ? null : id))
  }

  return (
    <div className="space-y-4">
      {/* Filter chips — Sprint 1551: data-donna-focus-id for DONNA filter highlight */}
      <div data-donna-focus-id="attention-filter-bar">
        <FilterChips
          activeFilter={activeFilter}
          items={items}
          onFilter={f => { setActiveFilter(f); setOpenItemId(null) }}
        />
      </div>

      {/* Summary line */}
      {visibleItems.length > 0 && (
        <p className="text-xs text-text-muted">
          {highCount > 0 && <span className="text-status-red font-medium">{highCount} high priority</span>}
          {highCount > 0 && medCount > 0 && <span className="text-text-muted"> · </span>}
          {medCount > 0 && <span className="text-status-orange font-medium">{medCount} medium</span>}
          {(highCount > 0 || medCount > 0) && visibleItems.length - highCount - medCount > 0 && (
            <span className="text-text-muted"> · {visibleItems.length - highCount - medCount} low</span>
          )}
          {highCount === 0 && medCount === 0 && (
            <span>{visibleItems.length} item{visibleItems.length !== 1 ? 's' : ''}</span>
          )}
          <span className="text-text-muted"> — click any row to expand</span>
        </p>
      )}

      {/* Queue list — Sprint 1551: data-donna-focus-id for DONNA list + item highlight */}
      {visibleItems.length === 0 ? (
        <EmptyAttentionState filter={activeFilter} />
      ) : (
        <div className="space-y-2" data-donna-focus-id="attention-items-list">
          {visibleItems.map(item => (
            <div key={item.id} data-donna-focus-id={`attention-item-${item.id}`}>
              <AttentionRow
                item={item}
                isOpen={openItemId === item.id}
                onToggle={() => toggleItem(item.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
