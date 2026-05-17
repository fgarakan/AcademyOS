import { Lock } from 'lucide-react'

interface Props {
  reason?: string
}

export function CurriculumReadOnlyBadge({ reason = 'This content is read-only and cannot be edited from the builder.' }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
      <Lock className="w-3.5 h-3.5 text-text-muted shrink-0" />
      <p className="text-[11px] text-text-muted">{reason}</p>
    </div>
  )
}
