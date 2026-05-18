'use client'

interface Props {
  selectedType: string | null
  onChange: (type: string | null) => void
  availableTypes: string[]
}

export function GateDomainFilter({ selectedType, onChange, availableTypes }: Props) {
  if (availableTypes.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Gate type</p>
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors ${
          selectedType === null
            ? 'bg-lime/15 text-lime border-lime/30'
            : 'bg-surface border-border text-text-muted hover:border-lime/30'
        }`}
      >
        All
      </button>
      {availableTypes.map(t => (
        <button
          key={t}
          onClick={() => onChange(t === selectedType ? null : t)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors capitalize ${
            selectedType === t
              ? 'bg-lime/15 text-lime border-lime/30'
              : 'bg-surface border-border text-text-muted hover:border-lime/30'
          }`}
        >
          {t.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  )
}
