// Sprint 369 — Donna Daily Brief API Route
// Sprint 967 — V2: uses buildDirectorDailyBriefing + adapter for COO-quality output
//
// GET /api/donna/brief
// Auth required (director only). Read-only queries. No mutations.
// Returns a structured DailyBrief object based on live DB data.
//
// Data sources (all RLS-scoped to academy_id):
//   - proposed_actions: pending review count, pending parent update count
//   - sessions: today's count, past sessions without wrap-up
//   - players: pending placement, advancement-eligible, no curriculum level
//   - v_player_curriculum_summary: advancement-eligible count (rawDb cast — TS2589 workaround)
//
// V3 gaps (not yet safely derivable — passed as 0):
//   - highRiskSignalCount: requires player signal aggregation
//   - curriculumGapCount: requires curriculum coverage computation
//   - coachesWithNoRecentRecap: requires per-coach session history join

import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import type { DailyBrief, DailyBriefSection } from '@/components/assistant/donnaDailyBrief'
import { buildDirectorDailyBriefing } from '@/lib/donna/briefings/directorBriefing'
import { adaptBriefingToDailyBrief } from '@/lib/donna/briefings/directorBriefingAdapter'

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

  // ── Gather data (sequential per backend rules) ─────────────────────────────

  let pendingCount: number | null = null
  let sessionCount: number | null = null
  let placementCount: number | null = null
  let advancementCount: number | null = null
  let noLevelCount: number | null = null
  let missingRecapCount: number | null = null
  let parentUpdatePendingCount: number | null = null

  try {
    // 1. Pending review queue items
    const r1 = await supabase
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')
    pendingCount = r1.count

    // 2. Today's sessions
    const r2 = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .gte('scheduled_date', today)
      .lte('scheduled_date', today)
    sessionCount = r2.count

    // 3. Players with pending placement
    const r3 = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_placement')
    placementCount = r3.count

    // 4. Advancement-ready players (rawDb — TS2589 workaround for view query)
    const rawDb = supabase as any
    const r4 = await rawDb
      .from('v_player_curriculum_summary')
      .select('player_id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('advancement_eligible', true)
    advancementCount = r4.count

    // 5. Active players missing curriculum level
    const r5 = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'active')
      .is('current_level_id', null)
    noLevelCount = r5.count

    // 6. Sprint 967 — sessions from past dates not yet completed or cancelled
    // A session with scheduled_date < today and status 'planned' or 'in_progress'
    // is a proxy for a missing coach wrap-up.
    const r6 = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .lt('scheduled_date', today)
      .in('status', ['planned', 'in_progress'])
    missingRecapCount = r6.count

    // 7. Sprint 967 — pending parent update drafts
    const r7 = await supabase
      .from('proposed_actions')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', academyId)
      .eq('status', 'pending_review')
      .eq('action_type', 'generate_parent_update')
    parentUpdatePendingCount = r7.count

  } catch {
    // Graceful fallback — partial data is acceptable; queries above are independent
  }

  // ── Build COO brief via library ────────────────────────────────────────────

  const briefing = buildDirectorDailyBriefing({
    todaySessionCount: sessionCount ?? 0,
    missingRecapCount: missingRecapCount ?? 0,
    pendingApprovalCount: pendingCount ?? 0,
    highRiskSignalCount: 0,                     // V3 — requires player signal aggregation
    missingParentDraftCount: parentUpdatePendingCount ?? 0,
    curriculumGapCount: 0,                      // V3 — requires curriculum coverage computation
    playersPendingPlacement: placementCount ?? 0,
    coachesWithNoRecentRecap: 0,                // V3 — requires per-coach session history join
  })

  // ── Adapt library output to DailyBrief UI shape ───────────────────────────

  const adapted = adaptBriefingToDailyBrief(briefing, today)

  // ── Append sections not covered by library ────────────────────────────────

  const extraSections: DailyBriefSection[] = []

  // Today's sessions — library marks as ok/no_data (skipped by adapter), add manually
  if (sessionCount !== null) {
    extraSections.push({
      title: "Today's sessions",
      priority: 'normal',
      items: [
        sessionCount === 0
          ? 'No sessions scheduled for today.'
          : `${sessionCount} session${sessionCount !== 1 ? 's' : ''} scheduled today.`,
      ],
    })
  }

  // Advancement-ready players — not in library params
  if (advancementCount !== null && advancementCount > 0) {
    extraSections.push({
      title: 'Advancement ready',
      priority: 'normal',
      items: [
        `${advancementCount} player${advancementCount !== 1 ? 's' : ''} meet${advancementCount === 1 ? 's' : ''} the criteria to advance to the next level — review their profiles.`,
      ],
    })
  }

  // No curriculum level — not in library params
  if (noLevelCount !== null && noLevelCount > 0) {
    extraSections.push({
      title: 'No curriculum level',
      priority: noLevelCount > 2 ? 'high' : 'normal',
      items: [
        `${noLevelCount} active player${noLevelCount !== 1 ? 's' : ''} ${noLevelCount === 1 ? 'does' : 'do'} not have a curriculum level assigned yet.`,
      ],
    })
  }

  // Recommended first action — appended last after all factual sections
  const recommendedSections: DailyBriefSection[] = []
  if (briefing.suggestedFirstAction) {
    recommendedSections.push({
      title: 'Recommended first action',
      priority: 'normal',
      items: [briefing.suggestedFirstAction],
    })
  }

  // ── Assemble final section list ────────────────────────────────────────────

  const allSections: DailyBriefSection[] = [
    ...adapted.sections,
    ...extraSections,
    ...recommendedSections,
  ]

  const finalSections: DailyBriefSection[] =
    allSections.length > 0
      ? allSections
      : [{ title: 'All clear', priority: 'normal', items: ['No urgent items today. Academy is on track.'] }]

  const result: DailyBrief = {
    ...adapted,
    sections: finalSections,
  }

  return NextResponse.json({ ok: true, brief: result })
}
