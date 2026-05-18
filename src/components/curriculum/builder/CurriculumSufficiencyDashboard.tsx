import Link from 'next/link'
import { CheckCircle2, AlertCircle, XCircle, TrendingUp } from 'lucide-react'
import type { CurriculumExplorerData } from '@/lib/backend/curriculumExplorer'

interface Props {
  data: CurriculumExplorerData
}

function getLevelStatus(levelId: string, data: CurriculumExplorerData) {
  const drills = data.drills.filter(d => d.level_min_id === levelId).length
  const gates = data.gates.filter(g => g.from_level_id === levelId).length
  if (gates === 0 || drills === 0) return 'missing'
  if (gates < 2 || drills < 3) return 'low'
  return 'sufficient'
}

type Status = 'sufficient' | 'low' | 'missing'

const STATUS_CONFIG: Record<Status, { Icon: typeof CheckCircle2; color: string; label: string; bg: string }> = {
  sufficient: { Icon: CheckCircle2, color: 'text-status-green',  label: 'Ready',   bg: 'bg-status-green/[0.06] border-status-green/20' },
  low:        { Icon: AlertCircle,  color: 'text-status-orange', label: 'Low',     bg: 'bg-status-orange/[0.06] border-status-orange/20' },
  missing:    { Icon: XCircle,      color: 'text-status-red',    label: 'Missing', bg: 'bg-status-red/[0.06] border-status-red/20' },
}

export function CurriculumSufficiencyDashboard({ data }: Props) {
  const statuses = data.levels.map(level => ({
    level,
    status: getLevelStatus(level.id, data) as Status,
  }))

  const counts = statuses.reduce<Record<Status, number>>(
    (acc, { status }) => { acc[status]++; return acc },
    { sufficient: 0, low: 0, missing: 0 }
  )

  const sufficiencyPct = Math.round((counts.sufficient / data.levels.length) * 100)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {(['sufficient', 'low', 'missing'] as Status[]).map(status => {
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} className={`rounded-xl border px-4 py-3 text-center ${cfg.bg}`}>
              <p className={`text-[22px] font-mono font-bold ${cfg.color}`}>{counts[status]}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-muted">Overall readiness</p>
        <p className="text-[11px] font-mono font-semibold text-lime">{sufficiencyPct}%</p>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-lime transition-all"
          style={{ width: `${sufficiencyPct}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {statuses
          .filter(s => s.status !== 'sufficient')
          .map(({ level, status }) => {
            const cfg = STATUS_CONFIG[status]
            return (
              <div key={level.id} className={`flex items-center justify-between rounded-xl border px-3 py-2 ${cfg.bg}`}>
                <div className="flex items-center gap-2">
                  <cfg.Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  <p className="text-[11px] text-text-primary">{level.display_name}</p>
                </div>
                <Link
                  href={`/director/curriculum/level/${level.id}`}
                  className="text-[10px] text-lime hover:text-lime/80 transition-colors"
                >
                  Fix →
                </Link>
              </div>
            )
          })}
        {counts.sufficient === data.levels.length && (
          <div className="flex items-center gap-2 rounded-xl border border-status-green/20 bg-status-green/[0.04] px-3 py-2">
            <TrendingUp className="w-3.5 h-3.5 text-status-green" />
            <p className="text-[11px] text-status-green font-semibold">All levels have sufficient content.</p>
          </div>
        )}
      </div>
    </div>
  )
}
