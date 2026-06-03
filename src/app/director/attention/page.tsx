import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getReassessmentPipeline } from '@/lib/backend/dashboard'
import { DonnaScreenBriefStatic } from '@/components/donna/DonnaScreenBrief'
import { AttentionQueueClient } from './AttentionQueueClient'
import {
  buildAttentionItems,
  type AttentionFilter,
  type PlayerSummaryRow,
  type ReassessmentRow,
  type PendingActionRow,
} from './buildAttentionItems'

interface PageProps {
  searchParams: { filter?: string }
}

function resolveFilter(raw: string | undefined): AttentionFilter {
  const valid: AttentionFilter[] = ['all', 'players', 'reassessment', 'parent-updates', 'placements', 'onboarding', 'coach']
  const candidate = (raw ?? 'all') as AttentionFilter
  return valid.includes(candidate) ? candidate : 'all'
}

export default async function DirectorAttentionPage({ searchParams }: PageProps) {
  const activeFilter = resolveFilter(searchParams.filter)

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">No session. Please sign in.</p>
      </div>
    )
  }

  const { data: profile } = await rawDb
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId: string | null = profile?.academy_id ?? null

  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable.</p>
      </div>
    )
  }

  // ── Fetch: all active + pending players via v_player_summary ─────────────────
  const { data: playerSummaryRaw } = await rawDb
    .from('v_player_summary')
    .select('player_id, full_name, player_status, level_label, group_name, coach_name, last_assessed_at, next_assessment_due, promotion_ready, overall_score, focus_areas, assessment_status')
    .eq('academy_id', academyId)

  const playerRows = (playerSummaryRaw ?? []) as PlayerSummaryRow[]

  // ── Fetch: reassessment pipeline ─────────────────────────────────────────────
  const reassessmentPipelineRaw = await getReassessmentPipeline(supabase, academyId)
  const reassessmentRows = (reassessmentPipelineRaw ?? []).map(r => ({
    player_id: r.player_id ?? null,
    full_name: r.full_name ?? null,
    group_name: r.group_name ?? null,
    coach_name: r.coach_name ?? null,
    urgency: r.urgency ?? null,
    days_overdue: r.days_overdue ?? null,
    last_assessed_at: r.last_assessed_at ?? null,
  })) as ReassessmentRow[]

  // ── Fetch: placement actions pending review ───────────────────────────────────
  const { data: placementActionsRaw } = await rawDb
    .from('proposed_actions')
    .select('id, action_label, target_module, created_at')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .in('target_module', ['placement_review', 'placement_recommendation_draft', 'level_review'])
    .order('created_at', { ascending: true })

  const placementActions = (placementActionsRaw ?? []) as PendingActionRow[]

  // ── Fetch: parent communication pending review ────────────────────────────────
  const { data: parentActionsRaw } = await rawDb
    .from('proposed_actions')
    .select('id, action_label, target_module, created_at')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .eq('target_module', 'parent_communication')
    .order('created_at', { ascending: true })

  const parentActions = (parentActionsRaw ?? []) as PendingActionRow[]

  // ── Fetch: coach wrap-ups pending review ──────────────────────────────────────
  const { data: coachWrapUpRaw } = await rawDb
    .from('proposed_actions')
    .select('id, action_label, target_module, created_at')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .eq('target_module', 'session_wrap_up_v1')
    .order('created_at', { ascending: true })

  const coachWrapUpActions = (coachWrapUpRaw ?? []) as PendingActionRow[]

  // ── Build attention items ─────────────────────────────────────────────────────
  const allItems = buildAttentionItems({
    players: playerRows,
    reassessmentRows,
    placementActions,
    parentActions,
    coachWrapUpActions,
  })

  const highCount = allItems.filter(i => i.priority === 'high').length
  const totalCount = allItems.length

  // ── DONNA brief ───────────────────────────────────────────────────────────────
  let donnaBrief: string
  let donnaUrgency: 'normal' | 'urgent' = 'normal'
  let donnaActionLabel: string | undefined
  let donnaActionHref: string | undefined

  if (totalCount === 0) {
    donnaBrief = 'No urgent academy issues today. Recommended focus: curriculum execution and coach development.'
  } else {
    const highItems = allItems.filter(i => i.priority === 'high')
    const topItem = highItems[0] ?? allItems[0]
    const topName = topItem?.playerName ?? null

    const parts: string[] = []
    if (highCount > 0) parts.push(`${highCount} high-priority item${highCount !== 1 ? 's' : ''}`)
    const medCount = allItems.filter(i => i.priority === 'medium').length
    if (medCount > 0) parts.push(`${medCount} medium`)

    donnaBrief = parts.join(', ') + ` in the queue.` +
      (topName ? ` ${topName} is highest priority.` : '')

    if (highCount >= 3) donnaUrgency = 'urgent'
    if (topItem) {
      donnaActionLabel = topName ? `View ${topName}` : 'Review queue'
      donnaActionHref = topItem.href
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div>
        <Link
          href="/director"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-lime transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Attention Queue</h1>
            <p className="text-text-secondary text-sm mt-1">
              {totalCount === 0
                ? 'All clear — no items need attention.'
                : `${totalCount} item${totalCount !== 1 ? 's' : ''} need${totalCount === 1 ? 's' : ''} attention${highCount > 0 ? ` · ${highCount} high priority` : ''}`
              }
            </p>
          </div>
          {totalCount > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                highCount > 0
                  ? 'bg-status-red/10 text-status-red border-status-red/25'
                  : 'bg-status-orange/10 text-status-orange border-status-orange/25'
              }`}>
                {highCount > 0 ? `${highCount} High` : 'No critical items'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── DONNA Brief ──────────────────────────────────────────────────────── */}
      <DonnaScreenBriefStatic
        brief={donnaBrief}
        primaryActionLabel={donnaActionLabel}
        primaryActionHref={donnaActionHref}
        emphasis={donnaUrgency}
      />

      {/* ── Column headers (desktop) ──────────────────────────────────────────── */}
      <div className="hidden lg:grid grid-cols-[1fr_auto] gap-4 px-4">
        <div className="grid grid-cols-[24px_1fr_auto_auto] gap-3 items-center">
          <span />
          <span className="label-xs">Player / Item</span>
          <span className="label-xs">Priority</span>
          <span className="label-xs">Category</span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-lime" />
          <span className="label-xs text-lime">DONNA</span>
        </div>
      </div>

      {/* ── Attention Queue ───────────────────────────────────────────────────── */}
      <AttentionQueueClient items={allItems} initialFilter={activeFilter} />

    </div>
  )
}
