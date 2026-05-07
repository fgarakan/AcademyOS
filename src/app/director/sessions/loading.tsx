import { Card, CardContent } from '@/components/ui'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function SessionsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <LoadingSkeleton className="h-3 w-16" />
        <LoadingSkeleton className="h-8 w-32" />
        <LoadingSkeleton className="h-4 w-80" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <LoadingSkeleton className="h-4 w-48" />
                    <LoadingSkeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <div className="flex gap-4">
                    <LoadingSkeleton className="h-3 w-24" />
                    <LoadingSkeleton className="h-3 w-20" />
                    <LoadingSkeleton className="h-3 w-28" />
                  </div>
                </div>
                <LoadingSkeleton className="h-4 w-4 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
