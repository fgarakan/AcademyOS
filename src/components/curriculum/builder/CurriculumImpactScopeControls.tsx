'use client'

import { Filter } from 'lucide-react'

export type ImpactScope = 'this_level' | 'this_stage' | 'all_levels'

interface Props {
  scope: ImpactScope
  onChange: (scope: ImpactScope) => void
}

const SCOPE_OPTIONS: { value: ImpactScope; label: string; description: string }[] = [
  { value: 'this_level',  label: 'This level only', description: 'Players currently enrolled at this level' },
  { value: 'this_stage',  label: 'This stage',      description: 'All levels in the same development stage' },
  { value: 'all_levels',  label: 'All levels',      description: 'Academy-wide impact across all 15 levels' },
]

export function CurriculumImpactScopeControls({ scope, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-text-muted" />
        <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Impact scope</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {SCOPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.description}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-colors ${
              scope === opt.value
                ? 'bg-lime text-base border-lime'
                : 'bg-surface border-border text-text-secondary hover:border-lime/40 hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-text-muted">
        {SCOPE_OPTIONS.find(o => o.value === scope)?.description}
      </p>
    </div>
  )
}
