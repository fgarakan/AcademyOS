import { cn } from '@/lib/utils'

type Status = 'action_needed' | 'needs_attention' | 'check_in' | 'on_track' | 'complete' | 'building' | 'warning' | 'info'

const styles: Record<Status, string> = {
  action_needed:   'bg-status-red/10 text-status-red border border-status-red/25',
  needs_attention: 'bg-status-orange/10 text-status-orange border border-status-orange/25',
  check_in:        'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25',
  on_track:        'bg-surface-raised text-text-secondary border border-border',
  complete:        'bg-lime/10 text-lime border border-lime/25',
  building:        'bg-surface-raised text-text-muted border border-border',
  warning:         'bg-status-orange/10 text-status-orange border border-status-orange/25',
  info:            'bg-blue-500/10 text-blue-400 border border-blue-500/25',
}

const labels: Record<Status, string> = {
  action_needed:   'Action needed',
  needs_attention: 'Needs attention',
  check_in:        'Check in',
  on_track:        'On track',
  complete:        'Complete',
  building:        'Building',
  warning:         'Warning',
  info:            'Info',
}

interface StatusBadgeProps {
  status: Status
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, label, className, size = 'sm' }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      styles[status],
      className
    )}>
      {label ?? labels[status]}
    </span>
  )
}

/** Convert urgency string from DB to StatusBadge status */
export function urgencyToStatus(urgency: string | null): Status {
  switch (urgency) {
    case 'immediate': return 'action_needed'
    case 'urgent':    return 'needs_attention'
    case 'high':      return 'check_in'
    default:          return 'on_track'
  }
}
