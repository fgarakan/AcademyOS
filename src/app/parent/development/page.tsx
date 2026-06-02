// Parent Development Context — Sprint 1084
// Shows parent the child's current mission context, why it matters, and how to support.
// Director-set data only. No raw coach notes. Sanitized coach language.
// Parent-authenticated via guardian -> player_guardians chain.

import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { Heart, BookOpen, MessageSquare, AlertCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { sanitizeParentFacingText } from '@/lib/communications/parentSafeResponseRules'
import { buildParentSupportGuide } from '@/lib/parent/parentSupportGuide'
import { buildIndividualDevelopmentPlan, buildRoleSpecificIdpView } from '@/lib/player/individualDevelopmentPlan'
import type { IdpParentView } from '@/lib/player/individualDevelopmentPlan'
import { ParentDevelopmentPlanCard } from '@/app/parent/_components/ParentDevelopmentPlanCard'

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technical Development',
  tactical: 'Tactical Development',
  fitness: 'Physical Development',
  competition: 'Competition Preparation',
  behavioral: 'Behavioral Development',
  mental: 'Mental Development',
}

export default async function ParentDevelopmentPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let childFirstName: string | null = null
  let parentView: IdpParentView | null = null
  let missionTitle: string | null = null
  let missionDescription: string | null = null
  let missionCategory: string | null = null
  let currentLevelName: string | null = null
  let supportGuide: ReturnType<typeof buildParentSupportGuide> | null = null
  let noAccess = false
  // Sprint 1113-1120: blueprint-sourced parent plan (resolved player IDs stored here)
  let resolvedPlayerId: string | null = null
  let resolvedAcademyId: string | null = null

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
            .select('id, first_name, last_name, full_name')
            .eq('id', playerIds[0])
            .eq('academy_id', academyId)
            .eq('is_active', true)
            .maybeSingle()

          if (!playerRow) {
            noAccess = true
          } else {
            childFirstName = playerRow.first_name ?? playerRow.full_name ?? null
            // Sprint 1113-1120: capture for blueprint card rendering
            resolvedPlayerId = playerRow.id
            resolvedAcademyId = academyId

            // Active mission (parent-safe fields only)
            const { data: priority } = await rawDb
              .from('player_priorities')
              .select('title, description, category')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .eq('priority_rank', 1)
              .eq('is_active', true)
              .maybeSingle()

            if (priority) {
              missionTitle = priority.title ?? null
              missionDescription = priority.description ?? null
              missionCategory = priority.category ?? null
            }

            // Curriculum level for IDP
            const { data: csRows } = await rawDb
              .from('player_curriculum_states')
              .select('current_level_id')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .limit(1)

            const levelId = csRows?.[0]?.current_level_id ?? null
            let currentStage: string | null = null
            let nextLevelName: string | null = null
            let coachLangDoingWell: string | null = null
            let coachLangWorkingOn: string | null = null
            let coachLangCurrentFocus: string | null = null
            let coachLangNextStep: string | null = null
            let coachLangDomain: string | null = null

            if (levelId) {
              const { data: lvl } = await rawDb
                .from('curriculum_levels')
                .select('display_name, stage, sort_order')
                .eq('id', levelId)
                .single()
              currentLevelName = lvl?.display_name ?? null
              currentStage = lvl?.stage ?? null

              if (lvl?.sort_order != null) {
                const { data: nextLvl } = await rawDb
                  .from('curriculum_levels')
                  .select('display_name')
                  .gt('sort_order', lvl.sort_order)
                  .order('sort_order', { ascending: true })
                  .limit(1)
                nextLevelName = nextLvl?.[0]?.display_name ?? null
              }

              const { data: clData } = await rawDb
                .from('curriculum_coach_language')
                .select('domain, doing_well, working_on, current_focus, next_step')
                .eq('level_id', levelId)
                .limit(1)
              const cl = clData?.[0] ?? null
              if (cl) {
                coachLangDomain = cl.domain ?? null
                coachLangDoingWell = cl.doing_well ? sanitizeParentFacingText(cl.doing_well) : null
                coachLangWorkingOn = cl.working_on ? sanitizeParentFacingText(cl.working_on) : null
                coachLangCurrentFocus = cl.current_focus ? sanitizeParentFacingText(cl.current_focus) : null
                coachLangNextStep = cl.next_step ? sanitizeParentFacingText(cl.next_step) : null
              }
            }

            // Build parent IDP view
            const activePriorities = priority ? [{
              title: priority.title ?? '',
              description: priority.description ?? null,
              category: priority.category ?? null,
            }] : []

            const plan = buildIndividualDevelopmentPlan({
              player_id: playerRow.id,
              player_name: playerRow.full_name ?? `${playerRow.first_name ?? ''} ${playerRow.last_name ?? ''}`.trim(),
              player_first_name: playerRow.first_name ?? playerRow.full_name ?? 'Your child',
              current_level: currentLevelName,
              current_stage: currentStage,
              next_target_level: nextLevelName,
              active_priorities: activePriorities,
              coach_language_current_focus: coachLangCurrentFocus,
              coach_language_next_step: coachLangNextStep,
              coach_language_doing_well: coachLangDoingWell,
              coach_language_working_on: coachLangWorkingOn,
            })
            parentView = buildRoleSpecificIdpView(plan, 'parent') as IdpParentView

            supportGuide = buildParentSupportGuide({
              domain: coachLangDomain,
              levelStage: currentStage,
              playerFirstName: playerRow.first_name ?? playerRow.full_name ?? 'your child',
            })
          }
        }
      }
    }
  }

  const name = childFirstName ?? 'Your child'
  const categoryLabel = missionCategory ? (CATEGORY_LABELS[missionCategory] ?? missionCategory) : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="page-eyebrow">Current Focus</p>
        <h1 className="page-title">Development Context</h1>
        <p className="page-subtitle">What {name} is working toward and how you can help.</p>
      </div>

      {noAccess && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-7 h-7 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-xs">Ask the academy director to link your parent account.</p>
          </CardContent>
        </Card>
      )}

      {!noAccess && !missionTitle && !parentView && (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <TrendingUp className="w-8 h-8 text-text-muted" />
            <p className="text-text-primary text-sm font-medium">Mission not assigned yet</p>
            <p className="text-text-muted text-xs leading-relaxed max-w-xs">
              Your coaching team will assign {name} a mission soon. Check back after the next session.
            </p>
          </CardContent>
        </Card>
      )}

      {!noAccess && (missionTitle || parentView) && (
        <>
          {/* Active mission */}
          {missionTitle && (
            <div className="rounded-2xl bg-lime/5 border border-lime/20 px-5 py-5">
              {categoryLabel && (
                <p className="label-xs text-lime mb-2">{categoryLabel}</p>
              )}
              <p className="text-sm font-bold text-text-primary leading-snug mb-2">{missionTitle}</p>
              {missionDescription && (
                <p className="text-xs text-text-secondary leading-relaxed">{missionDescription}</p>
              )}
              {currentLevelName && (
                <p className="text-[10px] text-text-muted mt-3">
                  Current level: {currentLevelName}
                </p>
              )}
            </div>
          )}

          {/* Why it matters */}
          {parentView?.why_it_matters && (
            <div className="rounded-xl border border-border bg-surface px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-text-muted" />
                <p className="text-sm font-semibold text-text-primary">Why It Matters</p>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{parentView.why_it_matters}</p>
            </div>
          )}

          {/* Support guide */}
          {supportGuide && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-surface-raised px-4 py-3 border-b border-border flex items-center gap-2">
                <Heart className="w-4 h-4 text-lime shrink-0" />
                <p className="text-sm font-semibold text-text-primary">How to Support This Week</p>
              </div>
              <div className="bg-surface divide-y divide-border">
                <div className="px-4 py-3">
                  <p className="label-xs text-status-green mb-1.5">What to Praise</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{supportGuide.whatToPraise}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="label-xs text-text-muted mb-1.5">At-Home Support</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{supportGuide.atHomeSupportIdea}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="label-xs text-status-orange mb-1.5">Avoid Overcoaching</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{supportGuide.avoidOvercoaching}</p>
                </div>
              </div>
            </div>
          )}

          {/* After practice conversation */}
          {parentView?.what_to_say_after_practice && (
            <div className="rounded-xl border border-border bg-surface-raised px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-text-muted" />
                <p className="text-sm font-semibold text-text-primary">After Practice, Try Saying</p>
              </div>
              <div className="px-3 py-3 rounded-xl bg-surface border border-border">
                <p className="text-sm text-text-secondary leading-relaxed italic">
                  {parentView.what_to_say_after_practice}
                </p>
              </div>
            </div>
          )}

          {/* Blueprint-sourced Development Plan — Sprint 1113-1120
              Only shown if show_to_parent=true on player_development_summary.
              Director must explicitly enable this. No raw scores or coach notes. */}
          {resolvedPlayerId && resolvedAcademyId && (
            <ParentDevelopmentPlanCard
              playerId={resolvedPlayerId}
              academyId={resolvedAcademyId}
              childFirstName={name}
            />
          )}

          {/* Links */}
          <div className="flex gap-3">
            <Link
              href="/parent/progress"
              className="flex-1 rounded-xl bg-surface-raised border border-border px-4 py-3 text-center text-xs font-semibold text-text-primary hover:border-lime/20 transition-colors"
            >
              See Progress
            </Link>
            <Link
              href="/parent/ask-donna"
              className="flex-1 rounded-xl bg-surface-raised border border-lime/20 px-4 py-3 text-center text-xs font-semibold text-lime hover:bg-lime/5 transition-colors"
            >
              Ask DONNA
            </Link>
          </div>

          {/* Safety note */}
          <p className="text-[10px] text-text-muted text-center px-4">
            Content shown here has been approved for parents by your academy director.
          </p>
        </>
      )}
    </div>
  )
}
