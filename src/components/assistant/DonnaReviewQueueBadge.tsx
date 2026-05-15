'use client'

// Sprint 373 — Donna Review Queue Badge V1
// Shows pending review queue count with urgency coloring.
// Clicking calls the provided onOpen callback.

interface Props {
  count: number
  onOpen: () => void
}

export function DonnaReviewQueueBadge({ count, onOpen }: Props) {
  if (count === 0) return null

  const isUrgent = count > 3
  const badgeColor = isUrgent ? '#FF9500' : '#C8FF00'
  const badgeBg = isUrgent ? 'rgba(255,149,0,0.12)' : 'rgba(200,255,0,0.1)'
  const badgeBorder = isUrgent ? 'rgba(255,149,0,0.3)' : 'rgba(200,255,0,0.25)'

  return (
    <button
      onClick={onOpen}
      type="button"
      className="flex items-center gap-1.5 text-[11px] transition-all hover:opacity-80"
      style={{ color: badgeColor }}
    >
      <span
        className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 font-bold text-[10px]"
        style={{ background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor }}
      >
        {count > 99 ? '99+' : count}
      </span>
      <span>
        {count === 1 ? 'item' : 'items'} need review
      </span>
    </button>
  )
}
