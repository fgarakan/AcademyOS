import { LoadingSkeleton } from '@/components/ui'

export default function PlayerProfileLoading() {
  return (
    <div>
      <LoadingSkeleton className="h-3 w-20 mb-4" />
      <div className="flex items-start gap-4 mb-6">
        <LoadingSkeleton className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <LoadingSkeleton className="h-7 w-48" />
          <LoadingSkeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-[260px_1fr_260px] gap-5">
        <LoadingSkeleton className="h-52 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <LoadingSkeleton className="h-52 rounded-2xl" />
      </div>
    </div>
  )
}
