'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelDetailPanel } from '@/components/curriculum/CurriculumLevelDetailPanel'

type Stage = 'red_foundation' | 'orange_development' | 'green_performance' | 'yellow_competitive' | 'high_performance'

const STAGE_CONFIG: Record<Stage, { label: string; color: string; bg: string; border: string }> = {
  red_foundation:       { label: 'Red Ball',        color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30' },
  orange_development:   { label: 'Orange Ball',     color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/30' },
  green_performance:    { label: 'Green Ball',      color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30' },
  yellow_competitive:   { label: 'Yellow Ball',     color: 'text-yellow-300', bg: 'bg-yellow-300/10', border: 'border-yellow-300/30' },
  high_performance:     { label: 'High Performance',color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/30' },
}

function isStage(s: string | null | undefined): s is Stage {
  return !!s && s in STAGE_CONFIG
}

interface Props {
  data: CurriculumExplorerData
}

export function CurriculumLevelMap({ data }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
  const selectedLevel = selectedId ? levels.find(l => l.id === selectedId) ?? null : null

  return (
    <div className="space-y-6">
      {stages.map(stage => {
        const cfg = STAGE_CONFIG[stage]
        const stageLevels = levels.filter(l => l.stage === stage)
        if (stageLevels.length === 0) return null

        return (
          <div key={stage} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-widest font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-[10px] text-text-muted">— {stageLevels.length} level{stageLevels.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {stageLevels.map(level => {
                const gateCount = gatesByLevel[level.id] ?? 0
                const drillCount = drillsByLevel[level.id] ?? 0
                const isSelected = selectedId === level.id

                return (
                  <button
                    key={level.id}
                    onClick={() => setSelectedId(isSelected ? null : level.id)}
                    className={`text-left rounded-xl border p-3 transition-all ${
                      isSelected
                        ? `${cfg.bg} ${cfg.border}`
                        : 'border-border bg-surface-raised hover:border-lime/30 hover:bg-lime/[0.03]'
                    }`}
                  >
                    <p className={`text-[12px] font-semibold mb-1.5 ${isSelected ? cfg.color : 'text-text-primary'}`}>
                      {level.display_name}
                    </p>
                    <div className="flex gap-3">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${gateCount === 0 ? 'bg-status-red' : gateCount < 2 ? 'bg-status-orange' : 'bg-status-green'}`} />
                        <span className="font-mono text-text-secondary">{gateCount}</span> gates
                      </span>
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${drillCount === 0 ? 'bg-status-red' : drillCount < 3 ? 'bg-status-orange' : 'bg-status-green'}`} />
                        <span className="font-mono text-text-secondary">{drillCount}</span> drills
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {selectedLevel && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="text-[12px] font-semibold text-text-primary">{selectedLevel.display_name}</p>
            <div className="flex items-center gap-3">
              <Link
                href={`/director/curriculum/level/${selectedLevel.id}`}
                className="text-[11px] text-lime hover:text-lime/80 transition-colors"
              >
                Open builder →
              </Link>
              <button
                onClick={() => setSelectedId(null)}
                className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          <div className="p-4">
            <CurriculumLevelDetailPanel
              level={selectedLevel}
              gates={gates.filter(g => g.from_level_id === selectedLevel.id)}
              drills={drills.filter(d => d.level_min_id === selectedLevel.id)}
              coachLanguage={data.coachLanguage.filter(cl => cl.level_id === selectedLevel.id)}
              competition={data.competitionTrack.find(ct => ct.level_id === selectedLevel.id) ?? null}
              fitness={data.fitnessGuidance.find(fg => fg.level_id === selectedLevel.id) ?? null}
              volume={data.volumeGuidance.find(vg => vg.level_id === selectedLevel.id) ?? null}
              tablesAvailable={data.tablesAvailable}
            />
          </div>
        </div>
      )}
    </div>
  )
}
