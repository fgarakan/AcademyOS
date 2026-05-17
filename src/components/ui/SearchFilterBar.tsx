'use client'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface SearchFilterBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  filters?: ReactNode
  className?: string
}

export function SearchFilterBar({
  value,
  onChange,
  placeholder = 'Search...',
  filters,
  className,
}: SearchFilterBarProps) {
  return (
    <div className={cn('flex gap-2 flex-wrap', className)}>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-9 pr-4 py-2.5 rounded-xl text-sm',
            'bg-surface-raised border border-border',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-lime/25 focus:border-lime/40 transition-colors'
          )}
        />
      </div>
      {filters && (
        <div className="flex gap-2 flex-wrap">{filters}</div>
      )}
    </div>
  )
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-100',
        active
          ? 'bg-lime/10 border-lime/35 text-lime'
          : 'bg-surface-raised border-border text-text-muted hover:text-text-secondary hover:border-border-strong'
      )}
    >
      {label}
    </button>
  )
}
