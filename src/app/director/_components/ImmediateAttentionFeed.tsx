import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { DonnaSignalMeta } from './DonnaSignalMeta'
import type { ConfidenceLevel } from '@/lib/donna/confidenceEngine'
import type { AttentionItem, AttentionSource, AttentionPriority } from '@/lib/director/attentionQueue'

interface Props {
  items: AttentionItem[]
}

function severityDot(priority: AttentionPriority) {
  const map: Record<AttentionPriority, string> = {
    critical: 'bg-status-red',
    high:     'bg-status-orange',
    medium:   'bg-yellow-400',
    low:      'bg-text-muted',
  }
  return (
    <span className={`w-2 h-2 rounded-full shrink-0 mt-[5px] ${map[priority]}`} />
  )
}

function actionLabel(source: AttentionSource): string {
  switch (source) {
    case 'pending_approval':    return 'Review'
    case 'expiring_action':     return 'Review now'
    case 'at_risk_player':      return 'View player'
    case 'curriculum_gap':      return 'View curriculum'
    case 'over_capacity_group': return 'View groups'
    case 'no_session_coverage': return 'View sessions'
    default:                    return 'Review'
  }
}

function itemConfidence(source: AttentionSource, priority: AttentionPriority): ConfidenceLevel {
  if (source === 'pending_approval')    return 'high'
  if (source === 'expiring_action')     return 'high'
  if (source === 'at_risk_player')      return 'high'
  if (source === 'over_capacity_group') return 'high'
  if (priority === 'critical')          return 'high'
  if (priority === 'high')              return 'medium'
  return 'medium'
}

function itemEvidence(source: AttentionSource): string {
  switch (source) {
    case 'pending_approval':    return 'Based on pending action record'
    case 'expiring_action':     return 'Based on action expiry timestamp'
    case 'at_risk_player':      return 'Based on player status and progress records'
    case 'over_capacity_group': return 'Based on live group enrollment records'
    case 'curriculum_gap':      return 'Based on enrollment and curriculum suggestion records'
    case 'no_session_coverage': return 'Based on session schedule and group records'
    default:                    return 'Based on academy records'
  }
}

export function ImmediateAttentionFeed({ items }: Props) {
  const top = items.slice(0, 5)

  return (
    <section className="space-y-2">
      <p className="label-xs">Immediate Attention</p>

      {top.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-surface">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-[12px] text-text-secondary">No urgent items right now — academy is clear.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {top.map((item, i) => (
            <div key={item.id ?? i} className="px-4 py-3.5 space-y-1">
              <div className="flex items-start gap-3">
                {severityDot(item.priority)}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-[13px] font-semibold text-text-primary leading-snug">
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <DonnaSignalMeta
                    confidence={itemConfidence(item.source, item.priority)}
                    evidenceSummary={itemEvidence(item.source)}
                    recommendedAction={actionLabel(item.source)}
                    actionHref={item.href}
                  />
                </div>
                <Link
                  href={item.href}
                  className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity whitespace-nowrap pt-0.5"
                >
                  {actionLabel(item.source)} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
