import { TrendingUp, Trophy, MessageCircle, BookOpen, ArrowRight, HelpCircle, Sparkles, Calendar, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import { PlayerMissionPreview } from '@/components/player/PlayerMissionPreview'
import { getSupabaseServer } from '@/lib/supabase/server'
import { buildIndividualDevelopmentPlan, buildRoleSpecificIdpView } from '@/lib/player/individualDevelopmentPlan'
import type { IdpPlayerView } from '@/lib/player/individualDevelopmentPlan'
import { parsePlayerProgressQuestion, buildPlayerProgressAnswer } from '@/lib/player/playerProgressQa'
import { buildModuleForLevelDomain } from '@/lib/curriculum/learningModules'
import type { LearningModuleDomain } from '@/lib/curriculum/learningModules'


export default async function PlayerHome() {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  // Resolve player via profile_id — never trust URL params for player identity
  let idpView: IdpPlayerView | null = null
  let playerFirstName: string | null = null
  let noMappingReason: string | null = null
  interface SessionHistoryItem {
    sessionName: string | null
    date: string
    status: string
  }
  let recentSessionHistory: SessionHistoryItem[] = []

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
          .select('curriculum_level_id')
          .eq('player_id', playerRow.id)
          .eq('academy_id', academyId)
          .limit(1)
        const currentLevelId: string | null = csRows?.[0]?.curriculum_level_id ?? null

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

          // Next level
          if (lvl?.sort_order != null) {
            const { data: nextLvl } = await rawDb
              .from('curriculum_levels')
              .select('display_name')
              .gt('sort_order', lvl.sort_order)
              .order('sort_order', { ascending: true })
              .limit(1)
            nextLevelName = nextLvl?.[0]?.display_name ?? null
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

      {/* ── Today's Mission ───────────────────────────────────── */}
      <PlayerMissionPreview
        strength={idpView?.what_to_understand?.[0] ?? null}
        mission={idpView?.recommended_next_mission ?? null}
        nextWin={idpView?.requirements_to_move_up?.[0] ?? null}
        currentLevel={idpView?.current_level ?? null}
      />

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
                    <p className="text-[10px] uppercase tracking-widest text-lime mb-1">Mini Challenge</p>
                    <p className="text-sm text-text-primary leading-relaxed">{idpView.mini_challenge}</p>
                  </div>
                )}
                {idpView.reflection_question && (
                  <div className="px-3 py-3 rounded-xl bg-surface-raised border border-border">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Reflect After Practice</p>
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
                <p className="text-[10px] text-text-muted mt-3">
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
                  <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Recent Sessions</p>
                    <p className="text-text-muted text-xs">Your last {recentSessionHistory.length} sessions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
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
              title="Your skill path will appear here"
              description="As you progress through the academy, your skills will be tracked here."
              className="py-8"
            />
          </CardContent>
        </Card>
      )}

      {/* ── Wins & Streaks ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Wins &amp; Streaks</p>
              <p className="text-text-muted text-xs">Your achievements</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Trophy className="w-5 h-5" />}
            title="Your wins will show up here"
            description="Keep showing up — your achievements are being tracked."
            className="py-8"
          />
        </CardContent>
      </Card>

      {/* ── Messages ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Messages</p>
              <p className="text-text-muted text-xs">From your coach and academy</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<MessageCircle className="w-5 h-5" />}
            title="No messages yet"
            description="Your coach will reach out here."
            className="py-8"
          />
        </CardContent>
      </Card>


    </div>
  )
}
