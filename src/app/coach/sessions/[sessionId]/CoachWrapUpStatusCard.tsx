import { Clock, CheckCircle2, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface StatusConfig {
  icon: React.ReactNode
  title: string
  helper: string
  colorClass: string
  borderClass: string
  bgClass: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  pending_review: {
    icon: <Clock className="w-4 h-4 shrink-0 mt-0.5" />,
    title: 'Wrap-up submitted — awaiting director review',
    helper: 'Director is reviewing your notes.',
    colorClass: 'text-status-blue',
    borderClass: 'border-status-blue/25',
    bgClass: 'bg-status-blue/5',
  },
  approved: {
    icon: <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />,
    title: 'Wrap-up approved',
    helper: 'Director can apply it to the session record.',
    colorClass: 'text-status-green',
    borderClass: 'border-status-green/25',
    bgClass: 'bg-status-green/5',
  },
  executed: {
    icon: <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    title: 'Wrap-up applied to the session record',
    helper: 'Your notes are now part of the official session record.',
    colorClass: 'text-status-green',
    borderClass: 'border-status-green/25',
    bgClass: 'bg-status-green/5',
  },
  clarification_needed: {
    icon: <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    title: 'Director requested clarification',
    helper: 'Review the feedback and update your wrap-up if needed.',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/25',
    bgClass: 'bg-status-orange/5',
  },
  rejected: {
    icon: <XCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    title: 'Wrap-up was not approved',
    helper: 'Check with the director if you need more context.',
    colorClass: 'text-status-red',
    borderClass: 'border-status-red/25',
    bgClass: 'bg-status-red/5',
  },
}

interface Props {
  status: string | null
  reviewerNote?: string | null
}

export function CoachWrapUpStatusCard({ status, reviewerNote }: Props) {
  if (!status) return null
  const config = STATUS_MAP[status]
  if (!config) return null

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${config.bgClass} ${config.borderClass} ${config.colorClass}`}
    >
      {config.icon}
      <div className="min-w-0">
        <p className="text-sm font-medium">{config.title}</p>
        <p className="text-xs mt-0.5 opacity-80">{config.helper}</p>
        {status === 'clarification_needed' && reviewerNote && (
          <p className="text-xs mt-2 text-text-secondary leading-snug">
            <span className="font-medium text-status-orange">Director note:</span>{' '}
            {reviewerNote}
          </p>
        )}
      </div>
    </div>
  )
}
