// Sprint 594 — Player Badge Wins V1
import { TrendingUp, Trophy, MessageCircle, BookOpen, ArrowRight, HelpCircle, Sparkles, CheckCircle, Zap, Activity, Map as MapIcon, Shield, ChevronRight, Star, Flame, Award, Lock } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { PlayerMissionPreview } from '@/components/player/PlayerMissionPreview'
import { PlayerHomeHeroCard } from '@/components/player/PlayerHomeHeroCard'
import { AttendanceSparkline } from '@/components/player/AttendanceSparkline'
import { LevelProgressRing } from '@/components/player/LevelProgressRing'
import { getSupabaseServer } from '@/lib/supabase/server'
import { buildIndividualDevelopmentPlan, buildRoleSpecificIdpView } from '@/lib/player/individualDevelopmentPlan'
import type { IdpPlayerView } from '@/lib/player/individualDevelopmentPlan'
import { parsePlayerProgressQuestion, buildPlayerProgressAnswer } from '@/lib/player/playerProgressQa'
import { buildModuleForLevelDomain } from '@/lib/curriculum/learningModules'
import type { LearningModuleDomain } from '@/lib/curriculum/learningModules'
import { buildPlayerMissionCopy } from '@/lib/player/playerMissionCopy'
import type { PlayerMissionCopy } from '@/lib/player/playerMissionCopy'
import { buildBadgeEligibilityReport, getNextBadgeToEarn } from '@/lib/badges/badgeEligibilityEngine'
import { getVisibleBadgesForPlayer, BADGE_DEFINITIONS } from '@/lib/badges/badgeModel'
import type { BadgeEligibilityReport } from '@/lib/badges/badgeEligibilityEngine'
import { buildPlayerProgressIndicators } from '@/lib/player/progressIndicators'
import type { ProgressStatusSummary } from '@/lib/player/evidenceQueries'


export default async function PlayerHome() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  // Resolve player via profile_id — never trust URL params for player identity
  let idpView: IdpPlayerView | null = null
  let playerFirstName: string | null = null
  let noMappingReason: string | null = null
  let currentLevelStage: string | null = null
  let nextLevelDisplayName: string | null = null
  let missionCopy: PlayerMissionCopy | null = null
  interface SessionHistoryItem {
    sessionName: string | null
    date: string
    status: string
  }
  let recentSessionHistory: SessionHistoryItem[] = []
  let badgeReport: BadgeEligibilityReport | null = null

  if (user) {
    const rawDb = supabase as any

    // 1. Get profile for academy_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()

    const academyId = profile?.academy_id ?? null

    if (!academyId) {
      noMappingReason = 'no_academy'
    } else {
      // 2. Find player record linked to this auth user via profile_id
      const { data: playerRow } = await rawDb
        .from('players')
        .select('id, first_name, last_name, full_name')
        .eq('academy_id', academyId)
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!playerRow) {
        noMappingReason = 'no_player_link'
      } else {
        playerFirstName = playerRow.first_name ?? playerRow.full_name ?? null

        // 3. Get curriculum state
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
        let levelGates: Array<{ id: string; domain: string; criterion: string; threshold: string }> = []
        let topDrills: Array<{ name: string; objective: string }> = []
        let coachLang: { domain: string; doing_well: string; working_on: string; current_focus: string; next_step: string } | null = null
        let miniChallenge: string | null = null
        let reflectionQuestion: string | null = null

        if (currentLevelId) {
          // Level name + stage
          const { data: lvl } = await rawDb
            .from('curriculum_levels')
            .select('display_name, stage, sort_order')
            .eq('id', currentLevelId)
            .single()
          currentLevelName = lvl?.display_name ?? null
          currentStage = lvl?.stage ?? null
          currentLevelStage = currentStage

          // Next level
          if (lvl?.sort_order != null) {
            const { data: nextLvl } = await rawDb
              .from('curriculum_levels')
              .select('display_name')
              .gt('sort_order', lvl.sort_order)
              .order('sort_order', { ascending: true })
              .limit(1)
            nextLevelName = nextLvl?.[0]?.display_name ?? null
            nextLevelDisplayName = nextLevelName
          }

          // Open gates
          const { data: gatesData } = await rawDb
            .from('curriculum_gates')
            .select('id, domain, criterion, threshold, sort_order')
            .eq('from_level_id', currentLevelId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(6)
          levelGates = (gatesData ?? []).map((g: any) => ({
            id: g.id,
            domain: g.domain,
            criterion: g.criterion,
            threshold: g.threshold ?? '',
          }))

          // Top drills (player-safe — names and objectives only)
          const { data: drillsData } = await rawDb
            .from('curriculum_drills')
            .select('id, name, domain, objective')
            .eq('level_min_id', currentLevelId)
            .eq('is_active', true)
            .limit(5)
          topDrills = (drillsData ?? []).map((d: any) => ({
            name: d.name,
            objective: d.objective,
          }))

          // Coach language (player-safe fields only)
          const { data: clData } = await rawDb
            .from('curriculum_coach_language')
            .select('domain, doing_well, working_on, current_focus, next_step')
            .eq('level_id', currentLevelId)
            .limit(1)
          coachLang = clData?.[0] ?? null

          // Learning module hint
          if (coachLang && currentLevelName) {
            const validDomains: LearningModuleDomain[] = [
              'Technical', 'Tactical', 'Movement', 'Competition',
              'Mentality', 'Fitness', 'Recovery', 'Lifestyle',
            ]
            const domain = validDomains.includes(coachLang.domain as LearningModuleDomain)
              ? (coachLang.domain as LearningModuleDomain)
              : 'Technical'
            try {
              const mod = buildModuleForLevelDomain({
                levelId: currentLevelId,
                levelName: currentLevelName,
                levelStage: currentStage ?? '',
                domain,
                gates: levelGates.map(g => ({
                  id: g.id,
                  from_level_id: currentLevelId,
                  domain: g.domain,
                  criterion: g.criterion,
                  threshold: g.threshold,
                })),
                drills: topDrills.map((d, i) => ({
                  id: `drill_${i}`,
                  level_min_id: currentLevelId,
                  domain: coachLang?.domain ?? 'Technical',
                  name: d.name,
                  objective: d.objective,
                })),
                coachLang: {
                  level_id: currentLevelId,
                  ...coachLang,
                },
              })
              miniChallenge = mod.mini_challenge
              reflectionQuestion = mod.reflection_question
            } catch {
              // graceful fallback
            }
          }
        }

        // 4. Active priorities (player-safe: title only, no internal notes)
        const { data: prioritiesData } = await rawDb
          .from('player_priorities')
          .select('title, description, category')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .eq('is_active', true)
          .order('priority_rank', { ascending: true })
          .limit(3)

        const activePriorities = (prioritiesData ?? []).map((p: any) => ({
          title: p.title,
          description: p.description ?? null,
          category: p.category ?? null,
        }))

        // 5. Build IDP and return player role view
        const plan = buildIndividualDevelopmentPlan({
          player_id: playerRow.id,
          player_name: playerRow.full_name ?? `${playerRow.first_name} ${playerRow.last_name}`,
          player_first_name: playerRow.first_name ?? playerRow.full_name ?? 'Player',
          current_level: currentLevelName,
          current_stage: currentStage,
          next_target_level: nextLevelName,
          active_priorities: activePriorities,
          open_gates: levelGates,
          coach_language_current_focus: coachLang?.current_focus ?? null,
          coach_language_next_step: coachLang?.next_step ?? null,
          coach_language_doing_well: coachLang?.doing_well ?? null,
          coach_language_working_on: coachLang?.working_on ?? null,
          top_drills: topDrills,
          mini_challenge: miniChallenge,
          reflection_question: reflectionQuestion,
        })

        idpView = buildRoleSpecificIdpView(plan, 'player') as IdpPlayerView

        // Build mission copy from domain + level stage (static, no AI)
        missionCopy = buildPlayerMissionCopy({
          domain: coachLang?.domain ?? null,
          levelStage: currentStage,
          currentLevel: currentLevelName,
        })

        // 6. Session attendance history — last 60 days, player-safe (no notes)
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().slice(0, 10)

        const { data: attendanceRows } = await rawDb
          .from('session_attendance')
          .select('status, session_id')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .limit(15)

        const attendanceData = (attendanceRows ?? []) as Array<{ status: string; session_id: string }>
        if (attendanceData.length > 0) {
          const sessionIds = attendanceData.map(r => r.session_id)
          const { data: sessionRows } = await rawDb
            .from('sessions')
            .select('id, name, scheduled_date')
            .in('id', sessionIds)
            .gte('scheduled_date', sixtyDaysAgoStr)
            .order('scheduled_date', { ascending: false })
            .limit(10)

          const sessionMap = new Map<string, { name: string | null; scheduled_date: string }>()
          for (const s of (sessionRows ?? [])) {
            sessionMap.set(s.id, { name: s.name, scheduled_date: s.scheduled_date })
          }

          recentSessionHistory = attendanceData
            .map(r => {
              const sess = sessionMap.get(r.session_id)
              if (!sess) return null
              return {
                sessionName: sess.name,
                date: sess.scheduled_date,
                status: r.status,
              }
            })
            .filter((r): r is SessionHistoryItem => r !== null)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        }

        // 7. Badge eligibility — computed from requirement progress (graceful fallback if table absent)
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
          const progressIndicators = buildPlayerProgressIndicators(progressSummary, [])

          // Compute consecutive attendance streak from recentSessionHistory (most-recent-first)
          let attendanceStreak = 0
          for (const s of recentSessionHistory) {
            if (s.status === 'present' || s.status === 'late') attendanceStreak++
            else break
          }

          badgeReport = buildBadgeEligibilityReport({
            playerId: playerRow.id,
            progressSummary,
            progressIndicators,
            promotionReady: null,
            attendanceStreak,
            domainCompletedIds: [],
            levelCompleted: progressSummary.total > 0 && progressSummary.total === (progressSummary.achieved + progressSummary.confirmed),
          })
        } catch {
          // player_requirement_progress table may not exist on live DB yet — badge display stays null
        }
      }
    }
  }

  // Q&A using playerProgressQa helper with player role view data
  const qaAnswer = idpView
    ? buildPlayerProgressAnswer(
        parsePlayerProgressQuestion('what to practice'),
        {
          currentLevelName: idpView.current_level,
          currentLevelStage: null,
          nextLevelName: null,
          hasCurriculumState: !!idpView.current_level,
          gates: idpView.requirements_to_move_up.map((c, i) => ({
            id: `gate_${i}`,
            domain: '',
            criterion: c,
            threshold: '',
            evaluator: '',
            cadence: '',
            evidence_window: null,
          })),
          drills: idpView.what_to_practice.map((p, i) => {
            const [name, ...rest] = p.split(' — ')
            return {
              id: `drill_${i}`,
              name: name ?? p,
              domain: '',
              session_block: '',
              objective: rest.join(' — ') || p,
            }
          }),
          coachLanguage: [],
          learningModuleHint: idpView.mini_challenge
            ? {
                mini_challenge: idpView.mini_challenge,
                reflection_question: idpView.reflection_question ?? '',
                try_this: null,
              }
            : null,
        },
      )
    : null

  const sessionPresentCount = recentSessionHistory.filter(r => r.status === 'present' || r.status === 'late').length
  const sessionAttendancePct = recentSessionHistory.length > 0
    ? Math.round((sessionPresentCount / recentSessionHistory.length) * 100)
    : 0

  return (
    <div className="space-y-4">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="pt-2">
        <p className="page-eyebrow">Your Journey</p>
        <h1 className="page-title">
          {playerFirstName ? `${playerFirstName}'s Development` : 'Player Home'}
        </h1>
        <p className="page-subtitle">Show up. Level up. Every day.</p>
      </div>

      {/* ── Mission Hero ─────────────────────────────────────── */}
      <PlayerHomeHeroCard
        playerFirstName={playerFirstName}
        missionText={idpView?.recommended_next_mission ?? null}
        currentLevelName={idpView?.current_level ?? null}
        nextLevelName={nextLevelDisplayName}
      />

      {/* ── Path Entry Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/player/skill-path',       icon: Zap,      label: 'Skill Path',    sub: 'Technical',  accent: 'text-lime',          bg: 'bg-lime/10',           border: 'border-lime/20' },
          { href: '/player/competition-path', icon: Trophy,   label: 'Competition',   sub: 'Match skills', accent: 'text-status-orange', bg: 'bg-status-orange/10', border: 'border-status-orange/20' },
          { href: '/player/fitness-path',     icon: Activity, label: 'Fitness',       sub: 'Body work',  accent: 'text-status-blue',   bg: 'bg-status-blue/10',    border: 'border-status-blue/20' },
          { href: '/player/missions',         icon: MapIcon,  label: 'My Missions',   sub: 'Journey',    accent: 'text-text-muted',    bg: 'bg-surface-raised',    border: 'border-border' },
        ].map(({ href, icon: Icon, label, sub, accent, bg, border }) => (
          <Link key={href} href={href}>
            <div className="rounded-xl bg-surface border border-border hover:border-lime/20 transition-colors px-3 py-3 h-full">
              <div className={`w-7 h-7 rounded-lg ${bg} border ${border} flex items-center justify-center mb-2`}>
                <Icon className={`w-3.5 h-3.5 ${accent}`} />
              </div>
              <p className="text-xs font-semibold text-text-primary">{label}</p>
              <p className="text-xs text-text-muted">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Today's Mission ───────────────────────────────────── */}
      <PlayerMissionPreview
        strength={idpView?.what_to_understand?.[0] ?? null}
        mission={idpView?.recommended_next_mission ?? null}
        nextWin={idpView?.requirements_to_move_up?.[0] ?? null}
        currentLevel={idpView?.current_level ?? null}
        whyItMatters={missionCopy?.whyItMatters ?? null}
        tryThisNext={missionCopy?.tryThisNext ?? null}
        coachIsWatchingFor={missionCopy?.coachIsWatchingFor ?? null}
      />

      {/* ── Ask DONNA ────────────────────────────────────────── */}
      <div className="rounded-xl bg-surface border border-border px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-status-blue shrink-0" />
          <p className="text-xs text-text-muted">Coach-approved answers only — no rankings, no pressure</p>
        </div>
        <p className="text-xs font-semibold text-text-primary">Ask DONNA</p>
        <div className="flex flex-wrap gap-2">
          {[
            'What should I practice?',
            'What does my mission mean?',
            'How do I get to the next level?',
            'How do I prepare for a match?',
          ].map(q => (
            <Link key={q} href="/player/ask-donna">
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-status-blue/5 border border-status-blue/15 text-status-blue hover:bg-status-blue/10 transition-colors">
                <ChevronRight className="w-2.5 h-2.5" />
                {q}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── No Mapping State ──────────────────────────────────── */}
      {!idpView && noMappingReason && (
        <Card>
          <CardContent className="py-8 space-y-3 text-center">
            <Sparkles className="w-8 h-8 text-lime/40 mx-auto" />
            <p className="text-text-primary text-sm font-medium">Your mission is on its way</p>
            <p className="text-text-secondary text-xs leading-relaxed max-w-xs mx-auto">
              Your coach will add your first mission soon. Once your account is connected, everything will appear here automatically.
            </p>
            <p className="text-text-muted text-xs">
              Ask your academy director to link your profile.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Live Development Plan ────────────────────────────── */}
      {idpView && (
        <>
          {/* Current Level Card */}
          {idpView.current_level && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-lime" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-text-muted mb-0.5">Current Level</p>
                      <p className="font-bold text-text-primary text-base leading-tight">{idpView.current_level}</p>
                      {currentLevelStage && (
                        <p className="text-xs text-text-muted capitalize">{currentLevelStage.replace(/_/g, ' ')} stage</p>
                      )}
                    </div>
                  </div>
                  {nextLevelDisplayName && (
                    <div className="text-right shrink-0">
                      <p className="text-[11px] uppercase tracking-widest text-text-muted mb-0.5">Next Level</p>
                      <p className="text-xs text-text-secondary font-medium">{nextLevelDisplayName}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* What to Practice */}
          {idpView.what_to_practice.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">What to Work On</p>
                    <p className="text-text-muted text-xs">Your current drill focus</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {idpView.what_to_practice.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-lime shrink-0 mt-0.5">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* What to Understand */}
          {idpView.what_to_understand.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">What to Understand</p>
                    <p className="text-text-muted text-xs">Ideas to build this week</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {idpView.what_to_understand.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-status-blue shrink-0 mt-0.5">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Requirements to move up */}
          {idpView.requirements_to_move_up.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Next Evidence to Show</p>
                    <p className="text-text-muted text-xs">What your coach is watching for</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {idpView.requirements_to_move_up.slice(0, 4).map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-status-orange shrink-0 mt-0.5">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Learning Module Challenge */}
          {(idpView.mini_challenge || idpView.reflection_question) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4 text-lime" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">This Week's Challenge</p>
                    <p className="text-text-muted text-xs">From your curriculum learning module</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {idpView.mini_challenge && (
                  <div className="px-3 py-3 rounded-xl bg-lime/5 border border-lime/20">
                    <p className="text-[11px] uppercase tracking-widest text-lime mb-1">Mini Challenge</p>
                    <p className="text-sm text-text-primary leading-relaxed">{idpView.mini_challenge}</p>
                  </div>
                )}
                {idpView.reflection_question && (
                  <div className="px-3 py-3 rounded-xl bg-surface-raised border border-border">
                    <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">Reflect After Practice</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{idpView.reflection_question}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* What to ask your coach */}
          {(idpView.what_to_understand.length > 0 || idpView.recommended_next_mission) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">What to Ask Your Coach</p>
                    <p className="text-text-muted text-xs">Good questions to ask this week</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {idpView.what_to_understand.slice(0, 2).map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-lime shrink-0 mt-0.5">?</span>
                      <span>&ldquo;How am I doing with {item.toLowerCase().replace(/\.$/, '')}?&rdquo;</span>
                    </li>
                  ))}
                  {idpView.recommended_next_mission && (
                    <li className="flex gap-2 text-sm text-text-secondary">
                      <span className="text-lime shrink-0 mt-0.5">?</span>
                      <span>&ldquo;What does success look like for my current mission?&rdquo;</span>
                    </li>
                  )}
                </ul>
                <p className="text-xs text-text-muted mt-3">
                  Great players ask great questions. These are safe to bring to any session.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Q&A Answer */}
          {qaAnswer && qaAnswer.question_intent !== 'unknown' && qaAnswer.bullets.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{qaAnswer.title}</p>
                    <p className="text-text-muted text-xs">From your development plan</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary mb-3 leading-relaxed">{qaAnswer.answer}</p>
                {qaAnswer.bullets.length > 0 && (
                  <ul className="space-y-1.5">
                    {qaAnswer.bullets.slice(0, 4).map((b, i) => (
                      <li key={i} className="flex gap-2 text-xs text-text-muted">
                        <span className="text-lime shrink-0 mt-0.5">·</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
          {/* Encouragement */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-raised border border-border">
            <Sparkles className="w-4 h-4 text-lime shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted leading-relaxed">
              Your coach updates this plan as you grow. Keep showing up — every session counts.
            </p>
          </div>

          {/* Recent session history */}
          {recentSessionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <LevelProgressRing
                    percent={sessionAttendancePct}
                    size={44}
                    label={`${sessionAttendancePct}%`}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm">Recent Sessions</p>
                    <p className="text-text-muted text-xs">Your last {recentSessionHistory.length} sessions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <AttendanceSparkline
                  sessions={recentSessionHistory}
                  className="mb-3"
                />
                <div className="divide-y divide-border">
                  {recentSessionHistory.map((item, i) => {
                    const statusLabel =
                      item.status === 'present' ? 'Attended'
                      : item.status === 'late' ? 'Attended late'
                      : item.status === 'excused' ? 'Excused'
                      : 'Not attended'
                    const statusColor =
                      item.status === 'present' ? 'text-status-green'
                      : item.status === 'late' ? 'text-status-orange'
                      : item.status === 'excused' ? 'text-status-blue'
                      : 'text-text-muted'
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm text-text-primary truncate">
                            {item.sessionName ?? 'Session'}
                          </p>
                          <p className="text-xs text-text-muted">
                            {new Date(item.date).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.status === 'present' && (
                            <CheckCircle className="w-3 h-3 text-status-green" />
                          )}
                          <span className={`text-[11px] font-semibold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── My Skills (empty state when no IDP) ──────────────── */}
      {!idpView && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">My Skills</p>
                <p className="text-text-muted text-xs">Your skill path</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<TrendingUp className="w-5 h-5" />}
              title="Your skill path is being set up"
              description="Your coach is setting up your first mission. Once connected, your level, focus, and next skills will appear here."
              className="py-8"
            />
          </CardContent>
        </Card>
      )}

      {/* ── Wins & Streaks ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Wins &amp; Badges</p>
                <p className="text-text-muted text-xs">Your achievements</p>
              </div>
            </div>
            {badgeReport && badgeReport.earnedCount > 0 && (
              <Link href="/player/wins">
                <span className="text-xs text-lime hover:text-lime/80 transition-colors">See all</span>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {badgeReport && badgeReport.earnedCount > 0 ? (
            <div className="space-y-3">
              {/* Earned badges */}
              <div className="grid grid-cols-2 gap-2">
                {badgeReport.awards
                  .filter(a => a.status === 'earned')
                  .slice(0, 4)
                  .map(award => {
                    const def = BADGE_DEFINITIONS[award.badgeId]
                    return (
                      <div key={award.badgeId} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-lime/5 border border-lime/20">
                        <div className="w-6 h-6 rounded-lg bg-lime/15 border border-lime/30 flex items-center justify-center shrink-0">
                          <Star className="w-3 h-3 text-lime" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-lime leading-tight truncate">{def.name}</p>
                          <p className="text-[11px] text-lime/60 capitalize">{def.rarity}</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
              {/* In-progress / next badge */}
              {(() => {
                const next = getNextBadgeToEarn(badgeReport)
                if (!next) return null
                const def = BADGE_DEFINITIONS[next.badgeId]
                const pct = next.progressMax > 0 ? Math.round((next.progress / next.progressMax) * 100) : 0
                return (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-widest text-text-muted">Next Badge</p>
                    <div className="px-3 py-2.5 rounded-xl border border-border bg-surface-raised">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-xs font-medium text-text-secondary">{def.name}</p>
                        <p className="text-xs text-text-muted">{next.progressLabel}</p>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-lime/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })()}
              <p className="text-xs text-text-muted text-center">
                {badgeReport.earnedCount} badge{badgeReport.earnedCount !== 1 ? 's' : ''} earned · {badgeReport.inProgressCount} in progress
              </p>
            </div>
          ) : badgeReport && badgeReport.inProgressCount > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-raised border border-border">
                <Flame className="w-3.5 h-3.5 text-status-orange shrink-0" />
                <p className="text-xs text-text-secondary">
                  Badges unlock as you complete requirements and attend sessions.
                </p>
              </div>
              {(() => {
                const next = getNextBadgeToEarn(badgeReport)
                if (!next) return null
                const def = BADGE_DEFINITIONS[next.badgeId]
                const pct = next.progressMax > 0 ? Math.round((next.progress / next.progressMax) * 100) : 0
                return (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-widest text-text-muted">Working Toward</p>
                    <div className="px-3 py-2.5 rounded-xl border border-border bg-surface">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-xs font-medium text-text-secondary">{def.name}</p>
                        <p className="text-xs text-text-muted">{next.progressLabel}</p>
                      </div>
                      <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                        <div className="h-full bg-lime/40 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-raised border border-border">
                <Lock className="w-4 h-4 text-text-muted shrink-0" />
                <div>
                  <p className="text-xs font-medium text-text-secondary">Badges unlock as you train</p>
                  <p className="text-xs text-text-muted mt-0.5">Attend sessions and complete requirements to earn your first badge.</p>
                </div>
              </div>
              <p className="text-xs text-text-muted text-center">
                {getVisibleBadgesForPlayer().length} badges available to earn
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Ask DONNA CTA ─────────────────────────────────────── */}
      <Link href="/player/ask-donna">
        <div className="rounded-2xl bg-status-blue/5 border border-status-blue/20 px-4 py-4 flex items-center justify-between gap-3 hover:bg-status-blue/8 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-status-blue/15 border border-status-blue/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-status-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Ask DONNA</p>
              <p className="text-xs text-text-muted">Training guide, match prep, mission help</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-status-blue/40 shrink-0" />
        </div>
      </Link>


    </div>
  )
}
