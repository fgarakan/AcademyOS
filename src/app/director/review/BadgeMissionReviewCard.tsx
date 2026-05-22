'use client'

// Sprint 637 — Badge/Mission Award Review Flow V1
// Review card for badge_award and mission_assignment proposed_actions.
// No apply path exists yet — approval captures the decision only.
// Evidence source and player/parent visibility are shown.
// Future sprint will add the badge/mission award apply server action.

import { useRouter } from 'next/navigation'
import { Award, Target, ShieldCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { DonnaIntelligenceDraftDecisionControls } from '@/components/assistant/DonnaIntelligenceDraftDecisionControls'

// ── Payload ────────────────────────────────────────────────────────────────────

export interface BadgeMissionPayload {
  draft_type?: string
  source?: string
  action_subtype?: 'badge_award' | 'mission_assignment' | string
  item_id?: string | null
  item_label?: string | null
  item_description?: string | null
  player_id?: string | null
  player_label?: string | null
  evidence_source?: string | null
  evidence_summary?: string | null
  criteria_met?: string[]
  criteria_missing?: string[]
  is_player_visible?: boolean | null
  is_parent_visible?: boolean | null
  warnings?: string[]
}

export interface EnrichedBadgeMissionDraftItem {
  id: string
  status: string
  createdAt: string
  targetModule: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: BadgeMissionPayload
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BadgeMissionReviewCard({ draft }: { draft: EnrichedBadgeMissionDraftItem }) {
  const router = useRouter()
  const p = draft.payload
  const isBadge = draft.targetModule === 'badge_award'
  const isPending = draft.status === 'pending_review'
  const isApproved = draft.status === 'approved'
  const isRejected = draft.status === 'rejected'
  const isExecuted = draft.status === 'executed'

  const Icon = isBadge ? Award : Target
  const typeLabel = isBadge ? 'Badge Award' : 'Mission Assignment'

  return (
    <Card>
      <CardContent className="py-5 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">{typeLabel} Draft</p>
        </div>

        {/* Player + item */}
        <div className="space-y-1">
          {(draft.playerName ?? p.player_label) && (
            <p className="text-sm font-semibold text-text-primary">
              {draft.playerName ?? p.player_label}
            </p>
          )}
          {p.item_label && (
            <p className="text-[11px] text-text-muted">{isBadge ? 'Badge' : 'Mission'}: {p.item_label}</p>
          )}
          {p.item_description && (
            <p className="text-[11px] text-text-secondary leading-relaxed pl-1">{p.item_description}</p>
          )}
        </div>

        {/* Criteria met */}
        {p.criteria_met && p.criteria_met.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Criteria Met</p>
            <div className="space-y-1 pl-1">
              {p.criteria_met.map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                  <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Criteria missing */}
        {p.criteria_missing && p.criteria_missing.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Criteria Missing</p>
            <div className="space-y-1 pl-1">
              {p.criteria_missing.map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence */}
        {p.evidence_source && (
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Evidence Source</p>
            <p className="text-[11px] text-text-muted pl-1">{p.evidence_source}</p>
          </div>
        )}
        {p.evidence_summary && (
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Evidence Summary</p>
            <p className="text-[11px] text-text-secondary leading-relaxed pl-1">{p.evidence_summary}</p>
          </div>
        )}

        {/* Visibility */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
          <span>
            {p.is_player_visible
              ? 'Player-visible badge/mission — confirm before approving.'
              : 'Not yet player-visible. Visibility controlled by apply step.'}
            {' '}
            {p.is_parent_visible
              ? 'Parent-visible — confirm before approving.'
              : 'Not yet parent-visible.'}
          </span>
        </div>

        {/* Apply path blocker */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <Info className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
          <span>
            No badge/mission apply path exists yet. Approving captures your decision — {isBadge ? 'the badge is not awarded' : 'the mission is not assigned'} until the apply action is built in a future sprint.
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
            <span>Approved — {isBadge ? 'badge award' : 'mission assignment'} apply step not yet available. No change made.</span>
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
            <span>Rejected — no {isBadge ? 'badge' : 'mission'} change made.</span>
          </div>
        )}

        {/* Decision controls */}
        {isPending && (
          <div className="pt-2 border-t border-border">
            <DonnaIntelligenceDraftDecisionControls
              proposedActionId={draft.id}
              targetModule={draft.targetModule}
              onSuccess={() => router.refresh()}
            />
          </div>
        )}

      </CardContent>
    </Card>
  )
}
