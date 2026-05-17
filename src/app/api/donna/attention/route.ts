// Sprint 370 — Donna What Needs Attention API Route
// Sprint 513 — Attention Signals Live Data Wiring V1 (added signals 3–4)
// GET /api/donna/attention
// Auth + director role required. Read-only queries. No mutations.

import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { AttentionItem, AttentionReport } from '@/components/assistant/donnaAttentionEngine'
import { sortAttentionItems } from '@/components/assistant/donnaAttentionEngine'

export async function GET() {
  const supabase = await getSupabaseServer()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, reason: 'not_authenticated' }, { status: 401 })
  }

  // Role check
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role, academy_id')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership || membership.role !== 'academy_director') {
    return NextResponse.json({ ok: false, reason: 'insufficient_role' }, { status: 403 })
  }

  const academyId = membership.academy_id
  const items: AttentionItem[] = []
  let idCounter = 0

  function nextId() {
    idCounter += 1
    return `attention_${idCounter}`
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgoDate = sevenDaysAgo.slice(0, 10)

  try {
    // 1. Pending review queue
    const { count: pendingCount } = await supabase
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')

    if (pendingCount && pendingCount > 0) {
      items.push({
        id: nextId(),
        urgency: pendingCount > 5 ? 'critical' : pendingCount > 2 ? 'high' : 'normal',
        category: 'review',
        title: 'Review Queue',
        description: `${pendingCount} item${pendingCount !== 1 ? 's' : ''} waiting for approval`,
        action: 'Open Review Queue',
        link: '/director/review',
      })
    }

    // 2. Pending player placements
    const { count: placementCount } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_placement')

    if (placementCount && placementCount > 0) {
      items.push({
        id: nextId(),
        urgency: 'high',
        category: 'placement',
        title: 'Pending Placements',
        description: `${placementCount} player${placementCount !== 1 ? 's' : ''} awaiting curriculum placement`,
        action: 'View Players',
        link: '/director/players',
      })
    }

    // 3. Coach concern observations (last 7 days)
    const { count: concernCount } = await supabase
      .from('coach_observations')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('observation_type', 'concern')
      .gte('created_at', sevenDaysAgo)

    if (concernCount && concernCount > 0) {
      items.push({
        id: nextId(),
        urgency: concernCount > 3 ? 'high' : 'normal',
        category: 'communication',
        title: 'Player Concerns',
        description: `${concernCount} concern observation${concernCount !== 1 ? 's' : ''} flagged in the last 7 days`,
        action: 'View Players',
        link: '/director/players',
      })
    }

    // 4. Attendance risk — absences in the last 7 days
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('academy_id', academyId)
      .gte('scheduled_date', sevenDaysAgoDate)

    const recentSessionIds = (recentSessions ?? []).map(s => s.id)

    if (recentSessionIds.length > 0) {
      const { count: absentCount } = await supabase
        .from('session_attendance')
        .select('id', { count: 'exact', head: true })
        .in('session_id', recentSessionIds)
        .neq('status', 'present')

      if (absentCount && absentCount > 0) {
        items.push({
          id: nextId(),
          urgency: absentCount > 10 ? 'high' : 'normal',
          category: 'scheduling',
          title: 'Attendance Gaps',
          description: `${absentCount} absence${absentCount !== 1 ? 's' : ''} recorded in the last 7 days`,
          action: 'View Sessions',
          link: '/director/sessions',
        })
      }
    }

  } catch {
    // Graceful fallback
  }

  const sorted = sortAttentionItems(items)
  const report: AttentionReport = {
    generatedAt: new Date().toISOString(),
    items: sorted,
    hasUrgent: sorted.some(i => i.urgency === 'critical' || i.urgency === 'high'),
  }

  return NextResponse.json({ ok: true, report })
}
