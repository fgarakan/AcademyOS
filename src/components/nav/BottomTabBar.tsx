'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface TabItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

export function BottomTabBar({ items }: { items: TabItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 safe-area-bottom">
      <div className="flex">
        {items.map(item => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors duration-100',
                isActive ? 'text-lime' : 'text-text-muted'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
