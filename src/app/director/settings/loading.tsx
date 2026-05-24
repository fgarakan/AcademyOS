import { SkeletonCard } from '@/components/ui'

export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-2xl space-y-6 animate-skeleton">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-3 w-16 bg-surface-raised rounded animate-skeleton" />
        <div className="h-8 w-48 bg-surface-raised rounded animate-skeleton" />
        <div className="h-4 w-64 bg-surface-raised rounded animate-skeleton" />
      </div>

      {/* Settings form */}
      <SkeletonCard className="h-80" />

      {/* Secondary settings card */}
      <SkeletonCard className="h-40" />
    </div>
  )
}
