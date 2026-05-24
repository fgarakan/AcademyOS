import { SkeletonCard } from '@/components/ui'

export default function PlayerHomeLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-3 w-14 bg-surface-raised rounded animate-skeleton" />
        <div className="h-7 w-48 bg-surface-raised rounded animate-skeleton" />
        <div className="h-3.5 w-36 bg-surface-raised rounded animate-skeleton" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-surface-raised border border-border rounded-xl animate-skeleton" />
        ))}
      </div>

      {/* Mission card */}
      <SkeletonCard className="h-40" />

      {/* Level progress */}
      <SkeletonCard className="h-28" />

      {/* Today's challenge */}
      <SkeletonCard className="h-36" />

      {/* Badges */}
      <SkeletonCard className="h-32" />
    </div>
  )
}
