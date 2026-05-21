// Player Skill Path — Sprint 1072 + Sprint 600 (progress indicator)
// Technical development view for the player.
// Shows skill area status, observation counts, and requirement progress indicator.
// Director-set focus from active priorities only.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Zap, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { buildPlayerProgressIndicators } from '@/lib/player/progressIndicators'
import type { ProgressStatusSummary } from '@/lib/player/evidenceQueries'

const SKILL_AREAS = [
  { key: 'forehand',   label: 'Forehand',           sub: ['Preparation', 'Contact', 'Finish'], obsTypes: ['technical'] },
  { key: 'backhand',   label: 'Backhand',           sub: ['Preparation', 'Contact', 'Finish'], obsTypes: ['technical'] },
  { key: 'serve',      label: 'Serve',              sub: ['Toss', 'Trophy Position', 'Contact'], obsTypes: ['technical'] },
  { key: 'volley',     label: 'Volley',             sub: ['Grip', 'Contact', 'Recovery'], obsTypes: ['tactical'] },
  { key: 'movement',   label: 'Movement / Footwork', sub: ['Split Step', 'First Step', 'Recovery'], obsTypes: ['movement'] },
  { key: 'preparation', label: 'Preparation',       sub: ['Early Turn', 'Racket Back', 'Ready Position'], obsTypes: ['technical'] },
]

const SKILL_OBS_TYPES = new Set(['technical', 'tactical', 'movement', 'general', 'positive_highlight'])

function deriveStatus(totalObs: number, isFocus: boolean): 'strong' | 'active' | 'developing' {
  if (isFocus) return 'active'
  if (totalObs >= 3) return 'strong'
  return 'developing'
}

const STATUS_STYLES = {
  strong:     { label: 'Strong',       text: 'text-status-green',  bg: 'bg-status-green/10',  border: 'border-status-green/20' },
  active:     { label: 'Active Focus', text: 'text-lime',          bg: 'bg-lime/10',           border: 'border-lime/20' },
  developing: { label: 'Developing',   text: 'text-text-muted',    bg: 'bg-surface-raised',    border: 'border-border' },
}

export default async function PlayerSkillPathPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let totalSkillObs = 0
  let currentFocusCategory: string | null = null
  let currentLevelName: string | null = null
  let noAccess = false
  let completionPct = 0
  let completionLabel = ''

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
        // Count skill-type observations (no content)
        const { data: obsRows } = await rawDb
          .from('coach_observations')
          .select('observation_type')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)

        totalSkillObs = (obsRows ?? []).filter((r: any) => SKILL_OBS_TYPES.has(r.observation_type)).length

        // Get current skill focus from top priority
        const { data: priorityRows } = await rawDb
          .from('player_priorities')
          .select('category')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('is_active', true)
          .order('priority_rank', { ascending: true })
          .limit(1)

        currentFocusCategory = priorityRows?.[0]?.category ?? null

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

        // Requirement progress indicator (graceful fallback)
        try {
          const { data: progressRows } = await rawDb
            .from('player_requirement_progress')
            .select('id, status, curriculum_level_id')
            .eq('player_id', playerRow.id)
            .eq('academy_id', academyId)
            .limit(200)
          const rows = (progressRows ?? []) as Array<{ id: string; status: string; curriculum_level_id: string }>
          const progressSummary: ProgressStatusSummary = {
            total: rows.length,
            notStarted: rows.filter(r => r.status === 'not_started').length,
            inProgress: rows.filter(r => r.status === 'in_progress').length,
            achieved: rows.filter(r => r.status === 'met').length,
            confirmed: rows.filter(r => r.status === 'waived').length,
          }
          const indicators = buildPlayerProgressIndicators(progressSummary, [])
          completionPct = indicators.overallCompletionPct
          completionLabel = indicators.progressLabel
        } catch {
          // Graceful fallback — table may not exist yet
        }
      }
    }
  }

  const skillFocusCategories = new Set(['technical', 'tactical', 'movement'])
  const isFocusOnSkill = currentFocusCategory ? skillFocusCategories.has(currentFocusCategory) : false

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">{currentLevelName ?? 'Skill Path'}</p>
        <h1 className="page-title">Technical Development</h1>
        <p className="page-subtitle">Your technical skills — not grades, just your current journey.</p>
      </div>

      {noAccess && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-7 h-7 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">Ask your director to link your profile to see your skill path.</p>
          </CardContent>
        </Card>
      )}

      {!noAccess && (
        <>
          {/* Overview */}
          <div className="rounded-xl bg-lime/5 border border-lime/20 px-4 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-lime" />
              <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">Skill Path Overview</p>
            </div>
            <p className="text-2xl font-mono font-bold text-text-primary">{totalSkillObs}</p>
            <p className="text-xs text-text-muted">Skill observations recorded by your coach</p>
            {isFocusOnSkill && (
              <p className="text-xs text-lime mt-2">Your current mission is in the skill path.</p>
            )}
          </div>

          {/* Requirement progress bar (shown when data is available) */}
          {completionPct > 0 && (
            <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-text-secondary">Level Requirement Progress</p>
                <p className="text-xs font-mono text-lime">{completionPct}%</p>
              </div>
              <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                <div className="h-full bg-lime rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              <p className="text-[10px] text-text-muted">{completionLabel}</p>
            </div>
          )}

          {/* Skill area cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SKILL_AREAS.map(area => {
              const isFocus = isFocusOnSkill && area.obsTypes.includes(currentFocusCategory ?? '')
              const status = deriveStatus(totalSkillObs, isFocus)
              const style = STATUS_STYLES[status]

              return (
                <div key={area.key} className={`rounded-xl border px-4 py-4 ${style.bg} ${style.border}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{area.label}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {area.sub.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface border border-border text-text-muted">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold ${style.text} shrink-0`}>{style.label}</span>
                  </div>

                  {isFocus && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <CheckCircle2 className="w-3 h-3 text-lime" />
                      <p className="text-[10px] text-lime">Current mission focus</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="text-center pt-1">
            <Link href="/player/missions" className="text-xs text-lime hover:text-lime/80 transition-colors">
              Work on your active mission →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
