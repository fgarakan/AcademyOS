'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Globe, Building2, Users, CreditCard, BookOpen, LogOut, Shield,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Tenants', href: '/platform', icon: Globe, exact: true },
]

const COMING_SOON_ITEMS = [
  { label: 'Tenant Management', icon: Building2 },
  { label: 'Consultant Access',  icon: Users },
  { label: 'Billing',            icon: CreditCard },
  { label: 'Global Templates',   icon: BookOpen },
]

interface PlatformNavProps {
  role?: string
}

export function PlatformNav({ role = 'platform_owner' }: PlatformNavProps) {
  const pathname = usePathname()
  const roleLabel = role === 'platform_owner' ? 'Platform Owner' : 'Platform Admin'

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex flex-col z-40">

      {/* Brand */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[11px] uppercase tracking-widest text-text-muted font-medium">
            Angles Platform
          </p>
        </div>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-lime/10 text-lime border border-lime/20">
          {roleLabel}
        </span>
      </div>

      {/* Primary nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
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
              </Link>
            )
          })}
        </div>

        <div className="my-3 border-t border-border" />

        <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-text-muted">
          Coming Soon
        </p>
        <div className="space-y-0.5">
          {COMING_SOON_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted opacity-40 cursor-not-allowed select-none"
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </div>
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
