'use client'

import { AlertTriangle, ArrowRight, CheckCircle, Clock, XCircle, Eye } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import type { CurriculumChangeScopeId } from '@/lib/curriculum/curriculumChangeScope'
import { SCOPE_BY_ID } from '@/lib/curriculum/curriculumChangeScope'

// ── Readiness state types ─────────────────────────────────────────────────────

export type PlayerReadinessState =
  | 'not_started'
  | 'in_progress'
  | 'advancement_eligible'
  | 'blocked'
  | 'insufficient_data'

export interface PlayerReadinessRow {
  playerId: string
  playerName: string
  currentLevel: string
  enrolledDaysAgo: number | null
  currentReadiness: PlayerReadinessState
  currentGatesOpen: number
  currentGatesTotal: number
  previewReadiness: PlayerReadinessState
  previewGatesOpen: number
  previewGatesTotal: number
  missingNewEvidence: string[]
  changeReason: string
  levelChangeApplied: false
}

export interface ReadinessRecalculationSummary {
  scopeId: CurriculumChangeScopeId
  changeDescription: string
  playersAnalyzed: number
  playersAffected: number
  playersGainingEligibility: number
  playersLosingEligibility: number
  playersUnchanged: number
  rows: PlayerReadinessRow[]
  dataNote: string | null
  generatedAt: string
}

// ── Readiness display helpers ─────────────────────────────────────────────────

const READINESS_CONFIG: Record<PlayerReadinessState, { label: string; color: string; icon: React.ReactNode }> = {
  not_started: {
    label: 'Not started',
    color: 'text-text-muted',
    icon: <Clock size={12} />,
  },
  in_progress: {
    label: 'In progress',
    color: 'text-status-blue',
    icon: <Clock size={12} />,
  },
  advancement_eligible: {
    label: 'Advancement eligible',
    color: 'text-lime',
    icon: <CheckCircle size={12} />,
  },
  blocked: {
    label: 'Blocked',
    color: 'text-status-red',
    icon: <XCircle size={12} />,
  },
  insufficient_data: {
    label: 'Insufficient data',
    color: 'text-text-muted',
    icon: <AlertTriangle size={12} />,
  },
}

function ReadinessBadge({ state }: { state: PlayerReadinessState }) {
  const cfg = READINESS_CONFIG[state]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function GateBar({ open, total }: { open: number; total: number }) {
  if (total === 0) return <span className="text-text-muted text-[10px]">—</span>
  const pct = Math.round(((total - open) / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-lime rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-text-muted shrink-0">{total - open}/{total}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ReadinessRecalculationPreviewProps {
  summary: ReadinessRecalculationSummary
  className?: string
}

export function ReadinessRecalculationPreview({ summary, className }: ReadinessRecalculationPreviewProps) {
  const scopeDef = SCOPE_BY_ID[summary.scopeId]

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="label-xs mb-1">Readiness Recalculation Preview</p>
              <p className="text-text-primary font-medium text-sm">{summary.changeDescription}</p>
              <p className="text-xs text-text-muted mt-0.5">Scope: {scopeDef?.label ?? summary.scopeId}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-text-muted border border-border rounded px-1.5 py-0.5">
              <Eye size={9} />
              Preview only
            </span>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Analyzed', value: summary.playersAnalyzed, color: 'text-text-secondary' },
              { label: 'Affected', value: summary.playersAffected, color: summary.playersAffected > 0 ? 'text-status-orange' : 'text-text-muted' },
              { label: 'Gain eligibility', value: summary.playersGainingEligibility, color: summary.playersGainingEligibility > 0 ? 'text-lime' : 'text-text-muted' },
              { label: 'Lose eligibility', value: summary.playersLosingEligibility, color: summary.playersLosingEligibility > 0 ? 'text-status-red' : 'text-text-muted' },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-raised border border-border rounded-lg p-2 text-center">
                <p className={`text-xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Safety banner */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-xs text-text-secondary mb-4">
            <AlertTriangle size={13} className="shrink-0 mt-0.5 text-text-muted" />
            <span>
              No level changes applied. Player readiness rows are not updated. This is an estimate of what would change if the curriculum change were approved.
            </span>
          </div>

          {/* Player rows */}
          {summary.rows.length === 0 ? (
            <p className="text-xs text-text-muted italic text-center py-4">No players analyzed for this change.</p>
          ) : (
            <div className="space-y-2">
              {summary.rows.map(row => {
                const changed = row.currentReadiness !== row.previewReadiness
                return (
                  <div
                    key={row.playerId}
                    className={`rounded-xl border p-3 text-xs ${changed ? 'border-status-orange/30 bg-status-orange/5' : 'border-border bg-surface-raised'}`}
                  >
                    {/* Player header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-text-primary">{row.playerName}</p>
                        <p className="text-text-muted text-[10px]">
                          {row.currentLevel}
                          {row.enrolledDaysAgo !== null && ` · ${row.enrolledDaysAgo}d in level`}
                        </p>
                      </div>
                      {changed && (
                        <span className="text-[10px] uppercase tracking-widest text-status-orange border border-status-orange/30 rounded px-1.5 py-0.5 shrink-0">
                          Changed
                        </span>
                      )}
                    </div>

                    {/* Readiness before → after */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-[10px] text-text-muted mb-0.5">Current</p>
                        <ReadinessBadge state={row.currentReadiness} />
                        <GateBar open={row.currentGatesOpen} total={row.currentGatesTotal} />
                      </div>
                      <ArrowRight size={14} className="text-text-muted shrink-0" />
                      <div className="flex-1">
                        <p className="text-[10px] text-text-muted mb-0.5">After change</p>
                        <ReadinessBadge state={row.previewReadiness} />
                        <GateBar open={row.previewGatesOpen} total={row.previewGatesTotal} />
                      </div>
                    </div>

                    {/* Change reason */}
                    {row.changeReason && (
                      <p className="text-text-secondary leading-relaxed mb-1">{row.changeReason}</p>
                    )}

                    {/* Missing new evidence */}
                    {row.missingNewEvidence.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Missing new evidence</p>
                        <ul className="space-y-0.5">
                          {row.missingNewEvidence.map((item, i) => (
                            <li key={i} className="flex items-center gap-1.5 text-status-orange text-[11px]">
                              <AlertTriangle size={9} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Level change guard */}
                    <p className="text-[10px] text-text-muted mt-2 italic">
                      Level change: not applied — director action required.
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border space-y-1">
            {summary.dataNote && (
              <p className="text-[11px] text-status-orange flex items-center gap-1">
                <AlertTriangle size={10} />
                {summary.dataNote}
              </p>
            )}
            <p className="text-[11px] text-text-muted">
              Preview only. No player records, gate status rows, or readiness values have been modified.
            </p>
            <p className="text-[10px] text-text-muted">
              Generated {new Date(summary.generatedAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
