// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// Director Capacity Meter: visualises today's attention budget.
// Purpose: prevent overload. Directors should understand what fits today and what does not.

import { Card } from '@/components/ui'
import type { DirectorCapacityBudget } from '@/lib/donna/operations/directorCapacityModel'

interface Props {
  budget: DirectorCapacityBudget
}

export function DirectorCapacityMeter({ budget }: Props) {
  const usedPct = Math.min(100, Math.round((budget.allocatedCapacity / budget.totalCapacity) * 100))

  // Colour: green → yellow → red based on usage
  const barColour = usedPct < 60 ? 'bg-status-green' : usedPct < 80 ? 'bg-status-orange' : 'bg-status-red'

  return (
    <Card className="p-5 space-y-4">
      <div>
        <p className="label-xs text-text-muted mb-1">TODAY'S CAPACITY</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-bold text-text-primary">{budget.allocatedCapacity}</span>
          <span className="text-text-muted text-sm">/ {budget.totalCapacity}</span>
        </div>
      </div>

      {/* Bar */}
      <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColour}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>

      {/* Remaining */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          <span className="text-text-secondary font-medium">{budget.remainingCapacity}</span> remaining
        </span>
        <span className={`font-medium ${
          usedPct < 60 ? 'text-status-green' : usedPct < 80 ? 'text-status-orange' : 'text-status-red'
        }`}>
          {usedPct}% used
        </span>
      </div>

      {/* Allocations */}
      {budget.allocations.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          {budget.allocations.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <p className="text-xs text-text-secondary truncate flex-1">{a.priorityTitle}</p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`label-xs px-1.5 py-0.5 rounded ${
                  a.cognitiveLoad === 'heavy'    ? 'bg-status-red/15 text-status-red' :
                  a.cognitiveLoad === 'moderate' ? 'bg-status-orange/15 text-status-orange' :
                  'bg-surface-raised text-text-muted'
                }`}>
                  {a.capacityCost}u
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deferred count */}
      {budget.deferredPriorities.length > 0 && (
        <p className="text-xs text-text-muted pt-1 border-t border-border">
          <span className="text-text-secondary font-medium">{budget.deferredPriorities.length}</span> item{budget.deferredPriorities.length > 1 ? 's' : ''} deferred to protect your capacity
        </p>
      )}
    </Card>
  )
}
