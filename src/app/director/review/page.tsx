import { BookOpen, CheckCircle, ClipboardList, Inbox, Link2, Mic, Target, Users, UserPlus, UserSearch } from 'lucide-react'
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
import { WrapUpObservationDraftCard } from './WrapUpObservationDraftCard'
import type { EnrichedObservationDraftItem } from './WrapUpObservationDraftCard'
import type { CoachObservationDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpObservationsAction'
import { DevelopmentSummaryDraftCard } from './DevelopmentSummaryDraftCard'
import type { EnrichedSummaryDraftItem } from './DevelopmentSummaryDraftCard'
import type { DevelopmentSummaryDraftPayload } from '@/app/director/players/[playerId]/draftSummaryUpdateAction'
import { PlacementReviewCard } from './PlacementReviewCard'
import type { EnrichedPlacementReviewItem, PlacementReviewPayload } from './PlacementReviewCard'
import { PlacementIntakeCandidateCard } from './PlacementIntakeCandidateCard'
import type { EnrichedIntakeCandidateItem, PlacementIntakeCandidatePayload } from './PlacementIntakeCandidateCard'
import { PlacementAssessmentDraftCard } from './PlacementAssessmentDraftCard'
import type { EnrichedAssessmentDraftItem, PlacementAssessmentDraftPayload } from './PlacementAssessmentDraftCard'
import { PlacementRecommendationDraftCard } from './PlacementRecommendationDraftCard'
import type { EnrichedRecommendationDraftItem, PlacementRecommendationDraftPayload, AcademyGroup } from './PlacementRecommendationDraftCard'
import { VoiceIntakeBatchPanel } from './VoiceIntakeBatchPanel'
import { CapturesBatchPanel } from './CapturesBatchPanel'

const VALID_TAB_PARAMS: Record<string, string> = {
  'wrap-ups': 'wrap_ups',
  'session-wrap-ups': 'wrap_ups',
  'attendance': 'attendance',
  'placement-review': 'placement_review',
  'placement-intake': 'placement_intake',
  'player-observations': 'player_observations',
  'development-summaries': 'development_summaries',
  'session-recaps': 'session_recaps',
  'priorities': 'priorities',
  'evidence': 'evidence',
  'curriculum': 'curriculum',
  'voice-intake': 'voice_intake',
  'captures': 'captures',
}

export default async function DirectorReviewQueuePage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
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

  const wrapUpSessionMap = new Map<string, { id: string; name: string | null; scheduled_date: string; group_id: string | null }>()
  if (wrapUpSessionIds.length > 0) {
    const { data: wuSessions } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date, group_id')
      .in('id', wrapUpSessionIds)
      .eq('academy_id', academyId)
    for (const s of (wuSessions ?? [])) {
      wrapUpSessionMap.set(s.id, { ...s, group_id: s.group_id ?? null })
    }
  }

  // Group name lookup for session context display
  const wrapUpGroupIds = Array.from(
    new Set(
      Array.from(wrapUpSessionMap.values())
        .map(s => s.group_id)
        .filter((id): id is string => id !== null)
    )
  )
  const wrapUpGroupMap = new Map<string, string>()
  if (wrapUpGroupIds.length > 0) {
    const { data: wuGroups } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', wrapUpGroupIds)
      .eq('academy_id', academyId)
    for (const g of (wuGroups ?? [])) {
      wrapUpGroupMap.set(g.id, g.name)
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
      groupName: sess?.group_id ? (wrapUpGroupMap.get(sess.group_id) ?? null) : null,
      proposerName: wrapUpProposerMap.get(d.proposed_by_id) ?? null,
      payload: d.proposed_payload as unknown as SessionActualDraftPayload,
    }
  })

  const pendingWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'pending_review')
  const approvedWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'approved')

  // ─── Player observation drafts (coach wrap-up observations) ──

  const { data: observationDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed'])
    .eq('target_module', 'coach_observation_draft_v1')
    .order('created_at', { ascending: false })
    .limit(100)

  const allObservationDraftRows: DraftRow[] = (observationDraftRows ?? []) as DraftRow[]

  const filteredObservationDrafts = allObservationDraftRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'coach_observation_draft_v1'
  })

  // Batch-fetch player names from target_object_id (= player_id)
  const observationPlayerIds = Array.from(
    new Set(
      filteredObservationDrafts
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )
  const observationPlayerMap = new Map<string, string>()
  if (observationPlayerIds.length > 0) {
    const { data: obsPlayers } = await supabase
      .from('players')
      .select('id, first_name, last_name, full_name')
      .in('id', observationPlayerIds)
      .eq('academy_id', academyId)
    for (const p of (obsPlayers ?? [])) {
      observationPlayerMap.set(p.id, p.full_name ?? `${p.first_name} ${p.last_name}`.trim())
    }
  }

  // Batch-fetch proposer display names
  const observationProposerIds = Array.from(new Set(filteredObservationDrafts.map(d => d.proposed_by_id)))
  const observationProposerMap = new Map<string, string>()
  if (observationProposerIds.length > 0) {
    const { data: obsProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', observationProposerIds)
    for (const p of (obsProposers ?? [])) {
      observationProposerMap.set(p.id, p.display_name)
    }
  }

  const enrichedObservationDrafts: EnrichedObservationDraftItem[] = filteredObservationDrafts.map(d => ({
    id: d.id,
    status: d.status,
    createdAt: d.created_at,
    playerId: d.target_object_id,
    playerName: d.target_object_id ? (observationPlayerMap.get(d.target_object_id) ?? null) : null,
    proposerName: observationProposerMap.get(d.proposed_by_id) ?? null,
    payload: d.proposed_payload as unknown as CoachObservationDraftPayload,
  }))

  const pendingObservationDrafts = enrichedObservationDrafts.filter(d => d.status === 'pending_review')
  const approvedObservationDrafts = enrichedObservationDrafts.filter(d => d.status === 'approved')

  // ─── Development summary drafts ───────────────────────────────

  const { data: summaryDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'development_summary_draft_v1')
    .order('created_at', { ascending: false })
    .limit(100)

  const allSummaryDraftRows: DraftRow[] = (summaryDraftRows ?? []) as DraftRow[]

  const filteredSummaryDrafts = allSummaryDraftRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'development_summary_draft_v1'
  })

  // Batch-fetch player names from target_object_id (= player_id)
  const summaryPlayerIds = Array.from(
    new Set(
      filteredSummaryDrafts
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )
  const summaryPlayerMap = new Map<string, string>()
  if (summaryPlayerIds.length > 0) {
    const { data: summaryPlayers } = await supabase
      .from('players')
      .select('id, first_name, last_name, full_name')
      .in('id', summaryPlayerIds)
      .eq('academy_id', academyId)
    for (const p of (summaryPlayers ?? [])) {
      summaryPlayerMap.set(p.id, p.full_name ?? `${p.first_name} ${p.last_name}`.trim())
    }
  }

  // Batch-fetch proposer display names
  const summaryProposerIds = Array.from(new Set(filteredSummaryDrafts.map(d => d.proposed_by_id)))
  const summaryProposerMap = new Map<string, string>()
  if (summaryProposerIds.length > 0) {
    const { data: summaryProposers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', summaryProposerIds)
    for (const p of (summaryProposers ?? [])) {
      summaryProposerMap.set(p.id, p.display_name)
    }
  }

  const enrichedSummaryDrafts: EnrichedSummaryDraftItem[] = filteredSummaryDrafts.map(d => ({
    id: d.id,
    status: d.status,
    createdAt: d.created_at,
    playerId: d.target_object_id,
    playerName: d.target_object_id ? (summaryPlayerMap.get(d.target_object_id) ?? null) : null,
    proposerName: summaryProposerMap.get(d.proposed_by_id) ?? null,
    payload: d.proposed_payload as unknown as DevelopmentSummaryDraftPayload,
  }))

  const pendingSummaryDrafts = enrichedSummaryDrafts.filter(d => d.status === 'pending_review')
  const approvedSummaryDrafts = enrichedSummaryDrafts.filter(d => d.status === 'approved')

  // ─── Placement review follow-ups ──────────────────────────────
  // Created when a director applies an attendance_exception draft that has
  // unrostered attendees. Each item represents one unexpected attendee
  // flagged by a coach — no player has been created.

  const { data: placementReviewRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'clarification_needed'])
    .eq('target_module', 'placement_review')
    .order('created_at', { ascending: false })
    .limit(100)

  const allPlacementReviewRows: DraftRow[] = (placementReviewRows ?? []) as DraftRow[]

  // Batch-fetch session names for placement review items
  const placementSessionIds = Array.from(
    new Set(
      allPlacementReviewRows
        .map(d => d.target_object_id)
        .filter((id): id is string => id !== null)
    )
  )
  const placementSessionMap = new Map<string, { id: string; name: string | null; scheduled_date: string }>()
  if (placementSessionIds.length > 0) {
    const { data: pSessions } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date')
      .in('id', placementSessionIds)
      .eq('academy_id', academyId)
    for (const s of (pSessions ?? [])) {
      placementSessionMap.set(s.id, s)
    }
  }

  const allEnrichedPlacementReviews: EnrichedPlacementReviewItem[] = allPlacementReviewRows.map(d => {
    const sess = d.target_object_id ? placementSessionMap.get(d.target_object_id) : undefined
    return {
      id: d.id,
      status: d.status,
      createdAt: d.created_at,
      sessionId: d.target_object_id,
      sessionName: sess?.name ?? null,
      sessionDate: sess?.scheduled_date ?? null,
      payload: d.proposed_payload as unknown as PlacementReviewPayload,
    }
  })
  const pendingPlacementReviews = allEnrichedPlacementReviews.filter(i => i.status === 'pending_review')
  const followUpPlacementReviews = allEnrichedPlacementReviews.filter(i => i.status === 'clarification_needed')

  // ─── Placement intake candidates ──────────────────────────────
  // Created when a director starts placement intake from a placement_review item.
  // Still a proposed_actions safe bridge — no player, no roster, no billing, no parent comms.

  const { data: intakeCandidateRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .eq('target_module', 'placement_intake_candidate')
    .order('created_at', { ascending: false })
    .limit(100)

  const allIntakeCandidateRows: Array<{ id: string; status: string; proposed_payload: unknown; created_at: string }> =
    (intakeCandidateRows ?? []) as any

  const filteredIntakeCandidates = allIntakeCandidateRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'placement_intake_candidate_v1'
  })

  // session_id lives in the payload (target_object_id is academyId)
  const intakeSessionIds = Array.from(
    new Set(
      filteredIntakeCandidates
        .map(d => {
          const p = d.proposed_payload as Record<string, unknown>
          return p?.session_id as string | null
        })
        .filter((id): id is string => id !== null)
    )
  )

  const intakeSessionMap = new Map<string, { id: string; name: string | null; scheduled_date: string }>()
  if (intakeSessionIds.length > 0) {
    const { data: iSessions } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date')
      .in('id', intakeSessionIds)
      .eq('academy_id', academyId)
    for (const s of (iSessions ?? [])) {
      intakeSessionMap.set(s.id, s)
    }
  }

  const enrichedIntakeCandidates: EnrichedIntakeCandidateItem[] = filteredIntakeCandidates.map(d => {
    const p = d.proposed_payload as PlacementIntakeCandidatePayload
    const sessionId = p?.session_id ?? null
    const sess = sessionId ? intakeSessionMap.get(sessionId) : undefined
    return {
      id: d.id,
      status: d.status,
      createdAt: d.created_at,
      sessionName: sess?.name ?? null,
      sessionDate: sess?.scheduled_date ?? null,
      payload: p,
    }
  })

  // ─── Placement assessment drafts ─────────────────────────────
  // Created when a director starts a placement assessment from an intake candidate.
  // Still a proposed_actions safe bridge — no player, no roster, no billing, no parent comms.

  const { data: assessmentDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at')
    .eq('academy_id', academyId)
    .eq('status', 'pending_review')
    .eq('target_module', 'placement_assessment_draft')
    .order('created_at', { ascending: false })
    .limit(100)

  const allAssessmentDraftRows: Array<{ id: string; status: string; proposed_payload: unknown; created_at: string }> =
    (assessmentDraftRows ?? []) as any

  const filteredAssessmentDrafts = allAssessmentDraftRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'placement_assessment_draft_v1'
  })

  // session_id lives in the payload
  const assessmentSessionIds = Array.from(
    new Set(
      filteredAssessmentDrafts
        .map(d => {
          const p = d.proposed_payload as Record<string, unknown>
          return p?.session_id as string | null
        })
        .filter((id): id is string => id !== null)
    )
  )

  const assessmentSessionMap = new Map<string, { id: string; name: string | null; scheduled_date: string }>()
  if (assessmentSessionIds.length > 0) {
    const { data: aSess } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date')
      .in('id', assessmentSessionIds)
      .eq('academy_id', academyId)
    for (const s of (aSess ?? [])) {
      assessmentSessionMap.set(s.id, s)
    }
  }

  const enrichedAssessmentDrafts: EnrichedAssessmentDraftItem[] = filteredAssessmentDrafts.map(d => {
    const p = d.proposed_payload as PlacementAssessmentDraftPayload
    const sessionId = p?.session_id ?? null
    const sess = sessionId ? assessmentSessionMap.get(sessionId) : undefined
    return {
      id: d.id,
      status: d.status,
      createdAt: d.created_at,
      sessionName: sess?.name ?? null,
      sessionDate: sess?.scheduled_date ?? null,
      payload: p,
    }
  })

  // ─── Placement recommendation drafts ─────────────────────────
  // Created when a director generates a recommendation from an assessment draft.
  // Still a proposed_actions safe bridge — no player, no roster, no billing, no parent comms.

  const { data: recommendationDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved'])
    .eq('target_module', 'placement_recommendation_draft')
    .order('created_at', { ascending: false })
    .limit(100)

  const allRecommendationDraftRows: Array<{ id: string; status: string; proposed_payload: unknown; created_at: string }> =
    (recommendationDraftRows ?? []) as any

  const filteredRecommendationDrafts = allRecommendationDraftRows.filter(d => {
    const p = d.proposed_payload as Record<string, unknown>
    return p?.draft_type === 'placement_recommendation_draft_v1'
  })

  const recommendationSessionIds = Array.from(
    new Set(
      filteredRecommendationDrafts
        .map(d => {
          const p = d.proposed_payload as Record<string, unknown>
          return p?.session_id as string | null
        })
        .filter((id): id is string => id !== null)
    )
  )

  const recommendationSessionMap = new Map<string, { id: string; name: string | null; scheduled_date: string }>()
  if (recommendationSessionIds.length > 0) {
    const { data: rSess } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date')
      .in('id', recommendationSessionIds)
      .eq('academy_id', academyId)
    for (const s of (rSess ?? [])) {
      recommendationSessionMap.set(s.id, s)
    }
  }

  const allEnrichedRecommendationDrafts: EnrichedRecommendationDraftItem[] = filteredRecommendationDrafts.map(d => {
    const p = d.proposed_payload as PlacementRecommendationDraftPayload
    const sessionId = p?.session_id ?? null
    const sess = sessionId ? recommendationSessionMap.get(sessionId) : undefined
    return {
      id: d.id,
      status: d.status,
      createdAt: d.created_at,
      sessionName: sess?.name ?? null,
      sessionDate: sess?.scheduled_date ?? null,
      payload: p,
    }
  })
  const pendingRecommendationDrafts = allEnrichedRecommendationDrafts.filter(d => d.status === 'pending_review')
  const approvedRecommendationDrafts = allEnrichedRecommendationDrafts.filter(d => d.status === 'approved')
  const enrichedRecommendationDrafts = allEnrichedRecommendationDrafts

  // ─── Academy groups for placement group selector ──────────────
  // Fetched here (server component) and passed to PlacementRecommendationDraftCard.
  // Only active groups scoped to this academy. Used to populate real UUID group selector.
  const { data: groupRows } = await supabase
    .from('groups')
    .select('id, name, track')
    .eq('academy_id', academyId)
    .eq('is_active', true)
    .order('name')

  const academyGroups: AcademyGroup[] = (groupRows ?? []).map(g => ({
    id: g.id,
    name: g.name,
    track: g.track ?? null,
  }))

  // Oldest pending date per category (arrays are sorted newest-first, so last item = oldest)
  const oldestPendingDates = {
    session_recaps: pendingDrafts.at(-1)?.createdAt ?? null,
    priorities: pendingPriorityDrafts.at(-1)?.createdAt ?? null,
    evidence: pendingEvidenceDrafts.at(-1)?.createdAt ?? null,
    attendance: pendingAttendanceDrafts.at(-1)?.createdAt ?? null,
    curriculum: pendingCurriculumOverrideDrafts.at(-1)?.createdAt ?? null,
    voice_intake: pendingVoiceIntakeDrafts.at(-1)?.createdAt ?? null,
    wrap_ups: pendingWrapUpDrafts.at(-1)?.createdAt ?? null,
    player_observations: pendingObservationDrafts.at(-1)?.createdAt ?? null,
    development_summaries: pendingSummaryDrafts.at(-1)?.createdAt ?? null,
    placement_review: pendingPlacementReviews.at(-1)?.createdAt ?? null,
    placement_intake: enrichedIntakeCandidates.at(-1)?.createdAt ?? null,
    placement_assessment: enrichedAssessmentDrafts.at(-1)?.createdAt ?? null,
    placement_recommendation: enrichedRecommendationDrafts.at(-1)?.createdAt ?? null,
    captures: generalCaptures.at(-1)?.createdAt ?? null,
  }

  // Compute default tab — operational tabs take priority, fallback to attendance
  const defaultTab = [
    { value: 'attendance', pending: pendingAttendanceDrafts.length },
    { value: 'placement_review', pending: pendingPlacementReviews.length },
    { value: 'placement_intake', pending: enrichedIntakeCandidates.length + enrichedAssessmentDrafts.length + enrichedRecommendationDrafts.length },
    { value: 'player_observations', pending: pendingObservationDrafts.length },
    { value: 'development_summaries', pending: pendingSummaryDrafts.length },
    { value: 'wrap_ups', pending: pendingWrapUpDrafts.length },
    { value: 'session_recaps', pending: pendingDrafts.length },
    { value: 'priorities', pending: pendingPriorityDrafts.length },
    { value: 'evidence', pending: pendingEvidenceDrafts.length },
    { value: 'curriculum', pending: pendingCurriculumOverrideDrafts.length },
    { value: 'voice_intake', pending: pendingVoiceIntakeDrafts.length },
    { value: 'captures', pending: generalCaptures.length },
  ].find(t => t.pending > 0)?.value ?? 'attendance'

  const requestedTabParam = searchParams.tab
  const resolvedTab = requestedTabParam ? (VALID_TAB_PARAMS[requestedTabParam] ?? null) : null
  const activeDefaultTab = resolvedTab ?? defaultTab

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
        observationPendingCount={pendingObservationDrafts.length}
        observationApprovedCount={approvedObservationDrafts.length}
        summaryPendingCount={pendingSummaryDrafts.length}
        summaryApprovedCount={approvedSummaryDrafts.length}
        placementReviewCount={pendingPlacementReviews.length}
        intakeCandidateCount={enrichedIntakeCandidates.length}
        assessmentDraftCount={enrichedAssessmentDrafts.length}
        recommendationDraftCount={enrichedRecommendationDrafts.length}
        captureCount={generalCaptures.length}
        oldestPendingDates={oldestPendingDates}
      />

      {/* All clear state — shown above tabs when no pending items remain */}
      {(
        pendingDrafts.length + pendingPriorityDrafts.length + pendingEvidenceDrafts.length +
        pendingAttendanceDrafts.length + pendingCurriculumOverrideDrafts.length +
        pendingVoiceIntakeDrafts.length + pendingWrapUpDrafts.length +
        pendingObservationDrafts.length + pendingSummaryDrafts.length + pendingPlacementReviews.length +
        enrichedIntakeCandidates.length + enrichedAssessmentDrafts.length + enrichedRecommendationDrafts.length + generalCaptures.length
      ) === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-status-green/10 border border-status-green/20">
          <CheckCircle className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-sm text-status-green font-medium">
            All caught up — no pending items in the queue.
          </p>
        </div>
      )}

      <Tabs defaultValue={activeDefaultTab}>
        <TabsList scrollable>
          <TabsTrigger value="attendance">
            <TabLabel
              label="Attendance"
              pending={pendingAttendanceDrafts.length}
              ready={approvedAttendanceDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="placement_review">
            <TabLabel
              label="Placement Review"
              pending={pendingPlacementReviews.length}
              ready={0}
            />
          </TabsTrigger>
          <TabsTrigger value="placement_intake">
            <TabLabel
              label="Intake Candidates"
              pending={enrichedIntakeCandidates.length + enrichedAssessmentDrafts.length + enrichedRecommendationDrafts.length}
              ready={0}
            />
          </TabsTrigger>
          <TabsTrigger value="player_observations">
            <TabLabel
              label="Player Observations"
              pending={pendingObservationDrafts.length}
              ready={approvedObservationDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="development_summaries">
            <TabLabel
              label="Dev Summaries"
              pending={pendingSummaryDrafts.length}
              ready={approvedSummaryDrafts.length}
            />
          </TabsTrigger>
          <TabsTrigger value="wrap_ups">
            <TabLabel
              label="Session Wrap-Ups"
              pending={pendingWrapUpDrafts.length}
              ready={approvedWrapUpDrafts.length}
            />
          </TabsTrigger>
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
          <TabsTrigger value="captures">
            <TabLabel
              label="Captures"
              pending={generalCaptures.length}
              ready={0}
            />
          </TabsTrigger>
        </TabsList>

        {/* ─── Attendance tab ─── */}
        <TabsContent value="attendance" className="pt-6 space-y-4">
          <p className="text-[10px] text-text-muted px-1">Records session attendance for rostered players. Approve to confirm the proposed changes, then apply to write to attendance records. Unexpected attendees create placement review follow-ups — no player is created automatically.</p>
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
                    description="When coaches flag unexpected attendees or record attendance exceptions, they appear here for review before any attendance is written."
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

        {/* ─── Placement Review tab ─── */}
        <TabsContent value="placement_review" className="pt-6 space-y-4">
          <p className="text-[10px] text-text-muted px-1">Unexpected attendees flagged by coaches during session wrap-up. Choose a next step for each individual. No player profile, roster entry, billing, or parent communication has been created.</p>

          {/* Pending — need a director decision */}
          <section className="space-y-3">
            {pendingPlacementReviews.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<UserSearch className="w-5 h-5" />}
                    title="No placement review items"
                    description="When a director applies an attendance exception draft that includes unexpected attendees, follow-up items appear here for a decision on whether to start intake, follow up later, or dismiss."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingPlacementReviews.map(item => (
                  <PlacementReviewCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* Follow-Up Later — parked, no urgent action required */}
          {followUpPlacementReviews.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="label-xs">Follow-Up Later</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-blue/10 text-status-blue border border-status-blue/30">
                  {followUpPlacementReviews.length}
                </span>
              </div>
              <p className="text-[10px] text-text-muted px-1">Parked by the director for later review — no urgent action needed now.</p>
              <div className="space-y-4">
                {followUpPlacementReviews.map(item => (
                  <PlacementReviewCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        {/* ─── Placement Intake tab ─── */}
        <TabsContent value="placement_intake" className="pt-6 space-y-6">
          <p className="text-[10px] text-text-muted px-1">Director-controlled intake pipeline. No player profile, roster entry, billing, or parent communication is created at any stage until the full placement assessment is approved. Each step requires explicit director action.</p>

          {/* Pending intake candidates */}
          <section className="space-y-3">
            <p className="label-xs">Pending Intake Candidates</p>
            {enrichedIntakeCandidates.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={<UserPlus className="w-5 h-5" />}
                    title="No intake candidates"
                    description="Intake candidates appear here when a director chooses 'Start Placement Intake' from the Placement Review tab. No player record is created until the full placement assessment is complete."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {enrichedIntakeCandidates.map(item => (
                  <PlacementIntakeCandidateCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* Assessment drafts in progress */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="label-xs">Placement Assessments In Progress</p>
              {enrichedAssessmentDrafts.length > 0 && (
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-blue/10 text-status-blue border border-status-blue/30">
                  {enrichedAssessmentDrafts.length}
                </span>
              )}
            </div>
            {enrichedAssessmentDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={<ClipboardList className="w-5 h-5" />}
                    title="No assessments in progress"
                    description="When you start a placement assessment from an intake candidate above, an editable assessment draft appears here. No player record is created until the assessment is complete and a recommendation is approved."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {enrichedAssessmentDrafts.map(item => (
                  <PlacementAssessmentDraftCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* Placement recommendation drafts */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="label-xs">Placement Recommendations</p>
              {pendingRecommendationDrafts.length > 0 && (
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-orange/10 text-status-orange border border-status-orange/30">
                  {pendingRecommendationDrafts.length} pending
                </span>
              )}
              {approvedRecommendationDrafts.length > 0 && (
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                  {approvedRecommendationDrafts.length} approved
                </span>
              )}
            </div>
            {allEnrichedRecommendationDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={<Target className="w-5 h-5" />}
                    title="No recommendations yet"
                    description="After completing an assessment above, click 'Generate Placement Recommendation' to create a recommendation draft. Director must approve before any player record is created."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allEnrichedRecommendationDrafts.map(item => (
                  <PlacementRecommendationDraftCard key={item.id} item={item} academyGroups={academyGroups} />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ─── Player Observations tab ─── */}
        <TabsContent value="player_observations" className="pt-6 space-y-4">
          <p className="text-[10px] text-text-muted px-1">Coach notes on individual players submitted during session wrap-up. Not added to player profiles until you apply them. Not visible to players or parents.</p>
          {approvedObservationDrafts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="label-xs">Approved — Ready to Apply</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                  {approvedObservationDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedObservationDrafts.map(draft => (
                  <WrapUpObservationDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            {approvedObservationDrafts.length > 0 && pendingObservationDrafts.length > 0 && (
              <p className="label-xs">Pending Review</p>
            )}
            {pendingObservationDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Users className="w-5 h-5" />}
                    title="No pending player observation drafts"
                    description="When coaches add player notes during a session wrap-up, individual observation drafts appear here for director review before being applied to player profiles."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingObservationDrafts.map(draft => (
                  <WrapUpObservationDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ─── Development Summaries tab ─── */}
        <TabsContent value="development_summaries" className="pt-6 space-y-4">
          <p className="text-[10px] text-text-muted px-1">Director-assembled development summary updates built from recent observations. Applying overwrites the player's current development summary. Not visible to players or parents until applied.</p>
          {approvedSummaryDrafts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="label-xs">Approved — Ready to Apply</p>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/30">
                  {approvedSummaryDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedSummaryDrafts.map(draft => (
                  <DevelopmentSummaryDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            {approvedSummaryDrafts.length > 0 && pendingSummaryDrafts.length > 0 && (
              <p className="label-xs">Pending Review</p>
            )}
            {pendingSummaryDrafts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<ClipboardList className="w-5 h-5" />}
                    title="No pending development summary drafts"
                    description="Use the 'Draft Development Summary Update' button on a player profile to assemble a draft from recent observations. It will appear here for director review before being applied."
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingSummaryDrafts.map(draft => (
                  <DevelopmentSummaryDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ─── Session Wrap-Ups tab ─── */}
        <TabsContent value="wrap_ups" className="pt-6 space-y-4">
          <p className="text-[10px] text-text-muted px-1">Guided coach recaps submitted after sessions. Review for accuracy, then approve and apply to record session actuals. Applying also creates individual player observation drafts.</p>
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
                    description="When coaches complete the guided wrap-up after a session, their summary appears here for director review before session actuals and player observations are recorded."
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

        {/* ─── Session Recaps tab ─── */}
        <TabsContent value="session_recaps" className="pt-6 space-y-4">
          <p className="text-[10px] text-text-muted px-1">AI-structured session recap drafts. Approve to confirm the proposed structure, then apply to write the structured data to the session record.</p>
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
                    description="When a coach saves a session recap and it is structured by AI, the draft appears here for review before being applied to the session record."
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
          <p className="text-[10px] text-text-muted px-1">Training priority recommendations for individual players. Approve to confirm, then apply to update a player's current focus areas. Not visible to players or parents until applied.</p>
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
                    description="Priority recommendations are created from evidence on player profiles. They appear here for director approval before updating a player's focus areas."
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
          <p className="text-[10px] text-text-muted px-1">Links connecting a performance moment to a curriculum requirement. Approve and apply to record evidence in the player's development record.</p>
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
                    description="Evidence links are created from a player's requirement page. They appear here for director approval before being recorded in the player's development record."
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

        {/* ─── Curriculum tab ─── */}
        <TabsContent value="curriculum" className="pt-6 space-y-4">
          <p className="text-[10px] text-text-muted px-1">Curriculum override suggestions — changes to the standard training plan. Approve and apply to modify what the curriculum prescribes. Not visible to players or parents until applied.</p>
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
                    description="Curriculum customizations created on the Curriculum page appear here for director approval before modifying the training plan."
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

        {/* ─── Voice Intake tab ─── */}
        <TabsContent value="voice_intake" className="pt-6 space-y-4">
          <p className="text-[10px] text-text-muted px-1">Unresolved voice commands requiring a director decision. Approve to confirm intent, then execute to write to the relevant record. Nothing is written automatically.</p>
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
                    description="Voice commands submitted from the Command Center or session pages appear here for director review before any data is written."
                  />
                </CardContent>
              </Card>
            ) : (
              <VoiceIntakeBatchPanel pending={pendingVoiceIntakeDrafts} />
            )}
          </section>
        </TabsContent>

        {/* ─── Captures tab ─── */}
        <TabsContent value="captures" className="pt-6 space-y-4">
          <p className="text-[10px] text-text-muted px-1">Unrouted quick-capture notes not yet assigned to a player. Route each one to a player profile or dismiss it — no data has been written yet.</p>
          <section className="space-y-3">
            {generalCaptures.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Inbox className="w-5 h-5" />}
                    title="No unrouted captures"
                    description="Quick captures made outside a player profile appear here. Use the + Capture button anywhere in the director area to add one."
                  />
                </CardContent>
              </Card>
            ) : (
              <CapturesBatchPanel captures={generalCaptures} players={playerOptions} />
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
  observationPendingCount,
  observationApprovedCount,
  summaryPendingCount,
  summaryApprovedCount,
  placementReviewCount,
  intakeCandidateCount,
  assessmentDraftCount,
  recommendationDraftCount,
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
  observationPendingCount: number
  observationApprovedCount: number
  summaryPendingCount: number
  summaryApprovedCount: number
  placementReviewCount: number
  intakeCandidateCount: number
  assessmentDraftCount: number
  recommendationDraftCount: number
  captureCount: number
  oldestPendingDates: Record<string, string | null>
}) {
  const totalPending = pendingCount + priorityPendingCount + evidencePendingCount + attendancePendingCount + curriculumOverridePendingCount + voiceIntakePendingCount + wrapUpPendingCount + observationPendingCount + summaryPendingCount + placementReviewCount + intakeCandidateCount + assessmentDraftCount + recommendationDraftCount + captureCount
  const totalReadyToApply = approvedCount + priorityApprovedCount + evidenceApprovedCount + attendanceApprovedCount + curriculumOverrideApprovedCount + voiceIntakeApprovedCount + wrapUpApprovedCount + observationApprovedCount + summaryApprovedCount

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

      {/* Command center overview — grouped by workflow area */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-surface-raised border border-border px-4 py-3 space-y-2">
          <p className="text-[9px] uppercase tracking-widest text-status-orange/80 font-semibold">Operations</p>
          <div className="space-y-1.5">
            <CategoryRow label="Attendance" pending={attendancePendingCount} ready={attendanceApprovedCount} oldest={oldestPendingDates['attendance']} />
            <CategoryRow label="Placement Review" pending={placementReviewCount} ready={0} oldest={oldestPendingDates['placement_review']} />
            <CategoryRow label="Intake Candidates" pending={intakeCandidateCount} ready={0} oldest={oldestPendingDates['placement_intake']} />
            <CategoryRow label="In Assessment" pending={assessmentDraftCount} ready={0} oldest={oldestPendingDates['placement_assessment']} />
            <CategoryRow label="Recommendation" pending={recommendationDraftCount} ready={0} oldest={oldestPendingDates['placement_recommendation']} />
          </div>
        </div>
        <div className="rounded-xl bg-surface-raised border border-border px-4 py-3 space-y-2">
          <p className="text-[9px] uppercase tracking-widest text-text-muted font-semibold">Player Development</p>
          <div className="space-y-1.5">
            <CategoryRow label="Observations" pending={observationPendingCount} ready={observationApprovedCount} oldest={oldestPendingDates['player_observations']} />
            <CategoryRow label="Dev Summaries" pending={summaryPendingCount} ready={summaryApprovedCount} oldest={oldestPendingDates['development_summaries']} />
            <CategoryRow label="Priorities" pending={priorityPendingCount} ready={priorityApprovedCount} oldest={oldestPendingDates['priorities']} />
            <CategoryRow label="Evidence" pending={evidencePendingCount} ready={evidenceApprovedCount} oldest={oldestPendingDates['evidence']} />
          </div>
        </div>
        <div className="rounded-xl bg-surface-raised border border-border px-4 py-3 space-y-2">
          <p className="text-[9px] uppercase tracking-widest text-text-muted font-semibold">Session Review</p>
          <div className="space-y-1.5">
            <CategoryRow label="Wrap-Ups" pending={wrapUpPendingCount} ready={wrapUpApprovedCount} oldest={oldestPendingDates['wrap_ups']} />
            <CategoryRow label="Recaps" pending={pendingCount} ready={approvedCount} oldest={oldestPendingDates['session_recaps']} />
          </div>
        </div>
        <div className="rounded-xl bg-surface-raised border border-border px-4 py-3 space-y-2">
          <p className="text-[9px] uppercase tracking-widest text-text-muted font-semibold">System</p>
          <div className="space-y-1.5">
            <CategoryRow label="Curriculum" pending={curriculumOverridePendingCount} ready={curriculumOverrideApprovedCount} oldest={oldestPendingDates['curriculum']} />
            <CategoryRow label="Voice Intake" pending={voiceIntakePendingCount} ready={voiceIntakeApprovedCount} oldest={oldestPendingDates['voice_intake']} />
            <CategoryRow label="Captures" pending={captureCount} ready={0} oldest={oldestPendingDates['captures']} />
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryRow({
  label,
  pending,
  ready,
  oldest,
}: {
  label: string
  pending: number
  ready: number
  oldest: string | null | undefined
}) {
  return (
    <div className="flex items-center justify-between gap-1 min-w-0">
      <p className="text-[9px] text-text-muted truncate">{label}</p>
      <div className="flex items-center gap-1 shrink-0">
        {pending > 0 ? (
          <span className="text-[9px] font-mono font-semibold text-status-orange">{pending}</span>
        ) : (
          <span className="text-[9px] font-mono text-border">—</span>
        )}
        {ready > 0 && (
          <span className="text-[9px] font-mono font-semibold text-lime ml-1">{ready}↑</span>
        )}
        {pending > 0 && oldest && (
          <span className="text-[9px] text-text-muted ml-0.5">· {relativeAge(oldest)}</span>
        )}
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
