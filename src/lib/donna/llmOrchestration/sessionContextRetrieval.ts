// Sprint 1004 — DONNA Session Context Retrieval V1
// Safe read-only director/coach-facing session context summary.
// Server-side only — uses Supabase with full RLS enforcement.
//
// Returns director/coach-safe session signals only:
//   - Session name
//   - Session status
//   - Scheduled date and time
//   - Duration in minutes
//   - Template name label (not raw ID)
//   - Coach display name (not raw ID)
//   - Group name (not raw ID)
//   - Block count
//   - Attendance counts (total/present/absent — counts only, no player names)
//   - Wrap-up status (submitted / draft / not started)
//   - Whether session needs coach recap
//   - Whether session needs director review
//
// NEVER returns:
//   - session_notes (raw coach notes)
//   - Individual player attendance by name
//   - Coach observation text or voice notes
//   - Raw wrap-up draft content
//   - proposed_actions payload text
//   - Sensitive or private player notes
//   - Raw database IDs in user-facing summary
//   - Any parent or player-facing content

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Output type ───────────────────────────────────────────────────────────────

export interface SessionContextSummary {
  /** Session name */
  sessionName: string | null
  /** Session status (planned, in_progress, completed, cancelled) */
  sessionStatus: string | null
  /** Scheduled date (YYYY-MM-DD) */
  scheduledDate: string | null
  /** Scheduled time (HH:MM) */
  scheduledTime: string | null
  /** Duration in minutes */
  durationMin: number | null
  /** Template name label — human-readable only */
  templateName: string | null
  /** Coach display name — human-readable only */
  coachName: string | null
  /** Group name */
  groupName: string | null
  /** Number of planned session blocks */
  blockCount: number
  /** Attendance counts (counts only — no player names) */
  attendance: {
    total: number
    present: number
    absent: number
    recorded: boolean
  }
  /** Wrap-up status from proposed_actions pipeline */
  wrapUpStatus: 'not_started' | 'draft_submitted' | 'approved' | 'rejected'
  /** Whether a coach wrap-up draft is pending director review */
  needsDirectorReview: boolean
}

export interface SessionContextRetrievalResult {
  summary: SessionContextSummary
  retrievedAt: string
  errors: string[]
}

// ── Retrieval function ────────────────────────────────────────────────────────

/**
 * Retrieve a director/coach-safe session context summary.
 * All queries use the provided Supabase client with full RLS enforcement.
 * academyId scopes queries in addition to RLS.
 * Partial failures are non-fatal — partial data returned with errors noted.
 * Never throws.
 */
export async function retrieveSessionContext(
  supabase: SupabaseClient,
  sessionId: string,
  academyId: string,
): Promise<SessionContextRetrievalResult> {
  const errors: string[] = []

  let sessionName: string | null = null
  let sessionStatus: string | null = null
  let scheduledDate: string | null = null
  let scheduledTime: string | null = null
  let durationMin: number | null = null
  let templateName: string | null = null
  let coachName: string | null = null
  let groupName: string | null = null
  let coachId: string | null = null
  let templateId: string | null = null
  let groupId: string | null = null

  // 1. Session core fields
  try {
    const { data: session } = await supabase
      .from('sessions')
      .select('name, status, scheduled_date, scheduled_time, duration_min, coach_id, template_id, group_id')
      .eq('id', sessionId)
      .eq('academy_id', academyId)
      .single()

    if (session) {
      sessionName = session.name ?? null
      sessionStatus = session.status ?? null
      scheduledDate = session.scheduled_date ?? null
      scheduledTime = session.scheduled_time ? String(session.scheduled_time).slice(0, 5) : null
      durationMin = session.duration_min ?? null
      coachId = session.coach_id ?? null
      templateId = session.template_id ?? null
      groupId = session.group_id ?? null
    }
  } catch { errors.push('session_core: query failed') }

  // 2. Template name (label only — no raw ID exposed)
  if (templateId) {
    try {
      const rawDb = supabase as any
      const { data: template } = await rawDb
        .from('templates')
        .select('name')
        .eq('id', templateId)
        .single()
      templateName = template?.name ?? null
    } catch { errors.push('template_name: query failed') }
  }

  // 3. Coach display name (label only — no raw ID exposed)
  if (coachId) {
    try {
      const { data: coachProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', coachId)
        .single()
      coachName = coachProfile?.display_name ?? null
    } catch { errors.push('coach_name: query failed') }
  }

  // 4. Group name (label only — no raw ID exposed)
  if (groupId) {
    try {
      const { data: group } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single()
      groupName = group?.name ?? null
    } catch { errors.push('group_name: query failed — group table may not exist') }
  }

  // 5. Block count
  let blockCount = 0
  try {
    const { count } = await supabase
      .from('session_blocks')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
    blockCount = count ?? 0
  } catch { errors.push('block_count: query failed') }

  // 6. Attendance counts (counts only — no player names)
  let attendanceTotal = 0
  let attendancePresent = 0
  let attendanceAbsent = 0
  let attendanceRecorded = false
  try {
    const { data: attendanceRows } = await supabase
      .from('session_attendance')
      .select('status')
      .eq('session_id', sessionId)
    if (attendanceRows && attendanceRows.length > 0) {
      attendanceRecorded = true
      attendanceTotal = attendanceRows.length
      attendancePresent = attendanceRows.filter(r => r.status === 'present').length
      attendanceAbsent = attendanceRows.filter(r => r.status === 'absent').length
    }
  } catch { errors.push('attendance_counts: query failed') }

  // 7. Wrap-up status from proposed_actions
  let wrapUpStatus: SessionContextSummary['wrapUpStatus'] = 'not_started'
  let needsDirectorReview = false
  try {
    const { data: wrapUps } = await supabase
      .from('proposed_actions')
      .select('status')
      .eq('session_id', sessionId)
      .eq('target_module', 'session_wrap_up_v1')
      .order('created_at', { ascending: false })
      .limit(1)

    if (wrapUps && wrapUps.length > 0) {
      const wrapUpStatusRaw = wrapUps[0].status
      if (wrapUpStatusRaw === 'pending_review') {
        wrapUpStatus = 'draft_submitted'
        needsDirectorReview = true
      } else if (wrapUpStatusRaw === 'approved' || wrapUpStatusRaw === 'executed') {
        wrapUpStatus = 'approved'
      } else if (wrapUpStatusRaw === 'rejected') {
        wrapUpStatus = 'rejected'
      } else {
        wrapUpStatus = 'draft_submitted'
      }
    }
  } catch { errors.push('wrap_up_status: query failed') }

  return {
    summary: {
      sessionName,
      sessionStatus,
      scheduledDate,
      scheduledTime,
      durationMin,
      templateName,
      coachName,
      groupName,
      blockCount,
      attendance: {
        total: attendanceTotal,
        present: attendancePresent,
        absent: attendanceAbsent,
        recorded: attendanceRecorded,
      },
      wrapUpStatus,
      needsDirectorReview,
    },
    retrievedAt: new Date().toISOString(),
    errors,
  }
}
