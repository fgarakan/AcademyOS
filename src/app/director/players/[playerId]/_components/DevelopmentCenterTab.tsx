// Sprint 1113-1120 — Development Center Tab
// Server Component — fetches its own data.
// Shows the active player development blueprint: priorities, 30-day plan, coach brief, DONNA summary.
// Role label: "Blueprint" for director/coach.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { Target, Zap, Trophy, Heart, Brain, Calendar, Users, ChevronRight, AlertCircle } from 'lucide-react'

interface DevelopmentCenterTabProps {
  playerId: string
  academyId: string
}

interface Priority {
  rank: number
  label: string
  description: string
  why: string
  pathway: string
}

interface ThirtyDayPlan {
  skillFocus: string
  competitionFocus: string
  fitnessFocus: string
  mentalFocus: string
  rationale: string
}

interface ActiveBlueprint {
  id: string
  curriculum_level_name: string | null
  curriculum_stage_key: string | null
  strengths: string[]
  gaps: string[]
  skill_priorities: Priority[]
  competition_priorities: Priority[]
  fitness_priorities: Priority[]
  mental_priorities: Priority[]
  thirty_day_plan: ThirtyDayPlan | null
  coach_focus_areas: string[]
  donna_brief: string | null
  generated_at: string
  overall_score: number | null
}

const PATHWAY_CONFIG = [
  { key: 'skill',       label: 'Skill Path',      icon: Zap,    color: 'text-lime',           bg: 'bg-lime/8 border-lime/20' },
  { key: 'competition', label: 'Competition',      icon: Trophy, color: 'text-status-blue',    bg: 'bg-status-blue/8 border-status-blue/20' },
  { key: 'fitness',     label: 'Fitness',          icon: Heart,  color: 'text-status-orange',  bg: 'bg-status-orange/8 border-status-orange/20' },
  { key: 'mental',      label: 'Mental Performance', icon: Brain, color: 'text-status-green',  bg: 'bg-status-green/8 border-status-green/20' },
] as const

export async function DevelopmentCenterTab({ playerId, academyId }: DevelopmentCenterTabProps) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <ErrorState message="Not authenticated." />

  const rawDb = supabase as any

  // Fetch active blueprint
  let blueprint: ActiveBlueprint | null = null
  try {
    const { data } = await rawDb
      .from('player_development_blueprints')
      .select([
        'id', 'curriculum_level_name', 'curriculum_stage_key',
        'strengths', 'gaps',
        'skill_priorities', 'competition_priorities', 'fitness_priorities', 'mental_priorities',
        'thirty_day_plan', 'coach_focus_areas', 'donna_brief', 'generated_at', 'overall_score',
      ].join(', '))
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    blueprint = data ?? null
  } catch {
    // Table not yet migrated — show pending state
  }

  // Fetch pending mission count
  let pendingMissions = 0
  try {
    const { count } = await rawDb
      .from('player_mission_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')
    pendingMissions = (count as number | null) ?? 0
  } catch { /* table not yet migrated */ }

  if (!blueprint) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-surface border border-border px-6 py-8 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
            <Target className="w-6 h-6 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">No blueprint yet</p>
            <p className="text-xs text-text-muted leading-relaxed max-w-xs">
              A development blueprint is generated automatically when a player is placed.
              Complete the placement process to generate this player's blueprint.
            </p>
          </div>
          {pendingMissions > 0 && (
            <p className="text-xs text-lime mt-1">{pendingMissions} mission{pendingMissions > 1 ? 's' : ''} pending review</p>
          )}
        </div>
      </div>
    )
  }

  const plan = blueprint.thirty_day_plan
  const priorities: Record<string, Priority[]> = {
    skill:       blueprint.skill_priorities ?? [],
    competition: blueprint.competition_priorities ?? [],
    fitness:     blueprint.fitness_priorities ?? [],
    mental:      blueprint.mental_priorities ?? [],
  }

  return (
    <div className="space-y-5">

      {/* Header: level + pending missions alert */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="label-xs text-text-muted mb-0.5">Current Blueprint</p>
          <h2 className="text-lg font-bold text-text-primary">
            {blueprint.curriculum_level_name ?? 'Development Plan'}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Generated {new Date(blueprint.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {pendingMissions > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime/8 border border-lime/20 text-xs font-semibold text-lime">
            <AlertCircle className="w-3.5 h-3.5" />
            {pendingMissions} mission{pendingMissions > 1 ? 's' : ''} pending review
          </div>
        )}
      </div>

      {/* Strengths and gaps row */}
      {(blueprint.strengths.length > 0 || blueprint.gaps.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {blueprint.strengths.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <p className="label-xs text-status-green mb-2">Top Strengths</p>
                <ul className="space-y-1">
                  {blueprint.strengths.slice(0, 4).map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-green shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {blueprint.gaps.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <p className="label-xs text-status-orange mb-2">Development Focus</p>
                <ul className="space-y-1">
                  {blueprint.gaps.slice(0, 4).map((g, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-orange shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Priority pathways */}
      <div>
        <p className="label-xs text-text-muted mb-3">Development Priorities</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PATHWAY_CONFIG.map(({ key, label, icon: Icon, color, bg }) => {
            const pathwayPriorities = priorities[key] ?? []
            if (pathwayPriorities.length === 0) return null
            return (
              <Card key={key}>
                <div className={`px-4 py-2.5 flex items-center gap-2 border-b border-border rounded-t-xl ${bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${color}`}>{label}</p>
                </div>
                <CardContent className="py-3">
                  <ol className="space-y-2">
                    {pathwayPriorities.slice(0, 3).map((p) => (
                      <li key={p.rank} className="flex items-start gap-2">
                        <span className={`text-[10px] font-bold ${color} w-4 shrink-0 mt-0.5`}>{p.rank}.</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary">{p.label}</p>
                          <p className="text-[10px] text-text-muted leading-relaxed mt-0.5 line-clamp-2">{p.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 30-Day Plan */}
      {plan && (
        <Card>
          <div className="px-4 py-2.5 flex items-center gap-2 bg-surface-raised border-b border-border rounded-t-xl">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <p className="label-xs text-text-muted">First 30-Day Plan</p>
          </div>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Skill', value: plan.skillFocus, color: 'text-lime' },
                { label: 'Competition', value: plan.competitionFocus, color: 'text-status-blue' },
                { label: 'Fitness', value: plan.fitnessFocus, color: 'text-status-orange' },
                { label: 'Mental', value: plan.mentalFocus, color: 'text-status-green' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
                  <p className={`label-xs ${color} mb-1`}>{label}</p>
                  <p className="text-xs font-semibold text-text-primary leading-tight">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">{plan.rationale}</p>
          </CardContent>
        </Card>
      )}

      {/* Coach Focus Areas */}
      {blueprint.coach_focus_areas.length > 0 && (
        <Card>
          <div className="px-4 py-2.5 flex items-center gap-2 bg-surface-raised border-b border-border rounded-t-xl">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <p className="label-xs text-text-muted">Coach Focus Areas</p>
          </div>
          <CardContent className="py-4">
            <ol className="space-y-2">
              {blueprint.coach_focus_areas.slice(0, 3).map((focus, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-text-muted w-4 shrink-0 mt-0.5">{i + 1}.</span>
                  <p className="text-xs text-text-secondary leading-relaxed">{focus}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* DONNA Brief — collapsed */}
      {blueprint.donna_brief && (
        <details className="group">
          <summary className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-border cursor-pointer hover:border-border-strong transition-colors list-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-lime/10 border border-lime/25 flex items-center justify-center shrink-0">
                <span className="font-bold text-lime text-[10px] leading-none">D</span>
              </span>
              <p className="text-xs font-semibold text-text-secondary">DONNA Development Brief</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-open:rotate-90 transition-transform" />
          </summary>
          <div className="mt-1 px-4 py-3 rounded-xl bg-surface border border-border border-t-0 rounded-t-none">
            <pre className="text-[10px] text-text-muted leading-relaxed whitespace-pre-wrap font-mono">
              {blueprint.donna_brief}
            </pre>
          </div>
        </details>
      )}

    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-status-red/8 border border-status-red/20 px-4 py-3">
      <p className="text-xs text-status-red">{message}</p>
    </div>
  )
}
