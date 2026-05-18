import { MessageSquare, Clock, User, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

export interface CoachCurriculumSuggestionPayload {
  source: 'coach_curriculum_suggestion'
  level_id: string
  level_name: string
  suggestion: string
  submitted_by_role: string
}

export interface CoachCurriculumSuggestionItem {
  id: string
  status: string
  createdAt: string
  proposerName: string | null
  payload: CoachCurriculumSuggestionPayload
}

export function CoachCurriculumSuggestionCard({ item }: { item: CoachCurriculumSuggestionItem }) {
  const { payload } = item

  const statusLabel =
    item.status === 'pending_review' ? 'Awaiting director review' :
    item.status === 'rejected'       ? 'No action taken' :
    item.status === 'approved'       ? 'Acknowledged' :
    item.status

  const statusColor =
    item.status === 'pending_review' ? 'text-status-orange' :
    item.status === 'rejected'       ? 'text-text-muted' :
    item.status === 'approved'       ? 'text-status-green' :
    'text-text-muted'

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-status-blue shrink-0" />
              <p className="text-[10px] uppercase tracking-widest text-status-blue font-semibold">
                Coach Curriculum Suggestion
              </p>
            </div>
            <p className="text-[13px] font-semibold text-text-primary">
              Suggestion for {payload.level_name}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              {item.proposerName && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.proposerName}
                </span>
              )}
              <span>{new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              <span className={statusColor}>{statusLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted capitalize">
              {payload.submitted_by_role.replace('_', ' ')}
            </span>
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-border text-text-muted">
              <Layers className="w-3 h-3" />
              {payload.level_name}
            </span>
          </div>
        </div>

        {/* Suggestion text */}
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-3 space-y-2">
          <p className="text-[11px] font-semibold text-text-secondary">Coach's suggestion</p>
          <p className="text-[12px] text-text-primary leading-relaxed">{payload.suggestion}</p>
        </div>

        {/* Director note */}
        <div className="flex items-start gap-2 rounded-xl border border-status-blue/10 bg-status-blue/[0.03] px-3 py-2.5">
          <MessageSquare className="w-3.5 h-3.5 text-status-blue shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed">
            This is a coach suggestion — no curriculum data has changed. You can use this as input when drafting a change in the{' '}
            <span className="text-status-blue font-semibold">Curriculum Builder</span>. No approval required to acknowledge it.
          </p>
        </div>

        {item.status === 'pending_review' && (
          <div className="flex items-center gap-2 text-[11px] text-status-orange">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Unread — no action required, but this coach is waiting for context.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
