import { Shield, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface Gate {
  id: string
  criterion: string
  domain: string
  gate_type: string
  threshold: string
  assessment_method?: string | null
  evaluator_role?: string | null
}

interface Props {
  gate: Gate
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  skill:       { label: 'Skill gate',       color: 'text-status-blue' },
  fitness:     { label: 'Fitness gate',     color: 'text-status-green' },
  match_play:  { label: 'Match play gate',  color: 'text-status-orange' },
  behavioural: { label: 'Behavioural gate', color: 'text-lime' },
}

export function AssessmentGateDetailPanel({ gate }: Props) {
  const typeCfg = TYPE_CONFIG[gate.gate_type] ?? { label: gate.gate_type, color: 'text-text-muted' }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border">
        <Shield className="w-4 h-4 text-status-blue shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary">{gate.criterion}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${typeCfg.color}`}>
              {typeCfg.label}
            </span>
            <span className="text-[10px] text-text-muted">{gate.domain}</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        <div className="flex items-start gap-3 px-4 py-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Threshold</p>
            <p className="text-[12px] text-text-primary">{gate.threshold}</p>
          </div>
        </div>

        {gate.assessment_method && (
          <div className="flex items-start gap-3 px-4 py-3">
            <Clock className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Assessment method</p>
              <p className="text-[12px] text-text-secondary">{gate.assessment_method}</p>
            </div>
          </div>
        )}

        {gate.evaluator_role && (
          <div className="flex items-start gap-3 px-4 py-3">
            <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Evaluated by</p>
              <p className="text-[12px] text-text-secondary capitalize">{gate.evaluator_role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
