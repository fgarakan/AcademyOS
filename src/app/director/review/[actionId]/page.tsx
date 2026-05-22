import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { ReviewItemRouter } from './ReviewItemRouter'
import type { ReviewItemData } from './ReviewItemRouter'
import { DonnaReviewContextPanel } from './DonnaReviewContextPanel'
import { ApprovalPreviewCard } from '@/components/review/ApprovalPreviewCard'
import { buildApprovalPreview } from '@/lib/review/approvalPreview'
import type { SessionActualDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpDraftAction'
import type { AttendanceExceptionPayload } from '@/app/director/sessions/[sessionId]/attendanceExceptionDraftAction'
import type { CoachObservationDraftPayload } from '@/app/coach/sessions/[sessionId]/saveWrapUpObservationsAction'
import type { PriorityRecommendationPayload } from '@/app/director/review/PriorityRecommendationDraftCard'
import type { EvidenceRequirementLinkPayload } from '@/app/director/review/EvidenceRequirementDraftCard'
import type { DevelopmentSummaryDraftPayload } from '@/app/director/players/[playerId]/draftSummaryUpdateAction'
import type { StructuredDraftPayload } from '@/app/director/sessions/[sessionId]/structureRecapAction'
import type { CurriculumOverrideDraftPayload } from '@/lib/actions/curriculumOverrideDraft'
import type { LevelMovementPayload } from '@/app/director/review/LevelMovementReviewCard'
import type { ParentSummaryPayload } from '@/app/director/review/ParentSummaryReviewCard'

const MODULE_LABEL: Record<string, string> = {
  session_wrap_up_v1: 'Session Wrap-Up',
  attendance_exception: 'Attendance Exception',
  coach_observation_draft_v1: 'Player Observation',
  priority_recommendation: 'Priority Recommendation',
  requirement_evidence_link: 'Evidence Requirement',
  development_summary_draft_v1: 'Development Summary',
  session_recap_structuring: 'Session Recap',
  curriculum_override: 'Curriculum Override',
  voice_intake: 'Voice Command',
  parent_communication: 'Parent Communication',
  level_review: 'Level Review',
  placement_review: 'Placement Review',
}

// Determine which entity type this module links to
function entityType(module: string): 'session' | 'player' | 'none' {
  if (['session_wrap_up_v1', 'attendance_exception', 'session_recap_structuring'].includes(module)) return 'session'
  if (['coach_observation_draft_v1', 'priority_recommendation', 'requirement_evidence_link', 'development_summary_draft_v1', 'level_review', 'parent_communication'].includes(module)) return 'player'
  return 'none'
}

export default async function ReviewItemDetailPage({
  params,
}: {
  params: { actionId: string }
}) {
  const { actionId } = params

  const supabase = await getSupabaseServer()
  const rawDb = supabase as any

  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // 2. Academy context from authenticated profile — never trust params
  const { data: profile } = await supabase
    .from('profiles')
    .select('academy_id')
    .eq('id', user.id)
    .single()
  if (!profile?.academy_id) notFound()
  const academyId = profile.academy_id

  // 3. Role guard — director or head_coach only
  const { data: membership } = await supabase
    .from('academy_memberships')
    .select('role')
    .eq('academy_id', academyId)
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()
  const role = membership?.role
  if (role !== 'academy_director' && role !== 'head_coach') notFound()

  // 4. Load proposed_action — verify academy_id match
  const { data: action } = await rawDb
    .from('proposed_actions')
    .select('id, academy_id, status, target_module, target_object_id, proposed_payload, created_at, proposed_by_id, reviewer_notes, risk_level')
    .eq('id', actionId)
    .single()

  if (!action) notFound()
  if (action.academy_id !== academyId) notFound()

  const targetModule: string = action.target_module ?? 'unknown'
  const eType = entityType(targetModule)

  // 5. Proposer name
  const { data: proposerProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', action.proposed_by_id)
    .single()
  const proposerName = proposerProfile?.display_name ?? null

  // 6. Entity lookup — session or player based on module
  let sessionName: string | null = null
  let sessionDate: string | null = null
  let playerName: string | null = null
  let playerId: string | null = null

  if (eType === 'session' && action.target_object_id) {
    const { data: sess } = await supabase
      .from('sessions')
      .select('id, name, scheduled_date')
      .eq('id', action.target_object_id)
      .eq('academy_id', academyId)
      .single()
    sessionName = sess?.name ?? null
    sessionDate = sess?.scheduled_date ?? null
  }

  if (eType === 'player' && action.target_object_id) {
    playerId = action.target_object_id
    const { data: player } = await supabase
      .from('players')
      .select('id, first_name, last_name, full_name')
      .eq('id', action.target_object_id)
      .eq('academy_id', academyId)
      .single()
    playerName = player?.full_name ?? (player ? `${player.first_name} ${player.last_name}`.trim() : null)
  }

  // 7. Build ReviewItemData union
  let itemData: ReviewItemData

  if (targetModule === 'session_wrap_up_v1') {
    itemData = {
      type: 'wrap_up',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        sessionId: action.target_object_id,
        sessionName,
        sessionDate,
        groupName: null,
        proposerName,
        payload: action.proposed_payload as unknown as SessionActualDraftPayload,
        reviewerNotes: action.reviewer_notes ?? null,
      },
    }
  } else if (targetModule === 'attendance_exception') {
    itemData = {
      type: 'attendance_exception',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        sessionId: action.target_object_id,
        sessionName,
        sessionDate,
        proposerName,
        payload: action.proposed_payload as unknown as AttendanceExceptionPayload,
      },
    }
  } else if (targetModule === 'coach_observation_draft_v1') {
    itemData = {
      type: 'observation',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        playerId,
        playerName,
        proposerName,
        payload: action.proposed_payload as unknown as CoachObservationDraftPayload,
      },
    }
  } else if (targetModule === 'priority_recommendation') {
    itemData = {
      type: 'priority_recommendation',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        playerId,
        playerName,
        proposerName,
        payload: action.proposed_payload as unknown as PriorityRecommendationPayload,
      },
    }
  } else if (targetModule === 'requirement_evidence_link') {
    itemData = {
      type: 'evidence_link',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        playerId,
        playerName,
        proposerName,
        payload: action.proposed_payload as unknown as EvidenceRequirementLinkPayload,
      },
    }
  } else if (targetModule === 'development_summary_draft_v1') {
    itemData = {
      type: 'development_summary',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        playerId,
        playerName,
        proposerName,
        payload: action.proposed_payload as unknown as DevelopmentSummaryDraftPayload,
      },
    }
  } else if (targetModule === 'session_recap_structuring') {
    itemData = {
      type: 'session_recap',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        sessionId: action.target_object_id,
        sessionName,
        sessionDate,
        proposerName,
        payload: action.proposed_payload as unknown as StructuredDraftPayload,
      },
    }
  } else if (targetModule === 'curriculum_override') {
    itemData = {
      type: 'curriculum_override',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        proposerName,
        payload: action.proposed_payload as unknown as CurriculumOverrideDraftPayload,
      },
    }
  } else if (targetModule === 'level_review') {
    itemData = {
      type: 'level_review',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        playerId,
        playerName,
        proposerName,
        payload: action.proposed_payload as unknown as LevelMovementPayload,
      },
    }
  } else if (targetModule === 'parent_communication') {
    itemData = {
      type: 'parent_summary',
      item: {
        id: action.id,
        status: action.status,
        createdAt: action.created_at,
        playerId,
        playerName,
        proposerName,
        payload: action.proposed_payload as unknown as ParentSummaryPayload,
      },
    }
  } else {
    itemData = {
      type: 'unsupported',
      targetModule,
      actionId: action.id,
      status: action.status,
      createdAt: action.created_at,
    }
  }

  const moduleLabel = MODULE_LABEL[targetModule] ?? targetModule
  const approvalPreview = buildApprovalPreview(targetModule)

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-5xl">

      {/* Breadcrumb */}
      <Link
        href="/director/review"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Review Queue
      </Link>

      {/* Page header */}
      <div className="space-y-1">
        <p className="page-eyebrow">Review Item</p>
        <h1 className="page-title">{moduleLabel}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            action.status === 'pending_review' ? 'bg-status-orange/10 border-status-orange/20 text-status-orange' :
            action.status === 'approved' ? 'bg-lime/10 border-lime/20 text-lime' :
            action.status === 'executed' ? 'bg-status-green/10 border-status-green/20 text-status-green' :
            action.status === 'rejected' ? 'bg-status-red/10 border-status-red/20 text-status-red' :
            'bg-surface-raised border-border text-text-muted'
          }`}>
            {action.status === 'pending_review' ? 'Pending review' :
             action.status === 'approved' ? 'Approved — ready to apply' :
             action.status === 'executed' ? 'Applied' :
             action.status === 'rejected' ? 'Rejected' :
             action.status === 'clarification_needed' ? 'Needs clarification' :
             action.status}
          </span>
          {proposerName && (
            <span className="text-[11px] text-text-muted">Submitted by {proposerName}</span>
          )}
          {sessionName && (
            <span className="text-[11px] text-text-muted">Session: {sessionName}</span>
          )}
          {playerName && (
            <span className="text-[11px] text-text-muted">Player: {playerName}</span>
          )}
        </div>
      </div>

      {/* Safety notice */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
        <span>
          No action has been taken yet. Review the draft below, then approve, reject, or request clarification.
          Nothing is applied or sent until you explicitly act.
        </span>
      </div>

      {/* 2-column layout: item card left, DONNA context right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <ReviewItemRouter data={itemData} />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <DonnaReviewContextPanel
            targetModule={targetModule}
            moduleLabel={moduleLabel}
            status={action.status}
            proposerName={proposerName}
            createdAt={action.created_at}
            sessionId={action.target_object_id ?? null}
            sessionName={sessionName}
            playerId={playerId}
            playerName={playerName}
            riskLevel={action.risk_level ?? null}
            reviewerNotes={action.reviewer_notes ?? null}
          />
          <ApprovalPreviewCard preview={approvalPreview} />
        </div>
      </div>

    </div>
  )
}
