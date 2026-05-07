import { BookOpen, CheckCircle, ClipboardList, Inbox, Link2, Mic, Target, Users } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, EmptyState, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { StructuredDraftCard } from './StructuredDraftCard'
import type { EnrichedDraftItem } from './StructuredDraftCard'
import type { StructuredDraftPayload } from '@/app/director/sessions/[sessionId]/structureRecapAction'
import { PriorityRecommendationDraftCard } from './PriorityRecommendationDraftCard'
import type { EnrichedPriorityDraftItem, PriorityRecommendationPayload } from './PriorityRecommendationDraftCard'
import { EvidenceRequirementDraftCard } from './EvidenceRequirementDraftCard'
import type { EnrichedEvidenceLinkDraftItem, EvidenceRequirementLinkPayload } from './EvidenceRequirementDraftCard'
import { AttendanceExceptionDraftCard } from './AttendanceExceptionDraftCard'
import type { EnrichedAttendanceExceptionDraftItem } from './AttendanceExceptionDraftCard'
import type { AttendanceExceptionPayload } from '@/app/director/sessions/[sessionId]/attendanceExceptionDraftAction'
import { CurriculumOverrideDraftCard } from './CurriculumOverrideDraftCard'
import type { EnrichedCurriculumOverrideDraftItem } from './CurriculumOverrideDraftCard'
import type { CurriculumOverrideDraftPayload } from '@/lib/actions/curriculumOverrideDraft'
import { VoiceIntakeDraftCard } from './VoiceIntakeDraftCard'
import type { EnrichedVoiceIntakeDraftItem, VoiceIntakeDraftPayload } from './VoiceIntakeDraftCard'
import type { GeneralCaptureItem, PlayerOption } from './GeneralCaptureDraftCard'
import { WrapUpDraftCard } from './WrapUpDraftCard'
import type { EnrichedWrapUpDraftItem } from './WrapUpDraftCard'
import type { SessionActualDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'
import { VoiceIntakeBatchPanel } from './VoiceIntakeBatchPanel'
import { CapturesBatchPanel } from './CapturesBatchPanel'

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

  // ─── Attendance exception drafts ─────────────────────────────

  // 19. Fetch pending + approved attendance exception drafts — scoped to this academy
  const { data: attendanceExceptionRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'attendance_exception')
    .order('created_at', { ascending: false })
    .limit(100)

  const allAttendanceExceptionRows: DraftRow[] = (attendanceExceptionRows ?? []) as DraftRow[]

  // 20. Filter to attendance_exception_v1
  const filteredAttendanceDrafts = allAttendanceExceptionRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'attendance_exception_v1'
  })

  // 21. Batch-fetch session names for attendance exception drafts
  const attendanceSessionIds = Array.from(
    new Set(
      filteredAttendanceDrafts
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )

  const attendanceSessionMap = new Map<string, { id: string; name: string | null; scheduled_date: string }>()
  if (attendanceSessionIds.length > 0) {
    const { data: aSessions } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date')
      .in('id', attendanceSessionIds)
      .eq('academy_id', academyId)
    for (const s of (aSessions ?? [])) {
      attendanceSessionMap.set(s.id, s)
    }
  }

  // 22. Batch-fetch proposer display names
  const attendanceProposerIds = Array.from(new Set(filteredAttendanceDrafts.map(d => d.proposed_by_id)))
  const attendanceProposerMap = new Map<string, string>()
  if (attendanceProposerIds.length > 0) {
    const { data: aProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', attendanceProposerIds)
    for (const p of (aProposers ?? [])) {
      attendanceProposerMap.set(p.id, p.display_name)
    }
  }

  // 23. Assemble enriched attendance exception draft items
  const enrichedAttendanceDrafts: EnrichedAttendanceExceptionDraftItem[] = filteredAttendanceDrafts.map(d => {
    const sess = d.target_object_id ? attendanceSessionMap.get(d.target_object_id) : undefined
    return {
      id: d.id,
      status: d.status,
      createdAt: d.created_at,
      sessionId: d.target_object_id,
      sessionName: sess?.name ?? null,
      sessionDate: sess?.scheduled_date ?? null,
      proposerName: attendanceProposerMap.get(d.proposed_by_id) ?? null,
      payload: d.proposed_payload as unknown as AttendanceExceptionPayload,
    }
  })

  const pendingAttendanceDrafts = enrichedAttendanceDrafts.filter(d => d.status === 'pending_review')
  const approvedAttendanceDrafts = enrichedAttendanceDrafts.filter(d => d.status === 'approved')

  // ─── Curriculum override drafts ────────────────────────────────

  // 24. Fetch pending + approved curriculum override drafts — scoped to this academy
  const { data: curriculumOverrideDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'curriculum_override')
    .order('created_at', { ascending: false })
    .limit(100)

  const allCurriculumOverrideDraftRows: DraftRow[] = (curriculumOverrideDraftRows ?? []) as DraftRow[]

  // 25. Filter to curriculum_override_v1
  const filteredCurriculumOverrideDrafts = allCurriculumOverrideDraftRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'curriculum_override_v1'
  })

  // 26. Batch-fetch proposer display names
  const curriculumProposerIds = Array.from(new Set(filteredCurriculumOverrideDrafts.map(d => d.proposed_by_id)))
  const curriculumProposerMap = new Map<string, string>()
  if (curriculumProposerIds.length > 0) {
    const { data: cProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', curriculumProposerIds)
    for (const p of (cProposers ?? [])) {
      curriculumProposerMap.set(p.id, p.display_name)
    }
  }

  // 27. Assemble enriched curriculum override draft items
  const enrichedCurriculumOverrideDrafts: EnrichedCurriculumOverrideDraftItem[] = filteredCurriculumOverrideDrafts.map(d => ({
    id: d.id,
    status: d.status,
    createdAt: d.created_at,
    proposerName: curriculumProposerMap.get(d.proposed_by_id) ?? null,
    payload: d.proposed_payload as unknown as CurriculumOverrideDraftPayload,
  }))

  const pendingCurriculumOverrideDrafts = enrichedCurriculumOverrideDrafts.filter(d => d.status === 'pending_review')
  const approvedCurriculumOverrideDrafts = enrichedCurriculumOverrideDrafts.filter(d => d.status === 'approved')

  // ─── Voice intake drafts ───────────────────────────────────────

  // 28. Fetch pending + approved voice intake drafts — scoped to this academy
  const { data: voiceIntakeDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at, proposed_by_id, risk_level')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'voice_intake')
    .order('created_at', { ascending: false })
    .limit(100)

  const allVoiceIntakeDraftRows: Array<DraftRow & { risk_level: string | null }> = (voiceIntakeDraftRows ?? []) as Array<DraftRow & { risk_level: string | null }>

  // 29. Filter to voice_intake_v1 — checked after fetch since payload is JSON
  const filteredVoiceIntakeDrafts = allVoiceIntakeDraftRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'voice_intake_v1'
  })

  // 30. Batch-fetch proposer display names for voice intake drafts
  const voiceIntakeProposerIds = Array.from(new Set(filteredVoiceIntakeDrafts.map(d => d.proposed_by_id)))
  const voiceIntakeProposerMap = new Map<string, string>()
  if (voiceIntakeProposerIds.length > 0) {
    const { data: viProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', voiceIntakeProposerIds)
    for (const p of (viProposers ?? [])) {
      voiceIntakeProposerMap.set(p.id, p.display_name)
    }
  }

  // 31. Assemble enriched voice intake draft items
  const enrichedVoiceIntakeDrafts: EnrichedVoiceIntakeDraftItem[] = filteredVoiceIntakeDrafts.map(d => ({
    id: d.id,
    status: d.status,
    createdAt: d.created_at,
    proposerName: voiceIntakeProposerMap.get(d.proposed_by_id) ?? null,
    riskLevel: d.risk_level ?? null,
    payload: d.proposed_payload as unknown as VoiceIntakeDraftPayload,
  }))

  const pendingVoiceIntakeDrafts = enrichedVoiceIntakeDrafts.filter(d => d.status === 'pending_review')
  const approvedVoiceIntakeDrafts = enrichedVoiceIntakeDrafts.filter(d => d.status === 'approved')

  // ─── General captures (unrouted Quick Captures) ────────────────
  const { data: captureRows } = await supabase
    .from('voice_notes')
    .select('id, raw_input, created_at, author_id')
    .eq('academy_id', academyId)
    .is('player_id', null)
    .eq('processing_status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(100)

  const captureAuthorIds = Array.from(new Set((captureRows ?? []).map(r => r.author_id)))
  const captureAuthorMap = new Map<string, string>()
  if (captureAuthorIds.length > 0) {
    const { data: captureAuthors } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', captureAuthorIds)
    for (const p of (captureAuthors ?? [])) {
      captureAuthorMap.set(p.id, p.display_name)
    }
  }

  const generalCaptures: GeneralCaptureItem[] = (captureRows ?? []).map(r => ({
    id: r.id,
    content: r.raw_input,
    createdAt: r.created_at,
    authorName: captureAuthorMap.get(r.author_id) ?? null,
    academyId,
  }))

  // ─── Active players for capture routing ────────────────────────
  const { data: playerRows } = await supabase
    .from('players')
    .select('id, full_name, first_name, last_name')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('full_name')

  const playerOptions: PlayerOption[] = (playerRows ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    first_name: p.first_name,
    last_name: p.last_name,
  }))

  // ─── Session wrap-up drafts (coach wrap-up guided recap) ─────

  const { data: wrapUpRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed'])
    .eq('target_module', 'session_wrap_up_v1')
    .order('created_at', { ascending: false })
    .limit(100)

  const allWrapUpRows: DraftRow[] = (wrapUpRows ?? []) as DraftRow[]

  const filteredWrapUpDrafts = allWrapUpRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'session_actual_v1'
  })

  const wrapUpSessionIds = Array.from(
    new Set(
      filteredWrapUpDrafts
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )

  const wrapUpSessionMap = new Map<string, { id: string; name: string | null; scheduled_date: string }>()
  if (wrapUpSessionIds.length > 0) {
    const { data: wuSessions } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date')
      .in('id', wrapUpSessionIds)
      .eq('academy_id', academyId)
    for (const s of (wuSessions ?? [])) {
      wrapUpSessionMap.set(s.id, s)
    }
  }

  const wrapUpProposerIds = Array.from(new Set(filteredWrapUpDrafts.map(d => d.proposed_by_id)))
  const wrapUpProposerMap = new Map<string, string>()
  if (wrapUpProposerIds.length > 0) {
    const { data: wuProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', wrapUpProposerIds)
    for (const p of (wuProposers ?? [])) {
      wrapUpProposerMap.set(p.id, p.display_name)
    }
  }

  const enrichedWrapUpDrafts: EnrichedWrapUpDraftItem[] = filteredWrapUpDrafts.map(d => {
    const sess = d.target_object_id ? wrapUpSessionMap.get(d.target_object_id) : undefined
    return {
      id: d.id,
      status: d.status,
      createdAt: d.created_at,
      sessionId: d.target_object_id,
      sessionName: sess?.name ?? null,
      sessionDate: sess?.scheduled_date ?? null,
      proposerName: wrapUpProposerMap.get(d.proposed_by_id) ?? null,
      payload: d.proposed_payload as unknown as SessionActualDraftPayload,
    }
  })

  const pendingWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'pending_review')
  const approvedWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'approved')

  // Oldest pending date per category (arrays are sorted newest-first, so last item = oldest)
  const oldestPendingDates = {
    session_recaps: pendingDrafts.at(-1)?.createdAt ?? null,
    priorities: pendingPriorityDrafts.at(-1)?.createdAt ?? null,
    evidence: pendingEvidenceDrafts.at(-1)?.createdAt ?? null,
    attendance: pendingAttendanceDrafts.at(-1)?.createdAt ?? null,
    curriculum: pendingCurriculumOverrideDrafts.at(-1)?.createdAt ?? null,
    voice_intake: pendingVoiceIntakeDrafts.at(-1)?.createdAt ?? null,
    wrap_ups: pendingWrapUpDrafts.at(-1)?.createdAt ?? null,
    captures: generalCaptures.at(-1)?.createdAt ?? null,
  }

  // Compute default tab — first category with pending items, fallback to session_recaps
  const defaultTab = [
    { value: 'session_recaps', pending: pendingDrafts.length },
    { value: 'priorities', pending: pendingPriorityDrafts.length },
    { value: 'evidence', pending: pendingEvidenceDrafts.length },
    { value: 'attendance', pending: pendingAttendanceDrafts.length },
    { value: 'curriculum', pending: pendingCurriculumOverrideDrafts.length },
    { value: 'voice_intake', pending: pendingVoiceIntakeDrafts.length },
    { value: 'wrap_ups', pending: pendingWrapUpDrafts.length },
    { value: 'captures', pending: generalCaptures.length },
  ].find(t => t.pending > 0)?.value ?? 'session_recaps'

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <PageHeader
        pendingCount={pendingDrafts.length}
        approvedCount={approvedDrafts.length}
        priorityPendingCount={pendingPriorityDrafts.length}
        priorityApprovedCount={approvedPriorityDrafts.length}
        evidencePendingCount={pendingEvidenceDrafts.length}
        evidenceApprovedCount={approvedEvidenceDrafts.length}
        attendancePendingCount={pendingAttendanceDrafts.length}
        attendanceApprovedCount={approvedAttendanceDrafts.length}
        curriculumOverridePendingCount={pendingCurriculumOverrideDrafts.length}
        curriculumOverrideApprovedCount={approvedCurriculumOverrideDrafts.length}
        voiceIntakePendingCount={pendingVoiceIntakeDrafts.length}
        voiceIntakeApprovedCount={approvedVoiceIntakeDrafts.length}
        wrapUpPendingCount={pendingWrapUpDrafts.length}
        wrapUpApprovedCount={approvedWrapUpDrafts.length}
        captureCount={generalCaptures.length}
        oldestPendingDates={oldestPendingDates}
      />

      {/* All clear state — shown above tabs when no pending items remain */}
      {(
        pendingDrafts.length + pendingPriorityDrafts.length + pendingEvidenceDrafts.length +
        pendingAttendanceDrafts.length + pendingCurriculumOverrideDrafts.length +
        pendingVoiceIntakeDrafts.length + pendingWrapUpDrafts.length + generalCaptures.length
      ) === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-status-green/10 border border-status-green/20">
          <CheckCircle className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-sm text-status-green font-medium">
            All caught up — no pending items in the queue.
          </p>
        </div>
      )}

      <Tabs defaultValue={defaultTab}>
        <TabsList scrollable>
          <TabsTrigger value="session_recaps">
            <TabLabel
              label="Session Recaps"
              pending={pendingDrafts.length}
              ready={approvedDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="priorities">
            <TabLabel
              label="Priorities"
              pending={pendingPriorityDrafts.length}
              ready={approvedPriorityDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="evidence">
            <TabLabel
              label="Evidence"
              pending={pendingEvidenceDrafts.length}
              ready={approvedEvidenceDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <TabLabel
              label="Attendance"
              pending={pendingAttendanceDrafts.length}
              ready={approvedAttendanceDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="curriculum">
            <TabLabel
              label="Curriculum"
              pending={pendingCurriculumOverrideDrafts.length}
              ready={approvedCurriculumOverrideDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="voice_intake">
            <TabLabel
              label="Voice Intake"
              pending={pendingVoiceIntakeDrafts.length}
              ready={approvedVoiceIntakeDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="wrap_ups">
            <TabLabel
              label="Session Wrap-Ups"
              pending={pendingWrapUpDrafts.length}
              ready={approvedWrapUpDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="captures">
            <TabLabel
              label="Captures"
              pending={generalCaptures.length}
              ready={0}
            />
          </TabsTrigger>
        </TabsList>

        {/* ─── Session Recaps tab ─── */}
        <TabsContent value="session_recaps" className="pt-6 space-y-4">
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
          <section className="space-y-3">
            {approvedDrafts.length > 0 && pendingDrafts.length > 0 && (
              <p className="label-xs">Pending Review</p>
            )}
            {pendingDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<ClipboardList className="w-5 h-5" />}
                    title="No pending session recap drafts"
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
        </TabsContent>

        {/* ─── Priorities tab ─── */}
        <TabsContent value="priorities" className="pt-6 space-y-4">
          {approvedPriorityDrafts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="label-xs">Approved — Ready to Apply</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                  {approvedPriorityDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedPriorityDrafts.map(draft => (
                  <PriorityRecommendationDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            {approvedPriorityDrafts.length > 0 && pendingPriorityDrafts.length > 0 && (
              <p className="label-xs">Pending Review</p>
            )}
            {pendingPriorityDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Target className="w-5 h-5" />}
                    title="No pending priority recommendation drafts"
                    description="Drafts created from player evidence will appear here for review."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingPriorityDrafts.map(draft => (
                  <PriorityRecommendationDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ─── Evidence tab ─── */}
        <TabsContent value="evidence" className="pt-6 space-y-4">
          {approvedEvidenceDrafts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="label-xs">Approved — Ready to Apply</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                  {approvedEvidenceDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedEvidenceDrafts.map(draft => (
                  <EvidenceRequirementDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            {approvedEvidenceDrafts.length > 0 && pendingEvidenceDrafts.length > 0 && (
              <p className="label-xs">Pending Review</p>
            )}
            {pendingEvidenceDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Link2 className="w-5 h-5" />}
                    title="No pending evidence link drafts"
                    description="Drafts created from player requirement pages will appear here for review."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingEvidenceDrafts.map(draft => (
                  <EvidenceRequirementDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ─── Attendance tab ─── */}
        <TabsContent value="attendance" className="pt-6 space-y-4">
          {approvedAttendanceDrafts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="label-xs">Approved — Ready to Apply</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                  {approvedAttendanceDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedAttendanceDrafts.map(draft => (
                  <AttendanceExceptionDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            {approvedAttendanceDrafts.length > 0 && pendingAttendanceDrafts.length > 0 && (
              <p className="label-xs">Pending Review</p>
            )}
            {pendingAttendanceDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Users className="w-5 h-5" />}
                    title="No pending attendance exception drafts"
                    description="When coaches record attendance exceptions from sessions, they will appear here for review."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingAttendanceDrafts.map(draft => (
                  <AttendanceExceptionDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ─── Curriculum tab ─── */}
        <TabsContent value="curriculum" className="pt-6 space-y-4">
          {approvedCurriculumOverrideDrafts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="label-xs">Approved — Ready to Apply</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                  {approvedCurriculumOverrideDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedCurriculumOverrideDrafts.map(draft => (
                  <CurriculumOverrideDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            {approvedCurriculumOverrideDrafts.length > 0 && pendingCurriculumOverrideDrafts.length > 0 && (
              <p className="label-xs">Pending Review</p>
            )}
            {pendingCurriculumOverrideDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<BookOpen className="w-5 h-5" />}
                    title="No pending curriculum override drafts"
                    description="Voice curriculum customizations typed on the Curriculum page will appear here for review."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingCurriculumOverrideDrafts.map(draft => (
                  <CurriculumOverrideDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ─── Session Wrap-Ups tab ─── */}
        <TabsContent value="wrap_ups" className="pt-6 space-y-4">
          {approvedWrapUpDrafts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="label-xs">Approved — Ready to Apply</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                  {approvedWrapUpDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedWrapUpDrafts.map(draft => (
                  <WrapUpDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            {approvedWrapUpDrafts.length > 0 && pendingWrapUpDrafts.length > 0 && (
              <p className="label-xs">Pending Review</p>
            )}
            {pendingWrapUpDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<ClipboardList className="w-5 h-5" />}
                    title="No pending session wrap-up drafts"
                    description="When coaches complete the guided wrap-up after a session, their summary will appear here for director review."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingWrapUpDrafts.map(draft => (
                  <WrapUpDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ─── Captures tab ─── */}
        <TabsContent value="captures" className="pt-6 space-y-4">
          <section className="space-y-3">
            {generalCaptures.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Inbox className="w-5 h-5" />}
                    title="No unrouted captures"
                    description="Quick captures made outside a player profile will appear here. Use the + Capture button anywhere in the director area to add one."
                  />
                </CardContent>
              </Card>
            ) : (
              <CapturesBatchPanel captures={generalCaptures} players={playerOptions} />
            )}
          </section>
        </TabsContent>

        {/* ─── Voice Intake tab ─── */}
        <TabsContent value="voice_intake" className="pt-6 space-y-4">
          {approvedVoiceIntakeDrafts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="label-xs">Approved — Ready to Execute</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                  {approvedVoiceIntakeDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedVoiceIntakeDrafts.map(draft => (
                  <VoiceIntakeDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            {approvedVoiceIntakeDrafts.length > 0 && pendingVoiceIntakeDrafts.length > 0 && (
              <p className="label-xs">Pending Review</p>
            )}
            {pendingVoiceIntakeDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Mic className="w-5 h-5" />}
                    title="No pending voice intake drafts"
                    description="When directors or coaches submit voice intake drafts from the Command Center or session pages, they will appear here for review."
                  />
                </CardContent>
              </Card>
            ) : (
              <VoiceIntakeBatchPanel pending={pendingVoiceIntakeDrafts} />
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TabLabel({
  label,
  pending,
  ready,
}: {
  label: string
  pending: number
  ready: number
}) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      {pending > 0 && (
        <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
          {pending}
        </span>
      )}
      {ready > 0 && (
        <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 leading-none">
          {ready}
        </span>
      )}
    </span>
  )
}

function PageHeader({
  pendingCount,
  approvedCount,
  priorityPendingCount,
  priorityApprovedCount,
  evidencePendingCount,
  evidenceApprovedCount,
  attendancePendingCount,
  attendanceApprovedCount,
  curriculumOverridePendingCount,
  curriculumOverrideApprovedCount,
  voiceIntakePendingCount,
  voiceIntakeApprovedCount,
  wrapUpPendingCount,
  wrapUpApprovedCount,
  captureCount,
  oldestPendingDates,
}: {
  pendingCount: number
  approvedCount: number
  priorityPendingCount: number
  priorityApprovedCount: number
  evidencePendingCount: number
  evidenceApprovedCount: number
  attendancePendingCount: number
  attendanceApprovedCount: number
  curriculumOverridePendingCount: number
  curriculumOverrideApprovedCount: number
  voiceIntakePendingCount: number
  voiceIntakeApprovedCount: number
  wrapUpPendingCount: number
  wrapUpApprovedCount: number
  captureCount: number
  oldestPendingDates: Record<string, string | null>
}) {
  const totalPending = pendingCount + priorityPendingCount + evidencePendingCount + attendancePendingCount + curriculumOverridePendingCount + voiceIntakePendingCount + wrapUpPendingCount + captureCount
  const totalReadyToApply = approvedCount + priorityApprovedCount + evidenceApprovedCount + attendanceApprovedCount + curriculumOverrideApprovedCount + voiceIntakeApprovedCount + wrapUpApprovedCount

  const categories = [
    { key: 'session_recaps', label: 'Session Recaps', pending: pendingCount, ready: approvedCount },
    { key: 'priorities', label: 'Priorities', pending: priorityPendingCount, ready: priorityApprovedCount },
    { key: 'evidence', label: 'Evidence', pending: evidencePendingCount, ready: evidenceApprovedCount },
    { key: 'attendance', label: 'Attendance', pending: attendancePendingCount, ready: attendanceApprovedCount },
    { key: 'curriculum', label: 'Curriculum', pending: curriculumOverridePendingCount, ready: curriculumOverrideApprovedCount },
    { key: 'voice_intake', label: 'Voice Intake', pending: voiceIntakePendingCount, ready: voiceIntakeApprovedCount },
    { key: 'wrap_ups', label: 'Session Wrap-Ups', pending: wrapUpPendingCount, ready: wrapUpApprovedCount },
    { key: 'captures', label: 'Captures', pending: captureCount, ready: 0 },
  ]

  return (
    <div className="space-y-4">
      <div>
        <p className="page-eyebrow">Director</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="page-title">Draft Review Queue</h1>
          {totalPending > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/25">
              {totalPending} pending
            </span>
          )}
          {totalReadyToApply > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/25">
              {totalReadyToApply} ready to apply
            </span>
          )}
        </div>
        <p className="page-subtitle">
          Structured drafts awaiting review or application. Nothing is applied automatically.
        </p>
      </div>

      {/* Per-category summary strip */}
      <div className="flex flex-wrap gap-4 px-4 py-3 rounded-xl bg-surface-raised border border-border">
        {categories.map(cat => {
          const oldest = oldestPendingDates[cat.key] ?? null
          return (
            <div key={cat.label} className="min-w-[80px]">
              <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">{cat.label}</p>
              <div className="flex flex-col gap-0.5">
                {cat.pending > 0 ? (
                  <>
                    <span className="text-xs font-mono font-semibold text-status-orange">{cat.pending} pending</span>
                    {oldest && (
                      <span className="text-[9px] text-text-muted">{relativeAge(oldest)}</span>
                    )}
                  </>
                ) : (
                  <span className="text-xs font-mono text-text-muted">—</span>
                )}
                {cat.ready > 0 && (
                  <span className="text-xs font-mono font-semibold text-lime">{cat.ready} ready</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function relativeAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 2) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}
