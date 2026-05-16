'use client'

interface DonnaOpenChipProps {
  prompt: string
}

export function DonnaOpenChip({ prompt }: DonnaOpenChipProps) {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent('donna:open', { detail: { prompt } })
    )
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] text-text-secondary bg-surface-raised border border-border hover:border-lime/40 hover:text-text-primary transition-colors cursor-pointer"
    >
      {prompt}
    </button>
  )
}
