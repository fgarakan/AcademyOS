import { MessageSquare, Calendar, Heart, Bell, BookOpen, ShieldCheck, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { ParentSafeProgressPreview } from '@/components/player/ParentSafeProgressPreview'
import { getSupabaseServer } from '@/lib/supabase/server'
import { buildIndividualDevelopmentPlan, buildRoleSpecificIdpView } from '@/lib/player/individualDevelopmentPlan'
import type { IdpParentView } from '@/lib/player/individualDevelopmentPlan'
import { sanitizeParentFacingText } from '@/lib/communications/parentSafeResponseRules'

export default async function ParentHome() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let parentView: IdpParentView | null = null
  let noMappingReason: string | null = null
  let linkedPlayerFirstName: string | null = null

  if (user) {
    const rawDb = supabase as any

    // 1. Profile → academy_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id ?? null

    if (!academyId) {
      noMappingReason = 'no_academy'
    } else {
      // 2. Auth user → guardian record via profile_id
      const { data: guardian } = await rawDb
        .from('guardians')
        .select('id')
        .eq('profile_id', user.id)
        .eq('academy_id', academyId)
        .maybeSingle()

      if (!guardian) {
        noMappingReason = 'no_guardian_link'
      } else {
        // 3. Guardian → linked player(s) via player_guardians
        const { data: pgRows } = await rawDb
          .from('player_guardians')
          .select('player_id')
          .eq('guardian_id', guardian.id)
          .limit(3)

        const playerIds: string[] = (pgRows ?? []).map((row: any) => row.player_id as string)

        if (playerIds.length === 0) {
          noMappingReason = 'no_player_link'
        } else {
          // Use first active linked player
          const { data: playerRow } = await rawDb
            .from('players')
            .select('id, first_name, last_name, full_name')
            .eq('id', playerIds[0])
            .eq('academy_id', academyId)
            .eq('is_active', true)
            .maybeSingle()

          if (!playerRow) {
            noMappingReason = 'player_not_active'
          } else {
            linkedPlayerFirstName = playerRow.first_name ?? playerRow.full_name ?? null

            // 4. Curriculum state
            const { data: csRows } = await rawDb
              .from('player_curriculum_states')
              .select('curriculum_level_id')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .limit(1)
            const currentLevelId: string | null = csRows?.[0]?.curriculum_level_id ?? null

            let currentLevelName: string | null = null
            let currentStage: string | null = null
            let nextLevelName: string | null = null
            let coachLangDoingWell: string | null = null
            let coachLangWorkingOn: string | null = null
            let coachLangCurrentFocus: string | null = null
            let coachLangNextStep: string | null = null

            if (currentLevelId) {
              const { data: lvl } = await rawDb
                .from('curriculum_levels')
                .select('display_name, stage, sort_order')
                .eq('id', currentLevelId)
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

              // Coach language — sanitize before IDP build (safety layer)
              const { data: clData } = await rawDb
                .from('curriculum_coach_language')
                .select('doing_well, working_on, current_focus, next_step')
                .eq('level_id', currentLevelId)
                .limit(1)
              const cl = clData?.[0] ?? null
              if (cl) {
                coachLangDoingWell = cl.doing_well ? sanitizeParentFacingText(cl.doing_well) : null
                coachLangWorkingOn = cl.working_on ? sanitizeParentFacingText(cl.working_on) : null
                coachLangCurrentFocus = cl.current_focus ? sanitizeParentFacingText(cl.current_focus) : null
                coachLangNextStep = cl.next_step ? sanitizeParentFacingText(cl.next_step) : null
              }
            }

            // 5. Active priorities (parent-safe fields only)
            const { data: prioritiesData } = await rawDb
              .from('player_priorities')
              .select('title, description, category')
              .eq('player_id', playerRow.id)
              .eq('academy_id', academyId)
              .eq('is_active', true)
              .order('priority_rank', { ascending: true })
              .limit(3)

            const activePriorities = (prioritiesData ?? []).map((p: any) => ({
              title: p.title as string,
              description: (p.description ?? null) as string | null,
              category: (p.category ?? null) as string | null,
            }))

            // 6. Build IDP → parent role view
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
          }
        }
      }
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="pt-2">
        <p className="page-eyebrow">Family Portal</p>
        <h1 className="page-title">
          {linkedPlayerFirstName ? `${linkedPlayerFirstName}'s Journey` : 'Parent Home'}
        </h1>
        <p className="page-subtitle">Stay connected to your child's tennis development.</p>
      </div>

      {/* ── Approved data banner ──────────────────────────────────── */}
      {parentView && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20">
          <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">
            {parentView.approved_data_note}
          </p>
        </div>
      )}

      {/* ── Child's Progress ──────────────────────────────────────── */}
      <ParentSafeProgressPreview
        doingWell={[]}
        workingOn={parentView?.what_child_is_working_on ? [parentView.what_child_is_working_on] : []}
        currentFocus={null}
        nextStep={parentView?.next_development_step ?? null}
        isPreviewOnly={false}
      />

      {/* ── No mapping state ──────────────────────────────────────── */}
      {!parentView && noMappingReason && (
        <Card>
          <CardContent className="py-6 space-y-2">
            <p className="text-text-secondary text-sm text-center">
              Your child's development plan will appear here once your account is linked to their player record.
            </p>
            <p className="text-text-muted text-xs text-center">
              Ask the academy director to connect your parent account.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Live parent IDP sections ──────────────────────────────── */}
      {parentView && (
        <>
          {/* Why It Matters */}
          {parentView.why_it_matters && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Why It Matters</p>
                    <p className="text-text-muted text-xs">The bigger picture</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary leading-relaxed">{parentView.why_it_matters}</p>
              </CardContent>
            </Card>
          )}

          {/* How to Support This Week */}
          {parentView.how_to_support_this_week && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 text-lime" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">How to Support This Week</p>
                    <p className="text-text-muted text-xs">From your coaching team</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary leading-relaxed">{parentView.how_to_support_this_week}</p>
              </CardContent>
            </Card>
          )}

          {/* What to Say After Practice */}
          {parentView.what_to_say_after_practice && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">What to Say After Practice</p>
                    <p className="text-text-muted text-xs">A conversation starter</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="px-3 py-3 rounded-xl bg-surface-raised border border-border">
                  <p className="text-sm text-text-secondary leading-relaxed italic">
                    {parentView.what_to_say_after_practice}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* What Not to Over-Focus On */}
          {parentView.what_not_to_over_focus_on && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">What Not to Over-Focus On</p>
                    <p className="text-text-muted text-xs">Keep the long view</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary leading-relaxed">{parentView.what_not_to_over_focus_on}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Latest Coach Update ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Latest Coach Update</p>
              <p className="text-text-muted text-xs">Parent-ready summaries from your coaching team</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<MessageSquare className="w-5 h-5" />}
            title="No updates yet"
            description="Your coach's latest update will appear here."
            className="py-8"
          />
        </CardContent>
      </Card>

      {/* ── Session Consistency ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Session Consistency</p>
              <p className="text-text-muted text-xs">Attendance and participation</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Calendar className="w-5 h-5" />}
            title="Attendance will appear here"
            description="Session consistency and attendance data will be shared here."
            className="py-8"
          />
        </CardContent>
      </Card>

      {/* ── Messages & Updates ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Messages & Updates</p>
              <p className="text-text-muted text-xs">Communications from your academy</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Bell className="w-5 h-5" />}
            title="No messages yet"
            description="Messages and announcements from your academy will appear here."
            className="py-8"
          />
        </CardContent>
      </Card>

      {/* ── Safety note ───────────────────────────────────────────── */}
      {parentView && (
        <div className="pt-1 pb-2">
          <p className="text-text-muted text-[10px] text-center leading-relaxed">
            {parentView.safety_note}
          </p>
        </div>
      )}

    </div>
  )
}
