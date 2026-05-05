import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, GraduationCap, GitBranch, Users, AlertTriangle } from 'lucide-react'
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
import { ClassRosterIntelligencePanel } from './ClassRosterIntelligencePanel'
import type { PlayerIntelligenceItem } from './ClassRosterIntelligencePanel'
import { SessionAdjustmentSuggestionsPanel } from './SessionAdjustmentSuggestionsPanel'
import type { SuggestionRow } from './SessionAdjustmentSuggestionsPanel'
import { VoiceCoachRecapInput } from './VoiceCoachRecapInput'
import { SessionCurriculumContextPanel, SessionNoCurriculumContextPanel } from '@/components/curriculum/SessionCurriculumContextPanel'

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

  // 3b. Extended curriculum data for session context panel (Sprint 198).
  // Fetches top gates, top drills, top coach language for the session's curriculum level.
  interface SessionCurriculumExtra {
    levelId: string
    topGates: { id: string; domain: string; criterion: string; threshold: string }[]
    topDomains: string[]
    topDrills: { id: string; name: string; domain: string; session_block: string; objective: string; duration_minutes: number | null }[]
    topLanguage: { id: string; domain: string; current_focus: string }[]
  }
  let sessionCurriculumExtra: SessionCurriculumExtra | null = null

  if (curriculumContext && session.template_id) {
    const rawDbEx = supabase as any
    // Get template.curriculum_level_id again (already known from the curriculumContext block)
    const { data: tpl } = await rawDbEx
      .from('templates')
      .select('curriculum_level_id')
      .eq('id', session.template_id)
      .single()

    const lvlId: string | null = tpl?.curriculum_level_id ?? null

    if (lvlId) {
      const { data: gatesData } = await rawDbEx
        .from('curriculum_gates')
        .select('id, domain, criterion, threshold')
        .eq('from_level_id', lvlId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(4)

      const { data: drillsData } = await rawDbEx
        .from('curriculum_drills')
        .select('id, name, domain, session_block, objective, duration_minutes')
        .eq('level_min_id', lvlId)
        .eq('is_active', true)
        .is('academy_id', null)
        .limit(3)

      const { data: languageData } = await rawDbEx
        .from('curriculum_coach_language')
        .select('id, domain, current_focus')
        .eq('level_id', lvlId)
        .limit(3)

      const gates = gatesData ?? []
      const topDomains: string[] = Array.from(new Set(gates.map((g: { domain: string }) => g.domain)))

      sessionCurriculumExtra = {
        levelId: lvlId,
        topGates: gates,
        topDomains,
        topDrills: drillsData ?? [],
        topLanguage: languageData ?? [],
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

  // 6b. Player intelligence — curriculum states, development summaries, priorities
  const rosterPlayerIds = directorRoster.map(p => p.playerId)
  const playerIntelligence: PlayerIntelligenceItem[] = directorRoster.map(p => ({
    playerId: p.playerId,
    fullName: p.fullName,
    attendanceStatus: p.status,
    curriculumLevelName: null,
    curriculumStage: null,
    curriculumSource: null,
    strengths: [],
    thingsToWorkOn: [],
    developmentFocus: null,
    topPriority: null,
  }))

  if (rosterPlayerIds.length > 0) {
    const rawDb = supabase as any

    const { data: csRows } = await rawDb
      .from('player_curriculum_states')
      .select('player_id, current_level_id, curriculum_version_id')
      .eq('academy_id', academyId)
      .in('player_id', rosterPlayerIds)

    const curriculumStateMap = new Map<string, { level_id: string | null; has_version: boolean }>()
    for (const row of (csRows ?? [])) {
      curriculumStateMap.set(row.player_id, {
        level_id: row.current_level_id ?? null,
        has_version: !!row.curriculum_version_id,
      })
    }

    const levelIds = Array.from(new Set(
      Array.from(curriculumStateMap.values())
        .map(v => v.level_id)
        .filter((id): id is string => !!id)
    ))

    const levelNameMap = new Map<string, { display_name: string; stage: string }>()
    if (levelIds.length > 0) {
      const { data: levelRows } = await rawDb
        .from('curriculum_levels')
        .select('id, display_name, stage')
        .in('id', levelIds)
      for (const row of (levelRows ?? [])) {
        levelNameMap.set(row.id, { display_name: row.display_name, stage: row.stage })
      }
    }

    const { data: devRows } = await rawDb
      .from('player_development_summary')
      .select('player_id, current_strengths, things_to_work_on, development_focus')
      .in('player_id', rosterPlayerIds)

    const devMap = new Map<string, { strengths: string[]; toWorkOn: string[]; focus: string | null }>()
    for (const row of (devRows ?? [])) {
      devMap.set(row.player_id, {
        strengths: (row.current_strengths as string[] | null) ?? [],
        toWorkOn: (row.things_to_work_on as string[] | null) ?? [],
        focus: row.development_focus ?? null,
      })
    }

    const { data: priorityRows } = await rawDb
      .from('player_priorities')
      .select('player_id, title, priority_rank')
      .in('player_id', rosterPlayerIds)
      .eq('academy_id', academyId)
      .eq('is_active', true)
      .order('priority_rank', { ascending: true })

    const topPriorityMap = new Map<string, string>()
    for (const row of (priorityRows ?? [])) {
      if (!topPriorityMap.has(row.player_id)) {
        topPriorityMap.set(row.player_id, row.title)
      }
    }

    for (const item of playerIntelligence) {
      const state = curriculumStateMap.get(item.playerId)
      if (state?.level_id) {
        const level = levelNameMap.get(state.level_id)
        item.curriculumLevelName = level?.display_name ?? null
        item.curriculumStage = level?.stage ?? null
        item.curriculumSource = state.has_version ? 'Academy version' : 'Global'
      }
      const dev = devMap.get(item.playerId)
      if (dev) {
        item.strengths = dev.strengths
        item.thingsToWorkOn = dev.toWorkOn
        item.developmentFocus = dev.focus
      }
      item.topPriority = topPriorityMap.get(item.playerId) ?? null
    }
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

  // 9. Fetch session-level voice_notes
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

  const pendingRecap = recapsWithStatus.find(r => r.processing_status === 'pending') ?? null

  // 10. Fetch existing structured drafts
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

  // 11. Fetch existing attendance exception drafts
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

  // 12. Fetch existing session adjustment suggestions
  const { data: suggestionRows } = await rawDb
    .from('session_adjustment_suggestions')
    .select('id, suggestion_type, suggested_change, reason, players_supported, player_needs_considered, risk_level, confidence, status, target_session_block_id, curriculum_context')
    .eq('session_id', session.id)
    .eq('academy_id', academyId)
    .not('status', 'in', '("rejected","dismissed")')
    .order('created_at', { ascending: true })

  const blockIdToName = new Map<string, string>()
  const blockIdToNotes = new Map<string, string | null>()
  for (const b of blockList) {
    blockIdToName.set(b.id, b.name)
    blockIdToNotes.set(b.id, b.notes ?? null)
  }

  const existingSuggestions: SuggestionRow[] = (suggestionRows ?? []).map((r: any) => ({
    id: r.id,
    suggestion_type: r.suggestion_type,
    suggested_change: r.suggested_change,
    reason: r.reason,
    players_supported: (r.players_supported as string[]) ?? [],
    player_needs_considered: (r.player_needs_considered as string[]) ?? [],
    risk_level: r.risk_level,
    confidence: r.confidence,
    status: r.status,
    target_session_block_id: r.target_session_block_id ?? null,
    target_block_name: r.target_session_block_id ? (blockIdToName.get(r.target_session_block_id) ?? null) : null,
    target_block_current_notes: r.target_session_block_id ? (blockIdToNotes.get(r.target_session_block_id) ?? null) : (session.session_notes ?? null),
    curriculum_context: (r.curriculum_context as Record<string, string>) ?? {},
  }))

  // Derived intelligence for coach briefing
  const playersWithNeeds = playerIntelligence.filter(p => p.thingsToWorkOn.length > 0)
  const playersWithPriority = playerIntelligence.filter(p => p.topPriority)
  const playersWithoutAssignment = playerIntelligence.filter(p => !p.curriculumLevelName)
  const playersUnrecorded = playerIntelligence.filter(p => p.attendanceStatus === null)
  const playersWithoutPriority = playerIntelligence.filter(p => !p.topPriority)

  const suggestionPendingCount = existingSuggestions.filter(s => s.status === 'pending_review').length
  const suggestionApprovedCount = existingSuggestions.filter(s => s.status === 'approved').length
  const suggestionAppliedCount = existingSuggestions.filter(s => s.status === 'applied').length
  const topSuggestions = existingSuggestions.filter(s => s.status === 'pending_review').slice(0, 3)

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <BackLink />

      {/* Session header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="page-eyebrow">Session</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="page-title">{session.name ?? 'Untitled Session'}</h1>
            <SessionStatusPill status={session.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-text-muted mt-1.5">
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
      </div>

      {/* Curriculum Focus — near top for coaching context */}
      {curriculumContext && (
        <div>
          <p className="label-xs mb-3">Curriculum Focus</p>
          <Card>
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

              {curriculumContext.academyVersionName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border">
                  <GitBranch className="w-3.5 h-3.5 text-lime shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">Academy Version</p>
                    <p className="text-xs text-text-secondary">{curriculumContext.academyVersionName}</p>
                  </div>
                </div>
              )}

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

              <p className="text-[10px] text-text-muted italic pt-1 border-t border-border">
                Internal coach context only — not visible to players or parents.
              </p>
            </CardContent>
          </Card>

          {/* Extended curriculum context — gates, drills, coach language (Sprint 198) */}
          {sessionCurriculumExtra && (
            <SessionCurriculumContextPanel
              levelId={sessionCurriculumExtra.levelId}
              levelName={curriculumContext.levelName}
              levelStage={curriculumContext.levelStage}
              topGates={sessionCurriculumExtra.topGates}
              topDomains={sessionCurriculumExtra.topDomains}
              topDrills={sessionCurriculumExtra.topDrills}
              topLanguage={sessionCurriculumExtra.topLanguage}
            />
          )}
        </div>
      )}

      {/* No curriculum context — graceful empty state (Sprint 198) */}
      {!curriculumContext && (
        <div>
          <p className="label-xs mb-3">Curriculum Context</p>
          <SessionNoCurriculumContextPanel />
        </div>
      )}

      {/* Coach Briefing — deterministic synthesis, no AI */}
      {(curriculumContext || playerIntelligence.length > 0) && (
        <div>
          <p className="label-xs mb-3">Coach Briefing</p>
          <div className="px-4 py-4 rounded-xl bg-surface-raised border border-border space-y-4">
            {/* Class */}
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <p className="text-sm text-text-primary">
                {playerIntelligence.length > 0
                  ? `${playerIntelligence.length} player${playerIntelligence.length > 1 ? 's' : ''} in class${groupName ? ` · ${groupName}` : ''}`
                  : groupName ?? 'No roster set'}
              </p>
            </div>

            {/* Watch for today */}
            <div className="space-y-1.5">
              <p className="text-[9px] uppercase tracking-widest text-text-muted">Watch for today</p>
              {curriculumContext?.overrideSummaryLines.map((line, i) => (
                <p key={i} className="text-[11px] text-text-secondary flex items-start gap-2">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-lime" />
                  Academy emphasis: {line}
                </p>
              ))}
              {playersWithNeeds.length > 0 && (
                <p className="text-[11px] text-text-secondary flex items-start gap-2">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-status-orange" />
                  {playersWithNeeds.length} player{playersWithNeeds.length > 1 ? 's' : ''} with active focus areas
                </p>
              )}
              {playersWithPriority.length > 0 && (
                <p className="text-[11px] text-text-secondary flex items-start gap-2">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-status-blue" />
                  {playersWithPriority.length} player{playersWithPriority.length > 1 ? 's' : ''} with active priorities
                </p>
              )}
              {playersWithoutAssignment.length > 0 && (
                <p className="text-[11px] text-text-secondary flex items-start gap-2">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-status-orange" />
                  {playersWithoutAssignment.length} player{playersWithoutAssignment.length > 1 ? 's' : ''} without curriculum assignment
                </p>
              )}
              {playersWithNeeds.length === 0 && playersWithPriority.length === 0 && playersWithoutAssignment.length === 0 && (
                <p className="text-[11px] text-text-muted">
                  {curriculumContext ? 'Standard curriculum focus — no specific watch items.' : 'No specific watch items.'}
                </p>
              )}
            </div>

            {/* Suggested adjustments summary */}
            {(suggestionPendingCount > 0 || suggestionApprovedCount > 0 || suggestionAppliedCount > 0) && (
              <div className="space-y-1.5 pt-3 border-t border-border">
                <p className="text-[9px] uppercase tracking-widest text-text-muted">Adaptive Suggestions</p>
                {suggestionPendingCount > 0 && (
                  <p className="text-[11px] text-text-secondary flex items-start gap-2">
                    <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-status-blue" />
                    {suggestionPendingCount} suggestion{suggestionPendingCount > 1 ? 's' : ''} pending review
                  </p>
                )}
                {suggestionApprovedCount > 0 && (
                  <p className="text-[11px] text-text-secondary flex items-start gap-2">
                    <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-status-green" />
                    {suggestionApprovedCount} approved — ready to apply
                  </p>
                )}
                {suggestionAppliedCount > 0 && (
                  <p className="text-[11px] text-text-secondary flex items-start gap-2">
                    <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-lime" />
                    {suggestionAppliedCount} applied to this session
                  </p>
                )}
                {topSuggestions.map((s, i) => (
                  <p key={i} className="text-[11px] text-text-muted pl-3.5 line-clamp-1">
                    · {s.suggested_change.slice(0, 80)}{s.suggested_change.length > 80 ? '…' : ''}
                  </p>
                ))}
              </div>
            )}

            {/* Capture after class */}
            <div className="space-y-1.5 pt-3 border-t border-border">
              <p className="text-[9px] uppercase tracking-widest text-text-muted">Capture after class</p>
              <p className="text-[11px] text-text-secondary flex items-start gap-2">
                <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-text-muted" />
                Record a session recap in the Coach Recap section below
              </p>
              {playersUnrecorded.length > 0 && (
                <p className="text-[11px] text-text-secondary flex items-start gap-2">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-status-orange" />
                  Note attendance for {playersUnrecorded.length} unrecorded player{playersUnrecorded.length > 1 ? 's' : ''}
                </p>
              )}
              {playersWithoutPriority.length > 0 && playerIntelligence.length > 0 && (
                <p className="text-[11px] text-text-secondary flex items-start gap-2">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-text-muted" />
                  Consider capturing priorities for {playersWithoutPriority.length} player{playersWithoutPriority.length > 1 ? 's' : ''} from their profiles
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Snapshot notice — compact */}
      <p className="text-[11px] text-text-muted">
        Planned session snapshot — changes here do not affect the master template.
      </p>

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
          {templateName && session.template_id && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Source Template</p>
              <Link
                href={`/director/fitness/templates/${session.template_id}`}
                className="text-sm text-lime hover:opacity-80 transition-opacity"
              >
                {templateName} →
              </Link>
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

      {/* Class Roster Intelligence */}
      {session.group_id && (
        <div>
          <SectionHeader title="CLASS ROSTER INTELLIGENCE" />
          {directorRoster.length === 0 ? (
            <Card className="mt-3">
              <CardContent className="py-8 text-center">
                <p className="text-text-muted text-sm">No current members in this group.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-3">
              <ClassRosterIntelligencePanel players={playerIntelligence} />
            </div>
          )}
        </div>
      )}

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
          {blockList.length > 0 && totalExercises === 0 && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-status-orange/10 border border-status-orange/30">
              <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[11px] text-status-orange leading-snug">
                Blocks are loaded — exercises are not showing. This usually means migration 056 has not been applied to your Supabase instance yet. Open Supabase → SQL Editor, verify with:
                <span className="font-mono"> SELECT policyname FROM pg_policies WHERE tablename = 'session_block_exercises';</span>
              </p>
            </div>
          )}
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
                      <p className="text-[11px] text-text-secondary italic line-clamp-2">&ldquo;{p.raw_input}&rdquo;</p>
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

      {/* Suggested Adjustments */}
      <div>
        <SectionHeader title="SUGGESTED ADJUSTMENTS" />
        <div className="mt-3">
          <SessionAdjustmentSuggestionsPanel
            sessionId={session.id}
            initialSuggestions={existingSuggestions}
            hasGroup={!!session.group_id}
          />
        </div>
      </div>

      {/* Coach Recap */}
      <div>
        <SectionHeader title="COACH RECAP" />
        <Card className="mt-3">
          <CardContent className="py-4 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-3">Add Recap</p>
              <VoiceCoachRecapInput sessionId={session.id} />
            </div>

            {recaps.length > 0 && (
              <div className="pt-3 border-t border-border">
                <SessionRecapSummary recaps={recaps} />
              </div>
            )}

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
