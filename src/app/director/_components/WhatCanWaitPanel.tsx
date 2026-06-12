'use client'
// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// What Can Wait: DonnaWaitDecision model. A decision, not just a display.
// DONNA intentionally determines what is safe to defer. WAIT ≠ IGNORE.

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { Card } from '@/components/ui'
import type { DonnaWaitDecision } from '@/lib/donna/operations/academyChangeEngine'

interface Props {
  waitDecisions: DonnaWaitDecision[]
}

export function WhatCanWaitPanel({ waitDecisions }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (waitDecisions.length === 0) return null

  return (
    <Card className="overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-text-muted" />
          <span className="text-sm font-semibold text-text-secondary">What Can Wait</span>
          <span className="label-xs text-text-muted ml-1">
            DONNA deferred {waitDecisions.length} item{waitDecisions.length > 1 ? 's' : ''}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-text-muted" />
        ) : (
          <ChevronDown size={14} className="text-text-muted" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
          <p className="text-xs text-text-muted">
            These items were evaluated and intentionally deferred. They are not forgotten — DONNA will resurface them at the right time.
          </p>
          {waitDecisions.map((d, i) => (
            <div key={i} className="p-4 rounded-xl bg-surface-raised space-y-2">
              <p className="text-sm font-medium text-text-primary">{d.item}</p>
              <div className="space-y-1">
                <p className="text-xs text-text-secondary">
                  <span className="text-text-muted">Reason: </span>{d.reasonDeferred}
                </p>
                <p className="text-xs text-text-secondary">
                  <span className="text-text-muted">Tradeoff: </span>{d.tradeoff}
                </p>
                <p className="text-xs text-lime">
                  Review again in {d.reviewDays === 1 ? 'next session' : `${d.reviewDays} days`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
