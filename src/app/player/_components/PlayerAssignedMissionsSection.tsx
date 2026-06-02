// Sprint 1113-1120 — Player Assigned Missions Section
// Server Component — shows active missions from player_mission_assignments.
// Player sees ONLY: mission_label, mission_description (no scores, no coach notes, no assessment data).
// RLS enforces player-scoped access (requires player.profile_id = auth.uid()).
// Falls back gracefully if migration 076 not applied.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Target, Flame, CheckCircle2 } from 'lucide-react'

interface PlayerMissionRow {
  id: string
  mission_label: string
  mission_description: string | null
  period_label: string | null
  curriculum_level_key: string | null
}

interface PlayerAssignedMissionsSectionProps {
  playerId: string
  academyId: string
  playerFirstName: string
}

export async function PlayerAssignedMissionsSection({
  playerId,
  academyId,
  playerFirstName,
}: PlayerAssignedMissionsSectionProps) {
  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  let missions: PlayerMissionRow[] = []

  try {
    const { data, error } = await rawDb
      .from('player_mission_assignments')
      .select('id, mission_label, mission_description, period_label, curriculum_level_key')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .eq('status', 'active')
      .order('display_order', { ascending: true })
      .limit(3)

    if (!error?.message?.includes('does not exist') && !error?.code?.includes('42P01')) {
      missions = (data ?? []) as PlayerMissionRow[]
    }
  } catch {
    // Migration 076 not yet applied — render nothing
    return null
  }

  if (missions.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-lime" />
        <p className="text-sm font-bold text-text-primary">My Missions</p>
        <span className="text-[10px] font-bold text-lime bg-lime/10 border border-lime/20 rounded px-1.5 py-0.5">
          {missions.length} active
        </span>
      </div>

      <div className="space-y-2">
        {missions.map((mission, index) => (
          <div
            key={mission.id}
            className="rounded-xl border border-lime/20 bg-lime/3 px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-lime">{index + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary leading-tight mb-1">
                  {mission.mission_label}
                </p>
                {mission.mission_description && (
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {mission.mission_description}
                  </p>
                )}
                {mission.period_label && (
                  <p className="text-[10px] text-text-muted mt-1.5">{mission.period_label}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-text-muted text-center px-4">
        Missions are set by your coaching team and updated as you progress.
      </p>
    </div>
  )
}
