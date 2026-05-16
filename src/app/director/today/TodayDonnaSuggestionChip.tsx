'use client'

interface TodayDonnaSuggestionChipProps {
  label: string
}

export function TodayDonnaSuggestionChip({ label }: TodayDonnaSuggestionChipProps) {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent('donna:open', { detail: { prompt: label } })
    )
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border hover:border-lime/40 hover:bg-surface transition-colors cursor-pointer text-left"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
      <p className="text-xs text-text-secondary group-hover:text-text-primary">{label}</p>
    </button>
  )
}
