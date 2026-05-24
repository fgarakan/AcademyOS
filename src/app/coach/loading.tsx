import { SkeletonCard } from '@/components/ui'

export default function CoachHomeLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-3 w-16 bg-surface-raised rounded animate-skeleton" />
        <div className="h-7 w-52 bg-surface-raised rounded animate-skeleton" />
        <div className="h-3.5 w-40 bg-surface-raised rounded animate-skeleton" />
      </div>

      {/* Next session card */}
      <SkeletonCard className="h-36" />

      {/* Stat row */}
      <div className="flex gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 h-16 bg-surface-raised border border-border rounded-xl animate-skeleton" />
        ))}
      </div>

      {/* Today section */}
      <SkeletonCard className="h-44" />

      {/* Watchlist */}
      <SkeletonCard className="h-32" />

      {/* Quick capture */}
      <SkeletonCard className="h-24" />
    </div>
  )
}
