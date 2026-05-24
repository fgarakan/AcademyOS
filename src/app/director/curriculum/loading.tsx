import { SkeletonCard } from '@/components/ui'

export default function CurriculumMapLoading() {
  return (
    <div className="p-6 space-y-6 animate-skeleton">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 w-24 bg-surface-raised rounded animate-skeleton" />
        <div className="h-8 w-60 bg-surface-raised rounded animate-skeleton" />
        <div className="h-4 w-80 bg-surface-raised rounded animate-skeleton" />
      </div>

      {/* Filter / action bar */}
      <div className="flex gap-3">
        <div className="h-9 w-32 bg-surface-raised border border-border rounded-xl animate-skeleton" />
        <div className="h-9 w-28 bg-surface-raised border border-border rounded-xl animate-skeleton" />
        <div className="ml-auto h-9 w-36 bg-surface-raised border border-border rounded-xl animate-skeleton" />
      </div>

      {/* 2-column layout: map + DONNA */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Curriculum level cards */}
        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <SkeletonCard key={i} className="h-20" />
          ))}
        </div>

        {/* DONNA sidebar */}
        <SkeletonCard className="h-72" />
      </div>
    </div>
  )
}
