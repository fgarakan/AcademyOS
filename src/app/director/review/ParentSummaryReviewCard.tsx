'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Eye, EyeOff, CheckCircle2, AlertTriangle, ShieldCheck, User, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { DonnaIntelligenceDraftDecisionControls } from '@/components/assistant/DonnaIntelligenceDraftDecisionControls'
import { applyParentCommunicationAction } from './applyParentCommunicationAction'

// ── Payload ────────────────────────────────────────────────────────────────────

export interface ParentSummaryPayload {
  draft_type?: string
  source?: string
  player_id?: string | null
  player_label?: string | null
  update_focus?: string | null
  tone?: string | null
  draft_text?: string | null
  draft_sections?: {
    working_on?: string | null
    improved?: string | null
    needs_support?: string | null
    parent_can_do?: string | null
    whats_next?: string | null
  }
  has_assessment?: boolean
  has_priorities?: boolean
  advancement_eligible?: boolean | null
  warnings?: string[]
}

export interface EnrichedParentSummaryDraftItem {
  id: string
  status: string
  createdAt: string
  playerId: string | null
  playerName: string | null
  proposerName: string | null
  payload: ParentSummaryPayload
}

// ── Section display ────────────────────────────────────────────────────────────

function SectionRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">{label}</p>
      <p className="text-[11px] text-text-secondary leading-relaxed pl-1">{value}</p>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ParentSummaryReviewCard({ draft }: { draft: EnrichedParentSummaryDraftItem }) {
  const router = useRouter()
  const [applyResult, setApplyResult] = useState<{ ok: boolean; error: string | null } | null>(null)
  const [isApplyPending, startApplyTransition] = useTransition()
  const p = draft.payload
  const isPending = draft.status === 'pending_review'
  const isApproved = draft.status === 'approved'
  const isExecuted = draft.status === 'executed'
  const isRejected = draft.status === 'rejected'
  const sections = p.draft_sections ?? {}

  return (
    <Card className="border border-status-orange/20">
      <CardContent className="py-5 space-y-5">

        {/* High-visibility banner */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/8 border border-status-orange/25 text-[11px] text-status-orange">
          <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="font-medium">Parent-visible content — review carefully before approving.</span>
        </div>

        {/* Player + focus */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-sm font-semibold text-text-primary">
              {draft.playerName ?? p.player_label ?? 'Unknown player'}
            </p>
          </div>
          {p.update_focus && (
            <p className="text-[11px] text-text-muted pl-5">Focus: {p.update_focus}</p>
          )}
          {p.tone && (
            <p className="text-[11px] text-text-muted pl-5">Tone: {p.tone}</p>
          )}
        </div>

        {/* Full draft text (parent-safe) */}
        {p.draft_text && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Draft Message</p>
            <div className="px-3 py-3 rounded-lg bg-surface-raised border border-border">
              <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">{p.draft_text}</p>
            </div>
          </div>
        )}

        {/* Structured sections */}
        {Object.values(sections).some(Boolean) && (
          <div className="space-y-3 pt-1 border-t border-border">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Draft Sections</p>
            <SectionRow label="Working on" value={sections.working_on} />
            <SectionRow label="Improved" value={sections.improved} />
            <SectionRow label="Needs support" value={sections.needs_support} />
            <SectionRow label="Parent can do" value={sections.parent_can_do} />
            <SectionRow label="What&apos;s next" value={sections.whats_next} />
          </div>
        )}

        {/* Source signals (no raw notes) */}
        <div className="flex flex-wrap gap-2">
          {p.has_assessment && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-muted">
              Based on assessment data
            </span>
          )}
          {p.has_priorities && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised border border-border text-text-muted">
              Priorities included
            </span>
          )}
          {p.advancement_eligible === true && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime/10 border border-lime/20 text-lime">
              Advancement eligible
            </span>
          )}
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

        {/* Safety notice — no raw coach notes */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
          <EyeOff className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            This draft contains no raw internal coach notes. All content was filtered to parent-safe language at draft creation.
          </span>
        </div>

        {/* Approved state — Apply button to publish to parent portal */}
        {isApproved && (
          <div className="space-y-2 pt-1 border-t border-border">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Send to Parent</p>
            <p className="text-[11px] text-text-muted">
              This draft is approved. Applying it publishes the summary to the parent portal and records the send in the audit log.
            </p>
            {applyResult && !applyResult.ok && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-red/8 border border-status-red/25 text-[11px] text-status-red">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{applyResult.error}</span>
              </div>
            )}
            <button
              type="button"
              disabled={isApplyPending}
              onClick={() => {
                setApplyResult(null)
                startApplyTransition(async () => {
                  const result = await applyParentCommunicationAction(draft.id)
                  setApplyResult({ ok: result.ok, error: result.error })
                  if (result.ok) router.refresh()
                })
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime/10 border border-lime/30 text-lime text-sm font-semibold hover:bg-lime/20 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isApplyPending ? 'Sending…' : 'Apply — Publish to Parent Portal'}
            </button>
          </div>
        )}

        {/* Executed terminal state */}
        {isExecuted && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green/10 border border-status-green/30 text-[11px] text-status-green">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Marked as executed — draft review cycle complete.</span>
          </div>
        )}

        {/* Rejected terminal state */}
        {isRejected && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-red/10 border border-status-red/30 text-[11px] text-status-red">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Rejected — parent was not contacted. Submit a new draft to try again.</span>
          </div>
        )}

        {/* Decision controls — pending only */}
        {isPending && (
          <div className="pt-2 border-t border-border">
            <DonnaIntelligenceDraftDecisionControls
              proposedActionId={draft.id}
              targetModule="parent_communication"
              onSuccess={() => router.refresh()}
            />
          </div>
        )}

      </CardContent>
    </Card>
  )
}
