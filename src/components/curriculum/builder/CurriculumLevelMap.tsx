'use client'

import type { CurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumMapLevelCard } from '@/components/curriculum/builder/CurriculumMapLevelCard'

type Stage = 'red_foundation' | 'orange_development' | 'green_performance' | 'yellow_competitive' | 'high_performance'

const STAGE_CONFIG: Record<Stage, {
  label: string
  color: string
  bg: string
  border: string
  dot: string
  laneBg: string
  laneBorder: string
}> = {
  red_foundation:     { label: 'Red Ball',         color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30',    dot: '#ef4444', laneBg: 'rgba(239,68,68,0.04)',   laneBorder: 'rgba(239,68,68,0.14)' },
  orange_development: { label: 'Orange Ball',      color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/30',  dot: '#f97316', laneBg: 'rgba(249,115,22,0.04)',  laneBorder: 'rgba(249,115,22,0.14)' },
  green_performance:  { label: 'Green Ball',       color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30',  dot: '#22c55e', laneBg: 'rgba(34,197,94,0.04)',   laneBorder: 'rgba(34,197,94,0.14)' },
  yellow_competitive: { label: 'Yellow Ball',      color: 'text-yellow-300', bg: 'bg-yellow-300/10', border: 'border-yellow-300/30', dot: '#eab308', laneBg: 'rgba(234,179,8,0.04)',   laneBorder: 'rgba(234,179,8,0.14)' },
  high_performance:   { label: 'High Performance', color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/30', dot: '#a78bfa', laneBg: 'rgba(167,139,250,0.04)', laneBorder: 'rgba(167,139,250,0.14)' },
}

function isStage(s: string | null | undefined): s is Stage {
  return !!s && s in STAGE_CONFIG
}

interface Props {
  data: CurriculumExplorerData
}

export function CurriculumLevelMap({ data }: Props) {
  const { levels, gates, drills } = data

  if (!data.tablesAvailable || levels.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm font-semibold text-text-primary mb-2">Curriculum data not yet available</p>
        <p className="text-xs text-text-secondary">Set up your curriculum spine to see the level map.</p>
      </div>
    )
  }

  const gatesByLevel = gates.reduce<Record<string, number>>((acc, g) => {
    acc[g.from_level_id] = (acc[g.from_level_id] ?? 0) + 1
    return acc
  }, {})

  const drillsByLevel = drills.reduce<Record<string, number>>((acc, d) => {
    if (d.level_min_id) acc[d.level_min_id] = (acc[d.level_min_id] ?? 0) + 1
    return acc
  }, {})

  const stages = Object.keys(STAGE_CONFIG) as Stage[]

  return (
    <div className="space-y-5">
      {stages.map(stage => {
        const cfg = STAGE_CONFIG[stage]
        const stageLevels = levels.filter(l => l.stage === stage)
        if (stageLevels.length === 0) return null

        return (
          <div
            key={stage}
            className="rounded-2xl overflow-hidden"
            style={{ background: cfg.laneBg, border: `1px solid ${cfg.laneBorder}` }}
          >
            {/* Lane header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: cfg.laneBorder }}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
              <span className={`text-[11px] uppercase tracking-widest font-bold ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-[11px] text-text-muted ml-1">
                {stageLevels.length} level{stageLevels.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Level cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
              {stageLevels.map(level => {
                const gateCount = gatesByLevel[level.id] ?? 0
                const drillCount = drillsByLevel[level.id] ?? 0
                const levelDrills = drills.filter(d => d.level_min_id === level.id)

                return (
                  <CurriculumMapLevelCard
                    key={level.id}
                    level={level}
                    gateCount={gateCount}
                    drillCount={drillCount}
                    levelDrills={levelDrills}
                    stageDot={cfg.dot}
                    stageBorder={cfg.laneBorder}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
