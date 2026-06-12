import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, ChevronRight, History } from 'lucide-react'
import type { DonnaActionMemoryEntry } from '@/lib/donna/actions/donnaActionMemory'
import type { DonnaActionStatus } from '@/lib/donna/actions/donnaActionContract'

interface Props {
  entries: DonnaActionMemoryEntry[]
}

// Re-export type for convenience in consuming files
export type { DonnaActionMemoryEntry }

function StatusIcon({ status }: { status: DonnaActionStatus }) {
  switch (status) {
    case 'completed':   return <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0" />
    case 'dismissed':   return <XCircle      className="w-3.5 h-3.5 text-text-muted shrink-0" />
    case 'in_progress': return <Clock        className="w-3.5 h-3.5 text-status-blue shrink-0" />
    case 'expired':     return <XCircle      className="w-3.5 h-3.5 text-text-muted/50 shrink-0" />
    default:            return <Clock        className="w-3.5 h-3.5 text-status-orange shrink-0" />
  }
}

function statusLabel(status: DonnaActionStatus): string {
  switch (status) {
    case 'completed':   return 'Completed'
    case 'dismissed':   return 'Dismissed'
    case 'in_progress': return 'In progress'
    case 'draft':       return 'Draft'
    case 'pending':     return 'Pending'
    case 'expired':     return 'Expired'
    default:            return status
  }
}

function relativeDate(iso: string): string {
  const ms   = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function DonnaActionTimeline({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center space-y-1">
        <History className="w-5 h-5 text-text-muted mx-auto" />
        <p className="text-[11px] text-text-muted">No action history yet.</p>
        <p className="text-[10px] text-text-muted/60">
          Actions you take from DONNA drafts will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="label-xs">Action History</p>
      <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
            <div className="mt-0.5">
              <StatusIcon status={entry.status} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-[12px] font-medium text-text-primary leading-snug truncate">
                {entry.label}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-widest font-medium ${
                  entry.status === 'completed' ? 'text-status-green' :
                  entry.status === 'dismissed' ? 'text-text-muted' :
                  'text-status-orange'
                }`}>
                  {statusLabel(entry.status)}
                </span>
                <span className="text-[10px] text-text-muted">
                  {relativeDate(entry.decidedAt ?? entry.createdAt)}
                </span>
                {entry.domain && (
                  <span className="text-[10px] text-text-muted/60">· {entry.domain}</span>
                )}
              </div>
              {entry.outcome && (
                <p className="text-[11px] text-text-muted italic">{entry.outcome}</p>
              )}
            </div>
            {entry.route && (
              <Link
                href={entry.route}
                className="shrink-0 text-text-muted hover:text-lime transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
