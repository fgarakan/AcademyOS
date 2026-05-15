// Sprint 370 — Donna What Needs Attention API Route
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
