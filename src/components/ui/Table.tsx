import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {children}
    </thead>
  )
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y" style={{ '--tw-divide-opacity': '1', borderColor: 'var(--border-subtle)' } as React.CSSProperties}>{children}</tbody>
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-100',
        onClick && 'cursor-pointer hover:bg-surface-raised',
        className
      )}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left label-xs text-text-muted font-medium', className)}>
      {children}
    </th>
  )
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3.5 text-text-secondary', className)}>
      {children}
    </td>
  )
}
