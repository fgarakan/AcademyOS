import Link from 'next/link'
import { BookOpen, AlertCircle, CheckCircle2, GitBranch, ArrowRight } from 'lucide-react'

interface Props {
  totalLevels: number
  levelsWithGaps: number
  pendingChanges: number
  lastReviewedAt?: string | null
}

export function DirectorCurriculumWidget({ totalLevels, levelsWithGaps, pendingChanges, lastReviewedAt }: Props) {
  const healthStatus = levelsWithGaps === 0 ? 'healthy' : levelsWithGaps < 3 ? 'warning' : 'critical'

  const statusConfig = {
    healthy:  { label: 'Curriculum healthy',  color: 'text-status-green',  Icon: CheckCircle2 },
    warning:  { label: 'Some levels need work', color: 'text-status-orange', Icon: AlertCircle },
    critical: { label: 'Gaps need attention',   color: 'text-status-red',    Icon: AlertCircle },
  }[healthStatus]

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">Curriculum</p>
        </div>
        <Link href="/director/curriculum" className="text-[11px] text-lime hover:text-lime/80 transition-colors flex items-center gap-1">
          Open builder <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border">
        <div className="px-3 py-3 text-center">
          <p className="text-[20px] font-mono font-bold text-text-primary">{totalLevels}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Levels</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className={`text-[20px] font-mono font-bold ${levelsWithGaps > 0 ? 'text-status-orange' : 'text-text-primary'}`}>
            {levelsWithGaps}
          </p>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Gaps</p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className={`text-[20px] font-mono font-bold ${pendingChanges > 0 ? 'text-status-orange' : 'text-text-primary'}`}>
            {pendingChanges}
          </p>
          <p className="text-[10px] text-text-muted uppercase tracking-widest">Pending</p>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-1.5">
          <statusConfig.Icon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
          <span className={`text-[10px] font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
        {lastReviewedAt && (
          <span className="text-[10px] text-text-muted">
            Reviewed {new Date(lastReviewedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}
