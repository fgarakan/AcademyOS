import { LoadingSkeleton, SkeletonCard } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'

export default function KpiLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <LoadingSkeleton className="h-3 w-24 mb-2" />
        <LoadingSkeleton className="h-8 w-48 mb-1" />
        <LoadingSkeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <LoadingSkeleton className="h-3 w-24" />
              <LoadingSkeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <SkeletonCard />
    </div>
  )
}
