import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface Props {
  line1: string
  line2: string
  urgency: 'normal' | 'urgent'
  ctaLabel?: string
  ctaHref?: string
}

export function DirectorTodayDonnaBrief({ line1, line2, urgency, ctaLabel, ctaHref }: Props) {
  const borderClass = urgency === 'urgent' ? 'border-status-orange/30' : 'border-lime/20'
  const bgClass = urgency === 'urgent' ? 'bg-status-orange/[0.03]' : 'bg-lime/[0.03]'

  return (
    <div
      className={`rounded-2xl border ${borderClass} ${bgClass} p-4 space-y-2`}
      data-donna-focus-id="director-today-brief"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
        <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">DONNA · Today</p>
      </div>
      <p className="text-[13px] font-semibold text-text-primary leading-snug">{line1}</p>
      {line2 && (
        <p className="text-[12px] text-text-secondary leading-relaxed">{line2}</p>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity"
        >
          {ctaLabel} →
        </Link>
      )}
    </div>
  )
}
