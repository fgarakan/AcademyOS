'use client'

import { Filter, Sparkles, X, Shield } from 'lucide-react'

export type ImpactScope = 'this_level' | 'all_groups' | 'academy_wide'

interface Props {
  scope: ImpactScope
  onChange: (scope: ImpactScope) => void
  onSaveAsDraft?: () => void
  onCancel?: () => void
  saving?: boolean
}

const SCOPE_OPTIONS: { value: ImpactScope; label: string; description: string; multiplier: string }[] = [
  {
    value: 'this_level',
    label: 'This level only',
    description: 'Players enrolled at this specific level',
    multiplier: '1×',
  },
  {
    value: 'all_groups',
    label: 'All groups at this level',
    description: 'All coach groups working at this level across the academy',
    multiplier: '~3×',
  },
  {
    value: 'academy_wide',
    label: 'Academy-wide',
    description: 'Every active player across all levels',
    multiplier: '15×',
  },
]

export function CurriculumImpactScopeControls({ scope, onChange, onSaveAsDraft, onCancel, saving }: Props) {
  const selected = SCOPE_OPTIONS.find(o => o.value === scope)

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-text-muted" />
        <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">Impact scope</p>
      </div>

      {/* Scope buttons */}
      <div className="px-4 py-3 space-y-2">
        {SCOPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
              scope === opt.value
                ? 'border-lime/30 bg-lime/[0.06]'
                : 'border-border bg-surface-raised hover:border-border/60'
            }`}
          >
            <div className="min-w-0">
              <p className={`text-[12px] font-semibold ${scope === opt.value ? 'text-lime' : 'text-text-secondary'}`}>
                {opt.label}
              </p>
              <p className="text-[10px] text-text-muted leading-relaxed mt-0.5">{opt.description}</p>
            </div>
            <span className={`text-[11px] font-mono shrink-0 ${scope === opt.value ? 'text-lime' : 'text-text-muted'}`}>
              {opt.multiplier}
            </span>
          </button>
        ))}

        {/* Active scope note */}
        {selected && (
          <p className="text-[10px] text-text-muted pt-1">
            Scope: <span className="text-text-secondary font-semibold">{selected.label}</span> — {selected.description.toLowerCase()}.
          </p>
        )}
      </div>

      {/* Actions */}
      {(onSaveAsDraft || onCancel) && (
        <div className="px-4 py-3 border-t border-border space-y-2">
          <div className="flex items-start gap-2 mb-3">
            <Shield className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-muted leading-relaxed">
              Saving as draft queues this change for director review. Nothing is applied automatically.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onSaveAsDraft && (
              <button
                onClick={onSaveAsDraft}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: '#C8FF00', color: '#0A0A0A' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save as draft'}
              </button>
            )}
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-text-muted hover:text-text-secondary border border-border transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
