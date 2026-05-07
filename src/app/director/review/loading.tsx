import { Card, CardContent } from '@/components/ui'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function ReviewQueueLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <LoadingSkeleton className="h-3 w-16" />
        <div className="flex items-center gap-3">
          <LoadingSkeleton className="h-8 w-48" />
          <LoadingSkeleton className="h-5 w-20 rounded-full" />
        </div>
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      {/* Category strip skeleton */}
      <div className="flex flex-wrap gap-4 px-4 py-3 rounded-xl bg-surface-raised border border-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="min-w-[80px] space-y-1.5">
            <LoadingSkeleton className="h-2 w-16" />
            <LoadingSkeleton className="h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-8 w-24 rounded-lg shrink-0" />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <LoadingSkeleton className="h-3 w-24" />
                  <LoadingSkeleton className="h-5 w-64" />
                  <LoadingSkeleton className="h-3 w-40" />
                </div>
                <LoadingSkeleton className="h-7 w-20 rounded-lg" />
              </div>
              <LoadingSkeleton className="h-16 w-full rounded-xl" />
              <div className="flex gap-2">
                <LoadingSkeleton className="h-7 w-20 rounded-lg" />
                <LoadingSkeleton className="h-7 w-28 rounded-lg" />
                <LoadingSkeleton className="h-7 w-16 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
