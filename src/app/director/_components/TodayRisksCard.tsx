'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react'
import type { DirectorRisk, RiskLevel } from '@/lib/donna/today/directorRiskEngine'

const RISK_DOT: Record<RiskLevel, string> = {
  high:   'bg-status-red',
  medium: 'bg-status-orange',
  low:    'bg-yellow-400',
}

interface Props {
  risks: DirectorRisk[]
}

function RiskRow({ risk }: { risk: DirectorRisk }) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div className="py-3 space-y-1.5 border-b border-border/50 last:border-none">
      <div className="flex items-start gap-3">
        <span className={`w-2 h-2 rounded-full shrink-0 mt-[5px] ${RISK_DOT[risk.level]}`} />
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-[13px] font-semibold text-text-primary leading-snug">
            {risk.headline}
          </p>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {risk.synthesis}
          </p>
        </div>
        <Link
          href={risk.actionHref}
          className="shrink-0 text-[11px] font-semibold text-lime hover:opacity-80 transition-opacity whitespace-nowrap pt-0.5"
        >
          {risk.actionLabel} →
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setShowDetail(v => !v)}
        className="ml-5 flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
      >
        {showDetail ? 'Hide' : 'Why this matters'}
        {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showDetail && (
        <div className="ml-5 space-y-1.5">
          <p className="text-[11px] text-text-muted leading-relaxed">{risk.consequence}</p>
          {risk.missingData && (
            <p className="text-[10px] text-text-muted italic leading-relaxed">
              Note: {risk.missingData}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function TodayRisksCard({ risks }: Props) {
  return (
    <div
      className="rounded-2xl border border-border bg-surface overflow-hidden"
      data-donna-focus-id="today-risks-card"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <ShieldAlert className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <p className="label-xs">Top Risks</p>
      </div>

      {risks.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-[12px] text-text-secondary">No significant risks detected.</p>
        </div>
      ) : (
        <div className="px-4">
          {risks.map((r, i) => (
            <RiskRow key={r.id + i} risk={r} />
          ))}
        </div>
      )}
    </div>
  )
}
