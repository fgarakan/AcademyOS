import { Card, CardContent, CardHeader } from '@/components/ui'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

export default function SessionsOverviewLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <LoadingSkeleton className="h-3 w-16" />
        <LoadingSkeleton className="h-8 w-40" />
        <LoadingSkeleton className="h-4 w-64" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4 space-y-2">
              <LoadingSkeleton className="h-3 w-20" />
              <LoadingSkeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Session list */}
      <Card>
        <CardHeader>
          <LoadingSkeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-1 gap-4">
                <div className="space-y-1.5 flex-1">
                  <LoadingSkeleton className="h-4 w-48" />
                  <LoadingSkeleton className="h-3 w-32" />
                </div>
                <LoadingSkeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
