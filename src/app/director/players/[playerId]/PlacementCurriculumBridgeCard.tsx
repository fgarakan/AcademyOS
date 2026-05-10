import { AlertCircle, Lock } from 'lucide-react'
import { CurriculumLevelPickerCard, type CurriculumLevelOption } from './CurriculumLevelPickerCard'

interface Props {
  playerId: string
  academyId: string
  levels: CurriculumLevelOption[]
}

export function PlacementCurriculumBridgeCard({ playerId, academyId, levels }: Props) {
  return (
    <div className="space-y-3">

      {/* Context callout */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-status-orange/5 border border-status-orange/20">
        <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-status-orange">
            Curriculum level not assigned
          </p>
          <p className="text-[10px] text-status-orange/80 leading-snug">
            This player is active and assigned to a group, but does not yet have a curriculum level.
            Assigning a curriculum level unlocks Skill Path tracking and progression evidence.
          </p>
          <div className="flex items-center gap-1 pt-0.5">
            <Lock className="w-2.5 h-2.5 text-text-muted shrink-0" />
            <p className="text-[10px] text-text-muted leading-snug">
              Internal only — no parent or player notification is sent.
              This does not move the player to a new level or auto-complete any requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Reuse existing CurriculumLevelPickerCard + setCurriculumLevelAction */}
      <CurriculumLevelPickerCard
        playerId={playerId}
        academyId={academyId}
        currentLevelId={null}
        currentLevelName={null}
        levels={levels}
      />

    </div>
  )
}
