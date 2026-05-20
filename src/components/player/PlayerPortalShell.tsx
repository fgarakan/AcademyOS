'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  House,
  Map,
  Zap,
  Trophy,
  Activity,
  ArrowUp,
  Dumbbell,
  Star,
  MessageCircle,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/player',                  icon: House,          label: 'Home',        exact: true },
  { href: '/player/missions',         icon: Map,            label: 'Missions' },
  { href: '/player/skill-path',       icon: Zap,            label: 'Skill Path' },
  { href: '/player/competition-path', icon: Trophy,         label: 'Competition' },
  { href: '/player/fitness-path',     icon: Activity,       label: 'Fitness' },
  { href: '/player/level-up',         icon: ArrowUp,        label: 'Level Up' },
  { href: '/player/practice',         icon: Dumbbell,       label: 'Practice' },
  { href: '/player/celebration',      icon: Star,           label: 'Achievements' },
  { href: '/player/ask-donna',        icon: MessageCircle,  label: 'Ask DONNA' },
]

interface PlayerPortalShellProps {
  children: React.ReactNode
  firstName?: string | null
  levelName?: string | null
}

function NavList({
  pathname,
  onItemClick,
}: {
  pathname: string
  onItemClick?: () => void
}) {
  return (
    <nav className="flex-1 px-3 py-3 overflow-y-auto">
      <div className="space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 py-2.5 rounded-lg text-sm transition-colors duration-100',
                isActive
                  ? 'bg-lime/10 text-lime border-l-[2px] border-lime px-[calc(0.875rem-2px)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised px-3.5'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function PlayerIdentity({
  firstName,
  levelName,
}: {
  firstName: string | null | undefined
  levelName: string | null | undefined
}) {
  if (!firstName && !levelName) return null
  const initials = firstName ? firstName.slice(0, 2).toUpperCase() : 'P'
  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-surface-raised border border-border flex items-center justify-center text-sm font-bold text-lime shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text-primary truncate">
            {firstName ?? 'Player'}
          </div>
          {levelName && (
            <div className="flex items-center gap-1 text-[11px] text-lime">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
              {levelName}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PlayerPortalShell({ children, firstName, levelName }: PlayerPortalShellProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const currentLabel =
    [...NAV_ITEMS].reverse().find(item =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    )?.label ?? 'Player Portal'

  return (
    <div className="min-h-screen flex bg-base">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-surface border-r border-border sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center shrink-0">
              <span className="text-base text-[10px] font-bold tracking-wider uppercase leading-none">
                AOS
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-lime leading-tight">
                AcademyOS
              </div>
              <div className="text-[11px] text-text-muted leading-tight">Player Portal</div>
            </div>
          </div>
        </div>

        <PlayerIdentity firstName={firstName} levelName={levelName} />

        <NavList pathname={pathname} />

        <div className="px-4 py-3 border-t border-border">
          <div className="text-[10px] text-text-muted">Keep training. Keep growing.</div>
        </div>
      </aside>

      {/* ── Mobile top header ───────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-lime flex items-center justify-center shrink-0">
            <span className="text-base text-[9px] font-bold tracking-wider uppercase leading-none">
              AOS
            </span>
          </div>
          <span className="text-sm font-semibold text-text-primary truncate">{currentLabel}</span>
        </div>
        <button
          onClick={() => setDrawerOpen(prev => !prev)}
          aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={drawerOpen}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0"
        >
          {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-64 h-full flex flex-col pt-[52px] bg-surface border-r border-border overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <PlayerIdentity firstName={firstName} levelName={levelName} />
            <NavList pathname={pathname} onItemClick={() => setDrawerOpen(false)} />
            <div className="px-4 py-3 border-t border-border">
              <div className="text-[10px] text-text-muted">Keep training. Keep growing.</div>
            </div>
          </div>
          <div className="flex-1 bg-black/50" />
        </div>
      )}

      {/* ── Content area ────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-x-hidden pt-[52px] lg:pt-0">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
