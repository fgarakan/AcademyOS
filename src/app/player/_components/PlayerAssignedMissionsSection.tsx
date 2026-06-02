// Sprint 1131-1140 — Player Assigned Missions Section V2
// Upgraded: encouraging, kid-friendly, motivating presentation.
//
// Player sees:
//   - Mission name (large, prominent)
//   - Why it matters (simple, positive)
//   - Today's action (specific, doable)
//   - Progress encouragement
//
// Player NEVER sees:
//   - Raw scores or assessment data
//   - Coach internal notes
//   - Director reasoning
//   - Placement recommendation detail

import { getSupabaseServer } from '@/lib/supabase/server'
import { Target, Flame, CheckCircle2, ArrowRight } from 'lucide-react'

interface PlayerMissionRow {
  id: string
  mission_label: string
  mission_description: string | null
  period_label: string | null
  curriculum_level_key: string | null
  display_order: number
}

interface PlayerAssignedMissionsSectionProps {
  playerId: string
  academyId: string
  playerFirstName: string
}

// Generate a simple, encouraging "why it matters" for common mission types
function buildMissionWhyItMatters(missionLabel: string): string {
  const label = missionLabel.toLowerCase()

  if (label.includes('rhythm') || label.includes('serve')) {
    return 'A smooth serve starts every point with confidence. When your rhythm is right, everything else feels easier.'
  }
  if (label.includes('space') || label.includes('spacing') || label.includes('contact')) {
    return 'Getting in the right position before you swing gives you more time, more control, and more power — with less effort.'
  }
  if (label.includes('rally') || label.includes('consistency')) {
    return 'Staying in the rally longer gives you more chances to win points. Patience is a superpower in tennis.'
  }
  if (label.includes('low ball') || label.includes('low-ball')) {
    return 'Handling low balls well means no shot is too hard to return. It makes you tougher to beat.'
  }
  if (label.includes('bounce') || label.includes('track')) {
    return 'Watching the ball all the way to your racket gives your brain the information it needs to make the perfect shot.'
  }
  if (label.includes('confidence') || label.includes('believe')) {
    return 'The way you think about yourself after a mistake matters more than the mistake. Reset fast, compete hard.'
  }
  if (label.includes('movement') || label.includes('footwork')) {
    return 'Great footwork means you always arrive at the ball on time. The best players look calm because their feet do the work.'
  }
  return 'This skill is one of the building blocks of your game at this level. Work on it regularly and you\'ll notice the difference in matches.'
}

// Generate a simple "today's action" suggestion
function buildTodayAction(missionLabel: string): string {
  const label = missionLabel.toLowerCase()

  if (label.includes('rhythm') || label.includes('serve')) {
    return 'Count "1-2-3" out loud with every serve today: toss on 1, backswing on 2, hit on 3. Slow is smooth, smooth is fast.'
  }
  if (label.includes('space') || label.includes('spacing')) {
    return 'Before each shot today, say "move first" to yourself before you swing. Get your feet there, then hit.'
  }
  if (label.includes('rally') || label.includes('consistency')) {
    return 'Try to extend every rally by 2 shots longer than feels natural. Count out loud — it keeps your focus.'
  }
  if (label.includes('low ball')) {
    return 'Find 5 low balls today and try bending your knees to meet the ball rather than reaching down.'
  }
  if (label.includes('track')) {
    return 'Say "bounce" every time the ball hits the ground today. It forces your eyes to follow the ball all the way.'
  }
  return 'Give this skill 5 focused minutes today. Slow down, feel it working, then speed it up.'
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
      .select('id, mission_label, mission_description, period_label, curriculum_level_key, display_order')
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .eq('status', 'active')
      .order('display_order', { ascending: true })
      .limit(3)

    if (!error?.message?.includes('does not exist') && !error?.code?.includes('42P01')) {
      missions = (data ?? []) as PlayerMissionRow[]
    }
  } catch {
    return null
  }

  if (missions.length === 0) return null

  // Primary mission — full card
  const primary = missions[0]
  // Secondary missions — compact list
  const secondary = missions.slice(1)

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-lime" />
        <p className="text-sm font-bold text-text-primary">My Missions</p>
        <span className="text-[10px] font-bold text-lime bg-lime/10 border border-lime/20 rounded px-1.5 py-0.5">
          {missions.length} active
        </span>
      </div>

      {/* Primary mission — large, encouraging */}
      <div className="rounded-2xl border border-lime/25 bg-lime/4 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-lime/15 border border-lime/30 flex items-center justify-center shrink-0">
              <Target className="w-3.5 h-3.5 text-lime" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-lime">Mission #1</p>
          </div>

          <h3 className="text-base font-bold text-text-primary leading-tight mb-2">
            {primary.mission_label}
          </h3>

          {/* Why it matters */}
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            {buildMissionWhyItMatters(primary.mission_label)}
          </p>

          {/* Today's action */}
          <div className="rounded-xl bg-surface/80 border border-lime/15 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-lime mb-1.5">Today's Action</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              {buildTodayAction(primary.mission_label)}
            </p>
          </div>

          {primary.period_label && (
            <p className="text-[10px] text-text-muted mt-3">{primary.period_label}</p>
          )}
        </div>

        {/* Encouragement footer */}
        <div className="bg-lime/8 border-t border-lime/15 px-5 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[11px] text-lime font-medium">
            Every session counts, {playerFirstName}. You're building something real.
          </p>
        </div>
      </div>

      {/* Secondary missions — compact */}
      {secondary.length > 0 && (
        <div className="space-y-2">
          {secondary.map((mission, i) => (
            <div
              key={mission.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-surface"
            >
              <div className="w-5 h-5 rounded-full bg-surface-raised border border-border flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-text-muted">{i + 2}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary leading-tight">{mission.mission_label}</p>
                {mission.mission_description && (
                  <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{mission.mission_description}</p>
                )}
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-text-muted text-center px-4">
        Missions are set by your coaching team and updated as you progress.
      </p>
    </div>
  )
}
