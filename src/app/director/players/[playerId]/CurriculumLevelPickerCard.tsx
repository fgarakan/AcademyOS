'use client'

import { useState, useTransition } from 'react'
import { GraduationCap, Check, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { setCurriculumLevelAction } from './setCurriculumLevelAction'

export interface CurriculumLevelOption {
  id: string
  display_name: string
  stage: string
}

const STAGE_LABELS: Record<string, string> = {
  red_foundation:     'Red Foundation',
  orange_development: 'Orange Development',
  green_performance:  'Green Performance',
  yellow_competitive: 'Yellow Competitive',
  high_performance:   'High Performance',
}

interface Props {
  playerId: string
  academyId: string
  currentLevelId: string | null
  currentLevelName: string | null
  levels: CurriculumLevelOption[]
}

export function CurriculumLevelPickerCard({
  playerId,
  academyId,
  currentLevelId,
  currentLevelName,
  levels,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(currentLevelId ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasChanged = selectedId !== (currentLevelId ?? '')
  const selectedLevel = levels.find(l => l.id === selectedId)

  const levelsByStage: Record<string, CurriculumLevelOption[]> = {}
  for (const level of levels) {
    if (!levelsByStage[level.stage]) levelsByStage[level.stage] = []
    levelsByStage[level.stage].push(level)
  }

  function handleSave() {
    if (!selectedId) {
      setError('Please select a curriculum level before saving.')
      return
    }
    startTransition(async () => {
      const result = await setCurriculumLevelAction(playerId, academyId, selectedId)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setError(null)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-lime" />
          <p className="label-xs">Assign Curriculum Level</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">

        {/* Current level */}
        {currentLevelName && !hasChanged && (
          <div className="px-3 py-2 rounded-lg border border-border bg-surface-raised">
            <p className="text-[10px] text-text-muted mb-0.5">Current level</p>
            <p className="text-sm font-semibold text-text-primary">{currentLevelName}</p>
          </div>
        )}

        {/* Level picker */}
        <div className="space-y-2">
          <select
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setSaved(false); setError(null) }}
            disabled={isPending}
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50 disabled:opacity-50"
          >
            <option value="">— Select a level —</option>
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
            disabled={isPending || !hasChanged || !selectedId}
            className={[
              'w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              hasChanged && selectedId && !isPending
                ? 'bg-lime text-base hover:bg-lime/90'
                : 'bg-surface-raised text-text-muted border border-border cursor-not-allowed opacity-60',
            ].join(' ')}
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Check className="w-4 h-4" /> {currentLevelId ? 'Change level' : 'Assign level'}</>
            }
          </button>
        </div>

        {/* Selected level preview */}
        {selectedLevel && hasChanged && (
          <div className="px-3 py-2 rounded-lg border border-lime/20 bg-lime/3">
            <p className="text-[10px] text-lime font-medium">Assigning to:</p>
            <p className="text-sm text-text-primary font-semibold mt-0.5">{selectedLevel.display_name}</p>
            <p className="text-[10px] text-text-muted capitalize">{STAGE_LABELS[selectedLevel.stage] ?? selectedLevel.stage}</p>
          </div>
        )}

        {/* Success */}
        {saved && !hasChanged && (
          <p className="text-[11px] text-status-green flex items-center gap-1.5">
            <Check className="w-3 h-3" /> Curriculum level saved.
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="text-[11px] text-status-red flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{error}
          </p>
        )}

        {/* Guardrail copy */}
        <p className="text-[10px] text-text-muted leading-relaxed border-t border-border pt-2">
          This sets the working curriculum level for coaching context. It does not auto-promote the player, change their group, or send any notifications.
        </p>

      </CardContent>
    </Card>
  )
}
