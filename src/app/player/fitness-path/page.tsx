// Player Fitness Path — Sprint 1074
// Body development view for the player.
// Shows fitness area status and observation counts — never raw coach note content.
// Director-set focus from active priorities only.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { Activity, AlertCircle } from 'lucide-react'

const FITNESS_AREAS = [
  { label: 'Mobility',       description: 'Hip, shoulder, and ankle range of motion' },
  { label: 'Coordination',   description: 'Hand-eye and footwork coordination' },
  { label: 'Speed',          description: 'First-step quickness and sprint speed' },
  { label: 'Agility',        description: 'Change of direction and court coverage' },
  { label: 'Strength',       description: 'Core and lower body stability' },
  { label: 'Recovery',       description: 'Balance recovery after wide movement' },
  { label: 'Tennis Transfer', description: 'Applying fitness gains on the court' },
]

const FITNESS_OBS_TYPES = new Set(['fitness', 'load', 'recovery'])

export default async function PlayerFitnessPathPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let totalFitnessObs = 0
  let currentFocusCategory: string | null = null
  let currentLevelName: string | null = null
  let noAccess = false
  let fitnessFocusTitle: string | null = null

  if (user) {
    const rawDb = supabase as any

    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id ?? null

    if (!academyId) {
      noAccess = true
    } else {
      const { data: playerRow } = await rawDb
        .from('players')
        .select('id')
        .eq('academy_id', academyId)
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!playerRow) {
        noAccess = true
      } else {
        // Count fitness-type observations (no content)
        const { data: obsRows } = await rawDb
          .from('coach_observations')
          .select('observation_type')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)

        totalFitnessObs = (obsRows ?? []).filter((r: any) => FITNESS_OBS_TYPES.has(r.observation_type)).length

        // Fitness-category active priority
        const { data: priorityRows } = await rawDb
          .from('player_priorities')
          .select('category, title')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('is_active', true)
          .order('priority_rank', { ascending: true })
          .limit(3)

        const fitnessPriority = (priorityRows ?? []).find((p: any) => p.category === 'fitness')
        currentFocusCategory = fitnessPriority?.category ?? null
        fitnessFocusTitle = fitnessPriority?.title ?? null

        // Level name
        const { data: csRows } = await rawDb
          .from('player_curriculum_states')
          .select('current_level_id')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .limit(1)

        if (csRows?.[0]?.current_level_id) {
          const { data: lvl } = await rawDb
            .from('curriculum_levels')
            .select('display_name')
            .eq('id', csRows[0].current_level_id)
            .single()
          currentLevelName = lvl?.display_name ?? null
        }
      }
    }
  }

  const hasFitnessFocus = currentFocusCategory === 'fitness'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">{currentLevelName ?? 'Fitness Path'}</p>
        <h1 className="page-title">Body Development</h1>
        <p className="page-subtitle">Building the athletic foundation for your tennis game.</p>
      </div>

      {noAccess && (
        <EmptyState
          icon={<AlertCircle className="w-5 h-5" />}
          title="Profile not linked"
          description="Ask your director to link your profile to see your fitness path."
        />
      )}

      {!noAccess && (
        <>
          {/* Current body focus */}
          {hasFitnessFocus && fitnessFocusTitle && (
            <div className="rounded-xl bg-status-blue/5 border border-status-blue/20 px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-status-blue" />
                <p className="text-[10px] uppercase tracking-widest text-status-blue font-semibold">Current Body Focus</p>
              </div>
              <p className="text-sm font-semibold text-text-primary leading-snug">&ldquo;{fitnessFocusTitle}&rdquo;</p>
              <p className="text-xs text-text-secondary mt-1">
                This fitness area is directly connected to your current mission.
              </p>
            </div>
          )}

          {/* Overview */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-raised border border-border">
            <p className="text-xs text-text-secondary">Fitness observations recorded</p>
            <p className="text-sm font-mono font-bold text-status-blue">{totalFitnessObs}</p>
          </div>

          {/* Fitness area cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FITNESS_AREAS.map((area, i) => {
              const isFocus = hasFitnessFocus && (i === 3 || i === 5)
              return (
                <div
                  key={area.label}
                  className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                    isFocus ? 'bg-status-blue/5 border-status-blue/20' : 'bg-surface-raised border-border'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isFocus ? 'border-status-blue text-status-blue' : 'border-border text-text-muted'
                  }`}>
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-text-primary">{area.label}</p>
                      {isFocus && (
                        <span className="text-[10px] text-status-blue bg-status-blue/10 px-1.5 py-0.5 rounded-full">Focus</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">{area.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
