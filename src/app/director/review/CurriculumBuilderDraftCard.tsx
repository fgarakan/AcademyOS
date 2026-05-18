import { Sparkles, Shield, Clock, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

export interface CurriculumBuilderDraftPayload {
  source: 'curriculum_builder'
  change_type: 'add_drill' | 'add_gate' | 'add_fitness' | 'add_mission' | 'rewrite_level'
  level_id: string
  level_name: string
  description: string
  domain?: string | null
  drafted_by_role: string
}

export interface CurriculumBuilderDraftItem {
  id: string
  status: string
  createdAt: string
  proposerName: string | null
  payload: CurriculumBuilderDraftPayload
}

const CHANGE_LABELS: Record<CurriculumBuilderDraftPayload['change_type'], string> = {
  add_drill:     'Add drill',
  add_gate:      'Add assessment gate',
  add_fitness:   'Add fitness support',
  add_mission:   'Add player mission',
  rewrite_level: 'Rewrite level intent',
}

export function CurriculumBuilderDraftCard({ draft }: { draft: CurriculumBuilderDraftItem }) {
  const { payload } = draft

  const statusLabel =
    draft.status === 'approved'       ? 'Approved — ready to apply' :
    draft.status === 'pending_review' ? 'Pending review' :
    draft.status === 'executed'       ? 'Applied' :
    draft.status === 'rejected'       ? 'Rejected' :
    draft.status

  const statusColor =
    draft.status === 'approved'       ? 'text-status-green' :
    draft.status === 'pending_review' ? 'text-status-orange' :
    draft.status === 'executed'       ? 'text-status-blue' :
    draft.status === 'rejected'       ? 'text-status-red' :
    'text-text-muted'

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-lime shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-lime font-semibold">
                Curriculum Builder Draft
              </p>
            </div>
            <p className="text-[13px] font-semibold text-text-primary">
              {CHANGE_LABELS[payload.change_type]} — {payload.level_name}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              {draft.proposerName && <span>by {draft.proposerName}</span>}
              <span>{new Date(draft.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              <span className={statusLabel ? statusColor : ''}>{statusLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {payload.domain && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted">{payload.domain}</span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded border border-lime/20 text-lime">
              {CHANGE_LABELS[payload.change_type]}
            </span>
          </div>
        </div>

        {/* Draft content */}
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-[11px] font-semibold text-text-secondary">Draft description</p>
          </div>
          <p className="text-[12px] text-text-primary leading-relaxed">{payload.description}</p>
        </div>

        {/* Safety banner */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-lime/10 bg-lime/[0.02] text-xs text-text-muted">
          <Shield className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <span>
            Draft only — no curriculum data has been changed. Approving queues the change for structured application. Nothing is applied automatically.
          </span>
        </div>

        {/* Status footer */}
        {draft.status === 'pending_review' && (
          <div className="flex items-center gap-2 text-[11px] text-status-orange">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Awaiting director review · Approve or reject below</span>
          </div>
        )}

        {/* Decision controls placeholder — wired when review queue supports curriculum_builder target_module */}
        {draft.status === 'pending_review' && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button className="btn-lime text-[12px] px-4 py-2" disabled>
              Approve (coming soon)
            </button>
            <button className="btn-ghost text-[12px] px-4 py-2" disabled>
              Reject
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
