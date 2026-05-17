'use client'

import { ArrowRight, Lock, CheckCircle2, Circle } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  levels: CurriculumLevel[]
  activeLevelId?: string
}

const STAGE_ORDER = [
  'red_foundation',
  'orange_development',
  'green_performance',
  'yellow_competitive',
  'high_performance',
] as const

const STAGE_LABELS: Record<string, string> = {
  red_foundation:      'Red Foundation',
  orange_development:  'Orange Development',
  green_performance:   'Green Performance',
  yellow_competitive:  'Yellow Competitive',
  high_performance:    'High Performance',
}

const STAGE_COLORS: Record<string, string> = {
  red_foundation:      'border-status-red/30 bg-status-red/[0.04]',
  orange_development:  'border-status-orange/30 bg-status-orange/[0.04]',
  green_performance:   'border-status-green/30 bg-status-green/[0.04]',
  yellow_competitive:  'border-lime/30 bg-lime/[0.04]',
  high_performance:    'border-status-blue/30 bg-status-blue/[0.04]',
}

const STAGE_DOT: Record<string, string> = {
  red_foundation:      'bg-status-red',
  orange_development:  'bg-status-orange',
  green_performance:   'bg-status-green',
  yellow_competitive:  'bg-lime',
  high_performance:    'bg-status-blue',
}

export function CurriculumRelationshipMap({ levels, activeLevelId }: Props) {
  const byStage = STAGE_ORDER.map(stage => ({
    stage,
    levels: levels.filter(l => l.stage === stage),
  })).filter(s => s.levels.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-[11px] uppercase tracking-widest text-text-muted font-semibold">
          Curriculum pathway — {levels.length} levels
        </p>
      </div>

      <div className="space-y-3">
        {byStage.map(({ stage, levels: stageLevels }, stageIdx) => (
          <div key={stage}>
            <div className={`rounded-2xl border p-4 space-y-3 ${STAGE_COLORS[stage] ?? 'border-border bg-surface'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${STAGE_DOT[stage] ?? 'bg-text-muted'}`} />
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest">
                  {STAGE_LABELS[stage] ?? stage}
                </p>
                <span className="text-[10px] text-text-muted">· {stageLevels.length} level{stageLevels.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {stageLevels.map((level, idx) => {
                  const isActive = level.id === activeLevelId
                  return (
                    <div key={level.id} className="flex items-center gap-1.5">
                      <div className={`
                        rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors
                        ${isActive
                          ? 'border-lime bg-lime/10 text-lime'
                          : 'border-border bg-surface text-text-secondary hover:border-lime/30 hover:text-text-primary'
                        }
                      `}>
                        {level.display_name}
                      </div>
                      {idx < stageLevels.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {stageIdx < byStage.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowRight className="w-4 h-4 text-text-muted rotate-90" />
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
