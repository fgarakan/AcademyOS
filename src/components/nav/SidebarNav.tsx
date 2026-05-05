'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, BookOpen, Calendar,
  Trophy, Brain, BarChart3, Settings, LogOut, Dumbbell, ClipboardList, FlaskConical,
  ChevronRight, LayoutTemplate, Sparkles, Terminal, UserPlus,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

const FOUNDATION_ITEMS = [
  { label: 'Dashboard',       href: '/director',                   icon: LayoutDashboard },
  { label: 'Players',         href: '/director/players',           icon: Users },
  { label: 'Placement',       href: '/director/placement',         icon: UserPlus },
  { label: 'Curriculum',      href: '/director/curriculum',        icon: BookOpen },
  { label: 'Class Templates', href: '/director/class-templates',   icon: LayoutTemplate },
  { label: 'Fitness OS',      href: '/director/fitness/templates', icon: Dumbbell },
  { label: 'Sessions',        href: '/director/sessions',          icon: Calendar },
  { label: 'Review Queue',    href: '/director/review',            icon: ClipboardList },
]

const INTELLIGENCE_ITEMS = [
  { label: 'Command Center', href: '/director/command-center', icon: Terminal },
  { label: 'AI Suggestions', href: '/director/ai-suggestions', icon: Sparkles },
  { label: 'Intelligence',   href: '/director/intelligence',   icon: Brain },
  { label: 'Competition',    href: '/director/competition',    icon: Trophy },
  { label: 'Reports',        href: '/director/reports',        icon: BarChart3 },
]

const SYSTEM_ITEMS = [
  { label: 'Configuration', href: '/director/configuration', icon: Settings },
  { label: 'Demo Tour',     href: '/director/demo',          icon: FlaskConical },
]

interface SidebarNavProps {
  academyName?: string
  pendingCount?: number
  userEmail?: string
  userDisplayName?: string
}

function NavItem({
  item,
  isActive,
  badge,
}: {
  item: { label: string; href: string; icon: React.ElementType }
  isActive: boolean
  badge?: number
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-lime/10 text-lime border border-lime/20'
          : 'text-text-muted hover:text-text-secondary hover:bg-surface-raised border border-transparent'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-lime rounded-r-full" />
      )}
      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-lime' : 'text-text-muted group-hover:text-text-secondary')} />
      <span className="flex-1">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-status-red text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-[0.12em] font-semibold text-text-muted/60 select-none">
      {label}
    </p>
  )
}

export function SidebarNav({
  academyName = 'Academy OS',
  pendingCount = 0,
  userEmail,
  userDisplayName,
}: SidebarNavProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/director') return pathname === '/director'
    return pathname.startsWith(href)
  }

  const initials = userDisplayName ? getInitials(userDisplayName) : 'AD'
  const displayName = userDisplayName ?? 'Academy Director'
  const emailLabel = userEmail ?? ''

  return (
    <nav
      className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Logo block */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-lime/15 border border-lime/25 flex items-center justify-center">
            <span className="text-lime text-[11px] font-bold">A</span>
          </div>
          <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-text-muted">Academy OS</span>
        </div>
        <p className="font-semibold text-sm text-text-primary truncate">{academyName}</p>
        <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest bg-lime/10 text-lime border border-lime/20">
          Director
        </span>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">

        <SectionLabel label="Foundation" />
        {FOUNDATION_ITEMS.map(item => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            badge={item.label === 'Review Queue' ? pendingCount : undefined}
          />
        ))}

        <SectionLabel label="Intelligence" />
        {INTELLIGENCE_ITEMS.map(item => (
          <NavItem key={item.href} item={item} isActive={isActive(item.href)} />
        ))}

        <SectionLabel label="System" />
        {SYSTEM_ITEMS.map(item => (
          <NavItem key={item.href} item={item} isActive={isActive(item.href)} />
        ))}

      </div>

      {/* User card + sign out */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
          {/* Circular initials avatar */}
          <div className="w-8 h-8 rounded-full bg-lime/15 border border-lime/25 flex items-center justify-center shrink-0">
            <span className="text-lime text-[11px] font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate leading-tight">{displayName}</p>
            {emailLabel && (
              <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">{emailLabel}</p>
            )}
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              title="Sign out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-status-red hover:bg-status-red/10 transition-all duration-100"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
