import { SkeletonCard } from '@/components/ui'

export default function DirectorHomeLoading() {
  return (
    <div className="p-6 space-y-6 animate-skeleton">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 w-20 bg-surface-raised rounded animate-skeleton" />
        <div className="h-8 w-64 bg-surface-raised rounded animate-skeleton" />
        <div className="h-4 w-48 bg-surface-raised rounded animate-skeleton" />
      </div>

      {/* Command center / attention queue hero */}
      <SkeletonCard className="h-48" />

      {/* Quick actions strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-surface-raised border border-border rounded-2xl animate-skeleton" />
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 space-y-3 animate-skeleton">
            <div className="h-2.5 w-20 bg-surface-raised rounded" />
            <div className="h-10 w-14 bg-surface-raised rounded" />
          </div>
        ))}
      </div>

      {/* Sessions + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  )
}
