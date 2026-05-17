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
    title: 'Wrap-up submitted — in director review queue',
    helper: "Your notes are queued for director review. You'll be notified here if clarification is needed.",
    colorClass: 'text-status-blue',
    borderClass: 'border-status-blue/25',
    bgClass: 'bg-status-blue/5',
  },
  approved: {
    icon: <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />,
    title: 'Wrap-up approved by director',
    helper: 'The director has approved your notes. They will apply them to the session record.',
    colorClass: 'text-status-green',
    borderClass: 'border-status-green/25',
    bgClass: 'bg-status-green/5',
  },
  executed: {
    icon: <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    title: 'Wrap-up applied to session record',
    helper: 'Your notes are now part of the official session record. No further action needed.',
    colorClass: 'text-status-green',
    borderClass: 'border-status-green/25',
    bgClass: 'bg-status-green/5',
  },
  clarification_needed: {
    icon: <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    title: 'Director requested clarification',
    helper: 'Read the director note below. Update your wrap-up and resubmit using the form above.',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/25',
    bgClass: 'bg-status-orange/5',
  },
  rejected: {
    icon: <XCircle className="w-4 h-4 shrink-0 mt-0.5" />,
    title: 'Wrap-up not approved',
    helper: 'Contact your director directly for guidance on what to resubmit.',
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
