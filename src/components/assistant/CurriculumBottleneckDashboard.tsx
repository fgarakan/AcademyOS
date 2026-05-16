'use client'

// Sprint 503 — Curriculum Bottleneck Dashboard V1
// Read-only director panel showing skill areas where multiple players are stuck.
// Props-only data — no DB calls. DONNA framing at the top.

import { BookOpen, ChevronRight, Users } from 'lucide-react'
import { getNextBestAction } from '@/lib/donna/kpiNextBestActionMap'
import type { KPISeverity } from '@/lib/donna/kpiNextBestActionMap'
import type { ObservationSkillTag } from '@/components/capture/WrapUpPlayerObservationInput'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BottleneckSeverity = 'critical' | 'notable' | 'minor'

export interface SkillBottleneckEntry {
  skillTag: ObservationSkillTag
  displayLabel: string
  concernFlagCount: number
  affectedPlayerCount: number
  affectedPlayerNames: string[]
  affectedGroups: string[]
  mostRecentFlag: string
  severity: BottleneckSeverity
  donnaNote: string | null
}

export interface CurriculumBottleneckDashboardProps {
  bottlenecks: SkillBottleneckEntry[]
  overallSeverity: KPISeverity
  onViewCurriculumPanel?: () => void
  className?: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<BottleneckSeverity, {
  label: string
  dotClass: string
  rowClass: string
  textClass: string
  badgeClass: string
}> = {
  critical: {
    label: 'Critical',
    dotClass: 'bg-status-red',
    rowClass: 'border-status-red/20 bg-status-red/5',
    textClass: 'text-status-red',
    badgeClass: 'bg-status-red/10 text-status-red border border-status-red/30',
  },
  notable: {
    label: 'Notable',
    dotClass: 'bg-status-orange',
    rowClass: 'border-status-orange/20 bg-status-orange/5',
    textClass: 'text-status-orange',
    badgeClass: 'bg-status-orange/10 text-status-orange border border-status-orange/30',
  },
  minor: {
    label: 'Minor',
    dotClass: 'bg-text-muted',
    rowClass: 'border-border bg-surface-raised',
    textClass: 'text-text-muted',
    badgeClass: 'bg-surface-raised text-text-muted border border-border',
  },
}

// ── Bottleneck row ────────────────────────────────────────────────────────────

function BottleneckRow({
  entry,
  onViewCurriculumPanel,
}: {
  entry: SkillBottleneckEntry
  onViewCurriculumPanel?: () => void
}) {
  const sev = SEVERITY_CONFIG[entry.severity]
  const playerPreview = entry.affectedPlayerNames.slice(0, 3).join(', ')
  const more = entry.affectedPlayerNames.length - 3

  return (
    <div className={`px-3 py-3 rounded-xl border ${sev.rowClass}`}>
      <div className="flex items-start justify-between gap-2">
        {/* Skill info */}
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${sev.dotClass}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-medium text-text-primary">{entry.displayLabel}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sev.badgeClass}`}>
                {entry.severity}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {entry.concernFlagCount} concern{entry.concernFlagCount > 1 ? 's' : ''} across{' '}
              <span className="text-text-secondary">{entry.affectedPlayerCount} player{entry.affectedPlayerCount > 1 ? 's' : ''}</span>
            </p>
            {entry.affectedPlayerNames.length > 0 && (
              <p className="text-[10px] text-text-muted mt-0.5">
                {playerPreview}{more > 0 ? ` + ${more} more` : ''}
              </p>
            )}
            {entry.affectedGroups.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-text-muted">
                <Users size={9} />
                {entry.affectedGroups.slice(0, 2).join(', ')}
                {entry.affectedGroups.length > 2 && ` + ${entry.affectedGroups.length - 2} more`}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        {onViewCurriculumPanel && (
          <button
            onClick={onViewCurriculumPanel}
            className="shrink-0 text-text-muted hover:text-lime transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* DONNA note */}
      {entry.donnaNote && (
        <div className="mt-2 pl-4 text-[11px] text-text-muted italic">{entry.donnaNote}</div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CurriculumBottleneckDashboard({
  bottlenecks,
  overallSeverity,
  onViewCurriculumPanel,
  className,
}: CurriculumBottleneckDashboardProps) {
  const nba = getNextBestAction('curriculum_bottleneck', overallSeverity)

  const sorted = [...bottlenecks].sort((a, b) => {
    const order = { critical: 0, notable: 1, minor: 2 }
    return order[a.severity] - order[b.severity]
  })

  const criticalCount = bottlenecks.filter(b => b.severity === 'critical').length
  const notableCount = bottlenecks.filter(b => b.severity === 'notable').length

  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden ${className}`}>
      {/* DONNA header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-border bg-surface-raised">
        <div className="w-7 h-7 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-lime text-[10px] font-bold">D</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Curriculum Bottlenecks</p>
            <BookOpen size={10} className="text-text-muted" />
          </div>
          <p className="text-sm text-text-primary leading-snug">
            {nba?.donnaSummary ?? 'Reviewing skill-level curriculum patterns.'}
          </p>
        </div>
      </div>

      {/* Summary */}
      {bottlenecks.length > 0 && (criticalCount > 0 || notableCount > 0) && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border">
          {criticalCount > 0 && (
            <span className="text-[11px] text-status-red">
              {criticalCount} critical skill{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {notableCount > 0 && (
            <span className="text-[11px] text-status-orange">
              {notableCount} notable pattern{notableCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Empty state */}
      {bottlenecks.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-text-muted">
            {overallSeverity === 'no_data'
              ? 'Not enough skill-tagged observations yet. Encourage coaches to tag skill areas in wrap-ups.'
              : 'No curriculum bottlenecks detected.'}
          </p>
        </div>
      )}

      {/* Bottleneck list */}
      {sorted.length > 0 && (
        <div className="px-4 py-3 space-y-1.5">
          {sorted.map((entry, i) => (
            <BottleneckRow key={i} entry={entry} onViewCurriculumPanel={onViewCurriculumPanel} />
          ))}
        </div>
      )}

      {/* DONNA recommendation */}
      {nba && nba.recommendedAction && nba.actionCta !== '' && (
        <div className="px-4 py-3 border-t border-border bg-surface-raised">
          <p className="text-[11px] text-text-muted">{nba.recommendedAction}</p>
          {nba.executionNote && (
            <p className="text-[10px] text-text-muted italic mt-0.5">{nba.executionNote}</p>
          )}
        </div>
      )}

      {/* Curriculum panel CTA */}
      {onViewCurriculumPanel && bottlenecks.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={onViewCurriculumPanel}
            className="w-full text-sm py-2 rounded-xl border border-lime/30 text-lime hover:bg-lime/5 transition-colors"
          >
            View curriculum panel →
          </button>
        </div>
      )}

      {/* Read-only note */}
      <div className="px-4 py-2 border-t border-border">
        <p className="text-[10px] text-text-muted italic">
          Read-only. Patterns derived from skill-tagged observations in coach wrap-ups.
          Curriculum changes go through the ripple approval flow.
        </p>
      </div>
    </div>
  )
}
