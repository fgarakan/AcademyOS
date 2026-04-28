'use client'
import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface ActionCardProps {
  title: string
  description?: string
  children?: ReactNode
  onAction?: () => void
  actionLabel?: string
  variant?: 'default' | 'alert' | 'warning' | 'opportunity'
  className?: string
  icon?: ReactNode
}

const variants = {
  default:     { border: 'border-border', dot: 'bg-text-muted', title: 'text-text-primary' },
  alert:       { border: 'border-status-red/30', dot: 'bg-status-red', title: 'text-white' },
  warning:     { border: 'border-status-orange/30', dot: 'bg-status-orange', title: 'text-white' },
  opportunity: { border: 'border-lime/30', dot: 'bg-lime', title: 'text-white' },
}

export function ActionCard({
  title,
  description,
  children,
  onAction,
  actionLabel = 'Open',
  variant = 'default',
  className,
  icon,
}: ActionCardProps) {
  const v = variants[variant]
  return (
    <div className={cn(
      'bg-surface border rounded-2xl p-5 flex gap-4 items-start animate-fade-in',
      v.border,
      className
    )}>
      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', v.dot)} />
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold', v.title)}>{title}</p>
        {description && (
          <p className="text-text-secondary text-sm mt-0.5">{description}</p>
        )}
        {children}
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="shrink-0 flex items-center gap-1 text-lime text-sm font-medium hover:opacity-80 transition-opacity"
        >
          {actionLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
