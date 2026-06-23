'use client'

// Sprint 639 — Knowledge Promotion Review Flow V1
// Review card for knowledge_promotion proposed_actions.
// Platform-owner approval required for global destinations.
// Academy director can approve for academy-local destinations only.
// No apply path exists yet. Approval captures the decision only.
// Future sprint will add knowledge promotion apply + platform-owner review gate.

import { useRouter } from 'next/navigation'
import { BookOpen, Globe, Shield, ShieldCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { DonnaIntelligenceDraftDecisionControls } from './DonnaIntelligenceDraftDecisionControls'

// ── Destination types ─────────────────────────────────────────────────────────

export type KnowledgeDestination =
  | 'global_core_curriculum'
  | 'approved_general_knowledge'
  | 'academy_local_draft'

export interface KnowledgePromotionPayload {
  draft_type?: string
  source?: string
  knowledge_item_id?: string | null
  knowledge_item_label?: string | null
  knowledge_summary?: string | null
  source_attribution?: string | null
  proposed_destination?: KnowledgeDestination | string | null
  requires_platform_owner?: boolean | null
  player_id?: string | null
  player_label?: string | null
  tags?: string[]
  warnings?: string[]
}

export interface EnrichedKnowledgePromotionDraftItem {
  id: string
  status: string
  createdAt: string
  proposerName: string | null
  payload: KnowledgePromotionPayload
}

const DESTINATION_LABELS: Record<string, string> = {
  global_core_curriculum: 'Global Core Curriculum',
  approved_general_knowledge: 'Approved General Knowledge Base',
  academy_local_draft: 'Academy-Local Draft',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function KnowledgePromotionReviewCard({ draft }: { draft: EnrichedKnowledgePromotionDraftItem }) {
  const router = useRouter()
  const p = draft.payload
  const isPending = draft.status === 'pending_review'
  const isApproved = draft.status === 'approved'
  const isRejected = draft.status === 'rejected'
  const isExecuted = draft.status === 'executed'
  const requiresPlatformOwner = p.requires_platform_owner !== false &&
    (p.proposed_destination === 'global_core_curriculum' || p.proposed_destination === 'approved_general_knowledge')

  return (
    <Card>
      <CardContent className="py-5 space-y-5">

        {/* Platform-owner gate banner */}
        {requiresPlatformOwner && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-status-orange/20 text-[11px] text-status-orange">
            <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="font-medium">Platform-owner approval required — global knowledge promotion cannot be applied by the academy director alone.</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-lime shrink-0" />
          <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">Knowledge Promotion Draft</p>
        </div>

        {/* Item details */}
        {p.knowledge_item_label && (
          <p className="text-sm font-semibold text-text-primary">{p.knowledge_item_label}</p>
        )}
        {p.knowledge_summary && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Summary</p>
            <div className="px-3 py-2.5 rounded-lg bg-surface-raised border border-border">
              <p className="text-[11px] text-text-secondary leading-relaxed">{p.knowledge_summary}</p>
            </div>
          </div>
        )}

        {/* Source */}
        {p.source_attribution && (
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Source Attribution</p>
            <p className="text-[11px] text-text-muted pl-1">{p.source_attribution}</p>
          </div>
        )}

        {/* Destination */}
        {p.proposed_destination && (
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-text-muted shrink-0" />
            <span className="text-[11px] text-text-secondary">
              Destination: <span className="font-medium">
                {DESTINATION_LABELS[p.proposed_destination] ?? p.proposed_destination}
              </span>
            </span>
            {requiresPlatformOwner && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-orange/10 border border-status-orange/20 text-status-orange">
                Platform-owner required
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {p.tags && p.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((tag, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Safety notices */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
          <span>
            This knowledge item is not visible to parents or players until explicitly promoted and published through the approved destination path.
          </span>
        </div>

        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <Info className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
          <span>
            No knowledge promotion apply path exists yet. Approving captures your review decision — knowledge will not be promoted until the apply action and platform-owner gate are built in a future sprint.
          </span>
        </div>

        {/* Warnings */}
        {p.warnings && p.warnings.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border">
            {p.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-text-muted">
                <Shield className="w-3 h-3 shrink-0 mt-0.5 text-status-green" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Terminal states */}
        {isApproved && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-lime/10 border border-lime/20 text-[11px] text-lime">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              Approved — {requiresPlatformOwner ? 'platform-owner review still required. ' : ''}
              Knowledge promotion apply step not yet available.
            </span>
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
            <span>Rejected — knowledge item was not promoted.</span>
          </div>
        )}

        {/* Decision controls — for academy-local destination, director can approve */}
        {isPending && !requiresPlatformOwner && (
          <div className="pt-2 border-t border-border">
            <DonnaIntelligenceDraftDecisionControls
              proposedActionId={draft.id}
              targetModule="knowledge_promotion"
              onSuccess={() => router.refresh()}
            />
          </div>
        )}

        {/* Platform-owner gate — cannot approve at director level */}
        {isPending && requiresPlatformOwner && (
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/8 border border-status-orange/20 text-[11px] text-status-orange">
              <Globe className="w-3 h-3 shrink-0 mt-0.5" />
              <span>
                This promotion requires platform-owner approval. Academy directors cannot approve global knowledge promotions. Contact the platform owner to proceed.
              </span>
            </div>
            <DonnaIntelligenceDraftDecisionControls
              proposedActionId={draft.id}
              targetModule="knowledge_promotion"
              onSuccess={() => router.refresh()}
            />
          </div>
        )}

      </CardContent>
    </Card>
  )
}
