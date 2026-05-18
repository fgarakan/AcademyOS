'use client'

interface Props {
  selectedDomain: string | null
  onChange: (domain: string | null) => void
  availableDomains: string[]
}

export function DrillDomainFilter({ selectedDomain, onChange, availableDomains }: Props) {
  if (availableDomains.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Domain</p>
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors ${
          selectedDomain === null
            ? 'bg-lime/15 text-lime border-lime/30'
            : 'bg-surface border-border text-text-muted hover:border-lime/30'
        }`}
      >
        All
      </button>
      {availableDomains.map(domain => (
        <button
          key={domain}
          onClick={() => onChange(domain === selectedDomain ? null : domain)}
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors capitalize ${
            selectedDomain === domain
              ? 'bg-lime/15 text-lime border-lime/30'
              : 'bg-surface border-border text-text-muted hover:border-lime/30'
          }`}
        >
          {domain}
        </button>
      ))}
    </div>
  )
}
