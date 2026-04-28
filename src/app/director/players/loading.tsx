import { Card } from '@/components/ui/Card'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { SkeletonRow } from '@/components/ui/LoadingSkeleton'

export default function PlayersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <LoadingSkeleton className="h-7 w-24" />
        <LoadingSkeleton className="h-4 w-72" />
      </div>

      <LoadingSkeleton className="h-10 w-full rounded-xl" />

      <Card>
        <div className="px-5 divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </Card>
    </div>
  )
}
