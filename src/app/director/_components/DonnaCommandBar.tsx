'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

const COMMAND_CHIPS: { label: string; href: string }[] = [
  { label: 'What should I do today?',   href: '/director/donna?q=what-should-i-do-today' },
  { label: 'Who needs attention?',       href: '/director/donna?q=who-needs-attention' },
  { label: 'What changed?',             href: '/director/donna?q=what-changed' },
  { label: 'What should we improve?',   href: '/director/donna?q=what-should-we-improve' },
  { label: 'Review approvals',          href: '/director/review' },
]

export function DonnaCommandBar() {
  return (
    <div className="hidden lg:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-30 items-center gap-2 px-3 py-2 rounded-2xl border border-border bg-surface shadow-lg shadow-black/40 ml-30">
      <MessageSquare className="w-3.5 h-3.5 text-lime shrink-0" />
      <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mr-1">
        Ask DONNA
      </span>
      {COMMAND_CHIPS.map(chip => (
        <Link
          key={chip.href}
          href={chip.href}
          className="px-3 py-1.5 rounded-lg border border-border bg-surface-raised text-[11px] text-text-secondary hover:text-lime hover:border-lime/30 hover:bg-lime/5 transition-all duration-100 whitespace-nowrap"
        >
          {chip.label}
        </Link>
      ))}
    </div>
  )
}
