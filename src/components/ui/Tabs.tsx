'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TabsCtx = createContext<{ active: string; set: (v: string) => void }>({
  active: '', set: () => {}
})

export function Tabs({
  defaultValue,
  children,
  className,
  onChange,
}: {
  defaultValue: string
  children: ReactNode
  className?: string
  onChange?: (value: string) => void
}) {
  const [active, setActive] = useState(defaultValue)
  const set = (v: string) => { setActive(v); onChange?.(v) }
  return (
    <TabsCtx.Provider value={{ active, set }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ children, className, scrollable = false }: {
  children: ReactNode
  className?: string
  scrollable?: boolean
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-0.5',
        scrollable && 'overflow-x-auto scrollbar-none',
        className
      )}
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className }: {
  value: string
  children: ReactNode
  className?: string
}) {
  const { active, set } = useContext(TabsCtx)
  const isActive = active === value
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => set(value)}
      className={cn(
        'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-150 border-b-2 -mb-px',
        isActive
          ? 'text-lime border-lime'
          : 'text-text-muted border-transparent hover:text-text-secondary hover:border-border',
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: {
  value: string
  children: ReactNode
  className?: string
}) {
  const { active } = useContext(TabsCtx)
  if (active !== value) return null
  return <div className={cn('animate-fade-in', className)}>{children}</div>
}
