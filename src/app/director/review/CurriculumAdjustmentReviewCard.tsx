'use client'

// Sprint 636 — Curriculum Draft Review Flow V1
// Shows a curriculum_adjustment proposed_action in the review item detail view.
// No direct curriculum mutation here — all changes go through the existing
// applyApprovedCurriculumAdjustmentAction server action (Sprint 285).
// Director approves → separate Apply step → versioned override record created.

import { useRouter } from 'next/navigation'
import { Layers, ShieldCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { DonnaIntelligenceDraftDecisionControls } from '@/components/assistant/DonnaIntelligenceDraftDecisionControls'
import { DonnaCurriculumAdjustmentApplyControls } from '@/components/assistant/DonnaCurriculumAdjustmentApplyControls'

// ── Payload ────────────────────────────────────────────────────────────────────

export interface CurriculumAdjustmentPayload {
  draft_type?: string
  source?: string
  adjustment_type?: string | null
  target_level?: string | null
  proposed_change?: string | null
  reason?: string | null
  affected_players?: string | null
  warnings?: string[]
}

export interface EnrichedCurriculumAdjustmentDraftItem {
  id: string
  status: string
  createdAt: string
  proposerName: string | null
  payload: CurriculumAdjustmentPayload
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CurriculumAdjustmentReviewCard({ draft }: { draft: EnrichedCurriculumAdjustmentDraftItem }) {
  const router = useRouter()
  const p = draft.payload
  const isPending = draft.status === 'pending_review'
  const isApproved = draft.status === 'approved'
  const isExecuted = draft.status === 'executed'
  const isRejected = draft.status === 'rejected'

  return (
    <Card>
      <CardContent className="py-5 space-y-5">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-lime shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">Curriculum Adjustment Draft</p>
          </div>
          {p.adjustment_type && (
            <p className="text-sm font-semibold text-text-primary pl-5">{p.adjustment_type}</p>
          )}
          {p.target_level && (
            <p className="text-[11px] text-text-muted pl-5">Level: {p.target_level}</p>
          )}
        </div>

        {/* Proposed change */}
        {p.proposed_change && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Proposed Change</p>
            <div className="px-3 py-3 rounded-lg bg-surface-raised border border-border">
              <p className="text-[12px] text-text-secondary leading-relaxed">{p.proposed_change}</p>
            </div>
          </div>
        )}

        {/* Reason */}
        {p.reason && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Reason</p>
            <p className="text-[11px] text-text-secondary leading-relaxed pl-1">{p.reason}</p>
          </div>
        )}

        {/* Affected players */}
        {p.affected_players && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Affected Players</p>
            <p className="text-[11px] text-text-secondary leading-relaxed pl-1">{p.affected_players}</p>
          </div>
        )}

        {/* Scope note — no direct mutation */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            Approval does not immediately change any curriculum data. The Apply step creates a versioned override record. Core curriculum spine, template blocks, and session blocks are not modified directly.
          </span>
        </div>

        {/* Parent/player visibility note */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
          <span>
            No parent or player visibility change. Curriculum adjustments are internal coaching records. Players and parents are not notified.
          </span>
        </div>

        {/* Warnings from draft */}
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
        {isExecuted && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green/10 border border-status-green/30 text-[11px] text-status-green">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Applied — versioned override record created. Audit log written.</span>
          </div>
        )}
        {isRejected && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-red/10 border border-status-red/30 text-[11px] text-status-red">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Rejected — no curriculum data was changed.</span>
          </div>
        )}

        {/* Decision controls — pending */}
        {isPending && (
          <div className="pt-2 border-t border-border">
            <DonnaIntelligenceDraftDecisionControls
              proposedActionId={draft.id}
              targetModule="curriculum_adjustment"
              onSuccess={() => router.refresh()}
            />
          </div>
        )}

        {/* Apply controls — approved */}
        {isApproved && (
          <div className="pt-2 border-t border-border">
            <DonnaCurriculumAdjustmentApplyControls
              proposedActionId={draft.id}
              previewText={
                p.adjustment_type && p.target_level
                  ? `${p.adjustment_type} — ${p.target_level}`
                  : (p.proposed_change?.slice(0, 80) ?? '')
              }
              onSuccess={() => router.refresh()}
            />
          </div>
        )}

      </CardContent>
    </Card>
  )
}
