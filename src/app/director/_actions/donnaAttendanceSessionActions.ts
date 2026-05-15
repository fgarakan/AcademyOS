'use server'

// Sprint 383 — Donna Attendance Session Actions V1
// Read-only: fetches recent sessions for use in the attendance exception session picker.
// Never mutates. Scoped to the current director's academy.

import { getSupabaseServer } from '@/lib/supabase/server'
import type { AttendanceSessionOption } from '@/components/assistant/donnaAttendanceSessionResolution'

// ---------------------------------------------------------------------------
// Auth + academy helper — read-only context
// ---------------------------------------------------------------------------

async function getReadContext(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof getSupabaseServer>>; academyId: string }
  | { ok: false; error: string }
> {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  if (!profile?.academy_id) return { ok: false, error: 'Academy context unavailable.' }

  return { ok: true, supabase, academyId: profile.academy_id }
}

// ---------------------------------------------------------------------------
// fetchRecentSessionsAction
//
// Returns the 5 most recent sessions within the last 7 days for this academy.
// Read-only. No writes. Scoped to academy_id.
//
// Returns AttendanceSessionOption[] — safe subset of session data.
// ---------------------------------------------------------------------------

export async function fetchRecentSessionsAction(): Promise<{
  ok: boolean
  sessions: AttendanceSessionOption[]
  error?: string
}> {
  const ctx = await getReadContext()
  if (!ctx.ok) return { ok: false, sessions: [], error: ctx.error }

  const { supabase, academyId } = ctx
  const rawDb = supabase as any

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const cutoff = sevenDaysAgo.toISOString().split('T')[0]

  const { data, error } = await rawDb
    .from('sessions')
    .select('id, name, scheduled_date, status, group_id')
    .eq('academy_id', academyId)
    .gte('scheduled_date', cutoff)
    .order('scheduled_date', { ascending: false })
    .limit(5)

  if (error || !data) {
    return { ok: false, sessions: [], error: error?.message ?? 'Could not load sessions.' }
  }

  // Collect unique group_ids for a single batch group name lookup
  const groupIds: string[] = Array.from(
    new Set((data as any[]).map((s: any) => s.group_id).filter(Boolean))
  )

  const groupNames: Record<string, string> = {}
  if (groupIds.length > 0) {
    const { data: groups } = await rawDb
      .from('groups')
      .select('id, name')
      .in('id', groupIds)
      .eq('academy_id', academyId)

    for (const g of groups ?? []) {
      if (g.id && g.name) groupNames[g.id as string] = g.name as string
    }
  }

  const sessions: AttendanceSessionOption[] = (data as any[]).map((s: any) => {
    const dateStr = (s.scheduled_date as string | null) ?? ''
    const dateLabel = dateStr
      ? new Date(dateStr + 'T12:00:00').toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      : 'Unknown date'
    const groupLabel = s.group_id ? groupNames[s.group_id as string] : undefined

    return {
      sessionId: s.id as string,
      title: (s.name as string | null) ?? `Session ${dateLabel}`,
      dateLabel,
      groupLabel,
      source: 'existing_session' as const,
      confidence: 'high' as const,
    }
  })

  return { ok: true, sessions }
}
