import { LoadingSkeleton, SkeletonCard } from '@/components/ui'

export default function SignalsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <LoadingSkeleton className="h-3 w-20 mb-2" />
        <LoadingSkeleton className="h-8 w-40 mb-1" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
