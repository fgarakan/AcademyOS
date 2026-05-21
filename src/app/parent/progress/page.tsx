// Parent Progress — Sprint 1080
// Development overview for parents. Observation counts by domain (never content).
// Level progression and gate advancement count.
// Parent-authenticated via guardian -> player_guardians chain.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { TrendingUp, ArrowRight, Lock, ShieldCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface DomainBlock {
  label: string
  count: number
  description: string
  accent: string
}

export default async function ParentProgressPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let childFirstName: string | null = null
  let currentLevelName: string | null = null
  let nextLevelName: string | null = null
  let focusCategory: string | null = null
  let domainCounts: Record<string, number> = {}
  let passedGates = 0
  let totalGates = 0
  let noAccess = false

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
      const { data: guardian } = await rawDb
        .from('guardians')
        .select('id')
        .eq('profile_id', user.id)
        .eq('academy_id', academyId)
        .maybeSingle()

      if (!guardian) {
        noAccess = true
      } else {
        const { data: pgRows } = await rawDb
          .from('player_guardians')
          .select('player_id')
          .eq('guardian_id', guardian.id)
          .limit(3)

        const playerIds: string[] = (pgRows ?? []).map((r: any) => r.player_id)

        if (playerIds.length === 0) {
          noAccess = true
        } else {
          const { data: playerRow } = await rawDb
            .from('players')
            .select('id, first_name, full_name')
            .eq('id', playerIds[0])
            .eq('academy_id', academyId)
            .eq('is_active', true)
            .maybeSingle()

          if (!playerRow) {
            noAccess = true
          } else {
            childFirstName = playerRow.first_name ?? playerRow.full_name ?? null

            // Curriculum state
            const { data: csRows } = await rawDb
              .from('player_curriculum_states')
              .select('current_level_id')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .limit(1)

            const levelId = csRows?.[0]?.current_level_id ?? null
            if (levelId) {
              const { data: lvl } = await rawDb
                .from('curriculum_levels')
                .select('display_name, sort_order')
                .eq('id', levelId)
                .single()
              currentLevelName = lvl?.display_name ?? null

              if (lvl?.sort_order != null) {
                const { data: nextLvl } = await rawDb
                  .from('curriculum_levels')
                  .select('display_name')
                  .gt('sort_order', lvl.sort_order)
                  .order('sort_order', { ascending: true })
                  .limit(1)
                nextLevelName = nextLvl?.[0]?.display_name ?? null
              }

              // Gate counts
              const { data: gateRows } = await rawDb
                .from('curriculum_gates')
                .select('id')
                .eq('from_level_id', levelId)
                .eq('is_active', true)
              const gateIds: string[] = (gateRows ?? []).map((g: any) => g.id)
              totalGates = gateIds.length

              if (gateIds.length > 0) {
                const { data: statusRows } = await rawDb
                  .from('player_gate_status')
                  .select('status')
                  .eq('player_id', playerRow.id)
                  .eq('academy_id', academyId)
                  .in('gate_id', gateIds)
                  .eq('status', 'passed')
                passedGates = (statusRows ?? []).length
              }
            }

            // Observation counts by type
            const { data: obsRows } = await rawDb
              .from('coach_observations')
              .select('observation_type')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)

            for (const row of (obsRows ?? [])) {
              const t = row.observation_type as string
              domainCounts[t] = (domainCounts[t] ?? 0) + 1
            }

            // Active mission category
            const { data: priority } = await rawDb
              .from('player_priorities')
              .select('category')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .eq('priority_rank', 1)
              .eq('is_active', true)
              .maybeSingle()
            focusCategory = priority?.category ?? null
          }
        }
      }
    }
  }

  const technicalCount = (domainCounts['technical'] ?? 0) + (domainCounts['tactical'] ?? 0) + (domainCounts['movement'] ?? 0)
  const fitnessCount = (domainCounts['fitness'] ?? 0) + (domainCounts['load'] ?? 0) + (domainCounts['recovery'] ?? 0)
  const competitionCount = (domainCounts['competition'] ?? 0) + (domainCounts['match'] ?? 0)
  const behavioralCount = (domainCounts['behavioral'] ?? 0) + (domainCounts['mental'] ?? 0)
  const generalCount = (domainCounts['general'] ?? 0) + (domainCounts['positive_highlight'] ?? 0)

  const name = childFirstName ?? 'Your child'

  const DOMAIN_BLOCKS: DomainBlock[] = [
    { label: 'Technical & Tactical', count: technicalCount,   description: 'Strokes, patterns, footwork, decision-making',  accent: 'text-lime' },
    { label: 'Fitness & Recovery',   count: fitnessCount,     description: 'Physical conditioning and load management',       accent: 'text-status-blue' },
    { label: 'Competition',          count: competitionCount, description: 'Match play, mental game, pressure situations',    accent: 'text-status-orange' },
    { label: 'Behavioral & Mental',  count: behavioralCount,  description: 'Focus, attitude, routines, composure',            accent: 'text-status-green' },
    { label: 'General Highlights',   count: generalCount,     description: 'Positive moments and overall impressions',        accent: 'text-text-muted' },
  ]

  const CATEGORY_LABELS: Record<string, string> = {
    technical: 'Technical',
    tactical: 'Tactical',
    fitness: 'Fitness',
    competition: 'Competition',
    behavioral: 'Behavioral',
    mental: 'Mental',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">Development</p>
        <h1 className="page-title">Progress Overview</h1>
        <p className="page-subtitle">{name}&apos;s development journey at a glance.</p>
      </div>

      {noAccess && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-7 h-7 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">Ask the academy director to link your parent account.</p>
          </CardContent>
        </Card>
      )}

      {!noAccess && (
        <>
          {/* Approved data notice */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20">
            <ShieldCheck className="w-4 h-4 text-lime shrink-0" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Showing coach-approved development data only — no raw notes, no rankings.
            </p>
          </div>

          {/* Level journey */}
          {(currentLevelName || nextLevelName) && (
            <div className="rounded-2xl bg-surface border border-border px-5 py-5">
              <p className="label-xs text-text-muted mb-4">Curriculum Journey</p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-[10px] text-text-muted mb-2">Current Level</p>
                  <div className="rounded-xl bg-surface-raised border border-border px-4 py-3 min-w-[80px]">
                    <p className="text-sm font-bold text-text-primary leading-tight">
                      {currentLevelName ?? 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {totalGates > 0 && (
                    <p className="text-[10px] text-text-muted">{passedGates}/{totalGates} requirements</p>
                  )}
                  <ArrowRight className="w-5 h-5 text-text-muted" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-text-muted mb-2">Next Level</p>
                  <div className="rounded-xl border-2 border-dashed border-border px-4 py-3 min-w-[80px] flex items-center gap-1.5 justify-center">
                    <p className="text-sm font-bold text-text-secondary leading-tight">
                      {nextLevelName ?? 'TBD'}
                    </p>
                    <Lock className="w-3 h-3 text-text-muted/50" />
                  </div>
                </div>
              </div>
              {totalGates > 0 && (
                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full bg-lime transition-all"
                      style={{ width: `${Math.round((passedGates / totalGates) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1.5">
                    {passedGates} of {totalGates} advancement requirements confirmed by coach
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Current focus */}
          {focusCategory && (
            <div className="rounded-xl bg-lime/5 border border-lime/20 px-4 py-3">
              <p className="label-xs text-lime mb-1">Current Focus Area</p>
              <p className="text-sm font-semibold text-text-primary">
                {CATEGORY_LABELS[focusCategory] ?? focusCategory}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Your coaching team is currently emphasizing this in sessions.
              </p>
            </div>
          )}

          {/* Domain observation counts */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-surface-raised px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-text-primary">Development Areas</p>
              <p className="text-xs text-text-muted">Session observations by area — count only, never content</p>
            </div>
            <div className="bg-surface divide-y divide-border">
              {DOMAIN_BLOCKS.map(block => (
                <div key={block.label} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{block.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{block.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-base font-mono font-bold ${block.count > 0 ? block.accent : 'text-text-muted'}`}>
                      {block.count}
                    </p>
                    <p className="text-[10px] text-text-muted">observations</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Encouragement */}
          <div className="rounded-xl bg-surface-raised border border-border px-4 py-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              {name}&apos;s development is tracked through coach observations in every session.
              The numbers above reflect how much coaching attention each area has received —
              not a grade or evaluation.
            </p>
          </div>

          {/* Development context link */}
          <Link href="/parent/development">
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 flex items-center justify-between hover:border-lime/20 transition-colors">
              <div>
                <p className="text-sm font-medium text-text-primary">Development Focus</p>
                <p className="text-xs text-text-muted">See current mission and how to support</p>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted shrink-0" />
            </div>
          </Link>

          {/* Safety note */}
          <p className="text-[10px] text-text-muted text-center px-4">
            Advancement requires coach and director confirmation — not automatic. Coaching teams decide timing.
          </p>
        </>
      )}
    </div>
  )
}
