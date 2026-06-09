'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import type { AcademyHealthSummary, HealthStatus } from '@/lib/donna/today/academyHealthSummaryEngine'
import { DonnaAskButton } from './DonnaAskButton'

// ── Status styling ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<HealthStatus, { label: string; dot: string; badge: string }> = {
  good:          { label: 'Healthy',         dot: 'bg-status-green',  badge: 'bg-status-green/10 border-status-green/20 text-status-green' },
  watch:         { label: 'Watch',           dot: 'bg-yellow-400',    badge: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' },
  action_needed: { label: 'Needs Attention', dot: 'bg-status-orange', badge: 'bg-status-orange/10 border-status-orange/20 text-status-orange' },
  critical:      { label: 'Critical',        dot: 'bg-status-red',    badge: 'bg-status-red/10 border-status-red/20 text-status-red' },
}

interface Props {
  health: AcademyHealthSummary
}

export function TodayHealthCard({ health }: Props) {
  const [showEvidence, setShowEvidence] = useState(false)
  const cfg = STATUS_CONFIG[health.status]

  return (
    <div
      className="rounded-2xl border border-border bg-surface overflow-hidden"
      data-donna-focus-id="today-health-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="label-xs">Academy Health</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-text-muted">{health.score}%</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Headline + synthesis */}
      <div className="px-4 pt-3 pb-2 space-y-1">
        <p className="text-[14px] font-semibold text-text-primary leading-snug">
          {health.headline}
        </p>
        <p className="text-[12px] text-text-secondary leading-relaxed">
          {health.synthesis}
        </p>
      </div>

      {/* Recommended action */}
      {health.recommendedAction && health.recommendedHref && (
        <div className="px-4 pb-3">
          <Link
            href={health.recommendedHref}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-lime hover:opacity-80 transition-opacity"
          >
            {health.recommendedAction} →
          </Link>
        </div>
      )}

      {/* Evidence toggle */}
      {(health.strengths.length > 0 || health.concerns.length > 0) && (
        <>
          <button
            type="button"
            onClick={() => setShowEvidence(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] text-text-muted hover:text-text-secondary transition-colors border-t border-border/50"
          >
            <span>{showEvidence ? 'Hide details' : 'Why?  Show evidence'}</span>
            {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showEvidence && (
            <div className="px-4 pb-4 space-y-3 border-t border-border/30">
              {health.strengths.length > 0 && (
                <div className="space-y-1 pt-2">
                  <p className="label-xs">Strengths</p>
                  {health.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-status-green shrink-0 mt-[3px]" />
                      <span className="text-[11px] text-text-secondary leading-snug">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {health.concerns.length > 0 && (
                <div className="space-y-1">
                  <p className="label-xs">Concerns</p>
                  {health.concerns.map((c, i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-[5px] ${cfg.dot}`} />
                        <span className="text-[11px] text-text-secondary leading-snug">{c.label}</span>
                      </div>
                      <Link href={c.actionHref} className="text-[10px] font-semibold text-lime hover:opacity-80 whitespace-nowrap shrink-0">
                        {c.actionLabel} →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-1">
                <DonnaAskButton prompt="how is the academy health?" label="Ask DONNA for full analysis" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
