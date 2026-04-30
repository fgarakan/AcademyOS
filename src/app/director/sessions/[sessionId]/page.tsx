import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Info } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, SectionHeader } from '@/components/ui'
import { formatDate } from '@/lib/utils'

interface PageProps {
  params: { sessionId: string }
}

interface SessionExerciseRow {
  id: string
  block_id: string
  order_index: number
  duration_min: number | null
  notes: string | null
  completed: boolean
  exercises: {
    id: string
    name: string
    category: string
  } | null
}

export default async function DirectorSessionDetailPage({ params }: PageProps) {
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

  // 1. Session — verified against academy_id to prevent cross-academy reads
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, status, session_notes, coach_id, template_id, duration_min, group_id')
    .eq('id', params.sessionId)
    .eq('academy_id', academyId)
    .single()

  if (sessionError || !session) notFound()

  // 2. Coach name
  let coachName = 'Unknown Coach'
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', session.coach_id)
    .single()
  if (coachProfile) coachName = coachProfile.display_name

  // 3. Template name (if sourced from one)
  let templateName: string | null = null
  if (session.template_id) {
    const { data: template } = await supabase
      .from('templates')
      .select('name')
      .eq('id', session.template_id)
      .single()
    templateName = template?.name ?? null
  }

  // 4. Session blocks ordered by order_index
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

  const blockList = blocks ?? []
  const blockIds = blockList.map(b => b.id)

  // 5. Session block exercises ordered by order_index, joined with exercise names
  let exercises: SessionExerciseRow[] = []
  if (blockIds.length > 0) {
    const rawDb = supabase as any
    const { data: exData } = await rawDb
      .from('session_block_exercises')
      .select('id, block_id, order_index, duration_min, notes, completed, exercises(id, name, category)')
      .in('block_id', blockIds)
      .order('order_index')
    exercises = (exData ?? []) as SessionExerciseRow[]
  }

  // Group exercises by block_id
  const exercisesByBlock = new Map<string, SessionExerciseRow[]>()
  for (const ex of exercises) {
    const list = exercisesByBlock.get(ex.block_id) ?? []
    list.push(ex)
    exercisesByBlock.set(ex.block_id, list)
  }

  const totalExercises = exercises.length
  const completedExercises = exercises.filter(e => e.completed).length

  // 6. Fetch player roster and attendance (read-only for director)
  let groupName: string | null = null
  interface DirectorRosterPlayer {
    playerId: string
    fullName: string
    status: 'present' | 'absent' | 'late' | 'excused' | null
  }
  const directorRoster: DirectorRosterPlayer[] = []

  if (session.group_id) {
    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', session.group_id)
      .single()
    groupName = group?.name ?? null

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
        directorRoster.push({
          playerId: p.id,
          fullName: p.full_name ?? `${p.first_name} ${p.last_name}`,
          status: (raw === 'present' || raw === 'absent' || raw === 'late' || raw === 'excused')
            ? raw
            : null,
        })
      }
    }
  }

  const attendanceCounts = {
    present: directorRoster.filter(p => p.status === 'present').length,
    absent: directorRoster.filter(p => p.status === 'absent').length,
    late: directorRoster.filter(p => p.status === 'late').length,
    excused: directorRoster.filter(p => p.status === 'excused').length,
    unrecorded: directorRoster.filter(p => p.status === null).length,
  }

  return (
    <div className="animate-fade-in space-y-6">
      <BackLink />

      {/* Session header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-text-primary">
            {session.name ?? 'Untitled Session'}
          </h1>
          <SessionStatusPill status={session.status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-text-muted mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(session.scheduled_date)}
            {session.scheduled_time && ` · ${session.scheduled_time.slice(0, 5)}`}
          </span>
          {session.duration_min && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {session.duration_min} min
            </span>
          )}
          <span>Coach: {coachName}</span>
        </div>
      </div>

      {/* Planned-snapshot notice */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-lime/5 border border-lime/20 text-xs text-text-secondary">
        <Info className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
        <span>
          This is a planned session snapshot. Coach execution updates are saved to the session only
          and do not change the master template.
        </span>
      </div>

      {/* Session meta */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Status" value={session.status.replace('_', ' ')} />
            <Stat label="Blocks" value={String(blockList.length)} mono />
            <Stat label="Exercises" value={String(totalExercises)} mono />
            {totalExercises > 0 && (
              <Stat
                label="Completed"
                value={`${completedExercises} / ${totalExercises}`}
                mono
              />
            )}
          </div>
          {templateName && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Source Template</p>
              <p className="text-sm text-text-secondary">{templateName}</p>
            </div>
          )}
          {session.session_notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Session Notes</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{session.session_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blocks and exercises */}
      {blockList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-text-muted text-sm">No blocks in this session.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <SectionHeader title="SESSION BLOCKS" />
          {blockList.map((block, idx) => {
            const blockExercises = exercisesByBlock.get(block.id) ?? []
            return (
              <Card key={block.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-0.5">
                        Block {idx + 1} · {block.type}
                      </p>
                      <p className="font-semibold text-text-primary text-sm">{block.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono font-bold text-lime">{block.duration_min} min</p>
                      {block.intensity != null && (
                        <p className="text-[10px] text-text-muted">Intensity {block.intensity}</p>
                      )}
                    </div>
                  </div>
                  {block.notes && (
                    <p className="text-xs text-text-muted mt-1">{block.notes}</p>
                  )}
                </CardHeader>

                {blockExercises.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {blockExercises.map(ex => (
                        <div
                          key={ex.id}
                          className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                        >
                          <div className={`mt-0.5 w-3.5 h-3.5 rounded-full shrink-0 border ${
                            ex.completed
                              ? 'bg-status-green border-status-green'
                              : 'border-border bg-surface-raised'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${ex.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                              {ex.exercises?.name ?? 'Unknown Exercise'}
                            </p>
                            {ex.exercises?.category && (
                              <p className="text-[10px] text-text-muted uppercase tracking-wider">
                                {ex.exercises.category}
                              </p>
                            )}
                            {ex.notes && (
                              <p className="text-xs text-text-secondary mt-0.5">{ex.notes}</p>
                            )}
                          </div>
                          {ex.duration_min && (
                            <p className="text-xs font-mono text-text-muted shrink-0">
                              {ex.duration_min} min
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Roster and attendance (read-only) */}
      <div>
        <SectionHeader title="ROSTER & ATTENDANCE" />
        <Card className="mt-3">
          <CardContent className="py-4">
            {!session.group_id ? (
              <div className="py-2 text-center">
                <p className="text-sm text-text-muted">No group assigned to this session.</p>
                <p className="text-xs text-text-muted mt-1">Player roster assignment will be added in a future sprint.</p>
              </div>
            ) : directorRoster.length === 0 ? (
              <div className="py-2 text-center">
                <p className="text-sm text-text-muted">
                  {groupName ? `${groupName} has no current members.` : 'No current members in this group.'}
                </p>
              </div>
            ) : (
              <>
                {/* Counts summary */}
                <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-border">
                  {groupName && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Group</p>
                      <p className="text-sm text-text-primary">{groupName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Present</p>
                    <p className="text-sm font-mono font-bold text-status-green">{attendanceCounts.present}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Absent</p>
                    <p className="text-sm font-mono font-bold text-status-red">{attendanceCounts.absent}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Late</p>
                    <p className="text-sm font-mono font-bold text-status-orange">{attendanceCounts.late}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Excused</p>
                    <p className="text-sm font-mono font-bold text-status-blue">{attendanceCounts.excused}</p>
                  </div>
                  {attendanceCounts.unrecorded > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Unrecorded</p>
                      <p className="text-sm font-mono font-bold text-text-muted">{attendanceCounts.unrecorded}</p>
                    </div>
                  )}
                </div>
                {/* Player rows */}
                <div className="space-y-2">
                  {directorRoster.map(player => (
                    <div key={player.playerId} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-text-primary flex-1 min-w-0 truncate">{player.fullName}</p>
                      <AttendancePill status={player.status} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AttendancePill({ status }: { status: 'present' | 'absent' | 'late' | 'excused' | null }) {
  if (!status) {
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-raised text-text-muted border border-border">
        —
      </span>
    )
  }
  const styles: Record<string, string> = {
    present: 'bg-status-green/10 text-status-green border-status-green/30',
    absent: 'bg-status-red/10 text-status-red border-status-red/30',
    late: 'bg-status-orange/10 text-status-orange border-status-orange/30',
    excused: 'bg-status-blue/10 text-status-blue border-status-blue/30',
  }
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  )
}

function BackLink() {
  return (
    <Link
      href="/director/sessions"
      className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      All Sessions
    </Link>
  )
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono font-bold text-lime' : 'text-text-primary capitalize'}`}>
        {value}
      </p>
    </div>
  )
}

function SessionStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planned: 'bg-surface-raised text-text-muted border-border',
    in_progress: 'bg-lime/10 text-lime border-lime/30',
    completed: 'bg-status-green/10 text-status-green border-status-green/30',
    cancelled: 'bg-status-red/10 text-status-red border-status-red/30',
  }
  const label: Record<string, string> = {
    planned: 'Planned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[status] ?? styles.planned}`}>
      {label[status] ?? status}
    </span>
  )
}
