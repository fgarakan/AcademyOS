import { CheckCircle2, Circle } from 'lucide-react'

interface TrackedDimension {
  label: string
  count: number
}

interface Props {
  tracked: TrackedDimension[]
  notTracked: string[]
}

export function CurriculumDimensionBreakdown({ tracked, notTracked }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-text-muted">Coverage Dimensions</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tracked.map(({ label, count }) => (
          <div
            key={label}
            className="rounded-lg border border-status-green/20 bg-status-green/5 px-3 py-2 flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-text-primary truncate">{label}</p>
              <p className="text-[10px] font-mono text-status-green">{count} total</p>
            </div>
          </div>
        ))}
        {notTracked.map(label => (
          <div
            key={label}
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 flex items-center gap-2"
          >
            <Circle className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted truncate">{label}</p>
              <p className="text-[10px] text-text-muted/50">not tracked yet</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
