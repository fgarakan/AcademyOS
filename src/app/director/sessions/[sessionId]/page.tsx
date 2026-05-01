import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Info, GraduationCap, GitBranch } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, SectionHeader } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import {
  getActiveAcademyCurriculumVersion,
  getAcademyOverridesForContext,
  buildOverrideSummaryLines,
} from '@/lib/curriculum/academyCurriculumResolution'
import { GroupAssignmentPanel } from './GroupAssignmentPanel'
import { SessionRecapSummary } from './SessionRecapSummary'
import { StructureRecapButton } from './StructureRecapButton'
import { StructuredDraftView } from './StructuredDraftView'
import type { StructuredDraftPayload } from './structureRecapAction'
import { AttendanceExceptionDraftPanel } from './AttendanceExceptionDraftPanel'
import type { AttendanceExceptionPayload } from './attendanceExceptionDraftAction'

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

  // 3. Template name + curriculum context (if sourced from a curriculum-tagged template)
  let templateName: string | null = null
  interface CurriculumContext {
    levelName: string
    levelStage: string
    academyVersionName: string | null
    overrideSummaryLines: string[]
  }
  let curriculumContext: CurriculumContext | null = null

  if (session.template_id) {
    const rawDbSession = supabase as any
    const { data: template } = await rawDbSession
      .from('templates')
      .select('name, curriculum_level_id')
      .eq('id', session.template_id)
      .single()
    templateName = template?.name ?? null

    if (template?.curriculum_level_id) {
      const { data: levelRow } = await rawDbSession
        .from('curriculum_levels')
        .select('display_name, stage')
        .eq('id', template.curriculum_level_id)
        .single()
      if (levelRow) {
        // Resolve academy curriculum version + overrides for coach context (Sprint 76)
        const activeVersion = await getActiveAcademyCurriculumVersion(supabase, academyId)
        let academyVersionName: string | null = null
        let overrideSummaryLines: string[] = []
        if (activeVersion) {
          academyVersionName = activeVersion.name
          const overrides = await getAcademyOverridesForContext({
            supabase,
            academyId,
            curriculumVersionId: activeVersion.id,
            levelId: template.curriculum_level_id,
          })
          overrideSummaryLines = buildOverrideSummaryLines(overrides)
        }
        curriculumContext = {
          levelName: levelRow.display_name,
          levelStage: levelRow.stage,
          academyVersionName,
          overrideSummaryLines,
        }
      }
    }
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

  // 7. Fetch active groups for group assignment panel
  const { data: activeGroupsRaw } = await supabase
    .from('groups')
    .select('id, name')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('name')

  // 8. Batch-fetch membership counts for each active group
  interface GroupOption { id: string; name: string; memberCount: number }
  const activeGroups: GroupOption[] = []
  if ((activeGroupsRaw ?? []).length > 0) {
    const groupIds = (activeGroupsRaw ?? []).map(g => g.id)
    const { data: memberRows } = await supabase
      .from('group_memberships')
      .select('group_id')
      .in('group_id', groupIds)
      .eq('is_current', true)
      .eq('academy_id', academyId)

    const countMap = new Map<string, number>()
    for (const m of memberRows ?? []) {
      countMap.set(m.group_id, (countMap.get(m.group_id) ?? 0) + 1)
    }
    for (const g of activeGroupsRaw ?? []) {
      activeGroups.push({ id: g.id, name: g.name, memberCount: countMap.get(g.id) ?? 0 })
    }
  }

  // 9. Fetch session-level voice_notes (coach recaps, player_id IS NULL, most recent first)
  interface RecapEntry { id: string; raw_input: string; created_at: string }
  interface RecapEntryWithStatus extends RecapEntry { processing_status: string }
  const { data: recapRows } = await supabase
    .from('voice_notes')
    .select('id, raw_input, created_at, processing_status')
    .eq('session_id', session.id)
    .eq('academy_id', academyId)
    .is('player_id', null)
    .order('created_at', { ascending: false })
    .limit(5)
  const recapsWithStatus: RecapEntryWithStatus[] = (recapRows ?? []) as RecapEntryWithStatus[]
  const recaps: RecapEntry[] = recapsWithStatus.map(r => ({
    id: r.id,
    raw_input: r.raw_input,
    created_at: r.created_at,
  }))

  // The most recent unstructured recap — used to show the "Create Structured Draft" button
  const pendingRecap = recapsWithStatus.find(r => r.processing_status === 'pending') ?? null

  // 10. Fetch existing structured drafts from proposed_actions for this session
  interface StructuredDraftRow {
    id: string
    proposed_payload: unknown
    created_at: string
    status: string
  }
  const rawDb = supabase as any
  const { data: draftRows } = await rawDb
    .from('proposed_actions')
    .select('id, proposed_payload, created_at, status')
    .eq('academy_id', academyId)
    .eq('target_object_id', session.id)
    .eq('target_module', 'session_recap_structuring')
    .order('created_at', { ascending: false })
    .limit(5)
  const structuredDrafts: StructuredDraftRow[] = (draftRows ?? []) as StructuredDraftRow[]

  // 11. Fetch existing attendance exception drafts for this session
  interface AttendanceExceptionDraftRow {
    id: string
    proposed_payload: unknown
    created_at: string
    status: string
  }
  const { data: attendanceDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, proposed_payload, created_at, status')
    .eq('academy_id', academyId)
    .eq('target_object_id', session.id)
    .eq('target_module', 'attendance_exception')
    .order('created_at', { ascending: false })
    .limit(5)
  const attendanceDrafts: AttendanceExceptionDraftRow[] = (attendanceDraftRows ?? []) as AttendanceExceptionDraftRow[]

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

      {/* Curriculum Context — shown when the source template has a curriculum level set */}
      {curriculumContext && (
        <div>
          <SectionHeader title="CURRICULUM FOCUS" />
          <Card className="mt-3">
            <CardContent className="py-4 space-y-4">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{curriculumContext.levelName}</p>
                  <p className="text-xs text-text-muted capitalize mt-0.5">
                    {curriculumContext.levelStage.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Academy curriculum version context */}
              {curriculumContext.academyVersionName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
                  <GitBranch className="w-3.5 h-3.5 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">Academy Version</p>
                    <p className="text-xs text-text-secondary">{curriculumContext.academyVersionName}</p>
                  </div>
                </div>
              )}

              {/* Academy override summaries */}
              {curriculumContext.overrideSummaryLines.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-text-muted">
                    Academy Customizations
                  </p>
                  {curriculumContext.overrideSummaryLines.map((line, i) => (
                    <p key={i} className="text-[11px] text-text-secondary px-2 py-1 rounded bg-surface-raised border border-border">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              <div className="pt-1 border-t border-border space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
                  Curriculum Notes Per Block
                </p>
                <p className="text-xs text-text-muted">
                  Block notes below contain the curriculum drills, games, cues, and success criteria
                  for this session. Review each block note for the coaching context.
                </p>
                <p className="text-[10px] text-text-muted italic">
                  Internal coach context only — not visible to players or parents.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Group Assignment */}
      <div>
        <SectionHeader title="GROUP ASSIGNMENT" />
        <Card className="mt-3">
          <CardContent className="py-4">
            <GroupAssignmentPanel
              sessionId={session.id}
              currentGroupId={session.group_id}
              currentGroupName={groupName}
              groups={activeGroups}
            />
          </CardContent>
        </Card>
      </div>

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
                <p className="text-sm text-text-muted">No group is assigned to this session yet.</p>
                <p className="text-xs text-text-muted mt-1">Assign a group above to populate the roster and enable attendance.</p>
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
      {/* Attendance Exception Drafts */}
      <div>
        <SectionHeader title="ATTENDANCE EXCEPTIONS" />
        <Card className="mt-3">
          <CardContent className="py-4 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
                Record Attendance Exception
              </p>
              <p className="text-xs text-text-muted mb-3">
                Describe who was here, who was absent, and any unrostered visitors. Creates a draft for director review — no attendance is recorded automatically.
              </p>
              <AttendanceExceptionDraftPanel
                sessionId={session.id}
                hasGroup={!!session.group_id}
                rosterCount={directorRoster.length}
              />
            </div>

            {attendanceDrafts.length > 0 && (
              <div className="pt-3 border-t border-border space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">
                  Recent Exception Drafts
                </p>
                {attendanceDrafts.map(row => {
                  const p = row.proposed_payload as unknown as AttendanceExceptionPayload
                  if (p?.draft_type !== 'attendance_exception_v1') return null
                  const absentCount = p.rostered_attendance?.filter(r => r.proposed_status === 'absent').length ?? 0
                  const presentCount = p.rostered_attendance?.filter(r => r.proposed_status === 'present').length ?? 0
                  const unrosteredCount = p.unrostered_attendees?.length ?? 0
                  const statusColors: Record<string, string> = {
                    pending_review: 'bg-status-orange/10 text-status-orange border-status-orange/30',
                    approved: 'bg-lime/10 text-lime border-lime/30',
                    rejected: 'bg-status-red/10 text-status-red border-status-red/30',
                    executed: 'bg-status-green/10 text-status-green border-status-green/30',
                  }
                  const pill = statusColors[row.status] ?? 'bg-surface-raised text-text-muted border-border'
                  return (
                    <div key={row.id} className="p-3 rounded-lg bg-surface-raised border border-border space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs text-text-muted">
                          {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${pill}`}>
                          {row.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary italic line-clamp-2">"{p.raw_input}"</p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-text-muted">
                        <span>{presentCount} present</span>
                        <span>{absentCount} absent</span>
                        {unrosteredCount > 0 && (
                          <span className="text-status-orange">{unrosteredCount} unrostered</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coach Recap */}
      <div>
        <SectionHeader title="COACH RECAP" />
        <Card className="mt-3">
          <CardContent className="py-4 space-y-4">
            <SessionRecapSummary recaps={recaps} />

            {/* Structure recap button — shown only when a pending recap exists */}
            {pendingRecap && (
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
                  AI Structuring
                </p>
                <StructureRecapButton
                  voiceNoteId={pendingRecap.id}
                  sessionId={session.id}
                />
              </div>
            )}

            {/* Existing structured drafts */}
            {structuredDrafts.map(row => {
              const payload = row.proposed_payload as unknown as StructuredDraftPayload
              if (!payload || payload.draft_type !== 'session_recap_structuring_v1') return null
              return (
                <StructuredDraftView
                  key={row.id}
                  draft={payload}
                  createdAt={row.created_at}
                />
              )
            })}
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
