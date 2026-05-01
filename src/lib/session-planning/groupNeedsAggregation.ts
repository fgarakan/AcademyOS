import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerNeedsItem {
  playerId: string
  fullName: string
  attendanceStatus: 'present' | 'absent' | 'late' | 'excused' | null
  curriculumLevelName: string | null
  curriculumLevelId: string | null
  curriculumSource: string | null
  strengths: string[]
  thingsToWorkOn: string[]
  developmentFocus: string | null
  topPriority: string | null
  evidenceCount: number | null
  lastCoachNote: string | null
}

export interface GroupNeedsResult {
  sessionId: string
  groupId: string | null
  playerCount: number
  players: PlayerNeedsItem[]
  commonStrengths: string[]
  commonNeeds: string[]
  commonPriorities: string[]
  missingCurriculumAssignments: number
  missingDevelopmentSummaries: number
  attendanceWarnings: string[]
  curriculumLevelCounts: Record<string, number>
  academyOverrideSummaries: string[]
  warnings: string[]
}

interface GetGroupNeedsInput {
  supabase: SupabaseClient<any>
  academyId: string
  sessionId: string
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function getGroupNeedsForSession({
  supabase,
  academyId,
  sessionId,
}: GetGroupNeedsInput): Promise<GroupNeedsResult> {
  const rawDb = supabase as any
  const warnings: string[] = []

  // 1. Session — verify ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id, group_id, template_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  if (!session) {
    return emptyResult(sessionId, ['Session not found or access denied.'])
  }

  if (!session.group_id) {
    return emptyResult(sessionId, ['No group assigned to this session. Assign a group to generate suggestions.'])
  }

  const groupId = session.group_id

  // 2. Group memberships
  const { data: memberships } = await supabase
    .from('group_memberships')
    .select('player_id')
    .eq('group_id', groupId)
    .eq('is_current', true)
    .eq('academy_id', academyId)

  const playerIds = (memberships ?? []).map(m => m.player_id)

  if (playerIds.length === 0) {
    return emptyResult(sessionId, ['No current members in this group.'], groupId)
  }

  // 3. Player names
  const { data: players } = await supabase
    .from('players')
    .select('id, full_name, first_name, last_name')
    .in('id', playerIds)
    .eq('academy_id', academyId)

  const playerNameMap = new Map<string, string>()
  for (const p of players ?? []) {
    playerNameMap.set(p.id, p.full_name ?? `${p.first_name} ${p.last_name}`.trim())
  }

  // 4. Attendance for this session
  const { data: attendanceRows } = await supabase
    .from('session_attendance')
    .select('player_id, status')
    .eq('session_id', sessionId)

  const attendanceMap = new Map<string, string>()
  for (const a of attendanceRows ?? []) {
    attendanceMap.set(a.player_id, a.status)
  }

  const unrecordedCount = playerIds.filter(id => !attendanceMap.has(id)).length
  if (unrecordedCount > 0) {
    warnings.push(`${unrecordedCount} player${unrecordedCount > 1 ? 's' : ''} with unrecorded attendance.`)
  }

  // 5. Curriculum states
  const { data: csRows } = await rawDb
    .from('player_curriculum_states')
    .select('player_id, current_level_id, curriculum_version_id')
    .eq('academy_id', academyId)
    .in('player_id', playerIds)

  const csMap = new Map<string, { level_id: string | null; has_version: boolean }>()
  for (const row of csRows ?? []) {
    csMap.set(row.player_id, {
      level_id: row.current_level_id ?? null,
      has_version: !!row.curriculum_version_id,
    })
  }

  // 6. Curriculum level names
  const levelIds = Array.from(new Set(
    Array.from(csMap.values()).map(v => v.level_id).filter((id): id is string => !!id)
  ))

  const levelNameMap = new Map<string, { name: string; id: string }>()
  if (levelIds.length > 0) {
    const { data: levelRows } = await rawDb
      .from('curriculum_levels')
      .select('id, display_name')
      .in('id', levelIds)
    for (const row of levelRows ?? []) {
      levelNameMap.set(row.id, { name: row.display_name, id: row.id })
    }
  }

  // 7. Development summaries
  const { data: devRows } = await rawDb
    .from('player_development_summary')
    .select('player_id, current_strengths, things_to_work_on, development_focus')
    .in('player_id', playerIds)

  const devMap = new Map<string, { strengths: string[]; toWorkOn: string[]; focus: string | null }>()
  for (const row of devRows ?? []) {
    devMap.set(row.player_id, {
      strengths: (row.current_strengths as string[] | null) ?? [],
      toWorkOn: (row.things_to_work_on as string[] | null) ?? [],
      focus: row.development_focus ?? null,
    })
  }

  // 8. Top priorities
  const { data: priorityRows } = await rawDb
    .from('player_priorities')
    .select('player_id, title, priority_rank')
    .in('player_id', playerIds)
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('priority_rank', { ascending: true })

  const topPriorityMap = new Map<string, string>()
  for (const row of priorityRows ?? []) {
    if (!topPriorityMap.has(row.player_id)) {
      topPriorityMap.set(row.player_id, row.title)
    }
  }

  // 9. Evidence counts (voice_notes as proxy)
  const { data: evidenceRows } = await supabase
    .from('voice_notes')
    .select('player_id')
    .in('player_id', playerIds)
    .eq('academy_id', academyId)
    .not('player_id', 'is', null)

  const evidenceCountMap = new Map<string, number>()
  for (const row of evidenceRows ?? []) {
    if (row.player_id) {
      evidenceCountMap.set(row.player_id, (evidenceCountMap.get(row.player_id) ?? 0) + 1)
    }
  }

  // 10. Last coach note per player (most recent voice_note raw_input)
  const lastNoteMap = new Map<string, string>()
  const { data: noteRows } = await supabase
    .from('voice_notes')
    .select('player_id, raw_input, created_at')
    .in('player_id', playerIds)
    .eq('academy_id', academyId)
    .not('player_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(playerIds.length * 2)

  for (const row of noteRows ?? []) {
    if (row.player_id && !lastNoteMap.has(row.player_id)) {
      const snippet = (row.raw_input ?? '').slice(0, 100)
      if (snippet) lastNoteMap.set(row.player_id, snippet)
    }
  }

  // 11. Academy override summaries for the template's curriculum level
  let academyOverrideSummaries: string[] = []
  if (session.template_id) {
    const { data: templateRow } = await rawDb
      .from('templates')
      .select('curriculum_level_id')
      .eq('id', session.template_id)
      .single()

    if (templateRow?.curriculum_level_id) {
      const { data: versionRow } = await rawDb
        .from('academy_curriculum_versions')
        .select('id')
        .eq('academy_id', academyId)
        .in('status', ['active', 'draft'])
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (versionRow?.id) {
        const { data: overrideRows } = await rawDb
          .from('academy_curriculum_overrides')
          .select('override_reason, applied_change')
          .eq('academy_id', academyId)
          .eq('curriculum_version_id', versionRow.id)
          .eq('status', 'applied')
          .limit(20)

        for (const row of overrideRows ?? []) {
          const reason = row.override_reason as string | null
          const change = row.applied_change as Record<string, unknown> | null
          const text = reason ?? (change ? JSON.stringify(change).slice(0, 80) : null)
          if (text) academyOverrideSummaries.push(text)
        }
      }
    }
  }

  // 12. Assemble player items
  const playerItems: PlayerNeedsItem[] = playerIds.map(pid => {
    const rawStatus = attendanceMap.get(pid) ?? null
    const status = (['present', 'absent', 'late', 'excused'].includes(rawStatus ?? '')
      ? rawStatus
      : null) as PlayerNeedsItem['attendanceStatus']

    const cs = csMap.get(pid)
    const levelEntry = cs?.level_id ? levelNameMap.get(cs.level_id) : null
    const dev = devMap.get(pid)

    return {
      playerId: pid,
      fullName: playerNameMap.get(pid) ?? 'Unknown Player',
      attendanceStatus: status,
      curriculumLevelName: levelEntry?.name ?? null,
      curriculumLevelId: cs?.level_id ?? null,
      curriculumSource: cs ? (cs.has_version ? 'Academy version' : 'Global') : null,
      strengths: dev?.strengths ?? [],
      thingsToWorkOn: dev?.toWorkOn ?? [],
      developmentFocus: dev?.focus ?? null,
      topPriority: topPriorityMap.get(pid) ?? null,
      evidenceCount: evidenceCountMap.get(pid) ?? 0,
      lastCoachNote: lastNoteMap.get(pid) ?? null,
    }
  })

  // 13. Aggregations
  const strengthFreq = new Map<string, number>()
  const needsFreq = new Map<string, number>()
  const priorityFreq = new Map<string, number>()

  for (const item of playerItems) {
    for (const s of item.strengths) {
      strengthFreq.set(s, (strengthFreq.get(s) ?? 0) + 1)
    }
    for (const n of item.thingsToWorkOn) {
      needsFreq.set(n, (needsFreq.get(n) ?? 0) + 1)
    }
    if (item.topPriority) {
      priorityFreq.set(item.topPriority, (priorityFreq.get(item.topPriority) ?? 0) + 1)
    }
  }

  const commonStrengths = topN(strengthFreq, 5)
  const commonNeeds = topN(needsFreq, 5)
  const commonPriorities = topN(priorityFreq, 5)

  const missingCurriculumAssignments = playerItems.filter(p => !p.curriculumLevelId).length
  const missingDevelopmentSummaries = playerItems.filter(
    p => p.strengths.length === 0 && p.thingsToWorkOn.length === 0
  ).length

  if (missingCurriculumAssignments > 0) {
    warnings.push(`${missingCurriculumAssignments} player${missingCurriculumAssignments > 1 ? 's' : ''} without curriculum assignment.`)
  }
  if (missingDevelopmentSummaries > 0) {
    warnings.push(`${missingDevelopmentSummaries} player${missingDevelopmentSummaries > 1 ? 's' : ''} without development summary.`)
  }

  const curriculumLevelCounts: Record<string, number> = {}
  for (const item of playerItems) {
    if (item.curriculumLevelName) {
      curriculumLevelCounts[item.curriculumLevelName] =
        (curriculumLevelCounts[item.curriculumLevelName] ?? 0) + 1
    }
  }

  const attendanceWarnings: string[] = []
  const absentCount = playerItems.filter(p => p.attendanceStatus === 'absent').length
  if (absentCount > 0) {
    attendanceWarnings.push(`${absentCount} player${absentCount > 1 ? 's' : ''} marked absent.`)
  }

  return {
    sessionId,
    groupId,
    playerCount: playerItems.length,
    players: playerItems,
    commonStrengths,
    commonNeeds,
    commonPriorities,
    missingCurriculumAssignments,
    missingDevelopmentSummaries,
    attendanceWarnings,
    curriculumLevelCounts,
    academyOverrideSummaries,
    warnings,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function topN(freq: Map<string, number>, n: number): string[] {
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k)
}

function emptyResult(sessionId: string, warnings: string[], groupId?: string | null): GroupNeedsResult {
  return {
    sessionId,
    groupId: groupId ?? null,
    playerCount: 0,
    players: [],
    commonStrengths: [],
    commonNeeds: [],
    commonPriorities: [],
    missingCurriculumAssignments: 0,
    missingDevelopmentSummaries: 0,
    attendanceWarnings: [],
    curriculumLevelCounts: {},
    academyOverrideSummaries: [],
    warnings,
  }
}
