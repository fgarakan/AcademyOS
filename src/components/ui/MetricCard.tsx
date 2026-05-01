import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'
import Link from 'next/link'

interface MetricCardProps {
  label: string
  value: string | number
  sublabel?: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'alert' | 'warning' | 'positive'
  className?: string
  action?: string
  icon?: ReactNode
}

const variants = {
  default:  { number: 'text-lime',         ring: 'border-border' },
  alert:    { number: 'text-status-red',   ring: 'border-status-red/25' },
  warning:  { number: 'text-status-orange', ring: 'border-status-orange/25' },
  positive: { number: 'text-status-green', ring: 'border-status-green/25' },
}

export function MetricCard({
  label,
  value,
  sublabel,
  href,
  onClick,
  variant = 'default',
  className,
  action,
  icon,
}: MetricCardProps) {
  const v = variants[variant]

  const inner = (
    <div
      className={cn(
        'bg-surface border rounded-2xl p-5 flex flex-col gap-2',
        'transition-all duration-150',
        (href || onClick) && 'cursor-pointer hover:border-lime/25 hover:shadow-cyan',
        v.ring,
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="label-xs">{label}</p>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>
      <p className={cn('font-mono font-bold leading-none', v.number,
        typeof value === 'number' && value > 99 ? 'text-4xl' : 'text-5xl'
      )}>
        {value}
      </p>
      {sublabel && <p className="text-text-secondary text-xs">{sublabel}</p>}
      {action && (
        <p className="text-lime text-xs font-medium mt-auto">{action} →</p>
      )}
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
