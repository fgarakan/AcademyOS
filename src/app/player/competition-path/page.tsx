// Player Competition Path — Sprint 1073
// Match skills view for the player.
// Shows competition skill status and observation counts — never raw coach note content.
// Director-set focus from active priorities only.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Trophy, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const COMPETITION_AREAS = [
  { label: 'Rally Decisions',       description: 'Choosing the right shot during a rally' },
  { label: 'Target Choice',         description: 'Selecting the right target under pressure' },
  { label: 'Scoring Awareness',     description: 'Understanding when to attack vs. defend' },
  { label: 'Pressure Response',     description: 'Staying composed when behind or under pressure' },
  { label: 'Match Routines',        description: 'Pre-point and between-game routines' },
  { label: 'Tournament Readiness',  description: 'Performing in match conditions' },
]

const TIPS: Record<string, string> = {
  'Rally Decisions':      'Keep the ball in play with high-percentage shots.',
  'Target Choice':        'Choose safer crosscourt targets when under pressure.',
  'Scoring Awareness':    'Know the score and adjust your risk level accordingly.',
  'Pressure Response':    'Breathe, reset, and play one point at a time.',
  'Match Routines':       'Consistent routines help you reset faster after tough points.',
  'Tournament Readiness': 'Practice like you play. Match experience builds this skill.',
}

export default async function PlayerCompetitionPathPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let totalCompObs = 0
  let currentFocusCategory: string | null = null
  let currentLevelName: string | null = null
  let noAccess = false
  let currentFocusTitle: string | null = null

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
        // Count competition observations
        const { data: obsRows } = await rawDb
          .from('coach_observations')
          .select('observation_type')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('observation_type', 'competition')

        totalCompObs = (obsRows ?? []).length

        // Top competition-category priority
        const { data: priorityRows } = await rawDb
          .from('player_priorities')
          .select('category, title')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('is_active', true)
          .order('priority_rank', { ascending: true })
          .limit(3)

        const compPriority = (priorityRows ?? []).find((p: any) => p.category === 'competition' || p.category === 'tactical')
        currentFocusCategory = compPriority?.category ?? null
        currentFocusTitle = compPriority?.title ?? null

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

  const hasFocus = currentFocusCategory === 'competition' || currentFocusCategory === 'tactical'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">{currentLevelName ?? 'Competition Path'}</p>
        <h1 className="page-title">Match Skills</h1>
        <p className="page-subtitle">How you think and compete — not just how you hit.</p>
      </div>

      {noAccess && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-7 h-7 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">Ask your director to link your profile to see your competition path.</p>
          </CardContent>
        </Card>
      )}

      {!noAccess && (
        <>
          {/* Current focus highlight */}
          {hasFocus && currentFocusTitle && (
            <div className="rounded-xl bg-status-orange/5 border border-status-orange/20 px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-3.5 h-3.5 text-status-orange" />
                <p className="text-[10px] uppercase tracking-widest text-status-orange font-semibold">Current Competition Focus</p>
              </div>
              <p className="text-sm font-semibold text-text-primary leading-snug">&ldquo;{currentFocusTitle}&rdquo;</p>
            </div>
          )}

          {/* Overview */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-raised border border-border">
            <p className="text-xs text-text-secondary">Match observations recorded</p>
            <p className="text-sm font-mono font-bold text-status-orange">{totalCompObs}</p>
          </div>

          {/* Competition skill cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {COMPETITION_AREAS.map((area, i) => {
              const isFocus = hasFocus && i === 1
              return (
                <div
                  key={area.label}
                  className={`rounded-xl border px-4 py-4 ${
                    isFocus ? 'bg-status-orange/5 border-status-orange/20' : 'bg-surface-raised border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-semibold text-text-primary">{area.label}</p>
                    {isFocus && (
                      <span className="text-[10px] font-semibold text-status-orange bg-status-orange/10 px-1.5 py-0.5 rounded-full shrink-0">
                        Focus
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mb-2">{area.description}</p>
                  <p className="text-xs text-text-secondary italic">{TIPS[area.label]}</p>
                </div>
              )
            })}
          </div>

          {/* DONNA CTA */}
          <div className="text-center pt-1">
            <Link href="/player/ask-donna" className="text-xs text-status-orange hover:text-status-orange/80 transition-colors">
              Ask DONNA how to prepare for a match →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
