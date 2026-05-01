import { ArrowUpCircle, ClipboardList, Link2, Target, TrendingUp } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { StructuredDraftCard } from './StructuredDraftCard'
import type { EnrichedDraftItem } from './StructuredDraftCard'
import type { StructuredDraftPayload } from '@/app/director/sessions/[sessionId]/structureRecapAction'
import { PriorityRecommendationDraftCard } from './PriorityRecommendationDraftCard'
import type { EnrichedPriorityDraftItem, PriorityRecommendationPayload } from './PriorityRecommendationDraftCard'
import { EvidenceRequirementDraftCard } from './EvidenceRequirementDraftCard'
import type { EnrichedEvidenceLinkDraftItem, EvidenceRequirementLinkPayload } from './EvidenceRequirementDraftCard'
import { LevelReadinessDraftCard } from './LevelReadinessDraftCard'
import type { EnrichedReadinessDraftItem, LevelReadinessDraftPayload } from './LevelReadinessDraftCard'
import { LevelMovementPlanDraftCard } from './LevelMovementPlanDraftCard'
import type { EnrichedLevelMovementPlanDraftItem, LevelMovementPlanPayload } from './LevelMovementPlanDraftCard'

export default async function DirectorReviewQueuePage() {
  const supabase = await getSupabaseServer()

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Please sign in to view the review queue.</p>
      </div>
    )
  }

  // 2. Resolve academy_id from authenticated profile — never trust client input
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()

  const academyId = profile?.academy_id
  if (!academyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">Academy context unavailable. Please sign in.</p>
      </div>
    )
  }

  // 3. Verify active academy membership — director or head_coach required
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary text-sm">
          You do not have permission to view the review queue.
        </p>
      </div>
    )
  }

  // ─── Session recap drafts ────────────────────────────────────

  // 4. Fetch pending + approved structured drafts — scoped to this academy only
  interface DraftRow {
    id: string
    status: string
    target_object_id: string | null
    proposed_payload: unknown
    created_at: string
    proposed_by_id: string
  }

  const rawDb = supabase as any
  const { data: draftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'session_recap_structuring')
    .order('created_at', { ascending: false })
    .limit(100)

  const allDrafts: DraftRow[] = (draftRows ?? []) as DraftRow[]

  // 5. Filter to session_recap_structuring_v1 — checked after fetch since payload is JSON
  const filteredDrafts = allDrafts.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'session_recap_structuring_v1'
  })

  // 6. Batch-fetch session names and dates for all target_object_ids
  const sessionIds = Array.from(
    new Set(
      filteredDrafts
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )

  const sessionMap = new Map<string, { id: string; name: string | null; scheduled_date: string }>()
  if (sessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date')
      .in('id', sessionIds)
      .eq('academy_id', academyId)
    for (const s of (sessions ?? [])) {
      sessionMap.set(s.id, s)
    }
  }

  // 7. Batch-fetch proposer display names for session recap drafts
  const proposerIds = Array.from(new Set(filteredDrafts.map(d => d.proposed_by_id)))
  const proposerMap = new Map<string, string>()
  if (proposerIds.length > 0) {
    const { data: proposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', proposerIds)
    for (const p of (proposers ?? [])) {
      proposerMap.set(p.id, p.display_name)
    }
  }

  // 8. Assemble enriched items for rendering — split pending vs approved
  const allEnriched: EnrichedDraftItem[] = filteredDrafts.map(d => {
    const session = d.target_object_id ? sessionMap.get(d.target_object_id) : undefined
    return {
      id: d.id,
      payload: d.proposed_payload as unknown as StructuredDraftPayload,
      createdAt: d.created_at,
      status: d.status,
      sessionId: d.target_object_id,
      sessionName: session?.name ?? null,
      sessionDate: session?.scheduled_date ?? null,
      proposerName: proposerMap.get(d.proposed_by_id) ?? null,
    }
  })

  const pendingDrafts = allEnriched.filter(d => d.status === 'pending_review')
  const approvedDrafts = allEnriched.filter(d => d.status === 'approved')

  // ─── Priority recommendation drafts ─────────────────────────

  // 9. Fetch pending + approved priority recommendation drafts — scoped to this academy
  //    Approved drafts are included so directors can apply them here
  const { data: priorityDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'priority_recommendation')
    .order('created_at', { ascending: false })
    .limit(100)

  const allPriorityDraftRows: DraftRow[] = (priorityDraftRows ?? []) as DraftRow[]

  // 10. Filter to priority_recommendation_v1 — checked after fetch since payload is JSON
  const filteredPriorityDrafts = allPriorityDraftRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'priority_recommendation_v1'
  })

  // 11. Batch-fetch player names for priority drafts
  const playerIds = Array.from(
    new Set(
      filteredPriorityDrafts
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )

  const playerMap = new Map<string, string>()
  if (playerIds.length > 0) {
    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name, full_name')
      .in('id', playerIds)
      .eq('academy_id', academyId)
    for (const p of (players ?? [])) {
      playerMap.set(p.id, p.full_name ?? `${p.first_name} ${p.last_name}`.trim())
    }
  }

  // 12. Batch-fetch proposer display names for priority drafts
  const priorityProposerIds = Array.from(new Set(filteredPriorityDrafts.map(d => d.proposed_by_id)))
  const priorityProposerMap = new Map<string, string>()
  if (priorityProposerIds.length > 0) {
    const { data: priorityProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', priorityProposerIds)
    for (const p of (priorityProposers ?? [])) {
      priorityProposerMap.set(p.id, p.display_name)
    }
  }

  // 13. Assemble enriched priority draft items — split pending vs approved
  const enrichedPriorityDrafts: EnrichedPriorityDraftItem[] = filteredPriorityDrafts.map(d => ({
    id: d.id,
    status: d.status,
    createdAt: d.created_at,
    playerId: d.target_object_id,
    playerName: d.target_object_id ? (playerMap.get(d.target_object_id) ?? null) : null,
    proposerName: priorityProposerMap.get(d.proposed_by_id) ?? null,
    payload: d.proposed_payload as unknown as PriorityRecommendationPayload,
  }))

  const pendingPriorityDrafts = enrichedPriorityDrafts.filter(d => d.status === 'pending_review')
  const approvedPriorityDrafts = enrichedPriorityDrafts.filter(d => d.status === 'approved')

  // ─── Evidence requirement link drafts ─────────────────────────

  // 14. Fetch pending + approved evidence requirement link drafts — scoped to this academy
  const { data: evidenceDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'requirement_evidence_link')
    .order('created_at', { ascending: false })
    .limit(100)

  const allEvidenceDraftRows: DraftRow[] = (evidenceDraftRows ?? []) as DraftRow[]

  // 15. Filter to requirement_evidence_link_v1 — checked after fetch since payload is JSON
  const filteredEvidenceDrafts = allEvidenceDraftRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'requirement_evidence_link_v1'
  })

  // 16. Batch-fetch player names for evidence link drafts
  const evidencePlayerIds = Array.from(
    new Set(
      filteredEvidenceDrafts
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )

  const evidencePlayerMap = new Map<string, string>()
  if (evidencePlayerIds.length > 0) {
    const { data: evidencePlayers } = await supabase
      .from('players')
      .select('id, first_name, last_name, full_name')
      .in('id', evidencePlayerIds)
      .eq('academy_id', academyId)
    for (const p of (evidencePlayers ?? [])) {
      evidencePlayerMap.set(p.id, p.full_name ?? `${p.first_name} ${p.last_name}`.trim())
    }
  }

  // 17. Batch-fetch proposer display names for evidence link drafts
  const evidenceProposerIds = Array.from(new Set(filteredEvidenceDrafts.map(d => d.proposed_by_id)))
  const evidenceProposerMap = new Map<string, string>()
  if (evidenceProposerIds.length > 0) {
    const { data: evidenceProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', evidenceProposerIds)
    for (const p of (evidenceProposers ?? [])) {
      evidenceProposerMap.set(p.id, p.display_name)
    }
  }

  // 18. Assemble enriched evidence link draft items — split pending vs approved
  const enrichedEvidenceDrafts: EnrichedEvidenceLinkDraftItem[] = filteredEvidenceDrafts.map(d => ({
    id: d.id,
    status: d.status,
    createdAt: d.created_at,
    playerId: d.target_object_id,
    playerName: d.target_object_id ? (evidencePlayerMap.get(d.target_object_id) ?? null) : null,
    proposerName: evidenceProposerMap.get(d.proposed_by_id) ?? null,
    payload: d.proposed_payload as unknown as EvidenceRequirementLinkPayload,
  }))

  const pendingEvidenceDrafts = enrichedEvidenceDrafts.filter(d => d.status === 'pending_review')
  const approvedEvidenceDrafts = enrichedEvidenceDrafts.filter(d => d.status === 'approved')

  // ─── Level readiness review drafts ─────────────────────────

  // 19. Fetch pending + approved level readiness review drafts — scoped to this academy
  const { data: readinessDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'level_readiness_review')
    .order('created_at', { ascending: false })
    .limit(100)

  const allReadinessDraftRows: DraftRow[] = (readinessDraftRows ?? []) as DraftRow[]

  // 20. Filter to level_readiness_review_v1
  const filteredReadinessDrafts = allReadinessDraftRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'level_readiness_review_v1'
  })

  // 21. Batch-fetch player names for readiness review drafts
  const readinessPlayerIds = Array.from(
    new Set(
      filteredReadinessDrafts
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )

  const readinessPlayerMap = new Map<string, string>()
  if (readinessPlayerIds.length > 0) {
    const { data: readinessPlayers } = await supabase
      .from('players')
      .select('id, first_name, last_name, full_name')
      .in('id', readinessPlayerIds)
      .eq('academy_id', academyId)
    for (const p of (readinessPlayers ?? [])) {
      readinessPlayerMap.set(p.id, p.full_name ?? `${p.first_name} ${p.last_name}`.trim())
    }
  }

  // 22. Batch-fetch proposer display names for readiness review drafts
  const readinessProposerIds = Array.from(new Set(filteredReadinessDrafts.map(d => d.proposed_by_id)))
  const readinessProposerMap = new Map<string, string>()
  if (readinessProposerIds.length > 0) {
    const { data: readinessProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', readinessProposerIds)
    for (const p of (readinessProposers ?? [])) {
      readinessProposerMap.set(p.id, p.display_name)
    }
  }

  // 23. Assemble enriched readiness draft items — split pending vs approved
  const enrichedReadinessDrafts: EnrichedReadinessDraftItem[] = filteredReadinessDrafts.map(d => ({
    id: d.id,
    status: d.status,
    createdAt: d.created_at,
    playerId: d.target_object_id,
    playerName: d.target_object_id ? (readinessPlayerMap.get(d.target_object_id) ?? null) : null,
    proposerName: readinessProposerMap.get(d.proposed_by_id) ?? null,
    payload: d.proposed_payload as unknown as LevelReadinessDraftPayload,
  }))

  const pendingReadinessDrafts = enrichedReadinessDrafts.filter(d => d.status === 'pending_review')
  const approvedReadinessDrafts = enrichedReadinessDrafts.filter(d => d.status === 'approved')

  // ─── Level movement plan drafts ─────────────────────────────

  // 24. Fetch pending + approved level_movement_plan drafts — scoped to this academy
  const { data: movementPlanRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'level_movement_plan')
    .order('created_at', { ascending: false })
    .limit(100)

  const allMovementPlanRows: DraftRow[] = (movementPlanRows ?? []) as DraftRow[]

  // 25. Filter to level_movement_plan_v1
  const filteredMovementPlanDrafts = allMovementPlanRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'level_movement_plan_v1'
  })

  // 26. Batch-fetch player names for movement plan drafts
  const movementPlanPlayerIds = Array.from(
    new Set(
      filteredMovementPlanDrafts
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )

  const movementPlanPlayerMap = new Map<string, string>()
  if (movementPlanPlayerIds.length > 0) {
    const { data: movementPlanPlayers } = await supabase
      .from('players')
      .select('id, first_name, last_name, full_name')
      .in('id', movementPlanPlayerIds)
      .eq('academy_id', academyId)
    for (const p of (movementPlanPlayers ?? [])) {
      movementPlanPlayerMap.set(p.id, p.full_name ?? `${p.first_name} ${p.last_name}`.trim())
    }
  }

  // 27. Batch-fetch proposer display names for movement plan drafts
  const movementPlanProposerIds = Array.from(new Set(filteredMovementPlanDrafts.map(d => d.proposed_by_id)))
  const movementPlanProposerMap = new Map<string, string>()
  if (movementPlanProposerIds.length > 0) {
    const { data: movementPlanProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', movementPlanProposerIds)
    for (const p of (movementPlanProposers ?? [])) {
      movementPlanProposerMap.set(p.id, p.display_name)
    }
  }

  // 28. Assemble enriched movement plan draft items — split pending vs approved
  const enrichedMovementPlanDrafts: EnrichedLevelMovementPlanDraftItem[] = filteredMovementPlanDrafts.map(d => ({
    id: d.id,
    status: d.status,
    createdAt: d.created_at,
    playerId: d.target_object_id,
    playerName: d.target_object_id ? (movementPlanPlayerMap.get(d.target_object_id) ?? null) : null,
    proposerName: movementPlanProposerMap.get(d.proposed_by_id) ?? null,
    payload: d.proposed_payload as unknown as LevelMovementPlanPayload,
  }))

  const pendingMovementPlanDrafts = enrichedMovementPlanDrafts.filter(d => d.status === 'pending_review')
  const approvedMovementPlanDrafts = enrichedMovementPlanDrafts.filter(d => d.status === 'approved')

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        pendingCount={pendingDrafts.length}
        approvedCount={approvedDrafts.length}
        priorityPendingCount={pendingPriorityDrafts.length}
        priorityApprovedCount={approvedPriorityDrafts.length}
        evidencePendingCount={pendingEvidenceDrafts.length}
        evidenceApprovedCount={approvedEvidenceDrafts.length}
        readinessPendingCount={pendingReadinessDrafts.length}
        readinessApprovedCount={approvedReadinessDrafts.length}
        movementPlanPendingCount={pendingMovementPlanDrafts.length}
        movementPlanApprovedCount={approvedMovementPlanDrafts.length}
      />

      {/* ─── Session recap structured drafts ─── */}
      <div className="space-y-6">
        <div>
          <p className="label-xs mb-1">Session Recap Drafts</p>
          <p className="text-text-muted text-xs">
            Structured session recap drafts awaiting review or application.
          </p>
        </div>

        {/* Approved — ready to apply */}
        {approvedDrafts.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="label-xs">Approved — Ready to Apply</p>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                {approvedDrafts.length}
              </span>
            </div>
            <div className="space-y-4">
              {approvedDrafts.map(draft => (
                <StructuredDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          </section>
        )}

        {/* Pending review */}
        <section className="space-y-3">
          {approvedDrafts.length > 0 && <p className="label-xs">Pending Review</p>}
          {pendingDrafts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<ClipboardList className="w-5 h-5" />}
                  title="No pending structured drafts"
                  description="When coaches save session recaps and directors structure them, they will appear here for review."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingDrafts.map(draft => (
                <StructuredDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── Priority recommendation drafts ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-1 border-b border-border">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-text-muted" />
            <p className="label-xs">Priority Recommendation Drafts</p>
          </div>
          {pendingPriorityDrafts.length > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/30">
              {pendingPriorityDrafts.length} pending
            </span>
          )}
          {approvedPriorityDrafts.length > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
              {approvedPriorityDrafts.length} ready to apply
            </span>
          )}
        </div>

        {/* Approved — ready to apply */}
        {approvedPriorityDrafts.length > 0 && (
          <section className="space-y-3">
            <p className="label-xs">Approved — Ready to Apply</p>
            <div className="space-y-4">
              {approvedPriorityDrafts.map(draft => (
                <PriorityRecommendationDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          </section>
        )}

        {/* Pending review */}
        <section className="space-y-3">
          {approvedPriorityDrafts.length > 0 && pendingPriorityDrafts.length > 0 && (
            <p className="label-xs">Pending Review</p>
          )}
          {pendingPriorityDrafts.length === 0 && approvedPriorityDrafts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<Target className="w-5 h-5" />}
                  title="No pending priority recommendation drafts"
                  description="Drafts created from player evidence will appear here for review."
                />
              </CardContent>
            </Card>
          ) : pendingPriorityDrafts.length > 0 ? (
            <div className="space-y-4">
              {pendingPriorityDrafts.map(draft => (
                <PriorityRecommendationDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          ) : null}
        </section>
      </div>
      {/* ─── Evidence link drafts ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-1 border-b border-border">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-text-muted" />
            <p className="label-xs">Evidence Link Drafts</p>
          </div>
          {pendingEvidenceDrafts.length > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/30">
              {pendingEvidenceDrafts.length} pending
            </span>
          )}
          {approvedEvidenceDrafts.length > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
              {approvedEvidenceDrafts.length} ready to apply
            </span>
          )}
        </div>

        {/* Approved — ready to apply */}
        {approvedEvidenceDrafts.length > 0 && (
          <section className="space-y-3">
            <p className="label-xs">Approved — Ready to Apply</p>
            <div className="space-y-4">
              {approvedEvidenceDrafts.map(draft => (
                <EvidenceRequirementDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          </section>
        )}

        {/* Pending review */}
        <section className="space-y-3">
          {approvedEvidenceDrafts.length > 0 && pendingEvidenceDrafts.length > 0 && (
            <p className="label-xs">Pending Review</p>
          )}
          {pendingEvidenceDrafts.length === 0 && approvedEvidenceDrafts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<Link2 className="w-5 h-5" />}
                  title="No pending evidence link drafts"
                  description="Drafts created from player requirement pages will appear here for review."
                />
              </CardContent>
            </Card>
          ) : pendingEvidenceDrafts.length > 0 ? (
            <div className="space-y-4">
              {pendingEvidenceDrafts.map(draft => (
                <EvidenceRequirementDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {/* ─── Level readiness review drafts ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-1 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-text-muted" />
            <p className="label-xs">Level Readiness Review Drafts</p>
          </div>
          {pendingReadinessDrafts.length > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/30">
              {pendingReadinessDrafts.length} pending
            </span>
          )}
          {approvedReadinessDrafts.length > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
              {approvedReadinessDrafts.length} approved
            </span>
          )}
        </div>

        {/* Approved — level movement plan pending (Sprint 45 will handle application) */}
        {approvedReadinessDrafts.length > 0 && (
          <section className="space-y-3">
            <p className="label-xs">Approved — Awaiting Level Movement Plan</p>
            <div className="space-y-4">
              {approvedReadinessDrafts.map(draft => (
                <LevelReadinessDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          </section>
        )}

        {/* Pending review */}
        <section className="space-y-3">
          {approvedReadinessDrafts.length > 0 && pendingReadinessDrafts.length > 0 && (
            <p className="label-xs">Pending Review</p>
          )}
          {pendingReadinessDrafts.length === 0 && approvedReadinessDrafts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="No pending level readiness reviews"
                  description="Readiness review drafts created from player profiles will appear here for director review."
                />
              </CardContent>
            </Card>
          ) : pendingReadinessDrafts.length > 0 ? (
            <div className="space-y-4">
              {pendingReadinessDrafts.map(draft => (
                <LevelReadinessDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {/* ─── Level movement plan drafts ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-1 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-text-muted" />
            <p className="label-xs">Level Movement Plan Drafts</p>
          </div>
          {pendingMovementPlanDrafts.length > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/30">
              {pendingMovementPlanDrafts.length} pending
            </span>
          )}
          {approvedMovementPlanDrafts.length > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
              {approvedMovementPlanDrafts.length} approved
            </span>
          )}
        </div>

        {/* Approved — awaiting application (Sprint 47 will add apply controls) */}
        {approvedMovementPlanDrafts.length > 0 && (
          <section className="space-y-3">
            <p className="label-xs">Approved — Awaiting Level Movement Application</p>
            <div className="space-y-4">
              {approvedMovementPlanDrafts.map(draft => (
                <LevelMovementPlanDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          </section>
        )}

        {/* Pending review */}
        <section className="space-y-3">
          {approvedMovementPlanDrafts.length > 0 && pendingMovementPlanDrafts.length > 0 && (
            <p className="label-xs">Pending Review</p>
          )}
          {pendingMovementPlanDrafts.length === 0 && approvedMovementPlanDrafts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<ArrowUpCircle className="w-5 h-5" />}
                  title="No pending level movement plans"
                  description="Level movement plan drafts are created after a readiness review is approved. They will appear here for a final director review before any level change."
                />
              </CardContent>
            </Card>
          ) : pendingMovementPlanDrafts.length > 0 ? (
            <div className="space-y-4">
              {pendingMovementPlanDrafts.map(draft => (
                <LevelMovementPlanDraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          ) : null}
        </section>
      </div>

    </div>
  )
}

function PageHeader({
  pendingCount,
  approvedCount,
  priorityPendingCount,
  priorityApprovedCount,
  evidencePendingCount,
  evidenceApprovedCount,
  readinessPendingCount,
  readinessApprovedCount,
  movementPlanPendingCount,
  movementPlanApprovedCount,
}: {
  pendingCount: number
  approvedCount: number
  priorityPendingCount: number
  priorityApprovedCount: number
  evidencePendingCount: number
  evidenceApprovedCount: number
  readinessPendingCount: number
  readinessApprovedCount: number
  movementPlanPendingCount: number
  movementPlanApprovedCount: number
}) {
  const totalPending = pendingCount + priorityPendingCount + evidencePendingCount + readinessPendingCount + movementPlanPendingCount
  const totalReadyToApply = approvedCount + priorityApprovedCount + evidenceApprovedCount + readinessApprovedCount + movementPlanApprovedCount
  return (
    <div>
      <p className="label-xs mb-1">DIRECTOR</p>
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-text-primary">Draft Review Queue</h1>
        {totalPending > 0 && (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/30">
            {totalPending} pending
          </span>
        )}
        {totalReadyToApply > 0 && (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
            {totalReadyToApply} ready to apply
          </span>
        )}
      </div>
      <p className="text-text-muted text-sm mt-1">
        Structured drafts awaiting review or application. Nothing is applied automatically.
      </p>
    </div>
  )
}
