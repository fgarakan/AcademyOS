import { CheckCircle2, AlertCircle, XCircle, Shield } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface GateRow {
  id: string
  criterion: string
  domain: string
  gate_type: string
  threshold: string
}

interface Props {
  level: CurriculumLevel
  gates: GateRow[]
}

const MIN_GATES = 2
const REQUIRED_DOMAINS = ['skill', 'fitness']

function getSufficiency(gates: GateRow[]) {
  const gateCount = gates.length
  const presentDomains = new Set(gates.map(g => g.gate_type))
  const missingDomains = REQUIRED_DOMAINS.filter(d => !presentDomains.has(d))

  if (gateCount === 0) return { status: 'critical' as const, reason: 'No gates defined — players cannot be evaluated for advancement.' }
  if (gateCount < MIN_GATES) return { status: 'low' as const, reason: `Only ${gateCount} gate. Minimum ${MIN_GATES} recommended for balanced evaluation.` }
  if (missingDomains.length > 0) return { status: 'low' as const, reason: `Missing gate types: ${missingDomains.join(', ')}. A complete level needs skill and fitness gates.` }
  return { status: 'sufficient' as const, reason: `${gateCount} gates across ${presentDomains.size} type${presentDomains.size !== 1 ? 's' : ''}. Good coverage.` }
}

export function AssessmentGateSufficiencyCheck({ level, gates }: Props) {
  const { status, reason } = getSufficiency(gates)

  const config = {
    critical:  { Icon: XCircle,      color: 'text-status-red',    bg: 'bg-status-red/[0.06] border-status-red/20',     label: 'Critical gap' },
    low:       { Icon: AlertCircle,  color: 'text-status-orange', bg: 'bg-status-orange/[0.06] border-status-orange/20', label: 'Insufficient' },
    sufficient:{ Icon: CheckCircle2, color: 'text-status-green',  bg: 'bg-status-green/[0.06] border-status-green/20',  label: 'Sufficient' },
  }[status]

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${config.bg}`}>
      <Shield className={`w-4 h-4 shrink-0 mt-0.5 ${config.color}`} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <config.Icon className={`w-3.5 h-3.5 shrink-0 ${config.color}`} />
          <p className={`text-[11px] font-semibold ${config.color}`}>{config.label}</p>
        </div>
        <p className="text-[11px] text-text-muted">{reason}</p>
        {status !== 'sufficient' && (
          <p className="text-[10px] text-text-muted mt-1">
            Ask DONNA to draft a gate, or add gates via the Gates tab.
          </p>
        )}
      </div>
    </div>
  )
}
