'use client'
import { Search, Filter } from 'lucide-react'
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
    <div className={cn('flex gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-9 pr-4 py-2 rounded-xl text-sm',
            'bg-surface-raised border border-border',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:border-lime/50 transition-colors'
          )}
        />
      </div>
      {filters && (
        <div className="flex gap-2">{filters}</div>
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
      className={cn(
        'px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-100',
        active
          ? 'bg-lime/10 border-lime/40 text-lime'
          : 'bg-surface-raised border-border text-text-muted hover:text-text-secondary'
      )}
    >
      {label}
    </button>
  )
}
