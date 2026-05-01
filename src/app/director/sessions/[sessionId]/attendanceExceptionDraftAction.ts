'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import type { Json } from '@/lib/supabase/database.types'

// ─────────────────────────────────────────────────────────────
// Payload shape
// ─────────────────────────────────────────────────────────────

export interface RosteredAttendanceDraft {
  player_id: string
  player_name: string
  proposed_status: 'present' | 'absent' | 'unknown'
  match_reason: string
}

export interface UnrosteredAttendeeDraft {
  name: string
  reason: string
}

export interface AttendanceExceptionPayload {
  draft_type: 'attendance_exception_v1'
  source: 'coach_attendance_voice_or_text'
  raw_input: string
  session_id: string
  group_id: string | null
  rostered_attendance: RosteredAttendanceDraft[]
  unrostered_attendees: UnrosteredAttendeeDraft[]
  warnings: string[]
}

// ─────────────────────────────────────────────────────────────
// Rule-based attendance parsing — no external API
// ─────────────────────────────────────────────────────────────

const EVERYONE_PHRASES = [
  'everyone was here', 'everyone came', 'everyone here', 'everyone present',
  'everybody was here', 'everybody came', 'all were here', 'all came',
  'whole group', 'full group', 'everyone showed up', 'all showed up',
  'everyone', 'everybody',
]

const EXCEPT_TRIGGERS = ['except', 'apart from', 'but not', 'excluding', 'other than']

// Stop words that should never be treated as player names
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
    // Take up to first sentence boundary
    const end = afterTrigger.search(/[.!?\n]/)
    const chunk = end >= 0 ? afterTrigger.slice(0, end) : afterTrigger

    // Split on " and " and ","
    const parts = chunk
      .replace(/\band\b/gi, ',')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50)

    for (const part of parts) {
      // Take first word of each part as the name
      const word = part.split(/\s+/)[0]
      if (word && !NAME_STOP_WORDS.has(word.toLowerCase())) {
        names.push(word)
      }
    }
    break // use first except trigger found
  }

  return names
}

function detectUnrosteredNames(text: string, roster: RosterPlayer[], absentNames: string[]): string[] {
  const ARRIVAL_PATTERNS = [
    // "X showed up", "X came", "X turned up", "X arrived"
    /\b([A-Z][a-z]{1,20})\s+(?:showed\s+up|came\s+in|turned\s+up|arrived|appeared)\b/g,
    // "new kid X", "new player X", "new student X"
    /\bnew\s+(?:kid|player|student|member)\s+([A-Z][a-z]{1,20})\b/g,
    // "also X showed up" / "also X came"
    /\balso[,\s]+([A-Z][a-z]{1,20})\s+(?:showed|came|turned|arrived)\b/g,
  ]

  const found: string[] = []
  const seen = new Set<string>()

  for (const pattern of ARRIVAL_PATTERNS) {
    pattern.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const name = m[1]?.trim()
      if (!name || NAME_STOP_WORDS.has(name.toLowerCase()) || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())

      // Skip if on roster
      if (matchToRoster(name, roster)) continue
      // Skip if already flagged as absent from roster
      if (absentNames.some(a => a.toLowerCase() === name.toLowerCase())) continue

      found.push(name)
    }
  }

  return found
}

interface RosterPlayer {
  playerId: string
  fullName: string
  firstName: string
}

function matchToRoster(name: string, roster: RosterPlayer[]): RosterPlayer | null {
  const lower = name.toLowerCase().trim()
  // Exact first name
  for (const p of roster) {
    if (p.firstName.toLowerCase() === lower) return p
    if (p.fullName.toLowerCase() === lower) return p
  }
  // Partial match (at least 3 chars)
  if (lower.length >= 3) {
    for (const p of roster) {
      if (p.firstName.toLowerCase().startsWith(lower)) return p
      if (lower.startsWith(p.firstName.toLowerCase()) && p.firstName.length >= 3) return p
    }
  }
  return null
}

function parseAttendance(
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

  // Match absent names → roster
  const absentPlayerIds = new Set<string>()
  const unmatchedAbsentNames: string[] = []

  for (const name of absentNames) {
    const match = matchToRoster(name, roster)
    if (match) {
      absentPlayerIds.add(match.playerId)
    } else {
      unmatchedAbsentNames.push(name)
      warnings.push(`"${name}" was mentioned as absent but could not be matched to the roster.`)
    }
  }

  // Build rostered attendance
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
    warnings.push('No roster attached to this session — player-level attendance could not be generated.')
  }

  // Detect unrostered attendees
  const unrosteredNames = detectUnrosteredNames(rawInput, roster, absentNames)
  const unrosteredAttendees: UnrosteredAttendeeDraft[] = unrosteredNames.map(name => ({
    name,
    reason: 'Mentioned as showing up but not matched to the session roster',
  }))

  return {
    draft_type: 'attendance_exception_v1',
    source: 'coach_attendance_voice_or_text',
    raw_input: rawInput,
    session_id: sessionId,
    group_id: groupId,
    rostered_attendance: rosteredAttendance,
    unrostered_attendees: unrosteredAttendees,
    warnings,
  }
}

// ─────────────────────────────────────────────────────────────
// Server action
// ─────────────────────────────────────────────────────────────

export interface AttendanceExceptionDraftResult {
  ok: boolean
  error: string | null
  draftId: string | null
}

export async function createAttendanceExceptionDraftAction(
  sessionId: string,
  rawInput: string,
): Promise<AttendanceExceptionDraftResult> {
  await assertNotPreviewMode()

  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.', draftId: null }

  // 2. Validate input
  if (!sessionId) return { ok: false, error: 'Session ID required.', draftId: null }
  const trimmed = rawInput?.trim() ?? ''
  if (!trimmed) return { ok: false, error: 'Attendance recap cannot be empty.', draftId: null }
  if (trimmed.length > 2000) return { ok: false, error: 'Recap must be 2000 characters or fewer.', draftId: null }

  // 3. Resolve academy_id — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.', draftId: null }
  const academyId = profile.academy_id

  // 4. Verify role
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (!role || !['academy_director', 'head_coach', 'coach'].includes(role)) {
    return { ok: false, error: 'You do not have permission to create attendance exception drafts.', draftId: null }
  }

  // 5. Verify session belongs to this academy
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, group_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.', draftId: null }

  // 6. Fetch roster if session has a group
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

      for (const p of players ?? []) {
        roster.push({
          playerId: p.id,
          fullName: p.full_name ?? `${p.first_name} ${p.last_name}`.trim(),
          firstName: p.first_name,
        })
      }
    }
  }

  // 7. Rule-based parse — no external API
  const payload = parseAttendance(trimmed, sessionId, session.group_id, roster)

  // 8. issuer_role for voice_commands record
  const issuerRole: 'academy_director' | 'head_coach' | 'coach' =
    role === 'academy_director' ? 'academy_director'
    : role === 'head_coach' ? 'head_coach'
    : 'coach'

  // 9. Create voice_commands record (required FK for proposed_actions)
  const { data: voiceCommand, error: vcError } = await supabase
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole as any,
      input_method: 'typed',
      raw_input: trimmed,
      transcript: trimmed,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    return { ok: false, error: `Failed to create command record: ${vcError?.message ?? 'unknown'}`, draftId: null }
  }

  // 10. Store draft as proposed_actions row
  //     status 'pending_review' — no attendance recorded until director approves
  //     Never touches session_attendance, player profiles, billing, or parent comms
  const rawDb = supabase as any
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Attendance Exception Draft — ${session.name ?? 'Untitled Session'}`,
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
    return { ok: false, error: `Failed to save draft: ${paError?.message ?? 'unknown'}`, draftId: null }
  }

  return { ok: true, error: null, draftId: proposedAction.id as string }
}
