import { Target, Star, ArrowRight } from 'lucide-react'

interface Props {
  levelName: string
  stage: string
  missionStatement?: string | null
  keyFocusAreas?: string[] | null
  successLooksLike?: string | null
}

const STAGE_MISSION: Record<string, string> = {
  red_foundation:     'Build a love of the game and develop fundamental movement and racquet skills.',
  orange_development: 'Develop consistent technique and begin competing in structured formats.',
  green_performance:  'Build competitive match play skills and tactical awareness.',
  yellow_competitive: 'Compete consistently at a high level and develop a personal game style.',
  high_performance:   'Perform at the highest level and pursue elite competitive opportunities.',
}

export function PlayerMissionPanel({ levelName, stage, missionStatement, keyFocusAreas, successLooksLike }: Props) {
  const stageMission = STAGE_MISSION[stage] ?? ''

  return (
    <div className="rounded-2xl border border-lime/15 bg-lime/[0.02] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-lime/10">
        <Target className="w-4 h-4 text-lime shrink-0" />
        <p className="text-[12px] font-semibold text-text-primary">Player mission — {levelName}</p>
      </div>

      <div className="p-4 space-y-4">
        {missionStatement ? (
          <p className="text-[13px] text-text-primary leading-relaxed">{missionStatement}</p>
        ) : (
          <p className="text-[13px] text-text-secondary leading-relaxed">{stageMission}</p>
        )}

        {keyFocusAreas && keyFocusAreas.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Key focus areas</p>
            <div className="space-y-1">
              {keyFocusAreas.map((area, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-lime shrink-0" />
                  <p className="text-[12px] text-text-secondary">{area}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {successLooksLike && (
          <div className="rounded-xl border border-status-green/20 bg-status-green/[0.04] px-3 py-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-status-green shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-status-green font-semibold">Success looks like</p>
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed">{successLooksLike}</p>
          </div>
        )}
      </div>
    </div>
  )
}
