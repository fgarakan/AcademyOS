'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  House,
  TrendingUp,
  Trophy,
  MessageCircle,
  Users,
  Calendar,
  Mic,
  User,
  Bell,
} from 'lucide-react'
import { type LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  home: House,
  progress: TrendingUp,
  wins: Trophy,
  messages: MessageCircle,
  players: Users,
  sessions: Calendar,
  voice: Mic,
  profile: User,
  updates: Bell,
}

interface TabItem {
  label: string
  href: string
  iconKey: string
  exact?: boolean
}

export function BottomTabBar({ items }: { items: TabItem[] }) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom"
      style={{
        background: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex">
        {items.map(item => {
          const Icon = ICON_MAP[item.iconKey]
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors duration-100',
                isActive ? 'text-lime' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {Icon && <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(17,217,223,0.4)]')} />}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
