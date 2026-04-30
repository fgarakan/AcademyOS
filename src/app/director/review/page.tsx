import { ClipboardList } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState } from '@/components/ui'
import { StructuredDraftCard } from './StructuredDraftCard'
import type { EnrichedDraftItem } from './StructuredDraftCard'
import type { StructuredDraftPayload } from '@/app/director/sessions/[sessionId]/structureRecapAction'

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

  // 7. Batch-fetch proposer display names
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

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader pendingCount={pendingDrafts.length} approvedCount={approvedDrafts.length} />

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
  )
}

function PageHeader({ pendingCount, approvedCount }: { pendingCount: number; approvedCount: number }) {
  return (
    <div>
      <p className="label-xs mb-1">DIRECTOR</p>
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-text-primary">Draft Review Queue</h1>
        {pendingCount > 0 && (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/30">
            {pendingCount} pending
          </span>
        )}
        {approvedCount > 0 && (
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
            {approvedCount} ready to apply
          </span>
        )}
      </div>
      <p className="text-text-muted text-sm mt-1">
        Structured drafts awaiting review or application. Nothing is applied automatically.
      </p>
    </div>
  )
}
