import { cn } from '@/lib/utils'
import { domainStatusToCoachLabel } from '@/lib/utils'

interface DomainRingProps {
  domain: string
  status: string
  outcomeCount?: number
  threshold?: number
  masteredAt?: string | null
  className?: string
  onClick?: () => void
  size?: 'sm' | 'md'
}

const DOMAIN_LABELS: Record<string, string> = {
  preparation:          'Preparation',
  downswing:            'Downswing',
  contact:              'Contact',
  finish:               'Finish',
  transition:           'Transition',
  movement:             'Movement',
  decision_making:      'Decision Making',
  competition_behavior: 'Competition',
}

export function DomainRing({ domain, status, outcomeCount = 0, threshold = 3, masteredAt, className, onClick, size = 'md' }: DomainRingProps) {
  const label = DOMAIN_LABELS[domain] ?? domain
  const statusLabel = domainStatusToCoachLabel(status)
  const pct = Math.min(100, threshold > 0 ? (outcomeCount / threshold) * 100 : 0)

  const r = size === 'md' ? 28 : 20
  const cx = size === 'md' ? 32 : 24
  const circumference = 2 * Math.PI * r
  const dash = (pct / 100) * circumference

  const strokeColor = status === 'complete' ? '#C8FF00' :
                      status === 'in_progress' ? '#C8FF0066' :
                      status === 'regressed' ? '#FF9500' : '#222222'

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-2xl border border-border bg-surface-raised',
        'transition-all duration-150',
        onClick && 'cursor-pointer hover:border-lime/30',
        size === 'md' && 'min-w-[88px]',
        size === 'sm' && 'min-w-[72px]',
        className
      )}
    >
      <svg
        width={cx * 2}
        height={cx * 2}
        className="rotate-[-90deg]"
      >
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#222" strokeWidth="3" />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
        {status === 'complete' && (
          <text
            x={cx} y={cx + 5}
            textAnchor="middle"
            className="rotate-90"
            style={{ transform: `rotate(90deg) translate(0px, -${cx * 2}px)`, transformOrigin: `${cx}px ${cx}px` }}
            fill="#C8FF00"
            fontSize="14"
            fontWeight="600"
          >
            ✓
          </text>
        )}
      </svg>
      <div className="text-center">
        <p className={cn(
          'font-medium leading-tight',
          size === 'md' ? 'text-[11px]' : 'text-[10px]'
        )}>
          {label}
        </p>
        <p className={cn(
          'leading-none mt-0.5',
          status === 'complete' ? 'text-lime' : 'text-text-muted',
          size === 'md' ? 'text-[10px]' : 'text-[9px]'
        )}>
          {statusLabel}
        </p>
      </div>
    </div>
  )
}
