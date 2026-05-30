import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Info, AlertTriangle, Sparkles, Users } from 'lucide-react'
import { CoachPlayerWatchList, type WatchListPlayer } from '@/components/coach/CoachPlayerWatchList'
import { DonnaOpenChip } from '@/components/assistant/DonnaOpenChip'
import { getSupabaseServer } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { CoachSessionExecutionClient } from './CoachSessionExecutionClient'
import { CoachRecapCommandPanel } from './CoachRecapCommandPanel'
import { CoachSessionGapBriefPanel } from './CoachSessionGapBriefPanel'
import { CoachSessionActions } from './CoachSessionActions'
import { CoachSessionCurriculumPanel } from './CoachSessionCurriculumPanel'
import { NextBestActionCard } from '@/components/onboarding/NextBestActionCard'
import { saveSessionExecutionAction, saveAttendanceAction, saveSessionRecapAction } from './actions'
import { structureCoachRecapAction } from './structureCoachRecapAction'
import { CoachWrapUpStatusCard } from './CoachWrapUpStatusCard'
import { CoachWrapUpDetailPanel } from './CoachWrapUpDetailPanel'

interface PageProps {
  params: { sessionId: string }
}

export interface SessionBlock {
  id: string
  name: string
  type: string
  duration_min: number
  order_index: number
  intensity: number | null
  notes: string | null
  template_block_id: string | null
}

export interface SessionExercise {
  id: string
  block_id: string
  order_index: number
  duration_min: number | null
  notes: string | null
  completed: boolean
  exerciseName: string
  exerciseCategory: string
}

export interface RosterPlayer {
  playerId: string
  fullName: string
  currentStatus: 'present' | 'absent' | 'late' | 'excused' | null
  curriculumLevelName: string | null
  curriculumStage: string | null
}

export default async function CoachSessionDetailPage({ params }: PageProps) {
  const supabase = await getSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  let academyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('academy_id')
      .eq('id', user.id)
      .single()
    academyId = profile?.academy_id ?? null
  }

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // 1. Fetch session — verified against academy_id
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, status, session_notes, coach_id, template_id, duration_min, group_id')
    .eq('id', params.sessionId)
    .eq('academy_id', academyId)
    .single()

  if (sessionError || !session) notFound()

  // 2. Template name + curriculum context (curriculum_level_key and template_goal are migration 067 fields)
  let templateName: string | null = null
  let templateCurriculumLevel: string | null = null
  let templateGoal: string | null = null
  if (session.template_id) {
    const rawTplDb = supabase as any
    const { data: template } = await rawTplDb
      .from('templates')
      .select('name, curriculum_level_key, template_goal')
      .eq('id', session.template_id)
      .single()
    templateName = template?.name ?? null
    templateCurriculumLevel = (template?.curriculum_level_key as string | null | undefined) ?? null
    templateGoal = (template?.template_goal as string | null | undefined) ?? null
  }

  // 3. Session blocks ordered
  const { data: blocks, error: blocksError } = await supabase
    .from('session_blocks')
    .select('id, name, type, duration_min, order_index, intensity, notes, template_block_id')
    .eq('session_id', session.id)
    .order('order_index')

  if (blocksError) {
    return (
      <div className="space-y-6">
        <BackLink />
        <p className="text-status-red text-sm">Failed to load session blocks: {blocksError.message}</p>
      </div>
    )
  }

  const blockList: SessionBlock[] = blocks ?? []
  const blockIds = blockList.map(b => b.id)

  // 4. Session block exercises with exercise names
  let exercises: SessionExercise[] = []
  if (blockIds.length > 0) {
    const rawDb = supabase as any
    const { data: exData } = await rawDb
      .from('session_block_exercises')
      .select('id, block_id, order_index, duration_min, notes, completed, exercises(id, name, category)')
      .in('block_id', blockIds)
      .order('order_index')

    exercises = ((exData ?? []) as Array<{
      id: string
      block_id: string
      order_index: number
      duration_min: number | null
      notes: string | null
      completed: boolean
      exercises: { id: string; name: string; category: string } | null
    }>).map(row => ({
      id: row.id,
      block_id: row.block_id,
      order_index: row.order_index,
      duration_min: row.duration_min,
      notes: row.notes,
      completed: row.completed,
      exerciseName: row.exercises?.name ?? 'Unknown Exercise',
      exerciseCategory: row.exercises?.category ?? '',
    }))
  }

  // 5. Fetch player roster and attendance
  //    Roster source: current group members if session has group_id, otherwise empty.
  const roster: RosterPlayer[] = []
  if (session.group_id) {
    const { data: memberships } = await supabase
      .from('group_memberships')
      .select('player_id')
      .eq('group_id', session.group_id)
      .eq('is_current', true)
      .eq('academy_id', academyId)

    const playerIds = (memberships ?? []).map(m => m.player_id)

    if (playerIds.length > 0) {
      const { data: players } = await supabase
        .from('players')
        .select('id, full_name, first_name, last_name')
        .in('id', playerIds)
        .eq('academy_id', academyId)

      const { data: attendanceRows } = await supabase
        .from('session_attendance')
        .select('player_id, status')
        .eq('session_id', session.id)

      const attendanceMap = new Map<string, string>()
      for (const a of attendanceRows ?? []) {
        attendanceMap.set(a.player_id, a.status)
      }

      // Curriculum levels for roster players
      const curricMap: Record<string, { levelName: string; stage: string }> = {}
      if (playerIds.length > 0) {
        const rawDb2 = supabase as any
        const { data: stateRows } = await rawDb2
          .from('player_curriculum_states')
          .select('player_id, curriculum_levels(display_name, stage)')
          .eq('academy_id', academyId)
          .in('player_id', playerIds)
        for (const row of (stateRows ?? [])) {
          if (row.curriculum_levels) {
            curricMap[row.player_id] = {
              levelName: row.curriculum_levels.display_name,
              stage: row.curriculum_levels.stage,
            }
          }
        }
      }

      for (const p of players ?? []) {
        const raw = attendanceMap.get(p.id) ?? null
        const curric = curricMap[p.id] ?? null
        roster.push({
          playerId: p.id,
          fullName: p.full_name ?? `${p.first_name} ${p.last_name}`,
          currentStatus: (raw === 'present' || raw === 'absent' || raw === 'late' || raw === 'excused')
            ? raw
            : null,
          curriculumLevelName: curric?.levelName ?? null,
          curriculumStage: curric?.stage ?? null,
        })
      }
    }
  }

  // 6. Fetch most recent session-level recap (voice_notes with player_id IS NULL)
  let initialRecap = ''
  const { data: recentRecap } = await supabase
    .from('voice_notes')
    .select('raw_input')
    .eq('session_id', params.sessionId)
    .eq('academy_id', academyId)
    .is('player_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  initialRecap = recentRecap?.raw_input ?? ''

  // 7. Check for existing wrap-up draft for this session submitted by this coach
  const rawWrapUpDb = supabase as any
  const { data: wrapUpDraftRow } = await rawWrapUpDb
    .from('proposed_actions')
    .select('status, reviewer_notes')
    .eq('academy_id', academyId)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('target_object_id', session.id)
    .eq('proposed_by_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const existingWrapUpStatus: string | null = (wrapUpDraftRow?.status as string) ?? null
  const existingWrapUpNote: string | null = (wrapUpDraftRow?.reviewer_notes as string) ?? null

  // Compute context for recap panel
  const totalExercises = exercises.length
  const completedCount = exercises.filter(e => e.completed).length
  const presentCount = roster.filter(p => p.currentStatus === 'present').length
  const attendanceSummary = roster.length > 0 ? `${presentCount}/${roster.length} present` : null
  const unmarkedAttendanceCount = roster.filter(p => p.currentStatus === null).length

  // Build roster name map for gap brief panel
  const rosterNames: Record<string, string> = {}
  for (const p of roster) {
    rosterNames[p.playerId] = p.fullName
  }

  // Build player watch list from roster data
  const watchListPlayers: WatchListPlayer[] = roster.map(p => ({
    playerId: p.playerId,
    fullName: p.fullName,
    currentPriority: null,
    pathwayTag: null,
    coachWatchFor: null,
    lastSafeNote: null,
    attentionFlag: null,
    curriculumLevel: p.curriculumLevelName,
  }))

  return (
    <div className="space-y-6 pb-10">
      <BackLink />

      {/* Session header — Sprint 977: data-donna-focus-id for DONNA session execution highlight */}
      <div data-donna-focus-id="coach-session-header">
        <p className="page-eyebrow">Session</p>
        <h1 className="page-title text-xl">
          {session.name ?? 'Untitled Session'}
        </h1>
        <p className="page-subtitle">
          {formatDate(session.scheduled_date)}
          {session.scheduled_time && ` · ${session.scheduled_time.slice(0, 5)}`}
          {session.duration_min && ` · ${session.duration_min} min`}
        </p>
        {(templateName || templateCurriculumLevel || templateGoal) && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {templateName && (
              <span className="inline-flex items-center gap-1 text-[10px] text-text-muted bg-surface-raised border border-border rounded-full px-2 py-0.5">
                Template: {templateName}
              </span>
            )}
            {templateCurriculumLevel && (
              <span className="inline-flex items-center gap-1 text-[10px] text-lime bg-lime/5 border border-lime/20 rounded-full px-2 py-0.5">
                {templateCurriculumLevel}
              </span>
            )}
          </div>
        )}
        {templateGoal && (
          <p className="text-xs text-text-secondary mt-1.5 leading-snug">
            <span className="text-text-muted">Goal: </span>{templateGoal}
          </p>
        )}

        {/* Block progress rail + execute link */}
        {blockList.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {blockList.map((block, i) => (
                <span
                  key={block.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-raised border border-border text-[10px] text-text-secondary"
                >
                  <span className="font-mono text-[9px] text-lime">{i + 1}</span>
                  {block.name}
                  {block.duration_min != null && (
                    <span className="text-[9px] text-text-muted">{block.duration_min}m</span>
                  )}
                </span>
              ))}
            </div>
            <Link
              href={`/coach/sessions/${params.sessionId}/execute`}
              className="inline-flex items-center gap-1.5 text-xs text-lime font-medium hover:opacity-80 transition-opacity"
            >
              Open focused execute view →
            </Link>
          </div>
        )}
      </div>

      {/* ── Player Watch List ──────────────────────────────────── */}
      {watchListPlayers.length > 0 && (
        <section data-donna-focus-id="coach-player-watch-list">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <p className="label-xs">Players in This Session</p>
          </div>
          <CoachPlayerWatchList players={watchListPlayers} sessionId={params.sessionId} />
        </section>
      )}

      {/* ── Today's Plan ── what to coach today */}
      {session.template_id && (
        <section data-donna-focus-id="coach-lesson-plan">
          <p className="label-xs mb-3">Today's Plan</p>
          <CoachSessionCurriculumPanel templateId={session.template_id} />
        </section>
      )}

      {/* Snapshot notice */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          Execution updates are saved to this session only — the master template is not changed.
        </span>
      </div>

      {/* ── Run the Session ── blocks, exercises, attendance */}
      <section data-donna-focus-id="coach-run-session">
        <p className="label-xs mb-3">Run the Session</p>
        {blockList.length === 0 ? (
          <NextBestActionCard
            variant="info"
            title="No blocks in this session"
            body="Blocks are added through the class template. Ask your director to add blocks to the template this session was created from."
            actionLabel="Back to Sessions"
            actionHref="/coach/sessions"
          />
        ) : (
          <CoachSessionExecutionClient
            sessionId={session.id}
            initialStatus={session.status as 'planned' | 'in_progress' | 'completed' | 'cancelled'}
            initialSessionNotes={session.session_notes ?? ''}
            blocks={blockList}
            exercises={exercises}
            roster={roster}
            saveAction={saveSessionExecutionAction}
            saveAttendanceAction={saveAttendanceAction}
          />
        )}
      </section>

      {/* Attendance completion prompt */}
      {roster.length > 0 && unmarkedAttendanceCount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-status-orange/5 border border-status-orange/30">
          <AlertTriangle className="w-4 h-4 text-status-orange shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-status-orange font-medium">
              {unmarkedAttendanceCount} player{unmarkedAttendanceCount !== 1 ? 's' : ''} not yet marked
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Mark attendance in the execution panel above before wrapping up.
            </p>
          </div>
        </div>
      )}

      {/* ── After Session ── primary: Wrap-Up Session ── */}
      <section data-donna-focus-id="coach-wrap-up-link">
        <p className="label-xs mb-1">After Session</p>
        <p className="text-[11px] text-text-muted mb-2">
          Use <span className="text-text-secondary font-medium">Wrap-Up Session</span> for your structured end-of-session recap.
          Player observations go directly to the director review queue.
        </p>
        {!existingWrapUpStatus && (
          <Link
            href={`/coach/sessions/${params.sessionId}/wrap-up`}
            className="flex items-center justify-between gap-2 mb-3 px-4 py-3 rounded-xl border border-lime/30 bg-lime/5 hover:bg-lime/10 transition-all group"
          >
            <p className="text-sm font-semibold text-lime">Start Wrap-Up →</p>
            <p className="text-[10px] text-text-muted">6 quick questions</p>
          </Link>
        )}
        {/* DONNA entry when no wrap-up submitted yet */}
        {!existingWrapUpStatus && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-lime/20 bg-lime/5 mb-3"
          >
            <Sparkles className="w-4 h-4 text-lime shrink-0" />
            <p className="text-xs text-text-secondary flex-1 leading-snug">
              {session.status === 'completed'
                ? 'Session complete. DONNA can help you capture notes and submit your wrap-up.'
                : 'DONNA can help you capture player observations and wrap up when you\'re done.'}
            </p>
            <DonnaOpenChip
              prompt={
                session.status === 'completed'
                  ? `Help me write my wrap-up for ${session.name ?? 'this session'}.`
                  : `I'm running ${session.name ?? 'a session'}. Help me capture observations as I coach.`
              }
            />
          </div>
        )}
        <div className="space-y-3">
          <CoachWrapUpDetailPanel
            sessionId={session.id}
            academyId={academyId}
            sessionName={session.name ?? 'Session'}
            scheduledDate={session.scheduled_date}
            scheduledTime={session.scheduled_time ?? null}
            existingWrapUpStatus={existingWrapUpStatus}
          />
          <CoachWrapUpStatusCard status={existingWrapUpStatus} reviewerNote={existingWrapUpNote} />
          <CoachSessionActions
            sessionId={session.id}
            academyId={academyId}
            sessionName={session.name ?? 'Untitled Session'}
            blocks={blockList}
            roster={roster}
            wrapUpStatus={existingWrapUpStatus}
          />
        </div>
      </section>

      {/* Secondary: quick internal note — informal, not a session recap */}
      <section>
        <p className="label-xs mb-3 text-text-muted">Or, add a quick internal note</p>
        <CoachRecapCommandPanel
          sessionId={session.id}
          sessionName={session.name ?? 'Untitled Session'}
          completedCount={completedCount}
          totalCount={totalExercises}
          attendanceSummary={attendanceSummary}
          initialRecap={initialRecap}
          saveRecapAction={saveSessionRecapAction}
          structureRecapAction={structureCoachRecapAction}
        />
      </section>

      {roster.length > 0 && (
        <CoachSessionGapBriefPanel
          playerIds={roster.map(p => p.playerId)}
          academyId={academyId}
          rosterNames={rosterNames}
        />
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/coach/sessions"
      className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      All Sessions
    </Link>
  )
}
