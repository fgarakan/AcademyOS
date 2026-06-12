// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// Top Three Wins: DONNA must surface positive momentum. Maximum 3.
// Directors should feel progress, not just pressure.

import { TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui'
import type { OperatingWin } from '@/lib/donna/operations/operatingPartnerOutputContract'

interface Props {
  wins: OperatingWin[]
}

export function TopThreeWinsPanel({ wins }: Props) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Momentum</h2>
        <span className="label-xs text-text-muted">{wins.length} / 3</span>
      </div>

      {wins.length === 0 ? (
        <p className="text-sm text-text-muted py-2">No wins detected yet. Load more academy data to surface positive momentum.</p>
      ) : (
        <div className="space-y-3">
          {wins.map((win, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl bg-lime/5 border border-lime/15">
              <TrendingUp size={14} className="text-lime flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-text-primary font-medium leading-snug">{win.headline}</p>
                <p className="text-xs text-text-muted">{win.evidence}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                  win.confidence === 'reliable'
                    ? 'bg-status-green/10 text-status-green'
                    : 'bg-status-orange/10 text-status-orange'
                }`}>
                  {win.confidence === 'reliable' ? 'Confirmed' : 'Provisional'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
