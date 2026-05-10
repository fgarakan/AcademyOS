import { CheckCircle2, FileText, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

interface Props {
  status: string
  sessionNotes: string | null
}

export function SessionActualDisplay({ status, sessionNotes }: Props) {
  const isCompleted = status === 'completed'

  return (
    <div className="space-y-2">
      <p className="label-xs">Session Actual</p>
      <Card>
        <CardContent className="py-4 space-y-4">

          {/* Status row */}
          <div className="flex items-center gap-3 flex-wrap">
            {isCompleted ? (
              <>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-status-green bg-status-green/10 border border-status-green/25 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </span>
                <p className="text-xs text-text-muted">This session has been marked completed.</p>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted bg-surface-raised border border-border px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Not Applied Yet
                </span>
                <p className="text-xs text-text-muted">Session actual has not been applied.</p>
              </>
            )}
          </div>

          {/* Notes or empty state */}
          {sessionNotes ? (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Official Notes
              </p>
              <p className="text-xs text-text-secondary whitespace-pre-wrap px-3 py-3 rounded-lg bg-surface-raised border border-border leading-relaxed">
                {sessionNotes}
              </p>
              <p className="text-[11px] text-text-muted">
                These notes reflect the approved session wrap-up applied to this session.
              </p>
            </div>
          ) : (
            <div className="px-3 py-4 rounded-lg bg-surface-raised border border-border space-y-1">
              <p className="text-sm text-text-muted">No session actual notes have been applied yet.</p>
              <p className="text-[11px] text-text-muted">
                Approved coach wrap-ups will appear here after they are applied.
              </p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
