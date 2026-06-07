import type { ConfidenceLevel } from '@/lib/donna/confidenceEngine'

interface Props {
  confidence: ConfidenceLevel
  evidenceSummary: string
  recommendedAction?: string
  actionHref?: string
}

const STYLES: Record<ConfidenceLevel, string> = {
  high:   'text-status-green',
  medium: 'text-yellow-400',
  low:    'text-text-muted',
}

const LABELS: Record<ConfidenceLevel, string> = {
  high:   'High confidence',
  medium: 'Medium confidence',
  low:    'Low confidence',
}

export function DonnaSignalMeta({ confidence, evidenceSummary, recommendedAction, actionHref }: Props) {
  return (
    <div className="mt-1.5 space-y-0.5">
      <div className="flex items-start gap-1.5 flex-wrap">
        <span className={`text-[10px] font-semibold shrink-0 ${STYLES[confidence]}`}>
          {LABELS[confidence]}
        </span>
        <span className="text-[10px] text-text-muted shrink-0">·</span>
        <span className="text-[10px] text-text-muted leading-snug italic">{evidenceSummary}</span>
      </div>
      {recommendedAction && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-text-muted">→</span>
          {actionHref ? (
            <a href={actionHref} className="text-[10px] text-lime hover:opacity-80 transition-opacity">
              {recommendedAction}
            </a>
          ) : (
            <span className="text-[10px] text-text-secondary">{recommendedAction}</span>
          )}
        </div>
      )}
    </div>
  )
}
