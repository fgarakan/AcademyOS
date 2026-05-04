// Training Gap Card — Sprint 232
// Director/coach facing. Displays detected training gaps from IdpTrainingGap[].
// Read-only. No mutations. Never shown to player or parent.

import type { ReactNode } from 'react'
import { AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import type { IdpTrainingGap, IdpGapSeverity } from '@/lib/player/individualDevelopmentPlan'

interface SeverityConfig {
  icon: ReactNode
  colorClass: string
  label: string
}

const SEVERITY_CONFIG: Record<IdpGapSeverity, SeverityConfig> = {
  high: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    colorClass: 'text-status-red',
    label: 'High',
  },
  medium: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    colorClass: 'text-status-orange',
    label: 'Medium',
  },
  low: {
    icon: <Info className="w-3.5 h-3.5" />,
    colorClass: 'text-status-blue',
    label: 'Low',
  },
  insufficient_data: {
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    colorClass: 'text-text-muted',
    label: 'No data',
  },
}

interface Props {
  gaps: IdpTrainingGap[]
  showRoleNote?: boolean
}

export function TrainingGapCard({ gaps, showRoleNote = true }: Props) {
  const highCount = gaps.filter(g => g.severity === 'high').length
  const hasNoData = gaps.length === 1 && gaps[0].severity === 'insufficient_data'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <AlertTriangle className={`w-4 h-4 ${highCount > 0 ? 'text-status-red' : 'text-text-muted'}`} />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Training Gaps</p>
              <p className="text-text-muted text-xs">Based on load and attendance data</p>
            </div>
          </div>
          {!hasNoData && gaps.length > 0 && (
            <span className="font-mono text-[10px] text-text-muted">{gaps.length} detected</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="w-5 h-5" />}
            title="No training gaps detected"
            description="Training load and attendance look consistent."
            className="py-6"
          />
        ) : (
          <ul className="space-y-3">
            {gaps.map((gap, i) => {
              const cfg = SEVERITY_CONFIG[gap.severity]
              return (
                <li key={i} className="flex gap-3">
                  <span className={`shrink-0 mt-0.5 ${cfg.colorClass}`}>
                    {cfg.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {gap.domain && (
                        <span className="text-[9px] uppercase tracking-widest text-text-muted">
                          {gap.domain}
                        </span>
                      )}
                      <span className={`text-[9px] uppercase tracking-widest font-semibold ${cfg.colorClass}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {gap.description}
                    </p>
                    {showRoleNote && gap.role_note && gap.severity !== 'insufficient_data' && (
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {gap.role_note}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
