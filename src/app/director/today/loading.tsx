import { SkeletonCard } from '@/components/ui'

export default function TodaysAcademyLoading() {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 w-24 bg-surface-raised rounded" />
        <div className="h-8 w-56 bg-surface-raised rounded" />
        <div className="h-4 w-40 bg-surface-raised rounded" />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <div className="h-2.5 w-20 bg-surface-raised rounded" />
            <div className="h-12 w-16 bg-surface-raised rounded" />
            <div className="h-2.5 w-28 bg-surface-raised rounded" />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard className="h-64" />
        </div>
        <div className="space-y-4">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-32" />
        </div>
      </div>
    </div>
  )
}
