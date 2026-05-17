'use client'

import { ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Props {
  title: string
  subtitle?: string
  count?: number
  collapsible?: boolean
  defaultOpen?: boolean
  action?: ReactNode
  children: ReactNode
}

export function CurriculumSectionCard({
  title,
  subtitle,
  count,
  collapsible = false,
  defaultOpen = true,
  action,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div
        className={`flex items-center justify-between px-4 py-3 ${collapsible ? 'cursor-pointer hover:bg-surface-raised transition-colors' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <div className="flex items-center gap-3">
          {collapsible && (
            open
              ? <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
              : <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-text-primary">{title}</p>
              {count != null && (
                <span className="text-[10px] font-mono text-lime bg-lime/10 rounded-full px-2 py-0.5">
                  {count}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && (
          <div onClick={e => e.stopPropagation()}>
            {action}
          </div>
        )}
      </div>
      {open && (
        <div className="border-t border-border px-4 py-3">
          {children}
        </div>
      )}
    </div>
  )
}
