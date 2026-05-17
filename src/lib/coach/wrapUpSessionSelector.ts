// Sprint 526 — Coach Wrap-Up Live Session Selector V1
// Read-only loader: returns coach sessions needing a wrap-up vs. already submitted.
// Checks last 7 days of completed/in-progress sessions.
// No writes. No migrations. RLS-scoped by coach_id and academy_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type DB = SupabaseClient<Database>

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WrapUpSessionEntry {
  sessionId: string
  sessionName: string
  scheduledDate: string
  scheduledTime: string | null
  status: string
  wrapUpSubmitted: boolean
}

export interface WrapUpSessionSelectorResult {
  needsWrapUp: WrapUpSessionEntry[]
  alreadySubmitted: WrapUpSessionEntry[]
  totalSessions: number
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadWrapUpSessionSelector(
  db: DB,
  coachId: string,
  academyId: string,
): Promise<WrapUpSessionSelectorResult> {
  const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  // Sessions: today (any status) + last 7 days completed/in_progress
  const { data: sessionRows } = await db
    .from('sessions')
    .select('id, name, scheduled_date, scheduled_time, status')
    .eq('coach_id', coachId)
    .eq('academy_id', academyId)
    .gte('scheduled_date', sevenDaysAgoDate)
    .lte('scheduled_date', today)
    .not('status', 'eq', 'cancelled')
    .order('scheduled_date', { ascending: false })

  const sessions = sessionRows ?? []
  if (sessions.length === 0) {
    return { needsWrapUp: [], alreadySubmitted: [], totalSessions: 0 }
  }

  const sessionIds = sessions.map(s => s.id)

  // Wrap-up detection via voice_notes with session_id
  const { data: vnRows } = await db
    .from('voice_notes')
    .select('session_id')
    .eq('academy_id', academyId)
    .in('session_id', sessionIds)

  const submittedSet = new Set<string>()
  for (const vn of vnRows ?? []) {
    if (vn.session_id) submittedSet.add(vn.session_id)
  }

  const entries: WrapUpSessionEntry[] = sessions.map(s => ({
    sessionId: s.id,
    sessionName: s.name ?? 'Session',
    scheduledDate: s.scheduled_date,
    scheduledTime: s.scheduled_time ?? null,
    status: s.status,
    wrapUpSubmitted: submittedSet.has(s.id),
  }))

  const needsWrapUp = entries.filter(e => !e.wrapUpSubmitted)
  const alreadySubmitted = entries.filter(e => e.wrapUpSubmitted)

  return { needsWrapUp, alreadySubmitted, totalSessions: sessions.length }
}
