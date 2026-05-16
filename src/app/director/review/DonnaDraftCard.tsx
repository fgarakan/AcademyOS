'use client'

import { Clock, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export interface DonnaDraftItem {
  id: string
  status: string
  createdAt: string
  actionLabel: string | null
  draftType: string | null
  warnings: string[]
  contentLines: string[]
}

export function DonnaDraftCard({ item }: { item: DonnaDraftItem }) {
  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              {item.actionLabel ?? item.draftType ?? 'DONNA Draft'}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-status-orange/10 border border-status-orange/20 text-status-orange">
                <Clock className="w-2.5 h-2.5" />
                Pending review
              </span>
              <span className="text-[10px] text-text-muted">
                {formatDate(item.createdAt)}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-text-muted">
                Draft-only
              </span>
            </div>
          </div>
        </div>

        {/* Draft content */}
        {item.contentLines.length > 0 && (
          <div
            className="rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: '#8b5cf6' }}>
              Draft content
            </p>
            <div className="space-y-1">
              {item.contentLines.map((line, i) => (
                <p key={i} className="text-[11px] text-text-secondary leading-snug">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Safety guardrails */}
        {item.warnings.length > 0 && (
          <div
            className="rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,59,48,0.04)', border: '1px solid rgba(255,59,48,0.18)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3 h-3 text-status-red shrink-0" />
              <p className="text-[10px] uppercase tracking-widest font-semibold text-status-red">
                I did not
              </p>
            </div>
            <ul className="space-y-0.5">
              {item.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                  <span className="shrink-0 mt-px text-status-red">✗</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[10px] text-text-muted">
          Director approval required before any action is taken. Nothing has been sent or applied.
        </p>
      </CardContent>
    </Card>
  )
}
