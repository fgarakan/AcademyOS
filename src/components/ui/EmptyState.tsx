import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center py-16 px-6',
      className
    )}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center mb-4 text-text-muted">
          {icon}
        </div>
      )}
      <p className="font-semibold text-text-primary mb-1">{title}</p>
      {description && (
        <p className="text-text-secondary text-sm max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
