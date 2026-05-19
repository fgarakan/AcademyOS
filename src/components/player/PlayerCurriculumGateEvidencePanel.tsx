// PlayerCurriculumGateEvidencePanel — Sprint 1060
// Director-facing panel showing curriculum gate requirements and per-gate evidence status.
// No automatic level movement. Director review required for all gate decisions.
// No writes. No parent/player exposure.

import { Shield, CheckCircle2, AlertCircle, Clock, Lock, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'

interface GateRow {
  id: string
  domain: string
  criterion: string
  gate_type: string
  threshold: string
  evaluator: string
  cadence: string
  evidence_window: string | null
  sort_order: number
}

interface GateStatus {
  gate_id: string
  status: string
  evidence_count: number
  last_evidence_at: string | null
}

interface Props {
  currentLevelName: string | null
  nextLevelName: string | null
  gates: GateRow[]
  gateStatuses: Record<string, GateStatus>
}

const EVIDENCE_STATUS = {
  no_evidence:     { label: 'No evidence',     color: 'text-text-muted',         bg: 'bg-surface-raised border-border',                icon: 'none' },
  partial:         { label: 'Partial evidence', color: 'text-status-orange',      bg: 'bg-status-orange/5 border-status-orange/20',     icon: 'alert' },
  strong:          { label: 'Strong evidence',  color: 'text-status-green',       bg: 'bg-status-green/5 border-status-green/20',      icon: 'check' },
  needs_review:    { label: 'Needs review',     color: 'text-status-blue',        bg: 'bg-status-blue/5 border-status-blue/20',        icon: 'clock' },
  director_passed: { label: 'Director passed',  color: 'text-lime',              bg: 'bg-lime/5 border-lime/20',                       icon: 'check' },
  director_blocked:{ label: 'Director blocked', color: 'text-status-red',         bg: 'bg-status-red/5 border-status-red/20',          icon: 'alert' },
}

function deriveEvidenceStatus(gateStatus: GateStatus | undefined): keyof typeof EVIDENCE_STATUS {
  if (!gateStatus) return 'no_evidence'
  if (gateStatus.status === 'passed') return 'director_passed'
  if (gateStatus.status === 'blocked') return 'director_blocked'
  if (gateStatus.evidence_count === 0) return 'no_evidence'
  if (gateStatus.evidence_count >= 3) return 'strong'
  if (gateStatus.evidence_count >= 1) return 'partial'
  return 'needs_review'
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const DOMAIN_LABELS: Record<string, string> = {
  technical:   'Technical',
  tactical:    'Tactical',
  fitness:     'Fitness',
  competition: 'Competition',
  behavioral:  'Behavioral',
  assessment:  'Assessment',
}

export function PlayerCurriculumGateEvidencePanel({
  currentLevelName,
  nextLevelName,
  gates,
  gateStatuses,
}: Props) {
  const totalGates = gates.length

  if (totalGates === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Curriculum Gate Evidence</p>
              <p className="text-text-muted text-[10px] uppercase tracking-widest">Advancement requirements</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-text-muted">
            {currentLevelName
              ? `No advancement gates defined for ${currentLevelName} yet.`
              : 'No curriculum level assigned. Assign a level to see gate requirements.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const passedCount = gates.filter(g => {
    const s = gateStatuses[g.id]
    return s?.status === 'passed'
  }).length

  const withEvidenceCount = gates.filter(g => {
    const s = gateStatuses[g.id]
    return s && s.evidence_count > 0
  }).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-lime" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Curriculum Gate Evidence</p>
              <p className="text-text-muted text-[10px] uppercase tracking-widest">
                {currentLevelName ?? 'Current level'}
                {nextLevelName ? <> <ChevronRight className="inline w-2.5 h-2.5" /> {nextLevelName}</> : null}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-mono font-bold text-lime">{passedCount} / {totalGates}</p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Gates passed</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress overview */}
        <div className="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
          <div className="text-center flex-1">
            <p className="text-base font-mono font-bold text-lime">{passedCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Passed</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-base font-mono font-bold text-status-blue">{withEvidenceCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">With Evidence</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-base font-mono font-bold text-text-muted">{totalGates - withEvidenceCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">No Evidence</p>
          </div>
        </div>

        {/* Per-gate rows */}
        <div className="space-y-2">
          {gates.map(gate => {
            const gateStatus = gateStatuses[gate.id]
            const evidenceStatus = deriveEvidenceStatus(gateStatus)
            const { label, color, bg, icon } = EVIDENCE_STATUS[evidenceStatus]
            const lastDate = formatDate(gateStatus?.last_evidence_at ?? null)
            const domainLabel = DOMAIN_LABELS[gate.domain] ?? gate.domain

            return (
              <div key={gate.id} className={`rounded-xl border px-3 py-2.5 ${bg}`}>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {icon === 'check' && <CheckCircle2 className={`w-3.5 h-3.5 ${color}`} />}
                    {icon === 'alert' && <AlertCircle className={`w-3.5 h-3.5 ${color}`} />}
                    {icon === 'clock' && <Clock className={`w-3.5 h-3.5 ${color}`} />}
                    {icon === 'none' && <div className={`w-3.5 h-3.5 rounded-full border-2 border-border`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs font-medium text-text-primary leading-snug">{gate.criterion}</p>
                      <span className={`text-[10px] font-semibold shrink-0 ${color}`}>{label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-text-muted">{domainLabel}</span>
                      <span className="text-[10px] text-text-muted">{gate.gate_type.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-text-muted">Threshold: {gate.threshold}</span>
                      {gateStatus && gateStatus.evidence_count > 0 && (
                        <span className="text-[10px] text-text-muted">{gateStatus.evidence_count} observation{gateStatus.evidence_count !== 1 ? 's' : ''}</span>
                      )}
                      {lastDate && (
                        <span className="text-[10px] text-text-muted">Last: {lastDate}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Director safety note */}
        <div className="flex items-center gap-2 pt-1">
          <Lock className="w-3 h-3 text-text-muted shrink-0" />
          <p className="text-[10px] text-text-muted leading-relaxed">
            Director review required for all gate decisions. No automatic level movement. No parent/player exposure.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
