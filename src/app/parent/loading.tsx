import { SkeletonCard } from '@/components/ui'

export default function ParentHomeLoading() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-24">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-3 w-14 bg-surface-raised rounded animate-skeleton" />
        <div className="h-7 w-56 bg-surface-raised rounded animate-skeleton" />
        <div className="h-3.5 w-44 bg-surface-raised rounded animate-skeleton" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-surface-raised border border-border rounded-xl animate-skeleton" />
        ))}
      </div>

      {/* Active mission context */}
      <SkeletonCard className="h-20" />

      {/* Level card */}
      <SkeletonCard className="h-24" />

      {/* Progress section */}
      <SkeletonCard className="h-48" />

      {/* Attendance */}
      <SkeletonCard className="h-36" />

      {/* Support guide */}
      <SkeletonCard className="h-52" />
    </div>
  )
}
