import { cn } from '@/lib/utils'
import { CheckCircle2, Clock } from 'lucide-react'

interface AdvancementStatusBadgeProps {
  eligible: boolean | null
  className?: string
}

export function AdvancementStatusBadge({ eligible, className }: AdvancementStatusBadgeProps) {
  if (eligible) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
        'bg-lime/15 text-lime border border-lime/30',
        className
      )}>
        <CheckCircle2 className="w-3 h-3" />
        Ready to advance
      </span>
    )
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
      'bg-surface-raised text-text-muted border border-border',
      className
    )}>
      <Clock className="w-3 h-3" />
      Building
    </span>
  )
}
