import { SkeletonCard } from '@/components/ui'

export default function LevelUpLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div>
        <div className="h-3 w-16 bg-surface-raised rounded mb-2" />
        <div className="h-8 w-48 bg-surface-raised rounded" />
      </div>
      <div className="h-12 bg-surface-raised rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-surface-raised border border-border rounded-xl px-5 py-4">
            <div className="h-8 w-12 bg-surface rounded mb-2" />
            <div className="h-3 w-20 bg-surface rounded" />
          </div>
        ))}
      </div>
      <SkeletonCard className="h-20" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <SkeletonCard key={i} className="h-16" />
        ))}
      </div>
    </div>
  )
}
