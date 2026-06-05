import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Props {
  healthPct: number
  attentionCount: number
  criticalCount: number
}

function statusLabel(score: number): string {
  if (score >= 80) return 'Healthy'
  if (score >= 60) return 'Needs Attention'
  return 'At Risk'
}

function statusDotClass(score: number): string {
  if (score >= 80) return 'bg-status-green'
  if (score >= 60) return 'bg-yellow-400'
  return 'bg-status-red'
}

function statusTextClass(score: number): string {
  if (score >= 80) return 'text-status-green'
  if (score >= 60) return 'text-yellow-400'
  return 'text-status-red'
}

export function DirectorAcademyHealthSnapshot({ healthPct, attentionCount, criticalCount }: Props) {
  return (
    <Link
      href="/director/kpi"
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3 hover:border-lime/30 transition-colors group"
      data-donna-focus-id="academy-health-snapshot"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass(healthPct)}`} />
        <p className={`text-[13px] font-semibold ${statusTextClass(healthPct)}`}>
          Academy Health — {statusLabel(healthPct)}
        </p>
      </div>
      <div className="flex items-center gap-5 shrink-0">
        <div className="text-right">
          <p className={`font-mono font-bold text-[18px] leading-none ${attentionCount > 0 ? 'text-status-orange' : 'text-text-muted'}`}>
            {attentionCount}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">attention</p>
        </div>
        <div className="text-right">
          <p className={`font-mono font-bold text-[18px] leading-none ${criticalCount > 0 ? 'text-status-red' : 'text-text-muted'}`}>
            {criticalCount}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">overdue</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-lime transition-colors shrink-0" />
    </Link>
  )
}
