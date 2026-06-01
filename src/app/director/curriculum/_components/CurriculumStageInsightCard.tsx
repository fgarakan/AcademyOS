'use client'

// Sprint 1095B — Curriculum Stage Insight Card
// Expandable stage card showing stage goal + per-level insight cards.
// Director-first: understanding before building.
// Client component — handles expand/collapse state.

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, ExternalLink, Target, User, Zap, AlertTriangle, Users } from 'lucide-react'
import type { LevelInsight } from '@/lib/curriculum/levelInsightMap'
import type { CurriculumGate } from '@/lib/backend/curriculumExplorer'

// ── Prop types ────────────────────────────────────────────────────────────────

interface LevelInsightRowData {
  id: string
  displayName: string
  levelNumber: number
  insight: LevelInsight
  gates: Array<{
    domain: string
    criterion: string
    threshold: string
  }>
}

export interface StageInsightData {
  stageKey: string
  stageLabel: string
  stageGoal: string
  ageRange: string | null
  dotClass: string
  textClass: string
  levels: LevelInsightRowData[]
}

interface Props {
  stage: StageInsightData
}

// ── Level detail card (shown when a level is expanded) ────────────────────────

function LevelInsightDetail({ level }: { level: LevelInsightRowData }) {
  const { insight, gates } = level

  return (
    <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border">

      {/* Director goal */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted flex items-center gap-1.5">
          <Target className="w-3 h-3 shrink-0" /> Director Goal
        </p>
        <p className="text-[12px] text-text-secondary leading-relaxed">{insight.directorGoal}</p>
      </div>

      {/* Exit player profile */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted flex items-center gap-1.5">
          <User className="w-3 h-3 shrink-0" /> Exit Player Profile
        </p>
        <p className="text-[12px] text-text-secondary leading-relaxed">{insight.exitPlayerProfile}</p>
      </div>

      {/* Focus areas */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted flex items-center gap-1.5">
          <Zap className="w-3 h-3 shrink-0" /> Focus Areas
        </p>
        <ul className="space-y-0.5">
          {insight.focusAreas.map((area, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12px] text-text-secondary">
              <span className="shrink-0 mt-0.5 text-text-muted">·</span>
              {area}
            </li>
          ))}
        </ul>
      </div>

      {/* Readiness gates — live from DB when available, static fallback otherwise */}
      {gates.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-lime/70 flex items-center gap-1.5">
            <Zap className="w-3 h-3 shrink-0 text-lime/70" /> Readiness Gates ({gates.length})
          </p>
          <div className="space-y-1">
            {gates.map((gate, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5"
                  style={{ background: 'rgba(200,255,0,0.08)', color: 'rgba(200,255,0,0.6)', whiteSpace: 'nowrap' }}
                >
                  {gate.domain}
                </span>
                <p className="text-[11px] text-text-secondary leading-snug">
                  {gate.criterion}
                  {gate.threshold ? (
                    <span className="text-text-muted ml-1 font-mono text-[10px]">({gate.threshold})</span>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted flex items-center gap-1.5">
            <Zap className="w-3 h-3 shrink-0" /> Readiness Signals
          </p>
          <ul className="space-y-0.5">
            {insight.readinessSignals.map((sig, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                <span className="shrink-0 mt-0.5 text-lime/60">✓</span>
                {sig}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common blockers */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0" /> Common Blockers
        </p>
        <ul className="space-y-0.5">
          {insight.commonBlockers.map((blocker, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
              <span className="shrink-0 mt-0.5 text-status-orange/70">·</span>
              {blocker}
            </li>
          ))}
        </ul>
      </div>

      {/* Parent-safe summary */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted flex items-center gap-1.5">
          <Users className="w-3 h-3 shrink-0" /> Parent-Safe Summary
        </p>
        <p className="text-[11px] text-text-muted leading-relaxed italic">
          &ldquo;{insight.parentSafeSummary}&rdquo;
        </p>
      </div>

      {/* Builder CTA */}
      <div className="pt-1">
        <Link
          href={`/director/curriculum/level/${level.id}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-lime/80 hover:text-lime transition-colors"
        >
          Open in Builder
          <ExternalLink className="w-3 h-3 shrink-0" />
        </Link>
      </div>
    </div>
  )
}

// ── Main stage card ───────────────────────────────────────────────────────────

export function CurriculumStageInsightCard({ stage }: Props) {
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null)

  function toggleLevel(levelId: string) {
    setExpandedLevelId(prev => (prev === levelId ? null : levelId))
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Stage header */}
      <div
        className="px-4 py-3 sm:px-5 sm:py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.dotClass}`} />
              <p className={`text-[13px] font-semibold ${stage.textClass}`}>{stage.stageLabel}</p>
              {stage.ageRange && (
                <span className="text-[10px] text-text-muted font-mono shrink-0">{stage.ageRange}</span>
              )}
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed max-w-2xl">
              {stage.stageGoal}
            </p>
          </div>
          <span className="shrink-0 text-[10px] text-text-muted font-mono">
            {stage.levels.length} levels
          </span>
        </div>
      </div>

      {/* Level rows */}
      <div className="divide-y divide-border">
        {stage.levels.map(level => {
          const isExpanded = expandedLevelId === level.id
          return (
            <div key={level.id}>
              {/* Level header row */}
              <button
                type="button"
                onClick={() => toggleLevel(level.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-raised transition-colors group"
              >
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-text-muted group-hover:text-text-secondary transition-colors" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-text-secondary group-hover:text-text-primary transition-colors truncate">
                    {level.displayName}
                  </p>
                  {!isExpanded && (
                    <p className="text-[10px] text-text-muted truncate mt-0.5">
                      {level.insight.directorGoal}
                    </p>
                  )}
                </div>
                {level.gates.length > 0 && (
                  <span
                    className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(200,255,0,0.06)', color: 'rgba(200,255,0,0.45)' }}
                  >
                    {level.gates.length}g
                  </span>
                )}
              </button>

              {/* Expanded detail */}
              {isExpanded && <LevelInsightDetail level={level} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
