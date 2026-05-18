'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

export interface CurriculumFilterState {
  domains: string[]
  stages: string[]
  types: string[]
}

export const EMPTY_FILTERS: CurriculumFilterState = { domains: [], stages: [], types: [] }

interface FilterGroupProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  format?: (v: string) => string
}

function FilterGroup({ label, options, selected, onChange, format = v => v.replace(/_/g, ' ') }: FilterGroupProps) {
  if (options.length === 0) return null

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold shrink-0">{label}</p>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors capitalize ${
            selected.includes(opt)
              ? 'bg-lime/15 text-lime border-lime/30'
              : 'bg-surface border-border text-text-muted hover:border-lime/30 hover:text-text-secondary'
          }`}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  )
}

interface Props {
  filters: CurriculumFilterState
  onChange: (filters: CurriculumFilterState) => void
  availableDomains?: string[]
  availableStages?: string[]
  availableTypes?: string[]
  showStages?: boolean
}

function activeCount(filters: CurriculumFilterState): number {
  return filters.domains.length + filters.stages.length + filters.types.length
}

export function CurriculumFilters({
  filters,
  onChange,
  availableDomains = [],
  availableStages = [],
  availableTypes = [],
  showStages = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const count = activeCount(filters)

  function clear() { onChange(EMPTY_FILTERS) }

  return (
    <div className="space-y-2">
      {/* Toggle bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border text-[11px] font-semibold transition-colors ${
            open ? 'border-lime/30 bg-lime/[0.06] text-lime' : 'border-border bg-surface text-text-secondary hover:border-lime/30'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {count > 0 && (
            <span className="ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-lime text-base leading-none">
              {count}
            </span>
          )}
        </button>

        {count > 0 && (
          <button
            onClick={clear}
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter panels */}
      {open && (
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-3">
          <FilterGroup
            label="Domain"
            options={availableDomains}
            selected={filters.domains}
            onChange={domains => onChange({ ...filters, domains })}
          />
          {showStages && (
            <FilterGroup
              label="Stage"
              options={availableStages}
              selected={filters.stages}
              onChange={stages => onChange({ ...filters, stages })}
            />
          )}
          <FilterGroup
            label="Type"
            options={availableTypes}
            selected={filters.types}
            onChange={types => onChange({ ...filters, types })}
          />
        </div>
      )}
    </div>
  )
}

// Utility: apply CurriculumFilterState to a list of objects
export function applyFilters<T extends { domain?: string; stage?: string; gate_type?: string }>(
  items: T[],
  filters: CurriculumFilterState,
): T[] {
  return items.filter(item => {
    if (filters.domains.length > 0 && !filters.domains.includes(item.domain ?? '')) return false
    if (filters.stages.length > 0 && !filters.stages.includes(item.stage ?? '')) return false
    if (filters.types.length > 0 && !filters.types.includes(item.gate_type ?? '')) return false
    return true
  })
}
