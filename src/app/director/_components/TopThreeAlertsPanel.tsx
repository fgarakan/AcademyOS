// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// Top Three Alerts: awareness items. Maximum 3. Not work — awareness.

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Card } from '@/components/ui'
import type { OperatingAlert, SituationSeverity } from '@/lib/donna/operations/operatingPartnerOutputContract'

interface Props {
  alerts: OperatingAlert[]
}

const SEVERITY_ICON: Record<SituationSeverity, React.ReactNode> = {
  critical: <AlertCircle size={14} className="text-status-red flex-shrink-0" />,
  high:     <AlertTriangle size={14} className="text-status-orange flex-shrink-0" />,
  medium:   <Info size={14} className="text-status-blue flex-shrink-0" />,
  low:      <Info size={14} className="text-text-muted flex-shrink-0" />,
}

const SEVERITY_BADGE: Record<SituationSeverity, string> = {
  critical: 'bg-status-red/15 text-status-red',
  high:     'bg-status-orange/15 text-status-orange',
  medium:   'bg-status-blue/15 text-status-blue',
  low:      'bg-surface-raised text-text-muted',
}

export function TopThreeAlertsPanel({ alerts }: Props) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Alerts</h2>
        <span className="label-xs text-text-muted">{alerts.length} / 3</span>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-text-muted py-2">No critical alerts. Academy is operating within normal parameters.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl bg-surface-raised">
              {SEVERITY_ICON[alert.severity]}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm text-text-primary font-medium leading-snug">{alert.headline}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${SEVERITY_BADGE[alert.severity]}`}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-text-muted">{alert.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
