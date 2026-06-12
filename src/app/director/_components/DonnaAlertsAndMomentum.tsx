import { AlertCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui'
import type { OperatingAlert, OperatingWin, SituationSeverity } from '@/lib/donna/operations/operatingPartnerOutputContract'

interface Props {
  alerts: OperatingAlert[]
  wins:   OperatingWin[]
}

const ALERT_ICON: Record<SituationSeverity, React.ReactNode> = {
  critical: <AlertCircle  size={13} className="text-status-red    shrink-0 mt-0.5" />,
  high:     <AlertTriangle size={13} className="text-status-orange shrink-0 mt-0.5" />,
  medium:   <Info          size={13} className="text-status-blue   shrink-0 mt-0.5" />,
  low:      <Info          size={13} className="text-text-muted    shrink-0 mt-0.5" />,
}

const ALERT_SEVERITY_LABEL: Record<SituationSeverity, string> = {
  critical: 'text-status-red',
  high:     'text-status-orange',
  medium:   'text-status-blue',
  low:      'text-text-muted',
}

const WIN_CONFIDENCE_CLS: Record<string, string> = {
  reliable:    'text-status-green',
  provisional: 'text-text-muted',
}

export function DonnaAlertsAndMomentum({ alerts, wins }: Props) {
  const hasAlerts = alerts.length > 0
  const hasWins   = wins.length > 0

  if (!hasAlerts && !hasWins) {
    return (
      <Card className="px-5 py-4">
        <p className="text-[12px] text-text-muted">
          No alerts or momentum signals right now. Academy is operating normally.
        </p>
      </Card>
    )
  }

  return (
    <Card className="divide-y divide-border">
      {/* Alerts section */}
      {hasAlerts && (
        <div className="px-5 py-4 space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-3">
              {ALERT_ICON[alert.severity]}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary leading-snug">
                  {alert.headline}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                  {alert.evidence}
                </p>
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-semibold shrink-0 mt-0.5 ${ALERT_SEVERITY_LABEL[alert.severity]}`}>
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Wins section */}
      {hasWins && (
        <div className="px-5 py-4 space-y-3">
          {wins.map((win, i) => (
            <div key={i} className="flex items-start gap-3">
              <TrendingUp size={13} className="text-lime shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary leading-snug">
                  {win.headline}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                  {win.evidence}
                </p>
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-semibold shrink-0 mt-0.5 ${WIN_CONFIDENCE_CLS[win.confidence] ?? 'text-text-muted'}`}>
                {win.confidence === 'reliable' ? 'confirmed' : 'est.'}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
