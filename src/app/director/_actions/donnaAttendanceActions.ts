'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/lib/supabase/server'
import { isPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'
import type { DonnaApprovalExecutionResult } from '@/components/assistant/donnaApprovalExecutionTypes'

// ---------------------------------------------------------------------------
// Local types — mirrors the session-page attendance exception payload shape
// ---------------------------------------------------------------------------

interface RosterPlayer {
  playerId: string
  fullName: string
  firstName: string
}

interface RosteredAttendanceDraft {
  player_id: string
  player_name: string
  proposed_status: 'present' | 'absent' | 'unknown'
  match_reason: string
}

interface UnrosteredAttendeeDraft {
  name: string
  reason: string
}

interface AttendanceExceptionPayload {
  draft_type: 'attendance_exception_v1'
  source: 'director_attendance_voice_or_text'
  raw_input: string
  session_id: string
  group_id: string | null
  rostered_attendance: RosteredAttendanceDraft[]
  unrostered_attendees: UnrosteredAttendeeDraft[]
  warnings: string[]
}

// ---------------------------------------------------------------------------
// Rule-based parsing helpers — mirrors attendanceExceptionDraftAction.ts
// No external API calls.
// ---------------------------------------------------------------------------

const EVERYONE_PHRASES = [
  'everyone was here', 'everyone came', 'everyone here', 'everyone present',
  'everybody was here', 'everybody came', 'all were here', 'all came',
  'whole group', 'full group', 'everyone showed up', 'all showed up',
  'everyone', 'everybody',
]

const EXCEPT_TRIGGERS = ['except', 'apart from', 'but not', 'excluding', 'other than']

const NAME_STOP_WORDS = new Set([
  'everyone', 'everybody', 'all', 'they', 'he', 'she', 'it', 'we', 'you', 'i',
  'the', 'a', 'an', 'this', 'that', 'also', 'and', 'but', 'or', 'so', 'just',
  'only', 'even', 'now', 'today', 'here', 'there', 'then', 'no', 'not', 'new',
  'kid', 'player', 'student', 'member', 'coach', 'one', 'two', 'three',
])

function hasEveryoneBaseline(text: string): boolean {
  const lower = text.toLowerCase()
  return EVERYONE_PHRASES.some(p => lower.includes(p))
}

function extractAbsentNames(text: string): string[] {
  const lower = text.toLowerCase()
  const names: string[] = []

  for (const trigger of EXCEPT_TRIGGERS) {
    const idx = lower.indexOf(trigger)
    if (idx === -1) continue

    const afterTrigger = text.slice(idx + trigger.length).trim()
    const end = afterTrigger.search(/[.!?\n]/)
    const chunk = end >= 0 ? afterTrigger.slice(0, end) : afterTrigger

    const parts = chunk
      .replace(/\band\b/gi, ',')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50)

    for (const part of parts) {
      const word = part.split(/\s+/)[0]
      if (word && !NAME_STOP_WORDS.has(word.toLowerCase())) {
        names.push(word)
      }
    }
    break
  }

  return names
}

function matchToRoster(name: string, roster: RosterPlayer[]): RosterPlayer | null {
  const lower = name.toLowerCase().trim()
  for (const p of roster) {
    if (p.firstName.toLowerCase() === lower) return p
    if (p.fullName.toLowerCase() === lower) return p
  }
  if (lower.length >= 3) {
    for (const p of roster) {
      if (p.firstName.toLowerCase().startsWith(lower)) return p
      if (lower.startsWith(p.firstName.toLowerCase()) && p.firstName.length >= 3) return p
    }
  }
  return null
}

function detectUnrosteredNames(
  text: string,
  roster: RosterPlayer[],
  absentNames: string[],
): string[] {
  // Fresh regex instances each call — avoids stateful lastIndex with /g flag
  const ARRIVAL_PATTERNS = [
    /\b([A-Z][a-z]{1,20})\s+(?:showed\s+up|came\s+in|turned\s+up|arrived|appeared)\b/g,
    /\bnew\s+(?:kid|player|student|member)\s+([A-Z][a-z]{1,20})\b/g,
    /\balso[,\s]+([A-Z][a-z]{1,20})\s+(?:showed|came|turned|arrived)\b/g,
  ]

  const found: string[] = []
  const seen = new Set<string>()

  for (const pattern of ARRIVAL_PATTERNS) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const name = m[1]?.trim()
      if (!name || NAME_STOP_WORDS.has(name.toLowerCase()) || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      if (matchToRoster(name, roster)) continue
      if (absentNames.some(a => a.toLowerCase() === name.toLowerCase())) continue
      found.push(name)
    }
  }

  return found
}

function buildAttendancePayload(
  rawInput: string,
  sessionId: string,
  groupId: string | null,
  roster: RosterPlayer[],
): AttendanceExceptionPayload {
  const warnings: string[] = [
    'Draft only. No official attendance has been changed.',
    'Unrostered attendees require director review before any roster, billing, or parent communication changes.',
  ]

  const everyone = hasEveryoneBaseline(rawInput)
  const absentNames = extractAbsentNames(rawInput)

  const absentPlayerIds = new Set<string>()
  for (const name of absentNames) {
    const match = matchToRoster(name, roster)
    if (match) {
      absentPlayerIds.add(match.playerId)
    } else {
      warnings.push(`"${name}" was mentioned as absent but could not be matched to the roster.`)
    }
  }

  const rosteredAttendance: RosteredAttendanceDraft[] = roster.map(p => {
    if (absentPlayerIds.has(p.playerId)) {
      return {
        player_id: p.playerId,
        player_name: p.fullName,
        proposed_status: 'absent',
        match_reason: 'Mentioned after "except"',
      }
    }
    if (everyone) {
      return {
        player_id: p.playerId,
        player_name: p.fullName,
        proposed_status: 'present',
        match_reason: '"Everyone" baseline detected',
      }
    }
    return {
      player_id: p.playerId,
      player_name: p.fullName,
      proposed_status: 'unknown',
      match_reason: 'No attendance baseline detected for this player',
    }
  })

  if (!everyone && absentNames.length === 0) {
    warnings.push(
      'No "everyone" baseline or "except" pattern detected. All players are marked as unknown.',
    )
  }

  if (roster.length === 0) {
    warnings.push(
      'No roster attached to this session — player-level attendance could not be generated.',
    )
  }

  const unrosteredNames = detectUnrosteredNames(rawInput, roster, absentNames)
  const unrosteredAttendees: UnrosteredAttendeeDraft[] = unrosteredNames.map(name => ({
    name,
    reason: 'Mentioned as showing up but not matched to the session roster',
  }))

  return {
    draft_type: 'attendance_exception_v1',
    source: 'director_attendance_voice_or_text',
    raw_input: rawInput,
    session_id: sessionId,
    group_id: groupId,
    rostered_attendance: rosteredAttendance,
    unrostered_attendees: unrosteredAttendees,
    warnings,
  }
}

// ---------------------------------------------------------------------------
// Auth + academy_id helper
// ---------------------------------------------------------------------------

async function getAuthorizedContext() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false as const, error: 'Academy context unavailable.' }

  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', profile.academy_id)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return { ok: false as const, error: 'Director or Head Coach access required.' }
  }

  return {
    ok: true as const,
    supabase,
    userId: user.id,
    academyId: profile.academy_id,
    role: role as 'academy_director' | 'head_coach',
  }
}

// ---------------------------------------------------------------------------
// saveAttendanceExceptionDraftAction
//
// Creates a proposed_actions row for an attendance exception draft.
// Does NOT write to session_attendance — that only happens when the director
// applies the approved draft in /director/review.
//
// Security chain:
//   1. Preview mode guard
//   2. Auth + academy_id + director/head_coach role check
//   3. _resolved_session_id required (not safe to write without confirmed ID)
//   4. Session ownership verified: sessions.academy_id = academy_id
//   5. Roster fetched via group_memberships scoped to academy_id
//   6. proposed_actions row created — no session_attendance rows written here
// ---------------------------------------------------------------------------

export async function saveAttendanceExceptionDraftAction(
  fields: Record<string, string>,
): Promise<DonnaApprovalExecutionResult> {
  if (await isPreviewMode()) {
    return {
      ok: false,
      status: 'blocked',
      message: 'Writes are disabled in preview mode.',
      safetyNotes: [],
    }
  }

  const ctx = await getAuthorizedContext()
  if (!ctx.ok) {
    return { ok: false, status: 'blocked', message: ctx.error, safetyNotes: [] }
  }

  const { supabase, userId, academyId, role } = ctx
  const rawDb = supabase as any

  // Require a confirmed session ID — text-only names are not safe for attendance writes
  const sessionId = (fields._resolved_session_id ?? '').trim()
  if (!sessionId) {
    return {
      ok: false,
      status: 'blocked',
      message:
        'Session must be confirmed before submitting attendance. Use the session resolver to select the correct session.',
      safetyNotes: ['No attendance data was changed.'],
    }
  }

  const attendanceStatement = (fields.attendance_statement ?? '').trim()
  if (!attendanceStatement) {
    return {
      ok: false,
      status: 'blocked',
      message: 'Attendance statement is required.',
      safetyNotes: [],
    }
  }
  if (attendanceStatement.length > 2000) {
    return {
      ok: false,
      status: 'blocked',
      message: 'Attendance statement must be 2000 characters or fewer.',
      safetyNotes: [],
    }
  }

  // Verify session belongs to this academy (session_attendance has no academy_id —
  // this check is the security gate for all downstream attendance operations)
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, group_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()

  if (!session) {
    return {
      ok: false,
      status: 'blocked',
      message: 'Session not found or not accessible.',
      safetyNotes: ['No attendance data was changed.'],
    }
  }

  // Fetch roster via group_memberships scoped to academy_id
  const roster: RosterPlayer[] = []
  if (session.group_id) {
    const { data: memberships } = await supabase
      .from('group_memberships')
      .select('player_id')
      .eq('group_id', session.group_id)
      .eq('is_current', true)
      .eq('academy_id', academyId)

    const playerIds = Array.from(
      new Set((memberships ?? []).map((m: any) => m.player_id).filter(Boolean)),
    )

    if (playerIds.length > 0) {
      const { data: players } = await rawDb
        .from('players')
        .select('id, full_name, first_name')
        .in('id', playerIds)
        .eq('academy_id', academyId)

      for (const p of players ?? []) {
        const fullName = (p.full_name as string | null) ?? ''
        const firstName = (p.first_name as string | null) ?? fullName.split(' ')[0] ?? ''
        roster.push({ playerId: p.id as string, fullName, firstName })
      }
    }
  }

  // Rule-based parse — no external API
  const payload = buildAttendancePayload(attendanceStatement, sessionId, session.group_id, roster)

  // Create voice_commands row (required FK for proposed_actions)
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: userId,
      issuer_role: role as any,
      input_method: 'typed',
      raw_input: attendanceStatement,
      transcript: attendanceStatement,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return {
      ok: false,
      status: 'error',
      message: `Failed to create command record: ${vcError?.message ?? 'unknown'}`,
      safetyNotes: ['No attendance data was changed.'],
    }
  }

  // Create proposed_actions row — status 'pending_review'
  // session_attendance is NOT written here.
  // The director applies in /director/review via ApplyApprovedAttendanceExceptionControls.
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: userId,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Attendance Draft — ${(session.name as string | null) ?? 'Session'}`,
      target_module: 'attendance_exception',
      target_object_id: sessionId,
      target_object_type: 'session',
      proposed_payload: payload as unknown as Json,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. No attendance was recorded.',
        'Unrostered attendees require separate director decision.',
        'No player profiles, billing, or parent communications were modified.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    return {
      ok: false,
      status: 'error',
      message: `Failed to save draft: ${paError?.message ?? 'unknown'}`,
      safetyNotes: ['No attendance data was changed.'],
    }
  }

  revalidatePath('/director/review')

  const unrosteredCount = payload.unrostered_attendees.length
  return {
    ok: true,
    status: 'saved',
    message: 'Attendance draft submitted for director review.',
    createdId: proposedAction.id as string,
    safetyNotes: [
      'No attendance records have been changed.',
      `${roster.length} rostered player(s) staged for director review.`,
      unrosteredCount > 0
        ? `${unrosteredCount} unrostered attendee(s) flagged — director review required before any action.`
        : 'No unrostered attendees detected.',
      'Apply the draft in the Review Queue to write official attendance.',
      'No parent, player, or coach was notified.',
    ],
  }
}
