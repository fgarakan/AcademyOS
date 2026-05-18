'use client'

import { ArrowRight, Shield, Target, ChevronRight } from 'lucide-react'
import type { CurriculumLevel, CurriculumGate, CurriculumDrill } from '@/lib/backend/curriculumExplorer'

interface Props {
  levels: CurriculumLevel[]
  gates?: CurriculumGate[]
  drills?: CurriculumDrill[]
  activeLevelId?: string
  onLevelClick?: (levelId: string) => void
}

const STAGE_ORDER = [
  'red_foundation',
  'orange_development',
  'green_performance',
  'yellow_competitive',
  'high_performance',
] as const

type Stage = typeof STAGE_ORDER[number]

const STAGE_CONFIG: Record<Stage, {
  label: string
  shortLabel: string
  dot: string
  stageBg: string
  stageBorder: string
  chip: string
  chipText: string
}> = {
  red_foundation:     { label: 'Red Foundation',     shortLabel: 'Red',    dot: '#FF3B30', stageBg: 'rgba(255,59,48,0.03)',    stageBorder: 'rgba(255,59,48,0.18)',    chip: 'bg-status-red/10 border-status-red/20',    chipText: 'text-status-red' },
  orange_development: { label: 'Orange Development', shortLabel: 'Orange', dot: '#f97316', stageBg: 'rgba(249,115,22,0.03)',   stageBorder: 'rgba(249,115,22,0.18)',   chip: 'bg-amber-500/10 border-amber-500/20',      chipText: 'text-amber-400' },
  green_performance:  { label: 'Green Performance',  shortLabel: 'Green',  dot: '#22c55e', stageBg: 'rgba(34,197,94,0.03)',    stageBorder: 'rgba(34,197,94,0.18)',    chip: 'bg-green-500/10 border-green-500/20',      chipText: 'text-green-400' },
  yellow_competitive: { label: 'Yellow Competitive', shortLabel: 'Yellow', dot: '#C8FF00', stageBg: 'rgba(200,255,0,0.03)',    stageBorder: 'rgba(200,255,0,0.18)',    chip: 'bg-lime/10 border-lime/20',                chipText: 'text-lime' },
  high_performance:   { label: 'High Performance',   shortLabel: 'HP',     dot: '#a78bfa', stageBg: 'rgba(167,139,250,0.03)',  stageBorder: 'rgba(167,139,250,0.18)',  chip: 'bg-violet-500/10 border-violet-500/20',    chipText: 'text-violet-400' },
}

export function CurriculumRelationshipMap({ levels, gates = [], drills = [], activeLevelId, onLevelClick }: Props) {
  const gatesByFromLevel = new Map<string, number>()
  for (const g of gates) {
    gatesByFromLevel.set(g.from_level_id, (gatesByFromLevel.get(g.from_level_id) ?? 0) + 1)
  }
  const drillsByLevel = new Map<string, number>()
  for (const d of drills) {
    if (d.level_min_id) drillsByLevel.set(d.level_min_id, (drillsByLevel.get(d.level_min_id) ?? 0) + 1)
  }

  const byStage = STAGE_ORDER.map(stage => ({
    stage,
    cfg: STAGE_CONFIG[stage],
    levels: levels
      .filter(l => l.stage === stage)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  })).filter(s => s.levels.length > 0)

  return (
    <div className="space-y-4">
      <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
        Curriculum pathway — {levels.length} level{levels.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-2">
        {byStage.map(({ stage, cfg, levels: stageLevels }, stageIdx) => (
          <div key={stage}>
            {/* Stage block */}
            <div
              className="rounded-2xl border p-4 space-y-3"
              style={{ background: cfg.stageBg, borderColor: cfg.stageBorder }}
            >
              {/* Stage header */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest">
                  {cfg.label}
                </p>
                <span className="text-[10px] text-text-muted">· {stageLevels.length} level{stageLevels.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Levels row */}
              <div className="flex flex-wrap gap-2">
                {stageLevels.map((level, idx) => {
                  const isActive = level.id === activeLevelId
                  const gateCount = gatesByFromLevel.get(level.id) ?? 0
                  const drillCount = drillsByLevel.get(level.id) ?? 0
                  const clickable = !!onLevelClick

                  return (
                    <div key={level.id} className="flex items-center gap-1.5">
                      <button
                        onClick={() => onLevelClick?.(level.id)}
                        disabled={!clickable}
                        className={`
                          group rounded-xl border px-3 py-2 text-left transition-all
                          ${isActive
                            ? 'border-lime bg-lime/10'
                            : clickable
                              ? 'border-border bg-surface hover:border-lime/30 hover:bg-lime/[0.03] cursor-pointer'
                              : 'border-border bg-surface cursor-default'
                          }
                        `}
                      >
                        <div className="flex items-center gap-1.5">
                          <p className={`text-[11px] font-semibold ${isActive ? 'text-lime' : 'text-text-secondary group-hover:text-text-primary'}`}>
                            {level.display_name}
                          </p>
                          {clickable && <ChevronRight className={`w-3 h-3 transition-colors ${isActive ? 'text-lime' : 'text-text-muted group-hover:text-lime/60'}`} />}
                        </div>
                        {(drillCount > 0 || gateCount > 0) && (
                          <div className="flex items-center gap-2 mt-1">
                            {drillCount > 0 && (
                              <span className="flex items-center gap-1 text-[9px] text-text-muted">
                                <Target className="w-2.5 h-2.5" />{drillCount}
                              </span>
                            )}
                            {gateCount > 0 && (
                              <span className="flex items-center gap-1 text-[9px] text-text-muted">
                                <Shield className="w-2.5 h-2.5" />{gateCount}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                      {idx < stageLevels.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Between-stage arrow */}
            {stageIdx < byStage.length - 1 && (
              <div className="flex justify-center py-0.5">
                <div className="flex flex-col items-center gap-0.5">
                  <ArrowRight className="w-4 h-4 text-text-muted rotate-90" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-text-muted text-center">
        Players progress left to right within each stage, then advance to the next stage.
        Gate requirements must be met to unlock the next level.
      </p>
    </div>
  )
}
