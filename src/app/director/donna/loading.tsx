import { SkeletonCard } from '@/components/ui'

export default function DonnaPageLoading() {
  return (
    <div className="p-6 space-y-6 animate-skeleton">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 w-16 bg-surface-raised rounded animate-skeleton" />
        <div className="h-8 w-52 bg-surface-raised rounded animate-skeleton" />
        <div className="h-4 w-72 bg-surface-raised rounded animate-skeleton" />
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left column — context cards */}
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map(i => (
            <SkeletonCard key={i} className="h-28" />
          ))}
        </div>

        {/* Right column — DONNA chat shell */}
        <div className="space-y-4">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-[500px]" />
        </div>
      </div>
    </div>
  )
}
