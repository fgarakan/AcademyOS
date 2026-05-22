'use client'

// Sprint 661 — Director Mobile Command Center Pass V1
// Bottom navigation bar for director portal on mobile screens (hidden on lg+).
// Shows the most frequently accessed director routes.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, ClipboardList, Sparkles, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV_ITEMS = [
  { label: 'Home',    href: '/director',         icon: LayoutDashboard },
  { label: 'Today',   href: '/director/today',   icon: Sun },
  { label: 'Players', href: '/director/players', icon: Users },
  { label: 'Review',  href: '/director/review',  icon: ClipboardList },
  { label: 'DONNA',   href: '/director/donna',   icon: Sparkles },
]

interface Props {
  pendingCount?: number
}

export function DirectorMobileNav({ pendingCount = 0 }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/director') return pathname === '/director'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden"
      style={{ background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border-subtle)' }}
    >
      {MOBILE_NAV_ITEMS.map(item => {
        const active = isActive(item.href)
        const Icon = item.icon
        const showBadge = item.href === '/director/review' && pendingCount > 0
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-2.5 gap-0.5 relative transition-colors',
              active ? 'text-lime' : 'text-text-muted'
            )}
          >
            <span className="relative">
              <Icon className="w-5 h-5" />
              {showBadge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </span>
            <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-lime rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
