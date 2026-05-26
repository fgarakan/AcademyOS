'use server'

import { getSupabaseServer } from '@/lib/supabase/server'
import { assertNotPreviewMode } from '@/lib/utils/previewMode'
import { createRequestId } from '@/lib/observability/requestTrace'
import { createActionLogger } from '@/lib/observability/logger'
import { createDuplicateSubmissionMessage } from '@/lib/idempotency/actionGuards'
import { parseAttendanceExceptionText } from '@/lib/attendance/parseAttendanceExceptionText'

// ─────────────────────────────────────────────────────────────
// Payload types
// ─────────────────────────────────────────────────────────────

export interface BlockCompletionDraft {
  block_id: string
  block_name: string
  status: 'completed' | 'skipped' | 'modified'
  note: string
}

export interface SessionActualDraftPayload {
  draft_type: 'session_actual_v1'
  session_id: string
  session_name: string
  block_completion: BlockCompletionDraft[]
  changes_note: string
  next_focus: string
  group_note: string
  raw_attendance_answer: string
  raw_standouts_answer: string
  raw_attention_answer: string
  warnings: string[]
}

export interface SaveWrapUpDraftResult {
  ok: boolean
  error: string | null
  draftId: string | null
  /** Set when Q2 attendance text was parsed and a secondary attendance_exception_v1 draft
   *  was created in the review queue. null when no exceptions detected or creation failed. */
  attendanceExceptionDraftId?: string | null
}

// ─────────────────────────────────────────────────────────────
// Server action
// ─────────────────────────────────────────────────────────────

export async function saveWrapUpDraftAction(
  sessionId: string,
  sessionName: string,
  blockCompletion: BlockCompletionDraft[],
  answers: {
    attendance: string
    changes: string
    standouts: string
    attention: string
    nextFocus: string
    groupNote: string
  },
): Promise<SaveWrapUpDraftResult> {
  const requestId = createRequestId('wrap-up-draft')
  const log = createActionLogger({ action: 'saveWrapUpDraftAction', requestId })

  try { await assertNotPreviewMode() } catch {
    return { ok: false, error: 'Writes are disabled in preview mode.', draftId: null }
  }

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    log.warn('auth_failed', { sessionId })
    return { ok: false, error: 'Not authenticated.', draftId: null }
  }

  // 2. Resolve academy_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.', draftId: null }
  const academyId = profile.academy_id

  // 3. Verify role
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (!role || !['academy_director', 'head_coach', 'coach'].includes(role)) {
    return { ok: false, error: 'Not authorized to create session actual drafts.', draftId: null }
  }

  // 4. Verify session belongs to this academy
  //    Also fetch group_id for attendance roster matching (Sprint 835)
  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, group_id')
    .eq('id', sessionId)
    .eq('academy_id', academyId)
    .single()
  if (!session) return { ok: false, error: 'Session not found or access denied.', draftId: null }

  log.info('start', { sessionId, userId: user.id, academyId, blockCount: blockCompletion.length })

  // Duplicate guard: reject if this user submitted a wrap-up draft for this session in the last 30 s.
  // Prevents double-click / double-submit without requiring a DB unique constraint.
  // True idempotency via a unique constraint is tracked in docs/IDEMPOTENCY_IMPLEMENTATION_NOTES.md.
  const windowStart = new Date(Date.now() - 30_000).toISOString()
  const { data: recentDraft } = await rawDb
    .from('proposed_actions')
    .select('id')
    .eq('academy_id', academyId)
    .eq('proposed_by_id', user.id)
    .eq('target_module', 'session_wrap_up_v1')
    .eq('target_object_id', sessionId)
    .gte('created_at', windowStart)
    .limit(1)
  if (recentDraft && recentDraft.length > 0) {
    log.warn('duplicate_submission', { sessionId, userId: user.id })
    return { ok: false, error: createDuplicateSubmissionMessage('session wrap-up draft'), draftId: null }
  }

  // 5. Build payload
  const payload: SessionActualDraftPayload = {
    draft_type: 'session_actual_v1',
    session_id: sessionId,
    session_name: sessionName,
    block_completion: blockCompletion,
    changes_note: answers.changes,
    next_focus: answers.nextFocus,
    group_note: answers.groupNote,
    raw_attendance_answer: answers.attendance,
    raw_standouts_answer: answers.standouts,
    raw_attention_answer: answers.attention,
    warnings: [
      'Draft only. No session records have been officially updated.',
      'Block completion reflects coach self-report — not automatically applied to session_blocks.',
    ],
  }

  // 6. Create voice_commands record (required FK for proposed_actions)
  const issuerRole = role === 'academy_director' ? 'academy_director'
    : role === 'head_coach' ? 'head_coach'
    : 'coach'

  const { data: voiceCommand, error: vcError } = await rawDb
    .from('voice_commands')
    .insert({
      academy_id: academyId,
      issuer_id: user.id,
      issuer_role: issuerRole,
      input_method: 'typed',
      raw_input: `[Wrap-Up] ${sessionName}`,
      transcript: `[Wrap-Up] ${sessionName}`,
      processing_status: 'processed',
    })
    .select('id')
    .single()

  if (vcError || !voiceCommand) {
    log.error('voice_command_failed', { sessionId, message: vcError?.message ?? 'unknown' })
    return { ok: false, error: `Failed to create command record: ${vcError?.message ?? 'unknown'}`, draftId: null }
  }

  // 7. Store draft as proposed_actions row
  const { data: proposedAction, error: paError } = await rawDb
    .from('proposed_actions')
    .insert({
      academy_id: academyId,
      proposed_by_id: user.id,
      voice_command_id: voiceCommand.id,
      action_type: 'other',
      action_label: `Session Actual Draft — ${sessionName}`,
      target_module: 'session_wrap_up_v1',
      target_object_id: sessionId,
      target_object_type: 'session',
      proposed_payload: payload,
      status: 'pending_review',
      risk_level: 'low',
      risk_notes: [
        'Draft only. Session records not changed.',
        'Block completion is self-reported — requires director review.',
        'No template, player profile, or parent communication was modified.',
      ],
    })
    .select('id')
    .single()

  if (paError || !proposedAction) {
    log.error('proposed_action_failed', { sessionId, message: paError?.message ?? 'unknown' })
    return { ok: false, error: `Failed to save draft: ${paError?.message ?? 'unknown'}`, draftId: null }
  }

  log.info('success', { sessionId, draftId: proposedAction.id })

  // ── Sprint 835: Attendance Exception Parsing ───────────────────────────────
  // Parse Q2 attendance answer. If exceptions are detected, create a secondary
  // attendance_exception_v1 proposed_action for the director review queue.
  //
  // Safety rules:
  //   - Best-effort: any failure here does NOT affect the main wrap-up save
  //   - No official attendance is written — status: pending_review only
  //   - No players created, no rosters changed, no parent comms triggered
  //   - Only roster-matched players appear in rostered_attendance (no null player_id rows)
  //   - Unmatched names go to warnings, not to rostered_attendance
  // ──────────────────────────────────────────────────────────────────────────

  let attendanceExceptionDraftId: string | null = null

  try {
    const attendanceText = answers.attendance?.trim() ?? ''

    if (attendanceText) {
      const parsed = parseAttendanceExceptionText(attendanceText)

      // Only proceed if the parser detected at least one absent or unexpected name
      if (parsed.absentNames.length > 0 || parsed.unexpectedNames.length > 0) {

        // Duplicate guard: skip if an attendance_exception draft was already created for this
        // session by this user in the last 30 seconds (prevents double-submit on retry)
        const attExcWindowStart = new Date(Date.now() - 30_000).toISOString()
        const { data: recentAttExc } = await rawDb
          .from('proposed_actions')
          .select('id')
          .eq('academy_id', academyId)
          .eq('proposed_by_id', user.id)
          .eq('target_module', 'attendance_exception')
          .eq('target_object_id', sessionId)
          .gte('created_at', attExcWindowStart)
          .limit(1)

        if (recentAttExc && recentAttExc.length > 0) {
          // A recent attendance exception draft already exists — skip creation
          log.info('attendance_exception_skipped_duplicate', { sessionId })
        } else {
          // Fetch session roster for name matching
          // Pattern: group_memberships → player_id list → players first_name / full_name
          interface RosterEntry { playerId: string; fullName: string; firstName: string }
          const roster: RosterEntry[] = []

          const groupId: string | null = (session as { group_id?: string | null }).group_id ?? null

          if (groupId) {
            const { data: memberships } = await supabase
              .from('group_memberships')
              .select('player_id')
              .eq('group_id', groupId)
              .eq('is_current', true)
              .eq('academy_id', academyId)

            const playerIds = (memberships ?? []).map((m: { player_id: string }) => m.player_id)

            if (playerIds.length > 0) {
              const { data: players } = await supabase
                .from('players')
                .select('id, full_name, first_name, last_name')
                .in('id', playerIds)
                .eq('academy_id', academyId)

              for (const p of players ?? []) {
                const fullName = p.full_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
                roster.push({
                  playerId: p.id,
                  fullName,
                  firstName: p.first_name ?? '',
                })
              }
            }
          }

          // ── Match absent names against roster ──────────────────────────────
          // Sprint 835: exact first name match, then prefix match (≥3 chars)
          // Sprint 837: matchAllNamesToRoster — returns ALL candidates to detect ambiguity.
          //   1 candidate  → safe, added to rostered_attendance
          //   >1 candidates → ambiguous, added to ambiguous_attendance_names + warnings
          //   0 candidates  → unmatched warning (existing behavior)
          // Only roster-matched, unambiguous players go into rostered_attendance (no null player_ids)

          // First-match lookup — kept for unexpectedNames check (no ambiguity concern there)
          const matchNameToRoster = (name: string, rosterList: RosterEntry[]): RosterEntry | null => {
            const lower = name.toLowerCase().trim()
            for (const p of rosterList) {
              if (p.firstName.toLowerCase() === lower) return p
              if (p.fullName.toLowerCase() === lower) return p
            }
            if (lower.length >= 3) {
              for (const p of rosterList) {
                if (p.firstName.toLowerCase().startsWith(lower)) return p
                if (lower.startsWith(p.firstName.toLowerCase()) && p.firstName.length >= 3) return p
              }
            }
            return null
          }

          // Sprint 837: all-candidates lookup — returns every roster entry that matches the name.
          // Used for absent names so that multiple players sharing a first name are not silently
          // resolved to the first roster match.
          //
          // Match priority (stops at the first tier that yields results):
          //   1. Exact full-name match  → always unambiguous for that full name
          //   2. Exact first-name match → may yield multiple players
          //   3. Prefix match (≥3 chars) → fallback, may also yield multiple players
          const matchAllNamesToRoster = (name: string, rosterList: RosterEntry[]): RosterEntry[] => {
            const lower = name.toLowerCase().trim()

            const fullMatches = rosterList.filter(p => p.fullName.toLowerCase() === lower)
            if (fullMatches.length > 0) return fullMatches

            const firstMatches = rosterList.filter(p => p.firstName.toLowerCase() === lower)
            if (firstMatches.length > 0) return firstMatches

            if (lower.length >= 3) {
              const prefixMatches: RosterEntry[] = []
              for (const p of rosterList) {
                if (p.firstName.toLowerCase().startsWith(lower)) prefixMatches.push(p)
                else if (lower.startsWith(p.firstName.toLowerCase()) && p.firstName.length >= 3) prefixMatches.push(p)
              }
              return prefixMatches
            }

            return []
          }

          interface RosteredAttendanceEntry {
            player_id: string
            player_name: string
            proposed_status: 'absent'
            match_reason: string
          }

          // Sprint 837: ambiguous name entry shape
          interface AmbiguousNameEntry {
            mentioned_name: string
            candidate_players: Array<{ player_id: string; player_name: string }>
            reason: string
          }

          const rosteredAttendance: RosteredAttendanceEntry[] = []
          const ambiguousNames: AmbiguousNameEntry[] = []
          const payloadWarnings: string[] = [...parsed.warnings]
          const matchedAbsentPlayerIds = new Set<string>()

          for (const name of parsed.absentNames) {
            const candidates = matchAllNamesToRoster(name, roster)

            if (candidates.length === 1) {
              // Unique roster match — safe to include
              matchedAbsentPlayerIds.add(candidates[0].playerId)
              rosteredAttendance.push({
                player_id: candidates[0].playerId,
                player_name: candidates[0].fullName,
                proposed_status: 'absent',
                match_reason: 'Parsed from wrap-up Q2 text — confirmed against roster',
              })
            } else if (candidates.length > 1) {
              // Sprint 837: ambiguous — multiple rostered players share this name.
              // Do NOT add to rostered_attendance (no null or silent-first-pick player_ids).
              // Director must confirm manually before any attendance is applied.
              ambiguousNames.push({
                mentioned_name: name,
                candidate_players: candidates.map(c => ({ player_id: c.playerId, player_name: c.fullName })),
                reason: `"${name}" matches ${candidates.length} rostered players — director must confirm which player was absent.`,
              })
              payloadWarnings.push(
                `"${name}" matched ${candidates.length} rostered players (${candidates.map(c => c.fullName).join(', ')}) — director must confirm before applying attendance.`,
              )
            } else {
              // No roster match
              payloadWarnings.push(
                `"${name}" was mentioned as absent but could not be matched to the session roster — director must confirm player identity.`,
              )
            }
          }

          // ── Detect unrostered arrivals ──────────────────────────────────────
          // unexpectedNames from parser — skip if the name matched to roster (rostered player)
          interface UnrosteredEntry { name: string; reason: string }
          const unrosteredAttendees: UnrosteredEntry[] = []

          for (const name of parsed.unexpectedNames) {
            const onRoster = matchNameToRoster(name, roster)
            if (!onRoster) {
              unrosteredAttendees.push({
                name,
                reason: 'Appeared unexpectedly — detected from wrap-up Q2 text. Director review required.',
              })
            } else {
              // Name IS on roster — flag as a possible confusion in the text, not unrostered
              payloadWarnings.push(
                `"${name}" appears to be a rostered player. Text may have been ambiguous — director should confirm whether this player was present or absent.`,
              )
            }
          }

          if (roster.length === 0 && groupId) {
            payloadWarnings.push('No roster found for this session — names could not be matched to players.')
          } else if (!groupId) {
            payloadWarnings.push('Session has no linked group — names could not be matched to roster players.')
          }

          // ── Build attendance_exception_v1 payload ──────────────────────────
          // Shape matches AttendanceExceptionPayload from attendanceExceptionDraftAction.ts
          // source: 'wrap_up_q2_parse' distinguishes this from Director DONNA / session detail paths
          //
          // Sprint 837: ambiguous_attendance_names is an optional extension field.
          // The apply action (applyApprovedAttendanceExceptionAction) reads only
          // rostered_attendance and unrostered_attendees — it never processes
          // ambiguous_attendance_names. This field is for display-only review card warnings.

          const attendancePayload = {
            draft_type: 'attendance_exception_v1' as const,
            source: 'wrap_up_q2_parse',
            raw_input: attendanceText,
            session_id: sessionId,
            group_id: groupId,
            rostered_attendance: rosteredAttendance,
            unrostered_attendees: unrosteredAttendees,
            ...(ambiguousNames.length > 0 ? { ambiguous_attendance_names: ambiguousNames } : {}),
            parsed_confidence: parsed.confidence,
            warnings: payloadWarnings,
          }

          // issuer_role for voice_commands record
          const issuerRoleForAttExc: 'academy_director' | 'head_coach' | 'coach' =
            role === 'academy_director' ? 'academy_director'
            : role === 'head_coach' ? 'head_coach'
            : 'coach'

          // Create voice_commands record (required FK for proposed_actions)
          const { data: attExcVoiceCmd, error: attExcVcErr } = await supabase
            .from('voice_commands')
            .insert({
              academy_id: academyId,
              issuer_id: user.id,
              issuer_role: issuerRoleForAttExc as any,
              input_method: 'typed',
              raw_input: attendanceText,
              transcript: attendanceText,
              processing_status: 'processed',
            })
            .select('id')
            .single()

          if (attExcVcErr || !attExcVoiceCmd) {
            log.warn('attendance_exception_voice_cmd_failed', {
              sessionId,
              message: attExcVcErr?.message ?? 'unknown',
            })
          } else {
            // Create proposed_actions row — attendance_exception target_module
            const { data: attExcAction, error: attExcPaErr } = await rawDb
              .from('proposed_actions')
              .insert({
                academy_id: academyId,
                proposed_by_id: user.id,
                voice_command_id: attExcVoiceCmd.id,
                action_type: 'other',
                action_label: `Attendance Exception — ${session.name ?? 'Session'} (from wrap-up Q2)`,
                target_module: 'attendance_exception',
                target_object_id: sessionId,
                target_object_type: 'session',
                proposed_payload: attendancePayload,
                status: 'pending_review',
                risk_level: 'low',
                risk_notes: [
                  'Draft only. No attendance was recorded.',
                  'Parsed from coach wrap-up Q2 free text — director must verify names against roster.',
                  'No player profiles, billing, or parent communications were modified.',
                ],
              })
              .select('id')
              .single()

            if (attExcPaErr || !attExcAction) {
              log.warn('attendance_exception_proposed_action_failed', {
                sessionId,
                message: attExcPaErr?.message ?? 'unknown',
              })
            } else {
              attendanceExceptionDraftId = attExcAction.id as string
              log.info('attendance_exception_draft_created', {
                sessionId,
                draftId: attendanceExceptionDraftId,
                absentCount: rosteredAttendance.length,
                unrosteredCount: unrosteredAttendees.length,
                confidence: parsed.confidence,
              })
            }
          }
        }
      }
    }
  } catch (attExcErr) {
    // Best-effort: log and continue — main wrap-up save already succeeded
    log.warn('attendance_exception_parse_error', {
      sessionId,
      message: attExcErr instanceof Error ? attExcErr.message : 'unknown',
    })
  }

  return { ok: true, error: null, draftId: proposedAction.id as string, attendanceExceptionDraftId }
}
