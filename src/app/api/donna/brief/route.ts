// Sprint 369 — Donna Daily Brief API Route
// GET /api/donna/brief
// Auth required (director only). Read-only queries. No mutations.
// Returns a structured DailyBrief object based on live DB data.

import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { DailyBrief, DailyBriefSection } from '@/components/assistant/donnaDailyBrief'
import { createEmptyBrief } from '@/components/assistant/donnaDailyBrief'

export async function GET() {
  const supabase = await getSupabaseServer()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, reason: 'not_authenticated' }, { status: 401 })
  }

  // Role check — director only (role is on academy_memberships)
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
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const brief = createEmptyBrief(today)
  const sections: DailyBriefSection[] = []

  try {
    // 1. Pending review queue items
    const { count: pendingCount } = await supabase
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')

    if (pendingCount !== null && pendingCount > 0) {
      sections.push({
        title: 'Pending Review',
        priority: pendingCount > 3 ? 'high' : 'normal',
        items: [
          `${pendingCount} item${pendingCount !== 1 ? 's' : ''} waiting for your review in the Review Queue.`,
        ],
      })
    }

    // 2. Today's sessions count
    const { count: sessionCount } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .gte('scheduled_date', today)
      .lte('scheduled_date', today)

    if (sessionCount !== null) {
      sections.push({
        title: "Today's Sessions",
        priority: sessionCount === 0 ? 'normal' : 'normal',
        items: [
          sessionCount === 0
            ? 'No sessions scheduled for today.'
            : `${sessionCount} session${sessionCount !== 1 ? 's' : ''} scheduled for today.`,
        ],
      })
    }

    // 3. Players with pending placement
    const { count: placementCount } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_placement')

    if (placementCount !== null && placementCount > 0) {
      sections.push({
        title: 'Pending Placements',
        priority: 'high',
        items: [
          `${placementCount} player${placementCount !== 1 ? 's' : ''} awaiting placement review.`,
        ],
      })
    }

  } catch {
    // Graceful fallback if any query fails
  }

  if (sections.length === 0) {
    sections.push({
      title: 'All clear',
      priority: 'normal',
      items: ['No urgent items found. Have a great day!'],
    })
  }

  const result: DailyBrief = { ...brief, sections }
  return NextResponse.json({ ok: true, brief: result })
}
