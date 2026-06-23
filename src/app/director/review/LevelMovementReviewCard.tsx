'use client'

// Sprint 634 — Level Movement Review Card
// Shows the level_review proposed_action payload in the review item detail view.
// Uses the pre-existing DonnaIntelligenceDraftDecisionControls for approve/reject
// and DonnaLevelMovementApplyControls for the apply step (approved items only).
// No mutations here — mutations go through the existing server actions.

import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { DonnaIntelligenceDraftDecisionControls } from './DonnaIntelligenceDraftDecisionControls'
import { DonnaLevelMovementApplyControls } from './DonnaLevelMovementApplyControls'

// ── Payload shape ──────────────────────────────────────────────────────────────

export interface LevelMovementPayload {
  draft_type?: string
  source?: string
  player_id?: string | null
  player_label?: string | null
  current_level?: string | null
  next_level?: string | null
  gate_evidence?: string | null
  coach_context?: string | null
  readiness_summary?: string | null
  evidence_present?: string[]
  evidence_missing?: string[]
  warnings?: string[]
}

export interface EnrichedLevelMovementDraftItem {
  id: string
  status: string
  createdAt: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: LevelMovementPayload
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LevelMovementReviewCard({ draft }: { draft: EnrichedLevelMovementDraftItem }) {
  const router = useRouter()
  const p = draft.payload
  const isPending = draft.status === 'pending_review'
  const isApproved = draft.status === 'approved'
  const isExecuted = draft.status === 'executed'
  const isRejected = draft.status === 'rejected'

  return (
    <Card>
      <CardContent className="py-5 space-y-5">

        {/* Player + level movement */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-sm font-semibold text-text-primary">
              {draft.playerName ?? p.player_label ?? 'Unknown player'}
            </p>
          </div>
          <div className="flex items-center gap-3 pl-5">
            <span className="text-[11px] text-text-muted bg-surface-raised border border-border px-2 py-0.5 rounded">
              {p.current_level ?? 'Current level unknown'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-lime shrink-0" />
            <span className="text-[11px] font-semibold text-lime bg-lime/10 border border-lime/20 px-2 py-0.5 rounded">
              {p.next_level ?? 'Target level unknown'}
            </span>
          </div>
        </div>

        {/* Readiness summary */}
        {p.readiness_summary && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Readiness Summary</p>
            <p className="text-[11px] text-text-secondary leading-relaxed pl-1">{p.readiness_summary}</p>
          </div>
        )}

        {/* Evidence present */}
        {p.evidence_present && p.evidence_present.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Evidence Present</p>
            <div className="space-y-1 pl-1">
              {p.evidence_present.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-secondary">
                  <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence missing */}
        {p.evidence_missing && p.evidence_missing.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Evidence Missing</p>
            <div className="space-y-1 pl-1">
              {p.evidence_missing.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                  <XCircle className="w-3 h-3 shrink-0 mt-0.5 text-status-red" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gate evidence freetext */}
        {p.gate_evidence && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Gate Evidence</p>
            <p className="text-[11px] text-text-secondary leading-relaxed pl-1">{p.gate_evidence}</p>
          </div>
        )}

        {/* Coach context */}
        {p.coach_context && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Coach Context</p>
            <p className="text-[11px] text-text-secondary leading-relaxed pl-1">{p.coach_context}</p>
          </div>
        )}

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

        {/* Applied state */}
        {isExecuted && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green/10 border border-status-green/30 text-[11px] text-status-green">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Level change applied — player curriculum state updated.</span>
          </div>
        )}

        {/* Rejected state */}
        {isRejected && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-red/10 border border-status-red/30 text-[11px] text-status-red">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Draft rejected — no level change was made.</span>
          </div>
        )}

        {/* Decision controls — pending only */}
        {isPending && (
          <div className="pt-2 border-t border-border">
            <DonnaIntelligenceDraftDecisionControls
              proposedActionId={draft.id}
              targetModule="level_review"
              onSuccess={() => router.refresh()}
            />
          </div>
        )}

        {/* Apply controls — approved only */}
        {isApproved && (
          <div className="pt-2 border-t border-border">
            <DonnaLevelMovementApplyControls
              proposedActionId={draft.id}
              playerLabel={draft.playerName ?? p.player_label ?? null}
              previewText={
                p.current_level && p.next_level
                  ? `${p.player_label ?? draft.playerName ?? 'Player'}: ${p.current_level} → ${p.next_level}`
                  : ''
              }
              onSuccess={() => router.refresh()}
            />
          </div>
        )}

      </CardContent>
    </Card>
  )
}
