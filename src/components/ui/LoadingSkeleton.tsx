import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn(
      'bg-surface-raised rounded animate-skeleton',
      className
    )} />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-surface border border-border rounded-2xl p-5 space-y-3', className)}>
      <LoadingSkeleton className="h-3 w-24" />
      <LoadingSkeleton className="h-8 w-16" />
      <LoadingSkeleton className="h-3 w-32" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <LoadingSkeleton className="w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton className="h-3 w-32" />
        <LoadingSkeleton className="h-3 w-48" />
      </div>
      <LoadingSkeleton className="h-5 w-20 rounded-full" />
    </div>
  )
}
