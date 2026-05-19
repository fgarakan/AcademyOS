// PlayerEvidenceHubHeader — Sprint 1057
// Director-facing summary card for the Player Evidence Hub.
// Shows aggregate evidence counts and provenance flags.
// Director view only. No parent/player exposure. No mutations.

import { BarChart2, AlertTriangle, Lock, Eye, Clock } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { PlayerEvidenceSummary } from '@/lib/players/playerEvidenceRepository'

interface Props {
  summary: PlayerEvidenceSummary | null
  isSchemaMissing: boolean
}

function StatCell({ label, value, dim }: { label: string; value: string | number; dim?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className={`text-xl font-mono font-bold ${dim ? 'text-text-secondary' : 'text-lime'}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-text-muted leading-tight">{label}</p>
    </div>
  )
}

export function PlayerEvidenceHubHeader({ summary, isSchemaMissing }: Props) {
  if (isSchemaMissing) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-status-orange shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Evidence schema is not yet fully deployed. Evidence Hub will show live data once migrations are applied.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-text-muted">Evidence summary unavailable.</p>
        </CardContent>
      </Card>
    )
  }

  const internalOnlyCount = summary.totalObservations + (summary.requirementEvidenceCount - summary.parentSafeEvidenceCount)
  const lastDate = summary.latestEvidenceDate
    ? new Date(summary.latestEvidenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4 text-lime" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Evidence Summary</p>
              <p className="text-text-muted text-[10px] uppercase tracking-widest">Director view</p>
            </div>
          </div>
          {lastDate && (
            <div className="flex items-center gap-1 text-[10px] text-text-muted shrink-0">
              <Clock className="w-3 h-3" />
              {lastDate}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary counts */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCell label="Total Evidence" value={summary.totalObservations + summary.requirementEvidenceCount} />
          <StatCell label="Last 30 Days" value={summary.recentObservationCount} />
          <StatCell label="Active Priorities" value={summary.activePriorityCount} dim />
        </div>

        <div className="h-px bg-border" />

        {/* Breakdown row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
            <p className="text-base font-mono font-bold text-text-primary">{summary.totalObservations}</p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">Coach Observations</p>
          </div>
          <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
            <p className="text-base font-mono font-bold text-text-primary">{summary.requirementEvidenceCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-text-muted mt-0.5">Requirement Evidence</p>
          </div>
          <div className="rounded-xl bg-status-blue/5 border border-status-blue/20 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Eye className="w-3 h-3 text-status-blue" />
              <p className="text-base font-mono font-bold text-status-blue">{summary.parentSafeEvidenceCount}</p>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Parent-Safe</p>
          </div>
          <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Lock className="w-3 h-3 text-text-muted" />
              <p className="text-base font-mono font-bold text-text-secondary">{internalOnlyCount}</p>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Internal Only</p>
          </div>
        </div>

        {/* Gates row */}
        {summary.totalGates > 0 && (
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-surface-raised border border-border">
            <p className="text-xs text-text-secondary">Curriculum gates with evidence</p>
            <p className="text-xs font-mono font-bold text-text-primary">
              {summary.gatesWithEvidence} / {summary.totalGates}
            </p>
          </div>
        )}

        {/* Safety footer */}
        <div className="flex items-center gap-2 pt-1">
          <Lock className="w-3 h-3 text-text-muted shrink-0" />
          <p className="text-[10px] text-text-muted leading-relaxed">
            Parent visibility requires approval. No automatic level movement.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
