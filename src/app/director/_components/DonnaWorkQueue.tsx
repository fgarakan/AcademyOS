'use client'

import Link from 'next/link'
import { ChevronRight, Layers, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui'
import type { DonnaWorkQueueSummary } from '@/lib/donna/actions/donnaActionContract'

interface Props {
  summary: DonnaWorkQueueSummary
}

const DOMAIN_LABEL: Record<string, string> = {
  players:    'Players',
  curriculum: 'Curriculum',
  coaches:    'Coaches',
  parents:    'Parents',
  system:     'System',
  business:   'Business',
  approval:   'Approvals',
}

export function DonnaWorkQueue({ summary }: Props) {
  if (summary.totalPending === 0) {
    return (
      <Card>
        <div className="px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <div>
            <p className="text-[12px] font-medium text-text-primary">Work queue is clear</p>
            <p className="text-[11px] text-text-muted">No pending DONNA actions right now.</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-lime" />
          <p className="label-xs">DONNA Work Queue</p>
        </div>
        <p className="text-[10px] text-text-muted">
          {summary.totalPending} action{summary.totalPending !== 1 ? 's' : ''} pending
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border">
        {summary.byDomain.map(item => (
          <Link
            key={item.domain}
            href={item.route}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised transition-colors group"
          >
            <span className="w-5 h-5 rounded-full bg-lime/10 border border-lime/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-lime">{item.count}</span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-text-primary">
                {DOMAIN_LABEL[item.domain] ?? item.domain}
              </p>
              <p className="text-[11px] text-text-muted truncate">
                {item.topDraftLabel}
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-lime transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
