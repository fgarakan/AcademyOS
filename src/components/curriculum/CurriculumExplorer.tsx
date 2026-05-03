'use client'

import { useState, useMemo } from 'react'
import type { CurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelDetailPanel } from './CurriculumLevelDetailPanel'

type Stage = 'red_foundation' | 'orange_development' | 'green_performance' | 'yellow_competitive' | 'high_performance'

const STAGE_ORDER: Stage[] = [
  'red_foundation',
  'orange_development',
  'green_performance',
  'yellow_competitive',
  'high_performance',
]

const STAGE_CONFIG: Record<Stage, {
  label: string
  color: string
  borderActive: string
  bgActive: string
  borderCard: string
}> = {
  red_foundation: {
    label: 'Red',
    color: 'text-red-400',
    borderActive: 'border-red-400/50',
    bgActive: 'bg-red-400/15',
    borderCard: 'border-red-400/25',
  },
  orange_development: {
    label: 'Orange',
    color: 'text-amber-400',
    borderActive: 'border-amber-400/50',
    bgActive: 'bg-amber-400/15',
    borderCard: 'border-amber-400/25',
  },
  green_performance: {
    label: 'Green',
    color: 'text-green-400',
    borderActive: 'border-green-400/50',
    bgActive: 'bg-green-400/15',
    borderCard: 'border-green-400/25',
  },
  yellow_competitive: {
    label: 'Yellow',
    color: 'text-yellow-300',
    borderActive: 'border-yellow-300/50',
    bgActive: 'bg-yellow-300/15',
    borderCard: 'border-yellow-300/25',
  },
  high_performance: {
    label: 'HP',
    color: 'text-violet-400',
    borderActive: 'border-violet-400/50',
    bgActive: 'bg-violet-400/15',
    borderCard: 'border-violet-400/25',
  },
}

interface Props {
  data: CurriculumExplorerData
}

export function CurriculumExplorer({ data }: Props) {
  const { levels, gates, drills, coachLanguage, competitionTrack, fitnessGuidance, volumeGuidance, tablesAvailable } = data

  const [activeStage, setActiveStage] = useState<Stage>('red_foundation')
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null)

  const levelSortMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of levels) map.set(l.id, l.sort_order)
    return map
  }, [levels])

  const stageLevels = useMemo(
    () => levels.filter(l => l.stage === activeStage),
    [levels, activeStage],
  )

  const gateCountByFromLevel = useMemo(() => {
    const map = new Map<string, number>()
    for (const g of gates) map.set(g.from_level_id, (map.get(g.from_level_id) ?? 0) + 1)
    return map
  }, [gates])

  const drillCountByLevel = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of levels) {
      const lo = levelSortMap.get(l.id) ?? 0
      const count = drills.filter(d => {
        if (!d.level_min_id || !d.level_max_id) return false
        const minSort = levelSortMap.get(d.level_min_id) ?? 0
        const maxSort = levelSortMap.get(d.level_max_id) ?? 999
        return lo >= minSort && lo <= maxSort
      }).length
      map.set(l.id, count)
    }
    return map
  }, [levels, drills, levelSortMap])

  const selectedLevel = useMemo(
    () => (selectedLevelId ? levels.find(l => l.id === selectedLevelId) ?? null : null),
    [selectedLevelId, levels],
  )

  const selectedLevelGates = useMemo(
    () => (selectedLevel ? gates.filter(g => g.from_level_id === selectedLevel.id) : []),
    [selectedLevel, gates],
  )

  const selectedLevelDrills = useMemo(() => {
    if (!selectedLevel) return []
    const lo = levelSortMap.get(selectedLevel.id) ?? 0
    return drills.filter(d => {
      if (!d.level_min_id || !d.level_max_id) return false
      const minSort = levelSortMap.get(d.level_min_id) ?? 0
      const maxSort = levelSortMap.get(d.level_max_id) ?? 999
      return lo >= minSort && lo <= maxSort
    })
  }, [selectedLevel, drills, levelSortMap])

  const summaryStats = [
    { label: 'Levels', value: levels.length || 15 },
    { label: 'Gates', value: tablesAvailable ? gates.length : 57 },
    { label: 'Drills', value: tablesAvailable ? drills.length : 152 },
    { label: 'Coach Language', value: tablesAvailable ? coachLanguage.length : 120 },
  ]

  function handleStageChange(stage: Stage) {
    setActiveStage(stage)
    setSelectedLevelId(null)
  }

  return (
    <div className="space-y-5">

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryStats.map(s => (
          <div key={s.label} className="px-4 py-3 rounded-xl border border-border bg-surface-raised">
            <p className="label-xs mb-1">{s.label}</p>
            <p className="text-2xl font-mono font-bold text-lime">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Product-clean badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-status-green/30 bg-status-green/5 w-fit">
        <span className="text-status-green text-[11px]">✓</span>
        <p className="text-[11px] text-status-green font-medium">Product-clean curriculum</p>
        <p className="text-[10px] text-text-muted">— no tool or vendor references in seed data</p>
      </div>

      {!tablesAvailable && (
        <div className="px-4 py-3 rounded-xl border border-status-orange/30 bg-status-orange/5">
          <p className="text-[11px] text-status-orange">
            Gate, drill, and language data require migration 052. Counts above show design targets.
          </p>
        </div>
      )}

      {/* Stage navigation */}
      <div className="flex gap-2 flex-wrap">
        {STAGE_ORDER.map(stage => {
          const cfg = STAGE_CONFIG[stage]
          const isActive = activeStage === stage
          const count = levels.filter(l => l.stage === stage).length
          return (
            <button
              key={stage}
              onClick={() => handleStageChange(stage)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                isActive
                  ? `${cfg.borderActive} ${cfg.bgActive} ${cfg.color}`
                  : 'border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              {cfg.label}
              <span className={`text-[10px] font-mono ${isActive ? cfg.color : 'text-text-muted'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* Level card list */}
        <div className="flex flex-col gap-2 w-full md:w-56 md:shrink-0">
          {stageLevels.map(level => {
            const cfg = STAGE_CONFIG[level.stage as Stage]
            const isSelected = selectedLevelId === level.id
            const gateCount = gateCountByFromLevel.get(level.id) ?? 0
            const drillCount = drillCountByLevel.get(level.id) ?? 0
            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(isSelected ? null : level.id)}
                className={`text-left w-full px-4 py-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-lime bg-lime/5 shadow-[0_0_8px_rgba(200,255,0,0.15)]'
                    : `${cfg.borderCard} bg-surface hover:bg-surface-raised hover:border-border`
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-[11px] font-semibold leading-snug ${isSelected ? 'text-lime' : cfg.color}`}>
                    {level.display_name}
                  </p>
                  {isSelected && (
                    <span className="text-[9px] text-lime">▶</span>
                  )}
                </div>
                {tablesAvailable && (
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[10px] text-text-muted font-mono">{gateCount} gates</span>
                    <span className="text-[10px] text-text-muted font-mono">{drillCount} drills</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0">
          {selectedLevel ? (
            <CurriculumLevelDetailPanel
              level={selectedLevel}
              gates={selectedLevelGates}
              drills={selectedLevelDrills}
              coachLanguage={coachLanguage.filter(cl => cl.level_id === selectedLevel.id)}
              competition={competitionTrack.find(ct => ct.level_id === selectedLevel.id) ?? null}
              fitness={fitnessGuidance.find(fg => fg.level_id === selectedLevel.id) ?? null}
              volume={volumeGuidance.find(vg => vg.level_id === selectedLevel.id) ?? null}
              tablesAvailable={tablesAvailable}
            />
          ) : (
            <div className="flex items-center justify-center h-48 rounded-xl border border-border border-dashed">
              <p className="text-[11px] text-text-muted">
                Select a level to explore its curriculum content
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
