import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className, onClick, hover = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface border border-border rounded-2xl transition-all duration-150',
        hover && 'cursor-pointer hover:border-lime/25 hover:shadow-cyan',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pt-5 pb-3', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pb-5', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-3', className)} style={{ borderTop: '1px solid var(--border-subtle)' }}>
      {children}
    </div>
  )
}
