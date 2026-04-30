'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, BookOpen, Calendar,
  Trophy, Brain, BarChart3, Settings, LogOut, Dumbbell
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/director',                        icon: LayoutDashboard },
  { label: 'Players',      href: '/director/players',                icon: Users },
  { label: 'Curriculum',   href: '/director/curriculum',             icon: BookOpen },
  { label: 'Fitness',      href: '/director/fitness/templates',      icon: Dumbbell },
  { label: 'Sessions',     href: '/director/sessions',               icon: Calendar },
  { label: 'Competition',  href: '/director/competition',            icon: Trophy },
]
const SECONDARY_ITEMS = [
  { label: 'Intelligence', href: '/director/intelligence',   icon: Brain },
  { label: 'Reports',      href: '/director/reports',        icon: BarChart3 },
  { label: 'Configuration',href: '/director/configuration',  icon: Settings },
]

interface SidebarNavProps {
  academyName?: string
  pendingCount?: number
}

export function SidebarNav({ academyName = 'Academy OS', pendingCount = 0 }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <p className="text-[11px] uppercase tracking-widest text-text-muted font-medium">Academy OS</p>
        <p className="font-semibold text-sm mt-0.5 truncate">{academyName}</p>
      </div>

      {/* Primary nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = item.href === '/director'
              ? pathname === '/director'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-100',
                  isActive
                    ? 'bg-lime/10 text-lime'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-raised'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {item.label === 'Players' && pendingCount > 0 && (
                  <span className="ml-auto bg-status-red text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        <div className="my-3 border-t border-border" />

        <div className="space-y-0.5">
          {SECONDARY_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-100',
                  isActive
                    ? 'bg-lime/10 text-lime'
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface-raised'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Sign out */}
      <div className="p-2 border-t border-border">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-secondary hover:bg-surface-raised transition-all duration-100"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
