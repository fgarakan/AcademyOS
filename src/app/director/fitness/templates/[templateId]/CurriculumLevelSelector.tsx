'use client'

import { useState, useTransition } from 'react'
import { GraduationCap, Check, Loader2 } from 'lucide-react'
import { setCurriculumLevelAction } from './setCurriculumLevelAction'

export interface CurriculumLevelOption {
  id: string
  display_name: string
  stage: string
}

interface Props {
  templateId: string
  currentLevelId: string | null
  levels: CurriculumLevelOption[]
}

const STAGE_LABELS: Record<string, string> = {
  red_foundation: 'Red Foundation',
  orange_development: 'Orange Development',
  green_performance: 'Green Performance',
  yellow_competitive: 'Yellow Competitive',
  high_performance: 'High Performance',
}

export function CurriculumLevelSelector({ templateId, currentLevelId, levels }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(currentLevelId)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentLevel = levels.find(l => l.id === selectedId)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value || null
    setSelectedId(val)
    setSaved(false)
    setError(null)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await setCurriculumLevelAction(templateId, selectedId)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setError(null)
      }
    })
  }

  // Group levels by stage for the select optgroup
  const levelsByStage: Record<string, CurriculumLevelOption[]> = {}
  for (const level of levels) {
    if (!levelsByStage[level.stage]) levelsByStage[level.stage] = []
    levelsByStage[level.stage].push(level)
  }

  const hasChanged = selectedId !== currentLevelId

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-text-muted" />
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Curriculum Focus</p>
        {currentLevel && !hasChanged && (
          <span className="text-[10px] font-semibold text-lime uppercase tracking-wide ml-auto">
            {currentLevel.display_name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedId ?? ''}
          onChange={handleChange}
          disabled={isPending}
          className="flex-1 min-w-0 bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50 disabled:opacity-50"
        >
          <option value="">— No curriculum level —</option>
          {Object.entries(levelsByStage).map(([stage, stageLevels]) => (
            <optgroup key={stage} label={STAGE_LABELS[stage] ?? stage}>
              {stageLevels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.display_name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={isPending || !hasChanged}
          className={[
            'shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
            hasChanged && !isPending
              ? 'bg-lime text-base hover:bg-lime/90'
              : 'bg-surface-raised text-text-muted border border-border cursor-not-allowed',
          ].join(' ')}
        >
          {isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Check className="w-3.5 h-3.5" />
          }
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      {saved && !hasChanged && (
        <p className="text-[11px] text-status-green">Curriculum level saved.</p>
      )}
      {error && (
        <p className="text-[11px] text-status-red">{error}</p>
      )}
      {!selectedId && (
        <p className="text-[11px] text-text-muted">
          Select a curriculum level to enable curriculum-aware block population.
        </p>
      )}
    </div>
  )
}
