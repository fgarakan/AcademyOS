import Link from 'next/link'
import { Sparkles, ShieldCheck, User, Calendar, FileText, AlertTriangle, CheckCircle2, ArrowRight, Eye, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import {
  resolveVisibilityImpact,
  resolveApprovalRequirement,
  classifyReviewItemRisk,
} from '@/lib/review/reviewCenterFilters'

interface WhatChanges {
  willChange: string[]
  willNotChange: string[]
}

interface Props {
  targetModule: string
  moduleLabel: string
  status: string
  proposerName: string | null
  createdAt: string
  sessionId: string | null
  sessionName: string | null
  playerId: string | null
  playerName: string | null
  riskLevel: string | null
  reviewerNotes: string | null
}

const MODULE_CHANGES: Record<string, WhatChanges> = {
  session_wrap_up_v1: {
    willChange: [
      'Session notes are written with the coach summary',
      'Session status advances to completed (if not already)',
      'Draft is marked executed',
    ],
    willNotChange: [
      'Session template or planned blocks',
      'Player profiles or curriculum levels',
      'Parent-facing records',
      'Attendance records (separate draft type)',
    ],
  },
  attendance_exception: {
    willChange: [
      'Attendance record for each rostered player is updated',
      'Unrostered attendees trigger a placement review item (no player created)',
      'Draft is marked executed',
    ],
    willNotChange: [
      'Player profiles or curriculum levels',
      'Parent-facing records',
      'Session template or curriculum',
    ],
  },
  coach_observation_draft_v1: {
    willChange: [
      'One internal coach observation is created on the player profile',
      'Draft is marked executed',
    ],
    willNotChange: [
      'Observation is private — not visible to parents or players',
      'Player curriculum level',
      'Parent-facing records',
      'Session records',
    ],
  },
  priority_recommendation: {
    willChange: [
      'Player training priority is updated',
      'Draft is marked executed',
    ],
    willNotChange: [
      'Player curriculum level',
      'Parent-facing records',
      'Session records or attendance',
    ],
  },
  requirement_evidence_link: {
    willChange: [
      'Evidence is linked to the curriculum requirement for this player',
      'Draft is marked executed',
    ],
    willNotChange: [
      'Player curriculum level — evidence links are informational only',
      'Parent-facing records',
      'Session records',
    ],
  },
  development_summary_draft_v1: {
    willChange: [
      'Player development summary is updated with the new draft',
      'Summary source is tagged as ai_draft',
      'Draft is marked executed',
    ],
    willNotChange: [
      'Summary is internal — not visible to parents or players by default',
      'Player curriculum level',
      'Parent-facing records',
    ],
  },
  session_recap_structuring: {
    willChange: [
      'Session recap notes are structured and written',
      'Draft is marked executed',
    ],
    willNotChange: [
      'Session template or planned curriculum',
      'Player profiles or curriculum levels',
      'Parent-facing records',
    ],
  },
  curriculum_override: {
    willChange: [
      'Curriculum override instruction is applied to the session template block',
      'Draft is marked executed',
    ],
    willNotChange: [
      'Core curriculum spine or levels',
      'Player profiles',
      'Parent-facing records',
    ],
  },
}

const MODULE_SOURCE_EVIDENCE: Record<string, string[]> = {
  session_wrap_up_v1: ['Coach wrap-up answers', 'Session roster', 'Session template blocks'],
  attendance_exception: ['Coach attendance submission', 'Existing session roster'],
  coach_observation_draft_v1: ['Coach session observation note'],
  priority_recommendation: ['Coach assessment inputs', 'Current player priorities'],
  requirement_evidence_link: ['Assessment score or coach observation linked to a curriculum requirement'],
  development_summary_draft_v1: ['Player profile data', 'Coach observations', 'Assessment history'],
  session_recap_structuring: ['Raw coach recap text', 'Session context'],
  curriculum_override: ['Coach voice or text instruction', 'Session template block'],
  parent_communication: ['Player profile', 'Coach observations (sanitized)', 'Assessment summary'],
  level_review: ['Player assessment scores', 'Curriculum requirement gates', 'Coach readiness signal'],
  placement_recommendation_draft: ['Placement assessment answers', 'Group and level options'],
}

const MODULE_WHO_CAN_APPROVE: Record<string, string> = {
  session_wrap_up_v1: 'Academy director or head coach',
  attendance_exception: 'Academy director or head coach',
  coach_observation_draft_v1: 'Academy director or head coach',
  priority_recommendation: 'Academy director',
  requirement_evidence_link: 'Academy director',
  development_summary_draft_v1: 'Academy director',
  session_recap_structuring: 'Academy director or head coach',
  curriculum_override: 'Academy director',
  parent_communication: 'Academy director only',
  level_review: 'Academy director only',
  placement_recommendation_draft: 'Academy director only',
  knowledge_promotion: 'Platform owner (for global); academy director (for academy-local)',
}

const DONNA_BRIEF: Record<string, string> = {
  session_wrap_up_v1: 'This is a coach session wrap-up. Review for accuracy and completeness, then approve and apply to record the session actual. If anything is unclear, use Needs Clarification.',
  attendance_exception: 'This attendance exception was flagged by a coach. Any unrostered attendees will create a follow-up placement item — no player is created automatically. Review the roster changes before approving.',
  coach_observation_draft_v1: 'This is a player observation from a coach. It will be stored as an internal note only — parents and players will not see it. Approve if the observation is accurate.',
  priority_recommendation: 'This is a training priority recommendation. It adjusts the player\'s focus areas. Review for alignment with your academy\'s development goals.',
  requirement_evidence_link: 'This links a piece of evidence to a curriculum requirement. It is informational only — it does not change the player\'s curriculum level. Approve if the evidence is valid.',
  development_summary_draft_v1: 'This is an AI-drafted development summary. It is internal by default — not visible to parents or players. Edit the draft before applying if needed.',
  session_recap_structuring: 'This structures raw session notes into a standard format. Review for accuracy, then apply to record the structured recap.',
  curriculum_override: 'This overrides a curriculum block for a session. Review carefully — curriculum changes affect what coaches teach.',
}

function riskColor(risk: string | null): string {
  if (risk === 'high') return 'text-status-red'
  if (risk === 'medium') return 'text-status-orange'
  return 'text-text-muted'
}

function riskLabel(risk: string | null): string {
  if (risk === 'high') return 'High risk — review carefully'
  if (risk === 'medium') return 'Medium risk'
  return 'Low risk'
}

export function DonnaReviewContextPanel({
  targetModule,
  moduleLabel,
  status,
  proposerName,
  createdAt,
  sessionId,
  sessionName,
  playerId,
  playerName,
  riskLevel,
  reviewerNotes,
}: Props) {
  const changes = MODULE_CHANGES[targetModule]
  const brief = DONNA_BRIEF[targetModule]
  const sourceEvidence = MODULE_SOURCE_EVIDENCE[targetModule]
  const whoCanApprove = MODULE_WHO_CAN_APPROVE[targetModule]
  const visibilityImpact = resolveVisibilityImpact(targetModule)
  const approvalReq = resolveApprovalRequirement(targetModule)
  const riskFromModule = classifyReviewItemRisk(targetModule)

  const formattedDate = new Date(createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="space-y-4">

      {/* DONNA header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-lime shrink-0" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">DONNA</p>
        <span className="text-[10px] text-text-muted">Review Context</span>
      </div>

      {/* Brief */}
      {brief && (
        <Card>
          <CardContent className="py-3 space-y-2">
            <p className="label-xs">DONNA Brief</p>
            <p className="text-[11px] text-text-secondary leading-snug">{brief}</p>
          </CardContent>
        </Card>
      )}

      {/* Submission details */}
      <Card>
        <CardContent className="py-3 space-y-2.5">
          <p className="label-xs">Submission</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-text-secondary">
              <FileText className="w-3 h-3 text-text-muted shrink-0" />
              <span>Type: {moduleLabel}</span>
            </div>
            {proposerName && (
              <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                <User className="w-3 h-3 text-text-muted shrink-0" />
                <span>Submitted by {proposerName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px] text-text-secondary">
              <Calendar className="w-3 h-3 text-text-muted shrink-0" />
              <span>{formattedDate}</span>
            </div>
            {riskLevel && riskLevel !== 'low' && (
              <div className={`flex items-center gap-2 text-[11px] font-medium ${riskColor(riskLevel)}`}>
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{riskLabel(riskLevel)}</span>
              </div>
            )}
          </div>

          {/* Links to related entities */}
          <div className="space-y-1 pt-1">
            {sessionId && sessionName && (
              <Link
                href={`/director/sessions/${sessionId}`}
                className="flex items-center gap-1.5 text-[11px] text-status-blue hover:underline"
              >
                <ArrowRight className="w-3 h-3 shrink-0" />
                View session: {sessionName}
              </Link>
            )}
            {playerId && playerName && (
              <Link
                href={`/director/players/${playerId}`}
                className="flex items-center gap-1.5 text-[11px] text-status-blue hover:underline"
              >
                <ArrowRight className="w-3 h-3 shrink-0" />
                View player profile: {playerName}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval & Visibility */}
      <Card>
        <CardContent className="py-3 space-y-2.5">
          <p className="label-xs">Approval &amp; Visibility</p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-[11px] text-text-secondary">
              <Lock className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
              <span>{approvalReq}</span>
            </div>
            {whoCanApprove && (
              <div className="flex items-start gap-2 text-[11px] text-text-secondary">
                <User className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                <span>Who can approve: {whoCanApprove}</span>
              </div>
            )}
            <div className="flex items-start gap-2 text-[11px]">
              <Eye className={`w-3 h-3 shrink-0 mt-0.5 ${riskFromModule.risk === 'high' ? 'text-status-red' : 'text-text-muted'}`} />
              <span className={riskFromModule.risk === 'high' ? 'text-status-red' : 'text-text-secondary'}>
                {visibilityImpact}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source evidence */}
      {sourceEvidence && sourceEvidence.length > 0 && (
        <Card>
          <CardContent className="py-3 space-y-2">
            <p className="label-xs">Source Evidence</p>
            <div className="space-y-1">
              {sourceEvidence.map((ev, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-text-secondary">
                  <FileText className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* What changes when applied */}
      {changes && (
        <Card>
          <CardContent className="py-3 space-y-3">
            <p className="label-xs">What changes when applied</p>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-status-green font-semibold mb-1">Will change</p>
              {changes.willChange.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-text-secondary">
                  <CheckCircle2 className="w-3 h-3 text-status-green shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">Will NOT change</p>
              {changes.willNotChange.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-text-muted">
                  <ShieldCheck className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Director clarification note (if set) */}
      {reviewerNotes && (
        <Card>
          <CardContent className="py-3 space-y-1">
            <p className="label-xs text-status-orange">Clarification Note</p>
            <p className="text-[11px] text-text-secondary leading-snug">{reviewerNotes}</p>
            <p className="text-[10px] text-text-muted">This note is visible to the coach who submitted this item.</p>
          </CardContent>
        </Card>
      )}

      {/* Safety footer */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-[10px] text-text-muted">
        <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
        <span>DONNA proposes — you approve. Nothing changes until you act on the item to the left.</span>
      </div>

    </div>
  )
}
