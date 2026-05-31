'use client'

import { ChevronDown, ChevronRight, CheckCircle2, Circle, Plus } from 'lucide-react'

// Shared collapsible block row for Fitness Builder and Class Builder.
// Renders a summary header row in collapsed state, wraps children in expanded state.
// All collapse/expand state lives in the parent — this is a pure display component.

export interface CollapsibleBlockRowProps {
  index: number
  name: string
  // Tailwind text color class for the block name accent (e.g. 'text-lime', 'text-status-blue')
  accentClass: string
  // Tailwind border color class for left-edge accent (e.g. 'border-lime/30')
  borderAccentClass: string
  durationMin: number | null
  // Number of items in the block (exercises, activities, drills)
  itemCount: number
  // Singular label for items (e.g. 'exercise', 'activity')
  itemLabel: string
  // Whether this block is considered complete (all required items present)
  isComplete: boolean
  // Short phrase describing the block's purpose/intent (e.g. 'Rhythm & hand-eye')
  intentHint: string | null
  isExpanded: boolean
  onToggle: () => void
  // Optional quick action shown on the collapsed row (e.g. "+ Add Exercise")
  quickActionLabel?: string
  onQuickAction?: () => void
  quickActionDisabled?: boolean
  children?: React.ReactNode
}

export function CollapsibleBlockRow({
  index,
  name,
  accentClass,
  borderAccentClass,
  durationMin,
  itemCount,
  itemLabel,
  isComplete,
  intentHint,
  isExpanded,
  onToggle,
  quickActionLabel,
  onQuickAction,
  quickActionDisabled = false,
  children,
}: CollapsibleBlockRowProps) {
  const completionIcon = isComplete
    ? <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
    : <Circle className="w-3.5 h-3.5 text-text-muted shrink-0" />

  const countText = itemCount === 0
    ? `0 ${itemLabel}s`
    : `${itemCount} ${itemLabel}${itemCount !== 1 ? 's' : ''}`

  return (
    <div className={[
      'rounded-xl border transition-colors',
      isExpanded
        ? `border-l-2 ${borderAccentClass} border-t-border border-r-border border-b-border bg-surface`
        : 'border-border bg-surface hover:border-border/80',
    ].join(' ')}>

      {/* Summary row — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-3 text-left group"
        aria-expanded={isExpanded}
      >
        {/* Step number */}
        <span className="text-[10px] font-mono text-text-muted w-5 shrink-0 text-center select-none">
          {index + 1}
        </span>

        {/* Completion indicator */}
        {completionIcon}

        {/* Block name + intent */}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold ${accentClass} truncate`}>
            {name}
          </span>
          {intentHint && (
            <span className="text-[10px] text-text-muted truncate hidden sm:block">
              {intentHint}
            </span>
          )}
        </div>

        {/* Duration + count */}
        <div className="flex items-center gap-3 shrink-0">
          {durationMin != null && (
            <span className="text-[10px] text-text-muted tabular-nums">
              {durationMin}m
            </span>
          )}
          <span className={[
            'text-[10px] tabular-nums',
            isComplete ? 'text-status-green' : itemCount > 0 ? 'text-text-secondary' : 'text-text-muted',
          ].join(' ')}>
            {countText}
          </span>
        </div>

        {/* Quick action — only shown in collapsed state */}
        {!isExpanded && quickActionLabel && onQuickAction && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onQuickAction() }}
            disabled={quickActionDisabled}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-lime border border-border hover:border-lime/30 rounded px-2 py-0.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="w-3 h-3" />
            {quickActionLabel}
          </button>
        )}

        {/* Chevron */}
        <span className="text-text-muted group-hover:text-text-secondary transition-colors shrink-0">
          {isExpanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && children && (
        <div className="border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}
