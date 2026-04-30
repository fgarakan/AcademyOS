import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Info } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, SectionHeader } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { CoachSessionExecutionClient } from './CoachSessionExecutionClient'
import { saveSessionExecutionAction, saveAttendanceAction } from './actions'

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

  // 2. Template name for context
  let templateName: string | null = null
  if (session.template_id) {
    const { data: template } = await supabase
      .from('templates')
      .select('name')
      .eq('id', session.template_id)
      .single()
    templateName = template?.name ?? null
  }

  // 3. Session blocks ordered
  const { data: blocks, error: blocksError } = await supabase
    .from('session_blocks')
    .select('id, name, type, duration_min, order_index, intensity, notes')
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

      for (const p of players ?? []) {
        const raw = attendanceMap.get(p.id) ?? null
        roster.push({
          playerId: p.id,
          fullName: p.full_name ?? `${p.first_name} ${p.last_name}`,
          currentStatus: (raw === 'present' || raw === 'absent' || raw === 'late' || raw === 'excused')
            ? raw
            : null,
        })
      }
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <BackLink />

      {/* Session header */}
      <div>
        <p className="label-xs mb-1">SESSION</p>
        <h1 className="text-xl font-bold text-text-primary">
          {session.name ?? 'Untitled Session'}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {formatDate(session.scheduled_date)}
          {session.scheduled_time && ` · ${session.scheduled_time.slice(0, 5)}`}
          {session.duration_min && ` · ${session.duration_min} min`}
        </p>
        {templateName && (
          <p className="text-xs text-text-muted mt-0.5">From template: {templateName}</p>
        )}
      </div>

      {/* Snapshot notice */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          This is a planned session snapshot. Coach execution updates are saved to the session only
          and do not change the master template.
        </span>
      </div>

      {blockList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-text-muted text-sm">No blocks in this session.</p>
          </CardContent>
        </Card>
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
