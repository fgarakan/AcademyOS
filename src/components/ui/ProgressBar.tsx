import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number       // 0–100
  max?: number
  label?: string
  sublabel?: string
  variant?: 'lime' | 'muted' | 'orange' | 'red'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showValue?: boolean
}

const trackColors = {
  lime:   'bg-lime/20',
  muted:  'bg-surface-raised',
  orange: 'bg-status-orange/20',
  red:    'bg-status-red/20',
}

const fillColors = {
  lime:   'bg-lime',
  muted:  'bg-text-muted',
  orange: 'bg-status-orange',
  red:    'bg-status-red',
}

const heights = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
}

export function ProgressBar({
  value,
  max = 100,
  label,
  sublabel,
  variant = 'lime',
  size = 'md',
  className,
  showValue = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showValue && (
            <span className="text-xs font-mono text-lime">{value}/{max}</span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full overflow-hidden', heights[size], trackColors[variant])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', fillColors[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {sublabel && (
        <p className="text-[11px] text-text-muted mt-1">{sublabel}</p>
      )}
    </div>
  )
}
