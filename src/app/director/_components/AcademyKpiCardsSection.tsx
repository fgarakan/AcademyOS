import Link from 'next/link'
import { Card, CardContent } from '@/components/ui'
import { BarChart2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'

interface AcademyKpiCardsSectionProps {
  activePlayers: number
  advancementReadyCount: number
  attentionSignalCount: number
}

export function AcademyKpiCardsSection({
  activePlayers,
  advancementReadyCount,
  attentionSignalCount,
}: AcademyKpiCardsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="label-xs">KPI Signals</p>
          <p className="text-xs text-text-muted mt-0.5">Academy-wide development signals. Time in level is live; other signals are demo-tier.</p>
        </div>
        <Link
          href="/director/kpi"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-lime transition-colors"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          KPI Dashboard
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="label-xs mb-2">Active Players</p>
            <p className="font-mono text-2xl text-lime font-semibold">{activePlayers}</p>
            <p className="text-xs text-text-muted mt-1">Currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="label-xs">Advancement Ready</p>
              <CheckCircle className="w-3 h-3 text-status-green" />
            </div>
            <p className="font-mono text-2xl text-status-green font-semibold">{advancementReadyCount}</p>
            <p className="text-xs text-text-muted mt-1">Eligible to advance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="label-xs">Attention Signals</p>
              {attentionSignalCount > 0 && <AlertTriangle className="w-3 h-3 text-status-orange" />}
            </div>
            <p className={`font-mono text-2xl font-semibold ${attentionSignalCount > 0 ? 'text-status-orange' : 'text-text-secondary'}`}>
              {attentionSignalCount}
            </p>
            <p className="text-xs text-text-muted mt-1">Needs attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
