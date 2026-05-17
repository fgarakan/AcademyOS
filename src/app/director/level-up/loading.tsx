import { LoadingSkeleton, SkeletonCard } from '@/components/ui'

export default function LevelUpLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <LoadingSkeleton className="h-3 w-20 mb-2" />
        <LoadingSkeleton className="h-8 w-48 mb-1" />
        <LoadingSkeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface-raised border border-border rounded-xl px-5 py-4 space-y-2">
            <LoadingSkeleton className="h-8 w-12" />
            <LoadingSkeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <SkeletonCard />
      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
