'use client'

// DONNA UI Constitution — CollapsedDetailSection
//
// Wraps any complex content behind a "Show details" / "Hide details" toggle.
// Constitution rule: details are accessible but NOT visually dominant.
//
// Usage:
//   <CollapsedDetailSection label="Assessment History" count={5}>
//     <AssessmentHistoryCard ... />
//   </CollapsedDetailSection>

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'

interface CollapsedDetailSectionProps {
  /** Section label shown in the toggle button */
  label: string
  /** Optional count badge (e.g., "Assessment History (3)") */
  count?: number
  /** Whether to start expanded */
  defaultExpanded?: boolean
  /** The detail content — hidden by default */
  children: ReactNode
  /** Optional extra class on wrapper */
  className?: string
}

export function CollapsedDetailSection({
  label,
  count,
  defaultExpanded = false,
  children,
  className = '',
}: CollapsedDetailSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className={`border border-border rounded-xl overflow-hidden ${className}`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-surface hover:bg-surface-raised transition-colors text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary">{label}</span>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] font-mono text-text-muted bg-surface-raised border border-border rounded px-1.5 py-0.5">
              {count}
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-text-muted shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-surface border-t border-border space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}
