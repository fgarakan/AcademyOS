import { AlertTriangle, Lock, WifiOff, RefreshCw, ShieldAlert, ArrowRight } from 'lucide-react'

type BlockedReason =
  | 'auth'
  | 'permission'
  | 'db_unavailable'
  | 'draft_blocked'
  | 'schema_missing'
  | 'unknown'

interface Props {
  reason: BlockedReason
  detail?: string
  onRetry?: () => void
}

const REASON_CONFIG: Record<BlockedReason, {
  Icon: typeof AlertTriangle
  iconColor: string
  headline: string
  body: string
  retryLabel?: string
  helpHint?: string
}> = {
  auth: {
    Icon: Lock,
    iconColor: 'text-status-red',
    headline: 'Not signed in',
    body: 'You need to be signed in to access the Curriculum Builder. Please sign in and try again.',
    retryLabel: 'Sign in',
    helpHint: 'Your session may have expired.',
  },
  permission: {
    Icon: ShieldAlert,
    iconColor: 'text-status-orange',
    headline: 'Access restricted',
    body: 'Only academy directors and head coaches can draft curriculum changes. Ask your director for access.',
    helpHint: 'Coaches can submit suggestions via the session wrap-up note.',
  },
  db_unavailable: {
    Icon: WifiOff,
    iconColor: 'text-status-orange',
    headline: 'Curriculum data unavailable',
    body: 'The curriculum database could not be reached. This is usually temporary — try refreshing.',
    retryLabel: 'Retry',
    helpHint: 'If this persists, the curriculum tables may not be seeded yet.',
  },
  draft_blocked: {
    Icon: AlertTriangle,
    iconColor: 'text-status-red',
    headline: 'Draft could not be saved',
    body: 'The draft was blocked before saving. Nothing has been changed in the curriculum.',
    retryLabel: 'Try again',
    helpHint: 'This is usually a temporary issue. Your text has not been lost — try again.',
  },
  schema_missing: {
    Icon: AlertTriangle,
    iconColor: 'text-status-orange',
    headline: 'Database schema not ready',
    body: 'The required curriculum tables are missing. The migrations may not have run yet.',
    helpHint: 'Ask a developer to run the curriculum migrations against this environment.',
  },
  unknown: {
    Icon: AlertTriangle,
    iconColor: 'text-text-muted',
    headline: 'Something went wrong',
    body: 'An unexpected error occurred. Nothing has been changed — your work is safe.',
    retryLabel: 'Try again',
    helpHint: 'If this keeps happening, contact your administrator.',
  },
}

export function CurriculumBlockedState({ reason, detail, onRetry }: Props) {
  const cfg = REASON_CONFIG[reason]
  const { Icon } = cfg

  return (
    <div className="rounded-2xl border border-status-red/15 bg-status-red/[0.03] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl border border-status-red/20 bg-status-red/[0.06] flex items-center justify-center shrink-0">
          <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary">{cfg.headline}</p>
          <p className="text-[12px] text-text-muted leading-relaxed mt-0.5">{cfg.body}</p>
        </div>
      </div>

      {/* Detail message from server if any */}
      {detail && (
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
          <p className="text-[11px] text-text-muted font-mono leading-relaxed">{detail}</p>
        </div>
      )}

      {/* Help hint */}
      {cfg.helpHint && (
        <div className="flex items-start gap-2">
          <ArrowRight className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed">{cfg.helpHint}</p>
        </div>
      )}

      {/* Retry action */}
      {onRetry && cfg.retryLabel && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-[12px] text-text-secondary font-semibold hover:border-lime/30 hover:text-text-primary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {cfg.retryLabel}
        </button>
      )}
    </div>
  )
}
