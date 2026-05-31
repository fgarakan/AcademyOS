import Link from 'next/link'
import { ArrowLeft, BookOpen, CheckCircle, Users } from 'lucide-react'
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
import { DonnaDraftCard } from './DonnaDraftCard'
import { CoachCurriculumSuggestionCard } from './CoachCurriculumSuggestionCard'
import type { CoachCurriculumSuggestionItem } from './CoachCurriculumSuggestionCard'
import type { DonnaDraftItem } from './DonnaDraftCard'
import { loadWrapUpReviewSurface } from '@/lib/donna/wrapUpReviewSurfaceLoader'
import { WrapUpCoveragePanel } from './WrapUpCoveragePanel'
import { DonnaReviewBriefPanel } from './DonnaReviewBriefPanel'
import { DonnaReviewTabGuide } from './DonnaReviewTabGuide'

const VALID_TAB_PARAMS: Record<string, string> = {
  // Director-facing section names (Sprint 247)
  'needs-approval': 'needs_approval',
  'player-updates': 'player_updates',
  'curriculum-session': 'curriculum_session',
  'completed': 'completed',
  // Legacy aliases — old URL params still work, route to the correct section
  'wrap-ups': 'needs_approval',
  'session-wrap-ups': 'needs_approval',
  'attendance': 'needs_approval',
  'placement-review': 'needs_approval',
  'placement-intake': 'needs_approval',
  'voice-intake': 'needs_approval',
  'captures': 'needs_approval',
  'player-observations': 'player_updates',
  'development-summaries': 'player_updates',
  'priorities': 'player_updates',
  'evidence': 'player_updates',
  'session-recaps': 'curriculum_session',
  'curriculum': 'curriculum_session',
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
    reviewer_notes?: string | null
  }

  const rawDb = supabase as any
  const { data: draftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed', 'rejected'])
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
  const clarificationNeededDrafts = allEnriched.filter(d => d.status === 'clarification_needed')
  const rejectedDrafts = allEnriched.filter(d => d.status === 'rejected')

  // ─── Priority recommendation drafts ─────────────────────────

  // 9. Fetch pending + approved priority recommendation drafts — scoped to this academy
  //    Approved drafts are included so directors can apply them here
  const { data: priorityDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed', 'rejected'])
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
  const clarificationNeededPriorityDrafts = enrichedPriorityDrafts.filter(d => d.status === 'clarification_needed')
  const rejectedPriorityDrafts = enrichedPriorityDrafts.filter(d => d.status === 'rejected')

  // ─── Evidence requirement link drafts ─────────────────────────

  // 14. Fetch pending + approved evidence requirement link drafts — scoped to this academy
  const { data: evidenceDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed', 'rejected'])
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
  const clarificationNeededEvidenceDrafts = enrichedEvidenceDrafts.filter(d => d.status === 'clarification_needed')
  const rejectedEvidenceDrafts = enrichedEvidenceDrafts.filter(d => d.status === 'rejected')

  // ─── Attendance exception drafts ─────────────────────────────

  // 19. Fetch pending + approved attendance exception drafts — scoped to this academy
  const { data: attendanceExceptionRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed', 'rejected'])
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
  const clarificationNeededAttendanceDrafts = enrichedAttendanceDrafts.filter(d => d.status === 'clarification_needed')
  const rejectedAttendanceDrafts = enrichedAttendanceDrafts.filter(d => d.status === 'rejected')

  // ─── Curriculum override drafts ────────────────────────────────

  // 24. Fetch pending + approved curriculum override drafts — scoped to this academy
  const { data: curriculumOverrideDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed', 'rejected'])
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
  const clarificationNeededCurriculumOverrideDrafts = enrichedCurriculumOverrideDrafts.filter(d => d.status === 'clarification_needed')
  const rejectedCurriculumOverrideDrafts = enrichedCurriculumOverrideDrafts.filter(d => d.status === 'rejected')

  // ─── Coach curriculum suggestions ─────────────────────────────

  const { data: coachSuggestionRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .eq('target_module', 'curriculum_builder')
    .in('status', ['pending_review', 'approved', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(50)

  const filteredCoachSuggestions = ((coachSuggestionRows ?? []) as Array<{
    id: string; status: string; proposed_payload: Record<string, unknown>; created_at: string; proposed_by_id: string
  }>).filter(d => d.proposed_payload?.source === 'coach_curriculum_suggestion')

  const coachSuggestionProposerIds = Array.from(new Set(filteredCoachSuggestions.map(d => d.proposed_by_id)))
  const coachSuggestionProposerMap = new Map<string, string>()
  if (coachSuggestionProposerIds.length > 0) {
    const { data: csp } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', coachSuggestionProposerIds)
    for (const p of (csp ?? [])) {
      coachSuggestionProposerMap.set(p.id, p.display_name)
    }
  }

  const enrichedCoachSuggestions = filteredCoachSuggestions.map(d => ({
    id: d.id,
    status: d.status,
    createdAt: d.created_at,
    proposerName: coachSuggestionProposerMap.get(d.proposed_by_id) ?? null,
    payload: d.proposed_payload as unknown as import('./CoachCurriculumSuggestionCard').CoachCurriculumSuggestionPayload,
  }))

  const pendingCoachSuggestions = enrichedCoachSuggestions.filter(d => d.status === 'pending_review')

  // ─── Voice intake drafts ───────────────────────────────────────

  // 28. Fetch pending + approved voice intake drafts — scoped to this academy
  const { data: voiceIntakeDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, proposed_payload, created_at, proposed_by_id, risk_level')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed', 'rejected'])
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
  const clarificationNeededVoiceIntakeDrafts = enrichedVoiceIntakeDrafts.filter(d => d.status === 'clarification_needed')
  const rejectedVoiceIntakeDrafts = enrichedVoiceIntakeDrafts.filter(d => d.status === 'rejected')

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
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id, reviewer_notes')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed', 'rejected'])
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
      reviewerNotes: d.reviewer_notes ?? null,
    }
  })

  const pendingWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'pending_review')
  const approvedWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'approved')
  const clarificationNeededWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'clarification_needed')
  const rejectedWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'rejected')

  // ─── Player observation drafts (coach wrap-up observations) ──

  const { data: observationDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'clarification_needed', 'rejected'])
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
  const clarificationNeededObservationDrafts = enrichedObservationDrafts.filter(d => d.status === 'clarification_needed')
  const rejectedObservationDrafts = enrichedObservationDrafts.filter(d => d.status === 'rejected')

  // ─── Development summary drafts ───────────────────────────────

  const { data: summaryDraftRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, target_object_id, proposed_payload, created_at, proposed_by_id')
    .eq('academy_id', academyId)
    .in('status', ['pending_review', 'approved', 'rejected'])
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
  const rejectedSummaryDrafts = enrichedSummaryDrafts.filter(d => d.status === 'rejected')

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

  // ─── DONNA-generated parent communication drafts ─────────────
  const { data: parentCommRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, created_at, action_label, proposed_payload')
    .eq('academy_id', academyId)
    .eq('target_module', 'parent_communication')
    .in('status', ['pending_review'])
    .order('created_at', { ascending: false })
    .limit(50)

  const parentCommDrafts: DonnaDraftItem[] = ((parentCommRows ?? []) as Array<{
    id: string; status: string; created_at: string; action_label: string | null; proposed_payload: Record<string, unknown>
  }>).map(r => {
    const p = r.proposed_payload ?? {}
    const sections = (p.draft_sections as Record<string, string> | null) ?? {}
    const contentLines: string[] = []
    if (sections.working_on) contentLines.push(`Working on: ${String(sections.working_on).slice(0, 200)}`)
    if (sections.improved) contentLines.push(`Improved: ${String(sections.improved).slice(0, 200)}`)
    if (sections.whats_next) contentLines.push(`What's next: ${String(sections.whats_next).slice(0, 200)}`)
    return {
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      actionLabel: r.action_label,
      draftType: String(p.draft_type ?? 'parent_update'),
      warnings: (p.warnings as string[] | null) ?? [],
      contentLines,
    }
  })

  // ─── DONNA-generated level readiness drafts ───────────────────
  const { data: levelReviewRows } = await rawDb
    .from('proposed_actions')
    .select('id, status, created_at, action_label, proposed_payload')
    .eq('academy_id', academyId)
    .eq('target_module', 'level_review')
    .in('status', ['pending_review'])
    .order('created_at', { ascending: false })
    .limit(50)

  const levelReviewDrafts: DonnaDraftItem[] = ((levelReviewRows ?? []) as Array<{
    id: string; status: string; created_at: string; action_label: string | null; proposed_payload: Record<string, unknown>
  }>).map(r => {
    const p = r.proposed_payload ?? {}
    const evidencePresent = (p.evidence_present as string[] | null) ?? []
    const evidenceMissing = (p.evidence_missing as string[] | null) ?? []
    const contentLines: string[] = []
    if (p.readiness_summary) contentLines.push(String(p.readiness_summary).slice(0, 300))
    if (evidencePresent.length > 0) contentLines.push(`Evidence present (${evidencePresent.length}): ${evidencePresent.slice(0, 3).join(', ')}`)
    if (evidenceMissing.length > 0) contentLines.push(`Evidence missing (${evidenceMissing.length}): ${evidenceMissing.slice(0, 3).join(', ')}`)
    return {
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      actionLabel: r.action_label,
      draftType: String(p.draft_type ?? 'level_readiness'),
      warnings: (p.warnings as string[] | null) ?? [],
      contentLines,
    }
  })

  // ─── Section counts for the 4 director-facing tabs ────────────

  // Needs Approval: items waiting for director action (pending or approved-but-not-applied)
  const needsApprovalPending =
    pendingWrapUpDrafts.length +
    pendingAttendanceDrafts.length +
    pendingPlacementReviews.length +
    enrichedIntakeCandidates.length +
    enrichedAssessmentDrafts.length +
    pendingRecommendationDrafts.length +
    pendingVoiceIntakeDrafts.length +
    generalCaptures.length +
    parentCommDrafts.length +
    levelReviewDrafts.length

  const needsApprovalReady =
    approvedWrapUpDrafts.length +
    approvedAttendanceDrafts.length +
    approvedRecommendationDrafts.length +
    approvedVoiceIntakeDrafts.length

  // Player Updates: items affecting player records
  const playerUpdatesPending =
    pendingObservationDrafts.length +
    pendingSummaryDrafts.length +
    pendingPriorityDrafts.length +
    pendingEvidenceDrafts.length

  const playerUpdatesReady =
    approvedObservationDrafts.length +
    approvedSummaryDrafts.length +
    approvedPriorityDrafts.length +
    approvedEvidenceDrafts.length

  // Curriculum / Session Changes
  const curriculumSessionPending = pendingDrafts.length + pendingCurriculumOverrideDrafts.length + pendingCoachSuggestions.length
  const curriculumSessionReady = approvedDrafts.length + approvedCurriculumOverrideDrafts.length

  // Completed: resolved items (sent back for clarification, rejected)
  const completedCount =
    clarificationNeededWrapUpDrafts.length +
    rejectedWrapUpDrafts.length +
    clarificationNeededObservationDrafts.length +
    rejectedObservationDrafts.length +
    clarificationNeededPriorityDrafts.length +
    rejectedPriorityDrafts.length +
    clarificationNeededEvidenceDrafts.length +
    rejectedEvidenceDrafts.length +
    clarificationNeededAttendanceDrafts.length +
    rejectedAttendanceDrafts.length +
    clarificationNeededCurriculumOverrideDrafts.length +
    rejectedCurriculumOverrideDrafts.length +
    rejectedSummaryDrafts.length +
    clarificationNeededDrafts.length +
    rejectedDrafts.length +
    clarificationNeededVoiceIntakeDrafts.length +
    rejectedVoiceIntakeDrafts.length

  // Oldest pending item age per section — used to surface stale drafts in summary cards
  function oldestDaysAgo(items: Array<{ createdAt: string }>): number | null {
    if (items.length === 0) return null
    const now = Date.now()
    const oldest = items.reduce((min, item) => {
      const t = new Date(item.createdAt).getTime()
      return t < min ? t : min
    }, now)
    return Math.floor((now - oldest) / (1000 * 60 * 60 * 24))
  }

  const needsApprovalOldestDays = oldestDaysAgo([
    ...pendingWrapUpDrafts,
    ...pendingAttendanceDrafts,
    ...pendingPlacementReviews,
    ...enrichedIntakeCandidates,
    ...enrichedAssessmentDrafts,
    ...pendingRecommendationDrafts,
    ...pendingVoiceIntakeDrafts,
    ...generalCaptures,
    ...parentCommDrafts,
    ...levelReviewDrafts,
  ])

  const playerUpdatesOldestDays = oldestDaysAgo([
    ...pendingObservationDrafts,
    ...pendingSummaryDrafts,
    ...pendingPriorityDrafts,
    ...pendingEvidenceDrafts,
  ])

  const curriculumSessionOldestDays = oldestDaysAgo([
    ...pendingDrafts,
    ...pendingCurriculumOverrideDrafts,
  ])

  // Stale max — oldest pending item across all sections
  const staleDaysMax = [needsApprovalOldestDays, playerUpdatesOldestDays, curriculumSessionOldestDays]
    .filter((d): d is number => d !== null)
    .reduce((max, d) => Math.max(max, d), -1)
  const staleDaysMaxValue = staleDaysMax >= 0 ? staleDaysMax : null

  // Default tab — first section with pending items, fallback to needs_approval
  const defaultTab = [
    { value: 'needs_approval', pending: needsApprovalPending },
    { value: 'player_updates', pending: playerUpdatesPending },
    { value: 'curriculum_session', pending: curriculumSessionPending },
  ].find(t => t.pending > 0)?.value ?? 'needs_approval'

  const requestedTabParam = searchParams.tab
  const resolvedTab = requestedTabParam ? (VALID_TAB_PARAMS[requestedTabParam] ?? null) : null
  const activeDefaultTab = resolvedTab ?? defaultTab

  // Wrap-up coverage context — Sprint 532
  const wrapUpCoverage = await loadWrapUpReviewSurface(supabase, academyId)

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-5xl">

      {/* Back link */}
      <Link
        href="/director"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      {/* Page header — Sprint 1036: safety note promoted to subtitle level */}
      <div className="space-y-1">
        <p className="page-eyebrow">Operations</p>
        <h1 className="page-title">Review Queue</h1>
        <p className="page-subtitle">
          Everything here waits for your decision. Nothing is applied until you approve it.
        </p>
      </div>

      {/* DONNA review brief panel — Sprint 1046 */}
      <DonnaReviewBriefPanel
        totalPending={needsApprovalPending + playerUpdatesPending + curriculumSessionPending}
        needsApprovalCount={needsApprovalPending}
        playerUpdatesCount={playerUpdatesPending}
        curriculumSessionCount={curriculumSessionPending}
        readyToApplyCount={needsApprovalReady + playerUpdatesReady + curriculumSessionReady}
        staleDaysMax={staleDaysMaxValue}
        wrapUpsPending={pendingWrapUpDrafts.length}
        attendanceCount={pendingAttendanceDrafts.length}
        parentCommCount={parentCommDrafts.length}
        academyId={academyId}
      />

      {/* Sprint 969: data-donna-focus-id="review-queue-primary" wraps the entire Tabs component
          so DONNA can reliably highlight the review queue regardless of which tab is active.
          Always present when the page renders — more stable than conditional section wrappers. */}
      <div data-donna-focus-id="review-queue-primary">
      <Tabs defaultValue={activeDefaultTab}>
        <TabsList>
          <TabsTrigger value="needs_approval">
            <TabLabel label="For Your Review" pending={needsApprovalPending} ready={needsApprovalReady} />
          </TabsTrigger>
          <TabsTrigger value="player_updates">
            <TabLabel label="Player Signals" pending={playerUpdatesPending} ready={playerUpdatesReady} />
          </TabsTrigger>
          <TabsTrigger value="curriculum_session">
            <TabLabel label="Sessions & Curriculum" pending={curriculumSessionPending} ready={curriculumSessionReady} />
          </TabsTrigger>
          <TabsTrigger value="completed">
            <TabLabel label="Done" pending={0} ready={completedCount} />
          </TabsTrigger>
        </TabsList>

        {/* ─── Needs Approval tab ─── */}
        <TabsContent value="needs_approval" className="pt-6 space-y-8">
          <DonnaReviewTabGuide tab="needs_approval" pendingCount={needsApprovalPending} />
          {needsApprovalPending + needsApprovalReady === 0 && (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<CheckCircle className="w-5 h-5" />}
                  title="You're caught up. Nothing needs approval right now."
                  description="Coach wrap-ups, attendance exceptions, placement items, and voice commands will appear here when they need your attention."
                />
              </CardContent>
            </Card>
          )}

          {/* Wrap-up coverage — moved inside tab (Sprint 781) */}
          <WrapUpCoveragePanel coverage={wrapUpCoverage} />

          {/* Coach Wrap-Ups */}
          {(pendingWrapUpDrafts.length + approvedWrapUpDrafts.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Coach Wrap-Ups</h3>
                {pendingWrapUpDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingWrapUpDrafts.length} to review
                  </span>
                )}
                {approvedWrapUpDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 leading-none">
                    {approvedWrapUpDrafts.length} ready to apply
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Guided coach recaps submitted after sessions. Review for accuracy, then approve and apply to record session actuals. Applying also creates individual player notes.</p>
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
              {pendingWrapUpDrafts.length > 0 && (
                <section className="space-y-3">
                  {approvedWrapUpDrafts.length > 0 && <p className="label-xs">Pending Review</p>}
                  <div className="space-y-4">
                    {pendingWrapUpDrafts.map(draft => (
                      <WrapUpDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Attendance Exceptions */}
          {/* Sprint 836: data-donna-focus-id added so DONNA can highlight this section */}
          {(pendingAttendanceDrafts.length + approvedAttendanceDrafts.length) > 0 && (
            <div className="space-y-4" data-donna-focus-id="attendance-exceptions-section">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Attendance Exceptions</h3>
                {pendingAttendanceDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingAttendanceDrafts.length} to review
                  </span>
                )}
                {approvedAttendanceDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 leading-none">
                    {approvedAttendanceDrafts.length} ready to apply
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Coach-flagged attendance changes. Approve to confirm, then apply to write to attendance records. Unexpected attendees create follow-up placement items — no player is created automatically.</p>
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
              {pendingAttendanceDrafts.length > 0 && (
                <section className="space-y-3">
                  {approvedAttendanceDrafts.length > 0 && <p className="label-xs">Pending Review</p>}
                  <div className="space-y-4">
                    {pendingAttendanceDrafts.map(draft => (
                      <AttendanceExceptionDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Placement / New Students */}
          {(pendingPlacementReviews.length + followUpPlacementReviews.length + enrichedIntakeCandidates.length + enrichedAssessmentDrafts.length + allEnrichedRecommendationDrafts.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Placement / New Students</h3>
                {(pendingPlacementReviews.length + enrichedIntakeCandidates.length + enrichedAssessmentDrafts.length + pendingRecommendationDrafts.length) > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingPlacementReviews.length + enrichedIntakeCandidates.length + enrichedAssessmentDrafts.length + pendingRecommendationDrafts.length} to review
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Unexpected attendees, intake candidates, and placement assessments. No player profile, roster entry, or parent communication is created until a placement recommendation is approved.</p>

              {pendingPlacementReviews.length > 0 && (
                <section className="space-y-3">
                  <p className="label-xs">Unexpected Attendees — Need a Decision</p>
                  <div className="space-y-4">
                    {pendingPlacementReviews.map(item => (
                      <PlacementReviewCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}
              {followUpPlacementReviews.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="label-xs">Follow-Up Later</p>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-blue/10 text-status-blue border border-status-blue/30">
                      {followUpPlacementReviews.length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {followUpPlacementReviews.map(item => (
                      <PlacementReviewCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}
              {enrichedIntakeCandidates.length > 0 && (
                <section className="space-y-3">
                  <p className="label-xs">Intake Candidates</p>
                  <div className="space-y-4">
                    {enrichedIntakeCandidates.map(item => (
                      <PlacementIntakeCandidateCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}
              {enrichedAssessmentDrafts.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="label-xs">Placement Assessments In Progress</p>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-blue/10 text-status-blue border border-status-blue/30">
                      {enrichedAssessmentDrafts.length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {enrichedAssessmentDrafts.map(item => (
                      <PlacementAssessmentDraftCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}
              {allEnrichedRecommendationDrafts.length > 0 && (
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
                  <div className="space-y-4">
                    {allEnrichedRecommendationDrafts.map(item => (
                      <PlacementRecommendationDraftCard key={item.id} item={item} academyGroups={academyGroups} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Voice Commands & Captures */}
          {(pendingVoiceIntakeDrafts.length + approvedVoiceIntakeDrafts.length + generalCaptures.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Voice Commands &amp; Captures</h3>
                {(pendingVoiceIntakeDrafts.length + generalCaptures.length) > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingVoiceIntakeDrafts.length + generalCaptures.length} to review
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Voice commands and unrouted quick captures awaiting a director decision. Nothing is written automatically.</p>
              {(approvedVoiceIntakeDrafts.length > 0) && (
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
              {pendingVoiceIntakeDrafts.length > 0 && (
                <section className="space-y-3">
                  {approvedVoiceIntakeDrafts.length > 0 && <p className="label-xs">Pending Review</p>}
                  <VoiceIntakeBatchPanel pending={pendingVoiceIntakeDrafts} />
                </section>
              )}
              {generalCaptures.length > 0 && (
                <section className="space-y-3">
                  <p className="label-xs">Unrouted Captures</p>
                  <p className="text-xs text-text-muted">Quick-capture notes not yet assigned to a player. Route each one or dismiss it.</p>
                  <CapturesBatchPanel captures={generalCaptures} players={playerOptions} />
                </section>
              )}
            </div>
          )}

          {/* DONNA Parent Communication Drafts */}
          {parentCommDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Parent Communication Drafts</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {parentCommDrafts.length} to review
                </span>
              </div>
              <p className="text-xs text-text-muted">DONNA-generated parent update drafts. Structured in 5 sections. No message has been sent — review the draft and approve before any external action.</p>
              <div className="space-y-3">
                {parentCommDrafts.map(item => (
                  <DonnaDraftCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* DONNA Level Readiness Drafts */}
          {levelReviewDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Level Readiness Reviews</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {levelReviewDrafts.length} to review
                </span>
              </div>
              <p className="text-xs text-text-muted">DONNA-generated level readiness assessments. Player level has NOT been changed — this is a review-only draft for your decision.</p>
              <div className="space-y-3">
                {levelReviewDrafts.map(item => (
                  <DonnaDraftCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Player Updates tab ─── */}
        <TabsContent value="player_updates" className="pt-6 space-y-8">
          <DonnaReviewTabGuide tab="player_updates" pendingCount={playerUpdatesPending} />
          {playerUpdatesPending + playerUpdatesReady === 0 && (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<Users className="w-5 h-5" />}
                  title="No player updates are waiting for review."
                  description="Player notes, development summaries, training priorities, and level readiness items will appear here when coaches or the system propose changes to player records."
                />
              </CardContent>
            </Card>
          )}

          {/* Player Notes — Sprint 931: includes clarification_needed items */}
          {(pendingObservationDrafts.length + approvedObservationDrafts.length + clarificationNeededObservationDrafts.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Player Notes</h3>
                {pendingObservationDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingObservationDrafts.length} to review
                  </span>
                )}
                {clarificationNeededObservationDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {clarificationNeededObservationDrafts.length} needs clarification
                  </span>
                )}
                {approvedObservationDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 leading-none">
                    {approvedObservationDrafts.length} ready to apply
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Coach notes on individual players from session wrap-ups. Not added to player profiles until you apply them. Not visible to players or parents.</p>
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
              {pendingObservationDrafts.length > 0 && (
                <section className="space-y-3">
                  {(approvedObservationDrafts.length > 0 || clarificationNeededObservationDrafts.length > 0) && (
                    <p className="label-xs">Pending Review</p>
                  )}
                  <div className="space-y-4">
                    {pendingObservationDrafts.map(draft => (
                      <WrapUpObservationDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                </section>
              )}
              {clarificationNeededObservationDrafts.length > 0 && (
                <section className="space-y-3">
                  <p className="label-xs">Needs Clarification</p>
                  <p className="text-[10px] text-text-muted">Clarification was requested. Review the coach&apos;s note, discuss offline if needed, then approve or reject.</p>
                  <div className="space-y-4">
                    {clarificationNeededObservationDrafts.map(draft => (
                      <WrapUpObservationDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Development Summaries */}
          {(pendingSummaryDrafts.length + approvedSummaryDrafts.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Development Summaries</h3>
                {pendingSummaryDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingSummaryDrafts.length} to review
                  </span>
                )}
                {approvedSummaryDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 leading-none">
                    {approvedSummaryDrafts.length} ready to apply
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Director-assembled development summary updates built from recent observations. Applying overwrites the player&apos;s current development summary. Not visible to players or parents until applied.</p>
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
              {pendingSummaryDrafts.length > 0 && (
                <section className="space-y-3">
                  {approvedSummaryDrafts.length > 0 && <p className="label-xs">Pending Review</p>}
                  <div className="space-y-4">
                    {pendingSummaryDrafts.map(draft => (
                      <DevelopmentSummaryDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Training Priorities */}
          {(pendingPriorityDrafts.length + approvedPriorityDrafts.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Training Priorities</h3>
                {pendingPriorityDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingPriorityDrafts.length} to review
                  </span>
                )}
                {approvedPriorityDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 leading-none">
                    {approvedPriorityDrafts.length} ready to apply
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Training priority recommendations for individual players. Approve to confirm, then apply to update a player&apos;s current focus areas. Not visible to players or parents until applied.</p>
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
              {pendingPriorityDrafts.length > 0 && (
                <section className="space-y-3">
                  {approvedPriorityDrafts.length > 0 && <p className="label-xs">Pending Review</p>}
                  <div className="space-y-4">
                    {pendingPriorityDrafts.map(draft => (
                      <PriorityRecommendationDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Level Readiness */}
          {(pendingEvidenceDrafts.length + approvedEvidenceDrafts.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Level Readiness</h3>
                {pendingEvidenceDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingEvidenceDrafts.length} to review
                  </span>
                )}
                {approvedEvidenceDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 leading-none">
                    {approvedEvidenceDrafts.length} ready to apply
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Links connecting a performance moment to a curriculum requirement. Approve and apply to record evidence in the player&apos;s development record.</p>
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
              {pendingEvidenceDrafts.length > 0 && (
                <section className="space-y-3">
                  {approvedEvidenceDrafts.length > 0 && <p className="label-xs">Pending Review</p>}
                  <div className="space-y-4">
                    {pendingEvidenceDrafts.map(draft => (
                      <EvidenceRequirementDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>

        {/* ─── Curriculum / Session Changes tab ─── */}
        <TabsContent value="curriculum_session" className="pt-6 space-y-8">
          <DonnaReviewTabGuide tab="curriculum_session" pendingCount={curriculumSessionPending} />
          {curriculumSessionPending + curriculumSessionReady === 0 && (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<BookOpen className="w-5 h-5" />}
                  title="No curriculum or session changes are waiting right now."
                  description="Session recap drafts and curriculum suggestions will appear here when they are submitted for review."
                />
              </CardContent>
            </Card>
          )}

          {/* Session Recaps */}
          {(pendingDrafts.length + approvedDrafts.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Session Recaps</h3>
                {pendingDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingDrafts.length} to review
                  </span>
                )}
                {approvedDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 leading-none">
                    {approvedDrafts.length} ready to apply
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">AI-structured session recap drafts. Approve to confirm the proposed structure, then apply to write the structured data to the session record.</p>
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
              {pendingDrafts.length > 0 && (
                <section className="space-y-3">
                  {approvedDrafts.length > 0 && <p className="label-xs">Pending Review</p>}
                  <div className="space-y-4">
                    {pendingDrafts.map(draft => (
                      <StructuredDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Coach Curriculum Suggestions */}
          {pendingCoachSuggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Coach Curriculum Suggestions</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-blue/15 text-status-blue border border-status-blue/20 leading-none">
                  {pendingCoachSuggestions.length} unread
                </span>
              </div>
              <p className="text-xs text-text-muted">Coaches submitted these curriculum suggestions. No curriculum data has changed — use these as input when drafting changes in the Curriculum Builder.</p>
              <div className="space-y-4">
                {pendingCoachSuggestions.map(item => (
                  <CoachCurriculumSuggestionCard key={item.id} item={item as CoachCurriculumSuggestionItem} />
                ))}
              </div>
            </div>
          )}

          {/* Curriculum Suggestions */}
          {(pendingCurriculumOverrideDrafts.length + approvedCurriculumOverrideDrafts.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Curriculum Suggestions</h3>
                {pendingCurriculumOverrideDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                    {pendingCurriculumOverrideDrafts.length} to review
                  </span>
                )}
                {approvedCurriculumOverrideDrafts.length > 0 && (
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-lime/10 text-lime border border-lime/20 leading-none">
                    {approvedCurriculumOverrideDrafts.length} ready to apply
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">Curriculum override suggestions — changes to the standard training plan. Approve and apply to modify what the curriculum prescribes. Not visible to players or parents until applied.</p>
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
              {pendingCurriculumOverrideDrafts.length > 0 && (
                <section className="space-y-3">
                  {approvedCurriculumOverrideDrafts.length > 0 && <p className="label-xs">Pending Review</p>}
                  <div className="space-y-4">
                    {pendingCurriculumOverrideDrafts.map(draft => (
                      <CurriculumOverrideDraftCard key={draft.id} draft={draft} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>

        {/* ─── Completed tab ─── */}
        <TabsContent value="completed" className="pt-6 space-y-8">
          <DonnaReviewTabGuide tab="completed" />
          {completedCount === 0 && (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<CheckCircle className="w-5 h-5" />}
                  title="Nothing sent back or rejected yet."
                  description="Items you send back for clarification or explicitly decline will appear here. Approved items that are ready to apply remain in Needs Approval and Player Updates until applied."
                />
              </CardContent>
            </Card>
          )}

          {/* Session recaps sent back for clarification */}
          {clarificationNeededDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Session Recaps — Sent Back for Clarification</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {clarificationNeededDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {clarificationNeededDrafts.map(draft => (
                  <StructuredDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          )}

          {/* Voice commands sent back for clarification */}
          {clarificationNeededVoiceIntakeDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Voice Commands — Sent Back for Clarification</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {clarificationNeededVoiceIntakeDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {clarificationNeededVoiceIntakeDrafts.map(draft => (
                  <VoiceIntakeDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          )}

          {/* Sent back for clarification */}
          {clarificationNeededWrapUpDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Sent Back for Clarification</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {clarificationNeededWrapUpDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {clarificationNeededWrapUpDrafts.map(draft => (
                  <WrapUpDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          )}

          {/* Observation drafts sent back for clarification */}
          {clarificationNeededObservationDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Player Observations — Sent Back for Clarification</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {clarificationNeededObservationDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {clarificationNeededObservationDrafts.map(draft => (
                  <WrapUpObservationDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          )}

          {/* Priority recommendations sent back for clarification */}
          {clarificationNeededPriorityDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Priority Recommendations — Sent Back for Clarification</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {clarificationNeededPriorityDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {clarificationNeededPriorityDrafts.map(draft => (
                  <PriorityRecommendationDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          )}

          {/* Evidence requirement links sent back for clarification */}
          {clarificationNeededEvidenceDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Evidence Links — Sent Back for Clarification</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {clarificationNeededEvidenceDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {clarificationNeededEvidenceDrafts.map(draft => (
                  <EvidenceRequirementDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          )}

          {/* Attendance exceptions sent back for clarification */}
          {clarificationNeededAttendanceDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Attendance Exceptions — Sent Back for Clarification</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {clarificationNeededAttendanceDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {clarificationNeededAttendanceDrafts.map(draft => (
                  <AttendanceExceptionDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          )}

          {/* Curriculum overrides sent back for clarification */}
          {clarificationNeededCurriculumOverrideDrafts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Curriculum Overrides — Sent Back for Clarification</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-orange/15 text-status-orange border border-status-orange/20 leading-none">
                  {clarificationNeededCurriculumOverrideDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {clarificationNeededCurriculumOverrideDrafts.map(draft => (
                  <CurriculumOverrideDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          )}

          {/* Not approved */}
          {(rejectedDrafts.length + rejectedVoiceIntakeDrafts.length + rejectedWrapUpDrafts.length + rejectedObservationDrafts.length + rejectedPriorityDrafts.length + rejectedEvidenceDrafts.length + rejectedAttendanceDrafts.length + rejectedCurriculumOverrideDrafts.length + rejectedSummaryDrafts.length) > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Not Approved</h3>
                <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-status-red/15 text-status-red border border-status-red/20 leading-none">
                  {rejectedDrafts.length + rejectedVoiceIntakeDrafts.length + rejectedWrapUpDrafts.length + rejectedObservationDrafts.length + rejectedPriorityDrafts.length + rejectedEvidenceDrafts.length + rejectedAttendanceDrafts.length + rejectedCurriculumOverrideDrafts.length + rejectedSummaryDrafts.length}
                </span>
              </div>
              <div className="space-y-4">
                {rejectedDrafts.map(draft => (
                  <StructuredDraftCard key={draft.id} draft={draft} />
                ))}
                {rejectedVoiceIntakeDrafts.map(draft => (
                  <VoiceIntakeDraftCard key={draft.id} draft={draft} />
                ))}
                {rejectedWrapUpDrafts.map(draft => (
                  <WrapUpDraftCard key={draft.id} draft={draft} />
                ))}
                {rejectedObservationDrafts.map(draft => (
                  <WrapUpObservationDraftCard key={draft.id} draft={draft} />
                ))}
                {rejectedPriorityDrafts.map(draft => (
                  <PriorityRecommendationDraftCard key={draft.id} draft={draft} />
                ))}
                {rejectedEvidenceDrafts.map(draft => (
                  <EvidenceRequirementDraftCard key={draft.id} draft={draft} />
                ))}
                {rejectedAttendanceDrafts.map(draft => (
                  <AttendanceExceptionDraftCard key={draft.id} draft={draft} />
                ))}
                {rejectedCurriculumOverrideDrafts.map(draft => (
                  <CurriculumOverrideDraftCard key={draft.id} draft={draft} />
                ))}
                {rejectedSummaryDrafts.map(draft => (
                  <DevelopmentSummaryDraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-surface-raised border border-border px-4 py-3">
            <p className="text-[11px] text-text-muted">
              Applied and executed items will be visible in a future update. Approved items ready to apply are in the Needs Approval and Player Updates tabs.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      </div>{/* /review-queue-primary */}
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
