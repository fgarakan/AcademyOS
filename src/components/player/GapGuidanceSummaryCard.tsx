// Gap Guidance Summary Card — Sprint 234
// Director/coach facing. Displays role-specific gap guidance from RoleSpecificGapGuidance.
// Read-only. No mutations. Never shown to player or parent.

import type { ReactNode } from 'react'
import { AlertTriangle, Eye, Info, ClipboardList } from 'lucide-react'
import { Card, CardHeader, CardContent, EmptyState } from '@/components/ui'
import type {
  RoleSpecificGapGuidance,
  GapGuidanceItem,
  GapGuidancePriority,
} from '@/lib/gaps/roleSpecificGapGuidance'

interface PriorityConfig {
  label: string
  colorClass: string
  icon: ReactNode
}

const PRIORITY_CONFIG: Record<GapGuidancePriority, PriorityConfig> = {
  act_now: {
    label: 'Act now',
    colorClass: 'text-status-red',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  monitor: {
    label: 'Monitor',
    colorClass: 'text-status-orange',
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  informational: {
    label: 'Informational',
    colorClass: 'text-status-blue',
    icon: <Info className="w-3.5 h-3.5" />,
  },
}

const SOURCE_LABEL: Record<string, string> = {
  training: 'Training',
  knowledge: 'Knowledge',
}

function GuidanceItemRow({ item }: { item: GapGuidanceItem }) {
  const cfg = PRIORITY_CONFIG[item.priority]
  return (
    <li className="flex gap-3">
      <span className={`shrink-0 mt-0.5 ${cfg.colorClass}`}>{cfg.icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`text-[9px] uppercase tracking-widest font-semibold ${cfg.colorClass}`}>
            {cfg.label}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-text-muted">
            {SOURCE_LABEL[item.source] ?? item.source}
          </span>
          {item.domain && (
            <span className="text-[9px] uppercase tracking-widest text-text-muted">
              {item.domain}
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{item.action}</p>
        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{item.rationale}</p>
      </div>
    </li>
  )
}

interface Props {
  guidance: RoleSpecificGapGuidance
}

export function GapGuidanceSummaryCard({ guidance }: Props) {
  const roleLabel = guidance.role === 'director' ? 'Director' : 'Coach'
  const hasItems = guidance.items.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised border border-border flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">Gap Guidance</p>
              <p className="text-text-muted text-xs">
                {roleLabel} internal — not visible to player or parent
              </p>
            </div>
          </div>
          {hasItems && (
            <span className="font-mono text-[10px] text-text-muted">
              {guidance.items.length} {guidance.items.length === 1 ? 'action' : 'actions'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasItems ? (
          <EmptyState
            icon={<ClipboardList className="w-5 h-5" />}
            title="No gap guidance at this time"
            description="No training or knowledge gaps were detected for this player."
            className="py-6"
          />
        ) : (
          <div className="space-y-4">
            {guidance.top_action && (
              <div className="bg-surface-raised border border-lime/20 rounded-xl p-3">
                <p className="text-[9px] uppercase tracking-widest text-lime font-semibold mb-1">
                  Top action
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {guidance.top_action}
                </p>
              </div>
            )}
            <ul className="space-y-3">
              {guidance.items.map((item, i) => (
                <GuidanceItemRow key={i} item={item} />
              ))}
            </ul>
            <p className="text-[10px] text-text-muted leading-relaxed border-t border-border pt-3">
              To act on a gap: go to the <span className="font-semibold text-text-secondary">Notes tab</span> → <span className="font-semibold text-text-secondary">Priority Recommendation</span> to create a director-reviewed priority draft from this player&apos;s observations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
