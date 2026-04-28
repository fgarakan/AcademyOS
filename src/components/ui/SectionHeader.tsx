import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'
import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  action?: string
  actionHref?: string
  onAction?: () => void
  className?: string
  children?: ReactNode
}

export function SectionHeader({ title, action, actionHref, onAction, className, children }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <h2 className="label-xs">{title}</h2>
      <div className="flex items-center gap-3">
        {children}
        {action && actionHref && (
          <Link href={actionHref} className="text-lime text-xs font-medium hover:opacity-80 transition-opacity">
            {action} →
          </Link>
        )}
        {action && onAction && !actionHref && (
          <button onClick={onAction} className="text-lime text-xs font-medium hover:opacity-80 transition-opacity">
            {action} →
          </button>
        )}
      </div>
    </div>
  )
}
