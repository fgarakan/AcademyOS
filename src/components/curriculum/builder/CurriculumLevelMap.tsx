'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import type { CurriculumExplorerData } from '@/lib/backend/curriculumExplorer'
import { CurriculumLevelDetailPanel } from '@/components/curriculum/CurriculumLevelDetailPanel'

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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
              {stageLevels.map(level => {
                const gateCount = gatesByLevel[level.id] ?? 0
                const drillCount = drillsByLevel[level.id] ?? 0
                const isSelected = selectedId === level.id
                const isMissing = gateCount === 0 && drillCount === 0
                const isLow = !isMissing && (gateCount < 2 || drillCount < 3)
                const statusDot = isMissing ? '#FF3B30' : isLow ? '#FF9500' : '#30D158'
                const statusLabel = isMissing ? 'Missing content' : isLow ? 'Low content' : 'Ready'

                return (
                  <button
                    key={level.id}
                    onClick={() => setSelectedId(isSelected ? null : level.id)}
                    className="group text-left rounded-xl border p-3 transition-all"
                    style={{
                      background: isSelected ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.20)',
                      borderColor: isSelected ? cfg.dot : 'rgba(255,255,255,0.07)',
                    }}
                  >
                    {/* Status dot + name */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: statusDot }} />
                      <p className="text-[12px] font-semibold text-text-primary leading-snug flex-1">
                        {level.display_name}
                      </p>
                    </div>

                    {/* Counts */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2.5">
                      <span className="text-[10px] text-text-muted">
                        <span className="font-mono text-text-secondary">{gateCount}</span> gates
                      </span>
                      <span className="text-[10px] text-text-muted">
                        <span className="font-mono text-text-secondary">{drillCount}</span> drills
                      </span>
                    </div>

                    {/* Status chip */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: isMissing ? 'rgba(255,59,48,0.12)' : isLow ? 'rgba(255,149,0,0.12)' : 'rgba(48,209,88,0.12)',
                          color: statusDot,
                        }}
                      >
                        {statusLabel}
                      </span>
                      <ChevronRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Expanded level detail */}
      {selectedLevel && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="text-[12px] font-semibold text-text-primary">{selectedLevel.display_name}</p>
            <div className="flex items-center gap-3">
              <Link
                href={`/director/curriculum/level/${selectedLevel.id}`}
                className="flex items-center gap-1 text-[11px] text-lime hover:text-lime/80 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Open builder
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
