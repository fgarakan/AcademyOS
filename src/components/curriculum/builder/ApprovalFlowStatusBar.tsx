import { Clock, CheckCircle2, XCircle, Play } from 'lucide-react'

type ApprovalStatus = 'draft' | 'pending_review' | 'approved' | 'applied' | 'rejected'

interface Props {
  status: ApprovalStatus
  proposedAt?: string
  reviewedAt?: string
  appliedAt?: string
  reviewerName?: string
}

const STATUS_STEPS: { id: ApprovalStatus; label: string }[] = [
  { id: 'draft',          label: 'Drafted' },
  { id: 'pending_review', label: 'In review' },
  { id: 'approved',       label: 'Approved' },
  { id: 'applied',        label: 'Applied' },
]

const ORDER: Record<ApprovalStatus, number> = {
  draft: 0, pending_review: 1, approved: 2, applied: 3, rejected: -1,
}

export function ApprovalFlowStatusBar({ status, proposedAt, reviewedAt, appliedAt, reviewerName }: Props) {
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-status-red/20 bg-status-red/[0.04] px-3 py-2">
        <XCircle className="w-4 h-4 text-status-red shrink-0" />
        <div>
          <p className="text-[11px] font-semibold text-status-red">Rejected</p>
          {reviewerName && <p className="text-[10px] text-text-muted">by {reviewerName}</p>}
        </div>
      </div>
    )
  }

  const currentOrder = ORDER[status]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map(({ id, label }, idx) => {
          const stepOrder = ORDER[id]
          const isComplete = stepOrder < currentOrder
          const isCurrent = stepOrder === currentOrder
          const isFuture = stepOrder > currentOrder

          return (
            <div key={id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isComplete ? 'bg-status-green border-status-green' :
                  isCurrent  ? 'bg-lime/20 border-lime' :
                               'bg-surface border-border'
                }`}>
                  {isComplete ? (
                    <CheckCircle2 className="w-3 h-3 text-base" />
                  ) : isCurrent ? (
                    id === 'applied' ? <Play className="w-2.5 h-2.5 text-lime" /> : <Clock className="w-2.5 h-2.5 text-lime" />
                  ) : null}
                </div>
                <p className={`text-[9px] font-semibold uppercase tracking-wide ${
                  isComplete ? 'text-status-green' :
                  isCurrent  ? 'text-lime' :
                               'text-text-muted'
                }`}>{label}</p>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`h-px flex-1 -mt-4 mx-1 ${stepOrder < currentOrder ? 'bg-status-green' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>

      {reviewerName && status === 'approved' && (
        <p className="text-[10px] text-text-muted text-center">Approved by {reviewerName}</p>
      )}
    </div>
  )
}
