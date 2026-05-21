'use client'

import { useState } from 'react'
import { Users, User } from 'lucide-react'

interface Props {
  levelName: string
  stage: string
  gateCount: number
  drillCount: number
}

const STAGE_LABEL: Record<string, string> = {
  red_foundation:     'Red Ball — Foundations',
  orange_development: 'Orange Ball — Development',
  green_performance:  'Green Ball — Performance',
  yellow_competitive: 'Yellow Ball — Competitive',
  high_performance:   'High Performance',
}

export function CurriculumNodePreview({ levelName, stage, gateCount, drillCount }: Props) {
  const [role, setRole] = useState<'player' | 'parent'>('player')
  const stageLabel = STAGE_LABEL[stage] ?? stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Viewing as</p>
        <div className="inline-flex rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setRole('player')}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors ${
              role === 'player'
                ? 'bg-lime text-[#030506]'
                : 'text-text-secondary hover:bg-surface-raised'
            }`}
          >
            <User className="w-3 h-3" />
            Player
          </button>
          <button
            onClick={() => setRole('parent')}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors ${
              role === 'parent'
                ? 'bg-lime text-[#030506]'
                : 'text-text-secondary hover:bg-surface-raised'
            }`}
          >
            <Users className="w-3 h-3" />
            Parent
          </button>
        </div>
      </div>

      {/* Preview card */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted">{stageLabel}</p>
          <p className="text-base font-semibold text-text-primary mt-0.5">{levelName}</p>
        </div>

        {role === 'player' ? (
          <div className="space-y-2">
            <div className="rounded-lg bg-surface-raised border border-border px-3 py-2.5">
              <p className="text-[10px] text-text-muted">What I&apos;m working on</p>
              <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5">
                Building the skills and consistency to progress through {levelName}.
              </p>
            </div>
            <div className="rounded-lg bg-surface-raised border border-border px-3 py-2.5">
              <p className="text-[10px] text-text-muted">What I need to show</p>
              <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5">
                {gateCount > 0
                  ? `${gateCount} development gate${gateCount !== 1 ? 's' : ''} — your coach tracks these during practice.`
                  : 'Gates not yet connected for this level.'}
              </p>
            </div>
            {drillCount > 0 && (
              <div className="rounded-lg bg-surface-raised border border-border px-3 py-2.5">
                <p className="text-[10px] text-text-muted">How I&apos;m training</p>
                <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5">
                  {drillCount} drill{drillCount !== 1 ? 's' : ''} designed for this level.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-lg bg-surface-raised border border-border px-3 py-2.5">
              <p className="text-[10px] text-text-muted">Current level</p>
              <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5">
                {levelName} — {stageLabel}
              </p>
            </div>
            <div className="rounded-lg bg-surface-raised border border-border px-3 py-2.5">
              <p className="text-[10px] text-text-muted">What they&apos;re working on</p>
              <p className="text-[12px] text-text-secondary leading-relaxed mt-0.5">
                Developing core skills at this stage.
                {drillCount > 0 ? ` ${drillCount} training drill${drillCount !== 1 ? 's' : ''} support their sessions.` : ''}
              </p>
            </div>
            <p className="text-[10px] text-text-muted/60 px-1 leading-relaxed">
              Parent views never show internal gate criteria, coach assessment notes,
              or advancement scores.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
