import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

export type SufficiencyStatus = 'sufficient' | 'low' | 'missing'

interface Props {
  status: SufficiencyStatus
  label: string
  detail?: string
}

const CONFIG: Record<SufficiencyStatus, { Icon: typeof CheckCircle2; color: string; bg: string }> = {
  sufficient: { Icon: CheckCircle2, color: 'text-status-green', bg: 'bg-status-green/[0.06] border-status-green/20' },
  low:        { Icon: AlertCircle,  color: 'text-status-orange', bg: 'bg-status-orange/[0.06] border-status-orange/20' },
  missing:    { Icon: XCircle,      color: 'text-status-red',    bg: 'bg-status-red/[0.06] border-status-red/20' },
}

export function CurriculumSufficiencyLabel({ status, label, detail }: Props) {
  const { Icon, color, bg } = CONFIG[status]
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${bg}`}>
      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${color}`} />
      <div>
        <p className={`text-[11px] font-semibold ${color}`}>{label}</p>
        {detail && <p className="text-[10px] text-text-muted mt-0.5">{detail}</p>}
      </div>
    </div>
  )
}

export function deriveSufficiency(count: number, min: number): SufficiencyStatus {
  if (count === 0) return 'missing'
  if (count < min) return 'low'
  return 'sufficient'
}
