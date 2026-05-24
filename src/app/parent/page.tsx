// Sprint 619 — Parent Child Switcher UI V1
// Key changes from pre-619:
//   1. searchParams.childId read and validated server-side before any child data fetch.
//   2. Guardian relationship resolved; all linked players fetched for multi-child resolution.
//   3. resolveParentChildList() + validateChildBelongsToGuardian() gate every child query.
//   4. playerIds[0] collapse replaced by validated activeChildId.
//   5. Lesson request display and form suppressed for multi-child parents:
//      proposed_actions.target_object_id is null for parent_lesson_request actions —
//      no player-scoped filter is possible without a schema migration. Hiding prevents
//      cross-child leakage. Re-enable in a future sprint after the migration is applied.
//   6. ParentChildSwitcher rendered above content when multiple selectable children exist.

import { MessageSquare, Calendar, Heart, Bell, BookOpen, ShieldCheck, TrendingUp, ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { ParentSafeProgressPreview } from '@/components/player/ParentSafeProgressPreview'
import { PrivateLessonRequestCard } from './PrivateLessonRequestCard'
import { getSupabaseServer } from '@/lib/supabase/server'
import { buildIndividualDevelopmentPlan, buildRoleSpecificIdpView } from '@/lib/player/individualDevelopmentPlan'
import type { IdpParentView } from '@/lib/player/individualDevelopmentPlan'
import { sanitizeParentFacingText } from '@/lib/communications/parentSafeResponseRules'
import { buildParentSupportGuide } from '@/lib/parent/parentSupportGuide'
import type { ParentSupportGuide } from '@/lib/parent/parentSupportGuide'
import Link from 'next/link'
import {
  resolveParentChildList,
  validateChildBelongsToGuardian,
  type RawChildInput,
  type ChildRelationshipRecord,
  type GuardianRelationshipType,
} from '@/lib/parent/parentPlayerRelationshipModel'
import { ParentChildSwitcher } from '@/components/parent/ParentChildSwitcher'

export default async function ParentHome({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let parentView: IdpParentView | null = null
  let noMappingReason: string | null = null
  let linkedPlayerFirstName: string | null = null
  let parentCurrentLevelName: string | null = null
  let parentNextLevelName: string | null = null
  let parentSafeDoingWell: string | null = null
  let parentSupportGuide: ParentSupportGuide | null = null
  let parentActiveMissionTitle: string | null = null
  let parentActiveMissionCategory: string | null = null
  interface AttendanceStat {
    totalRecorded: number
    presentCount: number
    absentCount: number
    lateCount: number
    recentSessions: Array<{ date: string; sessionName: string | null; status: string }>
  }
  let attendanceStat: AttendanceStat | null = null
  interface LessonRequestStatus {
    preferredDay: string | null
    focusArea: string | null
    submittedAt: string
    status: string
    parentSafeStatus: string
  }
  let latestLessonRequest: LessonRequestStatus | null = null
  // Multi-child state — exposed to render section
  let selectableChildRecords: ChildRelationshipRecord[] = []
  let activeChildId: string | null = null
  // Lesson requests cannot be safely scoped to a child without a migration.
  // proposed_actions.target_object_id is null for parent_lesson_request.
  // Safe only when guardian has ≤ 1 selectable child (no sibling leakage possible).
  let canShowLessonRequest = true

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
      // 2. Auth user → guardian record (now fetches relationship for resolver)
      const { data: guardian } = await rawDb
        .from('guardians')
        .select('id, relationship')
        .eq('profile_id', user.id)
        .eq('academy_id', academyId)
        .maybeSingle()

      if (!guardian) {
        noMappingReason = 'no_guardian_link'
      } else {
        // 3. Guardian → all linked player IDs
        const { data: pgRows } = await rawDb
          .from('player_guardians')
          .select('player_id')
          .eq('guardian_id', guardian.id)
          .limit(3)

        const playerIds: string[] = (pgRows ?? []).map((row: any) => row.player_id as string)

        if (playerIds.length === 0) {
          noMappingReason = 'no_player_link'
        } else {
          // 4. Fetch all linked players for multi-child relationship resolution.
          // No is_active filter here — the resolver marks inactive children as unselectable.
          const { data: linkedPlayerRows } = await rawDb
            .from('players')
            .select('id, first_name, last_name, full_name, academy_id, is_active')
            .in('id', playerIds)
            .eq('academy_id', academyId)

          // Preserve playerIds ordering — IN query result order is not guaranteed.
          const playerMap = new Map<string, any>(
            (linkedPlayerRows ?? []).map((p: any) => [p.id as string, p])
          )
          const rawChildren: RawChildInput[] = playerIds
            .map((id: string): RawChildInput | null => {
              const p = playerMap.get(id)
              if (!p) return null
              const rawName: string | null =
                (p.full_name as string | null) ??
                (`${(p.first_name as string) ?? ''} ${(p.last_name as string) ?? ''}`.trim() || null)
              return {
                playerId: id,
                playerName: rawName,
                playerAcademyId: (p.academy_id as string | null) ?? null,
                isActive: (p.is_active as boolean) ?? false,
              }
            })
            .filter((x): x is RawChildInput => x !== null)

          // 5. Resolve and validate candidate childId from URL search params.
          // SAFETY: validateChildBelongsToGuardian() only accepts IDs in the
          // guardian's verified linked list. Unlinked IDs fall back to the default.
          const candidateChildId: string | null =
            typeof searchParams.childId === 'string' ? searchParams.childId : null
          const relationshipType = (guardian.relationship ?? 'parent') as GuardianRelationshipType
          const resolution = resolveParentChildList(
            rawChildren,
            guardian.id as string,
            academyId,
            relationshipType,
          )
          const validation = validateChildBelongsToGuardian(candidateChildId, resolution)

          // Expose to render scope
          activeChildId = validation.resolvedChildId
          selectableChildRecords = resolution.selectableChildren
          canShowLessonRequest = resolution.selectableChildren.length <= 1

          if (!activeChildId) {
            noMappingReason = 'player_not_active'
          } else {
            // Active player row — guaranteed to be in the verified resolution list
            const playerRow = playerMap.get(activeChildId) ?? null

            if (!playerRow || !(playerRow.is_active as boolean)) {
              noMappingReason = 'player_not_active'
            } else {
              linkedPlayerFirstName =
                (playerRow.first_name as string | null) ??
                (playerRow.full_name as string | null) ?? null

              // 6. Curriculum state
              const { data: csRows } = await rawDb
                .from('player_curriculum_states')
                .select('current_level_id')
                .eq('player_id', playerRow.id)
                .eq('academy_id', academyId)
                .limit(1)
              const currentLevelId: string | null = csRows?.[0]?.current_level_id ?? null

              let currentLevelName: string | null = null
              let currentStage: string | null = null
              let nextLevelName: string | null = null
              let coachLangDomain: string | null = null
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

                // Coach language — sanitized before IDP build
                const { data: clData } = await rawDb
                  .from('curriculum_coach_language')
                  .select('domain, doing_well, working_on, current_focus, next_step')
                  .eq('level_id', currentLevelId)
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

              // 7. Active priorities (parent-safe fields only)
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

              parentCurrentLevelName = currentLevelName
              parentNextLevelName = nextLevelName
              parentSafeDoingWell = coachLangDoingWell
              if (activePriorities.length > 0) {
                parentActiveMissionTitle = activePriorities[0].title ?? null
                parentActiveMissionCategory = activePriorities[0].category ?? null
              }
              parentSupportGuide = buildParentSupportGuide({
                domain: coachLangDomain,
                levelStage: currentStage,
                playerFirstName: (playerRow.first_name as string | null) ?? (playerRow.full_name as string | null) ?? 'your child',
              })

              // 8. Build IDP → parent role view
              const plan = buildIndividualDevelopmentPlan({
                player_id: playerRow.id,
                player_name: (playerRow.full_name as string | null) ?? `${(playerRow.first_name as string) ?? ''} ${(playerRow.last_name as string) ?? ''}`.trim(),
                player_first_name: (playerRow.first_name as string | null) ?? (playerRow.full_name as string | null) ?? 'Your child',
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

              // 9. Session attendance — last 60 days (parent-safe: active child only)
              const sixtyDaysAgo = new Date()
              sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
              const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().slice(0, 10)

              const { data: attendanceRows } = await rawDb
                .from('session_attendance')
                .select('status, session_id')
                .eq('player_id', playerRow.id)
                .eq('academy_id', academyId)
                .limit(30)

              const attendanceData = (attendanceRows ?? []) as Array<{ status: string; session_id: string }>

              // 10. Lesson request status — only for single-child guardians.
              // For multi-child parents: proposed_actions.target_object_id is null for
              // parent_lesson_request actions. Filtering by proposed_by_id: user.id
              // would return all requests across all children (cross-child leakage).
              // This section is suppressed until a player-scoped migration exists.
              if (canShowLessonRequest) {
                const { data: lessonRows } = await rawDb
                  .from('proposed_actions')
                  .select('status, proposed_payload, created_at')
                  .eq('academy_id', academyId)
                  .eq('proposed_by_id', user!.id)
                  .eq('target_module', 'parent_lesson_request')
                  .order('created_at', { ascending: false })
                  .limit(1)

                const lessonRow = (lessonRows ?? [])[0] as {
                  status: string
                  proposed_payload: any
                  created_at: string
                } | undefined

                if (lessonRow) {
                  const STATUS_MAP: Record<string, string> = {
                    pending_review: 'Submitted — under review',
                    approved: 'Under review',
                    applied: 'Assigned',
                    rejected: 'Declined',
                    dismissed: 'Closed',
                  }
                  latestLessonRequest = {
                    preferredDay: lessonRow.proposed_payload?.preferred_day ?? null,
                    focusArea: lessonRow.proposed_payload?.focus_area ?? null,
                    submittedAt: lessonRow.created_at,
                    status: lessonRow.status,
                    parentSafeStatus: STATUS_MAP[lessonRow.status] ?? 'Under review',
                  }
                }
              }

              if (attendanceData.length > 0) {
                const sessionIds = attendanceData.map(r => r.session_id)
                const { data: sessionRows } = await rawDb
                  .from('sessions')
                  .select('id, name, scheduled_date')
                  .in('id', sessionIds)
                  .gte('scheduled_date', sixtyDaysAgoStr)
                  .order('scheduled_date', { ascending: false })
                  .limit(30)

                const sessionDateMap = new Map<string, { name: string | null; scheduled_date: string }>()
                for (const s of (sessionRows ?? [])) {
                  sessionDateMap.set(s.id, { name: s.name ?? null, scheduled_date: s.scheduled_date })
                }

                const recentAttendance = attendanceData
                  .filter(r => sessionDateMap.has(r.session_id))
                  .slice(0, 10)

                attendanceStat = {
                  totalRecorded: recentAttendance.length,
                  presentCount: recentAttendance.filter(r => r.status === 'present' || r.status === 'late').length,
                  absentCount: recentAttendance.filter(r => r.status === 'absent').length,
                  lateCount: recentAttendance.filter(r => r.status === 'late').length,
                  recentSessions: recentAttendance.slice(0, 5).map(r => {
                    const s = sessionDateMap.get(r.session_id)
                    return {
                      date: s?.scheduled_date ?? '',
                      sessionName: s?.name ?? null,
                      status: r.status,
                    }
                  }),
                }
              }
            }
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

      {/* ── Child Switcher — rendered only when multiple verified children exist ── */}
      {selectableChildRecords.length > 1 && (
        <ParentChildSwitcher records={selectableChildRecords} activeChildId={activeChildId} />
      )}

      {/* ── Approved data banner ──────────────────────────────────── */}
      {parentView && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20">
          <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">
            {parentView.approved_data_note}
          </p>
        </div>
      )}

      {/* ── Quick navigation ─────────────────────────────────────── */}
      {parentView && (
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { href: '/parent/development', icon: BookOpen,     label: 'Development Focus', sub: 'Current mission',       accent: 'text-lime',          bg: 'bg-lime/10',           border: 'border-lime/20' },
            { href: '/parent/progress',    icon: TrendingUp,   label: 'Progress',          sub: 'Level & advancement',   accent: 'text-status-blue',   bg: 'bg-status-blue/10',    border: 'border-status-blue/20' },
            { href: '/parent/ask-donna',   icon: MessageSquare, label: 'Ask DONNA',        sub: 'Support guidance',      accent: 'text-status-orange', bg: 'bg-status-orange/10',  border: 'border-status-orange/20' },
            { href: '/parent/wins',        icon: Heart,        label: 'Wins',              sub: 'Highlights',            accent: 'text-status-green',  bg: 'bg-status-green/10',   border: 'border-status-green/20' },
          ].map(({ href, icon: Icon, label, sub, accent, bg, border }) => (
            <Link key={href} href={href}>
              <div className="rounded-xl bg-surface border border-border hover:border-lime/20 transition-colors px-3 py-3.5 min-h-[72px] flex flex-col justify-center">
                <div className={`w-7 h-7 rounded-lg ${bg} border ${border} flex items-center justify-center mb-2`}>
                  <Icon className={`w-3.5 h-3.5 ${accent}`} />
                </div>
                <p className="text-xs font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Active mission context ────────────────────────────────── */}
      {parentActiveMissionTitle && (
        <Link href="/parent/development">
          <div className="rounded-2xl bg-lime/5 border border-lime/20 px-4 py-4 flex items-start justify-between gap-3 hover:bg-lime/8 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="label-xs text-lime mb-1">Currently Working On</p>
              <p className="text-sm font-semibold text-text-primary leading-snug">{parentActiveMissionTitle}</p>
              {parentActiveMissionCategory && (
                <p className="text-xs text-text-muted mt-0.5 capitalize">{parentActiveMissionCategory} focus</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-lime/60 shrink-0 mt-1" />
          </div>
        </Link>
      )}

      {/* ── Level Card ───────────────────────────────────────────── */}
      {parentCurrentLevelName && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-lime" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-text-muted mb-0.5">Current Level</p>
                  <p className="font-bold text-text-primary text-base leading-tight">{parentCurrentLevelName}</p>
                </div>
              </div>
              {parentNextLevelName && (
                <div className="text-right shrink-0 flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-muted mb-0.5">Next Level</p>
                    <p className="text-xs text-text-secondary font-medium">{parentNextLevelName}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Child's Progress ──────────────────────────────────────── */}
      <ParentSafeProgressPreview
        doingWell={parentSafeDoingWell ? [parentSafeDoingWell] : []}
        workingOn={parentView?.what_child_is_working_on ? [parentView.what_child_is_working_on] : []}
        currentFocus={null}
        nextStep={parentView?.next_development_step ?? null}
        isPreviewOnly={false}
      />

      {/* ── No mapping state ──────────────────────────────────────── */}
      {!parentView && noMappingReason && (
        <>
          <Card>
            <CardContent className="py-6 space-y-2">
              <p className="text-text-primary text-sm font-medium text-center">Your academy is preparing your child's development view</p>
              <p className="text-text-secondary text-xs leading-relaxed text-center max-w-xs mx-auto">
                Once connected, you'll see their level, current focus, and how best to support them at home.
              </p>
              <p className="text-text-muted text-xs text-center">
                Ask the academy director to link your parent account to your child's profile.
              </p>
            </CardContent>
          </Card>
          <Link href="/parent/ask-donna">
            <div className="rounded-2xl bg-status-blue/5 border border-status-blue/20 px-4 py-4 flex items-center justify-between gap-3 hover:bg-status-blue/8 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-status-blue/15 border border-status-blue/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-status-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">While you wait — Ask DONNA</p>
                  <p className="text-xs text-text-muted">Get parent guidance on supporting your child right now</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-status-blue/40 shrink-0" />
            </div>
          </Link>
        </>
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

          {/* How to Support This Week — suppressed when richer parentSupportGuide is present */}
          {parentView.how_to_support_this_week && !parentSupportGuide && (
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

      {/* ── Parent Support Guide ───────────────────────────────────── */}
      {parentSupportGuide && linkedPlayerFirstName && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-lime" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">How to Support This Week</p>
                <p className="text-text-muted text-xs">A guide from the coaching team</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="px-3 py-3 rounded-xl bg-status-green/5 border border-status-green/20">
              <p className="text-[11px] uppercase tracking-widest text-status-green mb-1">What to Praise</p>
              <p className="text-sm text-text-primary font-medium leading-relaxed">{parentSupportGuide.whatToPraise}</p>
            </div>
            <div className="px-3 py-3 rounded-xl bg-surface-raised border border-border">
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">At-Home Support Idea</p>
              <p className="text-sm text-text-secondary leading-relaxed">{parentSupportGuide.atHomeSupportIdea}</p>
            </div>
            <div className="px-3 py-3 rounded-xl bg-lime/5 border border-lime/15">
              <p className="text-[11px] uppercase tracking-widest text-lime mb-1">After Practice, Try Saying</p>
              <p className="text-sm text-text-secondary leading-relaxed italic">&ldquo;{parentSupportGuide.practiceLanguage.replace(/^"|"$/g, '')}&rdquo;</p>
            </div>
            <div className="px-3 py-3 rounded-xl bg-surface-raised border border-border">
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">Leave This to the Coaching Team</p>
              <p className="text-sm text-text-secondary leading-relaxed">{parentSupportGuide.avoidOvercoaching}</p>
            </div>
            <div className="px-3 py-3 rounded-xl bg-status-blue/5 border border-status-blue/15">
              <p className="text-[11px] uppercase tracking-widest text-status-blue mb-1">A Question to Ask the Coach</p>
              <p className="text-sm text-text-secondary leading-relaxed">{parentSupportGuide.whenToAskCoach}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Coach Updates CTA ────────────────────────────────────── */}
      <Link href="/parent/updates">
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3.5 min-h-[64px] flex items-center justify-between hover:border-lime/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Coach Updates</p>
              <p className="text-xs text-text-muted">Director-approved summaries and announcements</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
        </div>
      </Link>

      {/* ── Session Consistency ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Session Consistency</p>
              <p className="text-text-muted text-xs">Attendance over the past 60 days</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceStat && attendanceStat.totalRecorded > 0 ? (
            <div className="space-y-4">
              {/* Summary row */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-lime">{attendanceStat.presentCount}</p>
                  <p className="text-[11px] uppercase tracking-widest text-text-muted mt-0.5">Attended</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-text-secondary">{attendanceStat.totalRecorded}</p>
                  <p className="text-[11px] uppercase tracking-widest text-text-muted mt-0.5">Recorded</p>
                </div>
                {attendanceStat.totalRecorded > 0 && (
                  <div className="flex-1">
                    <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className="h-full bg-lime rounded-full transition-all"
                        style={{ width: `${Math.round((attendanceStat.presentCount / attendanceStat.totalRecorded) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {Math.round((attendanceStat.presentCount / attendanceStat.totalRecorded) * 100)}% attendance rate
                    </p>
                  </div>
                )}
              </div>
              {/* Late count — shown only if relevant */}
              {attendanceStat.lateCount > 0 && (
                <p className="text-xs text-status-orange">
                  {attendanceStat.lateCount} session{attendanceStat.lateCount !== 1 ? 's' : ''} attended late
                </p>
              )}
              {/* Recent session list */}
              {attendanceStat.recentSessions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-widest text-text-muted">Recent Sessions</p>
                  {attendanceStat.recentSessions.map((s, i) => {
                    const statusLabel =
                      s.status === 'present' ? 'Attended'
                      : s.status === 'late' ? 'Attended late'
                      : s.status === 'excused' ? 'Excused'
                      : 'Missed'
                    const formattedDate = s.date
                      ? new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      : ''
                    return (
                      <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-border last:border-0">
                        <div className="min-w-0">
                          <p className="text-xs text-text-secondary truncate">{s.sessionName ?? 'Training session'}</p>
                          <p className="text-xs text-text-muted">{formattedDate}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                          s.status === 'present'
                            ? 'bg-status-green/10 text-status-green border-status-green/30'
                            : s.status === 'late'
                            ? 'bg-status-orange/10 text-status-orange border-status-orange/30'
                            : s.status === 'excused'
                            ? 'bg-status-blue/10 text-status-blue border-status-blue/30'
                            : 'bg-surface-raised text-text-muted border-border'
                        }`}>
                          {statusLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="w-5 h-5" />}
              title="No attendance recorded yet"
              description="Session attendance will appear here once sessions have been recorded."
              className="py-8"
            />
          )}
        </CardContent>
      </Card>

      {/* ── Private Lesson Request + Status ─────────────────────── */}
      {/* Shown only when guardian has ≤ 1 selectable child.
          For multi-child parents: proposed_actions.target_object_id is null for
          parent_lesson_request — no player-scoped filter is possible. Displaying
          the status or form could expose cross-child data. Re-enable after migration. */}
      {parentView && linkedPlayerFirstName && canShowLessonRequest && (
        <>
          {latestLessonRequest && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Private Lesson Request</p>
                    <p className="text-text-muted text-xs">Your most recent request</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
                  <p className="text-xs text-text-secondary">Status</p>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    latestLessonRequest.status === 'applied' || latestLessonRequest.status === 'approved'
                      ? 'bg-status-green/10 text-status-green border-status-green/30'
                      : latestLessonRequest.status === 'rejected' || latestLessonRequest.status === 'dismissed'
                      ? 'bg-status-red/10 text-status-red border-status-red/30'
                      : 'bg-status-orange/10 text-status-orange border-status-orange/30'
                  }`}>
                    {latestLessonRequest.parentSafeStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {latestLessonRequest.preferredDay && (
                    <div>
                      <p className="label-xs text-text-muted mb-0.5">Preferred day</p>
                      <p className="text-text-secondary">{latestLessonRequest.preferredDay}</p>
                    </div>
                  )}
                  {latestLessonRequest.focusArea && (
                    <div>
                      <p className="label-xs text-text-muted mb-0.5">Focus area</p>
                      <p className="text-text-secondary">{latestLessonRequest.focusArea}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  Submitted {new Date(latestLessonRequest.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                  Your director will follow up directly.
                </p>
              </CardContent>
            </Card>
          )}
          <PrivateLessonRequestCard playerId={activeChildId ?? ''} playerFirstName={linkedPlayerFirstName} />
        </>
      )}

      {/* ── Safety note ───────────────────────────────────────────── */}
      {parentView && (
        <div className="pt-1 pb-2">
          <p className="text-text-muted text-xs text-center leading-relaxed">
            {parentView.safety_note}
          </p>
        </div>
      )}

    </div>
  )
}
