'use client'
// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// What Should I Ignore: DonnaIgnoreDecision model. A decision, not just a display.
// DONNA intentionally determines what should not consume attention. IGNORE ≠ WAIT.

import { useState } from 'react'
import { ChevronDown, ChevronUp, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui'
import type { DonnaIgnoreDecision } from '@/lib/donna/operations/academyChangeEngine'

interface Props {
  ignoreDecisions: DonnaIgnoreDecision[]
}

export function WhatShouldIIgnorePanel({ ignoreDecisions }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (ignoreDecisions.length === 0) return null

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <EyeOff size={14} className="text-text-muted" />
          <span className="text-sm font-semibold text-text-secondary">What Should I Ignore</span>
          <span className="label-xs text-text-muted ml-1">
            {ignoreDecisions.length} signal{ignoreDecisions.length > 1 ? 's' : ''} — DONNA is watching
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-text-muted" />
        ) : (
          <ChevronDown size={14} className="text-text-muted" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
          <p className="text-xs text-text-muted">
            These signals do not require your action today. DONNA is monitoring them and will surface them when evidence strengthens.
          </p>
          {ignoreDecisions.map((d, i) => (
            <div key={i} className="p-4 rounded-xl bg-surface-raised space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-text-primary">{d.signal}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  d.confidence === 'reliable'
                    ? 'bg-surface text-text-muted border border-border'
                    : 'bg-status-orange/10 text-status-orange'
                }`}>
                  {d.confidence === 'reliable' ? 'Low priority' : 'Provisional'}
                </span>
              </div>
              <p className="text-xs text-text-secondary">{d.reason}</p>
              <p className="text-xs text-text-muted">Monitor again in {d.reviewWindowDays} days</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
