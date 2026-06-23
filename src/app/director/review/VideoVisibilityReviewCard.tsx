'use client'

// Sprint 638 — Video Visibility Review Flow V1
// Review card for video_visibility_change proposed_actions.
// HIGH VISIBILITY RISK — parent/player can see this content when visibility is changed.
// No apply path exists yet. Approval captures the decision only.
// Future sprint will add the video visibility apply server action.

import { useRouter } from 'next/navigation'
import { Video, Eye, EyeOff, ShieldCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { DonnaIntelligenceDraftDecisionControls } from './DonnaIntelligenceDraftDecisionControls'

// ── Visibility states ─────────────────────────────────────────────────────────

export type VideoVisibilityState =
  | 'internal_only'
  | 'coach_visible'
  | 'parent_visible'
  | 'player_visible'
  | 'public_demo'

export interface VideoVisibilityPayload {
  draft_type?: string
  source?: string
  video_id?: string | null
  video_title?: string | null
  video_description?: string | null
  current_visibility?: VideoVisibilityState | null
  proposed_visibility?: VideoVisibilityState | null
  player_id?: string | null
  player_label?: string | null
  curriculum_context?: string | null
  ownership_note?: string | null
  licensing_note?: string | null
  warnings?: string[]
}

export interface EnrichedVideoVisibilityDraftItem {
  id: string
  status: string
  createdAt: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: VideoVisibilityPayload
}

const VISIBILITY_LABELS: Record<string, string> = {
  internal_only: 'Internal only',
  coach_visible: 'Coach visible',
  parent_visible: 'Parent visible',
  player_visible: 'Player visible',
  public_demo: 'Public / demo',
}

function visibilityRisk(v: string | null | undefined): 'high' | 'medium' | 'low' {
  if (v === 'parent_visible' || v === 'player_visible' || v === 'public_demo') return 'high'
  if (v === 'coach_visible') return 'medium'
  return 'low'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VideoVisibilityReviewCard({ draft }: { draft: EnrichedVideoVisibilityDraftItem }) {
  const router = useRouter()
  const p = draft.payload
  const isPending = draft.status === 'pending_review'
  const isApproved = draft.status === 'approved'
  const isRejected = draft.status === 'rejected'
  const isExecuted = draft.status === 'executed'
  const isHighRisk = visibilityRisk(p.proposed_visibility) === 'high'

  return (
    <Card className={isHighRisk ? 'border border-status-orange/25' : ''}>
      <CardContent className="py-5 space-y-5">

        {/* High-visibility banner */}
        {isHighRisk && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/8 border border-status-orange/25 text-[11px] text-status-orange">
            <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="font-medium">High visibility risk — parent or player will see this video once visibility is changed.</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2">
          <Video className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Video Visibility Change</p>
        </div>

        {/* Video details */}
        {p.video_title && (
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-text-primary">{p.video_title}</p>
            {p.video_description && (
              <p className="text-[11px] text-text-muted">{p.video_description}</p>
            )}
          </div>
        )}

        {/* Visibility change */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <EyeOff className="w-3 h-3 text-text-muted" />
            <span className="text-[11px] text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded">
              {VISIBILITY_LABELS[p.current_visibility ?? ''] ?? p.current_visibility ?? 'Unknown'}
            </span>
          </div>
          <span className="text-text-muted text-xs">→</span>
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-lime" />
            <span className={`text-[11px] px-2 py-0.5 rounded border ${isHighRisk ? 'text-status-orange border-status-orange/25 bg-status-orange/8' : 'text-lime border-lime/20 bg-lime/8'}`}>
              {VISIBILITY_LABELS[p.proposed_visibility ?? ''] ?? p.proposed_visibility ?? 'Unknown'}
            </span>
          </div>
        </div>

        {/* Context */}
        {p.curriculum_context && (
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Curriculum Context</p>
            <p className="text-[11px] text-text-secondary leading-relaxed pl-1">{p.curriculum_context}</p>
          </div>
        )}
        {p.ownership_note && (
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Ownership</p>
            <p className="text-[11px] text-text-muted pl-1">{p.ownership_note}</p>
          </div>
        )}
        {p.licensing_note && (
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Licensing</p>
            <p className="text-[11px] text-text-muted pl-1">{p.licensing_note}</p>
          </div>
        )}

        {/* Safety notices */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
          <span>
            Video visibility does not change on approval alone. An apply step is required. No apply path exists yet — future sprint required.
          </span>
        </div>

        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <Info className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
          <span>
            No video visibility apply path exists yet. Approving captures your decision — visibility will not change until the apply action is built in a future sprint.
          </span>
        </div>

        {/* Warnings */}
        {p.warnings && p.warnings.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border">
            {p.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-text-muted">
                <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Terminal states */}
        {isApproved && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-lime/10 border border-lime/20 text-[11px] text-lime">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Approved — video visibility apply step not yet available. No change made.</span>
          </div>
        )}
        {isExecuted && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green/10 border border-status-green/30 text-[11px] text-status-green">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Review cycle complete.</span>
          </div>
        )}
        {isRejected && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-red/10 border border-status-red/30 text-[11px] text-status-red">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Rejected — video visibility was not changed.</span>
          </div>
        )}

        {/* Decision controls */}
        {isPending && (
          <div className="pt-2 border-t border-border">
            <DonnaIntelligenceDraftDecisionControls
              proposedActionId={draft.id}
              targetModule="video_visibility_change"
              onSuccess={() => router.refresh()}
            />
          </div>
        )}

      </CardContent>
    </Card>
  )
}
