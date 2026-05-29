import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { buildProactiveAlerts, type AlertUrgency } from '@/lib/donna/donnaProactiveAlerts'

// Sprint 959 — read-only intelligence signals surface for /director/donna.
// Wires buildProactiveAlerts with available ctx data (pendingReviews, sessionsWithoutWrapUp).
// reviewOldestDaysAgo and parentSummariesReady are NOT passed (data unavailable without new
// queries) — those alert types safely default to not firing. No mutations. No fake data.

interface DonnaIntelligenceSignalsCardProps {
  pendingReviews: number
  sessionsWithoutWrapUp: number
  isLive: boolean
}

const URGENCY_CHIP: Record<AlertUrgency, string> = {
  critical: 'text-status-red   border-status-red/25   bg-status-red/8',
  high:     'text-status-orange border-status-orange/25 bg-status-orange/8',
  medium:   'text-yellow-400   border-yellow-500/25   bg-yellow-500/5',
  low:      'text-text-muted   border-border          bg-surface-raised',
}

const URGENCY_LABEL: Record<AlertUrgency, string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Review',
  low:      'Info',
}

export function DonnaIntelligenceSignalsCard({
  pendingReviews,
  sessionsWithoutWrapUp,
  isLive,
}: DonnaIntelligenceSignalsCardProps) {
  const alerts = buildProactiveAlerts({
    pendingReviews,
    sessionsWithoutWrapUp,
    // reviewOldestDaysAgo omitted — not available without a new query; review_aging alert will not fire
    // parentSummariesReady omitted — not available without a new query; parent_summary_ready alert will not fire
  })

  return (
    <div data-donna-focus-id="donna-intelligence-signals">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <span className="label-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-lime" />
              Intelligence Signals
            </span>
            {!isLive && (
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-status-orange/20 bg-status-orange/5 text-status-orange">
                Demo
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-text-muted">No active intelligence signals.</p>
              <p className="text-[11px] text-text-muted/70 mt-1 leading-snug">
                Signals appear when sessions are missing wrap-ups or review items age.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map(alert => (
                <Link
                  key={alert.id}
                  href={alert.actionRoute}
                  className="group flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-border hover:border-lime/20 hover:bg-surface-raised transition-all"
                >
                  <span className={`shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${URGENCY_CHIP[alert.urgency]}`}>
                    {URGENCY_LABEL[alert.urgency]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary leading-snug">{alert.headline}</p>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{alert.body}</p>
                    {alert.safetyNote && (
                      <p className="text-[10px] text-text-muted/60 mt-1 italic">{alert.safetyNote}</p>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted/30 group-hover:text-lime/50 shrink-0 mt-0.5 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
