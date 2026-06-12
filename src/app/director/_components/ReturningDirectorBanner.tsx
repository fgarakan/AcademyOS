import Link from 'next/link'
import { ChevronRight, TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-react'
import type { ReturningDirectorSummary } from '@/lib/donna/operations/directorDecisionEngine'

interface Props {
  summary:            ReturningDirectorSummary
  daysSinceLastVisit: number
}

export function ReturningDirectorBanner({ summary, daysSinceLastVisit }: Props) {
  const { whatChanged, whatImproved, whatMattersNow, recommendedFirstAction } = summary

  const changeIcon = (type: 'positive' | 'negative' | 'attention') => {
    if (type === 'positive')   return <TrendingUp   className="w-3.5 h-3.5 text-status-green shrink-0" />
    if (type === 'negative')   return <TrendingDown className="w-3.5 h-3.5 text-status-red shrink-0" />
    return                            <AlertCircle  className="w-3.5 h-3.5 text-status-orange shrink-0" />
  }

  const changeTextColor = (type: 'positive' | 'negative' | 'attention') => {
    if (type === 'positive')  return 'text-status-green'
    if (type === 'negative')  return 'text-status-red'
    return 'text-status-orange'
  }

  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/5 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-lime mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Welcome back — {daysSinceLastVisit} day{daysSinceLastVisit !== 1 ? 's' : ''} since your last visit
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Here is what happened while you were away.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* What Changed */}
        {whatChanged.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
              What changed
            </p>
            <div className="space-y-1.5">
              {whatChanged.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  {changeIcon(c.changeType)}
                  <div className="min-w-0">
                    <p className={`text-[12px] font-medium leading-snug ${changeTextColor(c.changeType)}`}>
                      {c.headline}
                    </p>
                    <p className="text-[11px] text-text-muted leading-snug truncate">
                      {c.detail}
                    </p>
                  </div>
                  {c.route && (
                    <Link href={c.route} className="shrink-0 text-lime hover:underline">
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What Improved */}
        {whatImproved.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
              What improved
            </p>
            <div className="space-y-1.5">
              {whatImproved.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-status-green shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-status-green leading-snug">
                      {w.headline}
                    </p>
                    <p className="text-[11px] text-text-muted leading-snug">
                      {w.evidence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* What Matters Now */}
      <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-1">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-lime/70">
          What matters now
        </p>
        <p className="text-[13px] font-semibold text-text-primary leading-snug">
          {whatMattersNow}
        </p>
      </div>

      {/* Recommended First Action */}
      <Link
        href={recommendedFirstAction.href}
        className="inline-flex items-center gap-2 btn-lime text-sm"
      >
        {recommendedFirstAction.label}
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
