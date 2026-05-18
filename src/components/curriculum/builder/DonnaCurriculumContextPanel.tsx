'use client'

import { useState } from 'react'
import { Sparkles, AlertCircle, TrendingUp, BookOpen, Target, Shield, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Props {
  level: CurriculumLevel
  drillCount: number
  gateCount: number
  onAddDrill?: () => void
  onAddGate?: () => void
  onAddFitness?: () => void
}

export function DonnaCurriculumContextPanel({ level, drillCount, gateCount, onAddDrill, onAddGate, onAddFitness }: Props) {
  const [expanded, setExpanded] = useState(false)

  const isMissing = gateCount === 0 && drillCount === 0
  const isLow = !isMissing && (gateCount < 2 || drillCount < 3)

  const gaps: string[] = []
  if (gateCount === 0) gaps.push('no assessment gates — players cannot be evaluated for advancement')
  else if (gateCount < 2) gaps.push(`only ${gateCount} gate${gateCount !== 1 ? 's' : ''} — add at least 2 for robust evaluation`)
  if (drillCount === 0) gaps.push('no drills — coaches have nothing to run at this level')
  else if (drillCount < 3) gaps.push(`only ${drillCount} drill${drillCount !== 1 ? 's' : ''} — coaches need variety`)

  const summary = isMissing
    ? `This level has no drills or gates. It cannot be used for planning or evaluation yet.`
    : isLow
    ? `This level has low content coverage. I spotted ${gaps.length} gap${gaps.length !== 1 ? 's' : ''} that could affect coach adoption.`
    : `This level looks well-structured — ${drillCount} drills and ${gateCount} gates on file.`

  const QUICK_ACTIONS = [
    { label: 'Add a drill', icon: Target, action: onAddDrill, show: true },
    { label: 'Add a gate', icon: Shield, action: onAddGate, show: true },
    { label: 'Add fitness', icon: Dumbbell, action: onAddFitness, show: true },
  ]

  return (
    <div className="rounded-2xl border border-lime/15 bg-lime/[0.02] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">
            DONNA — {level.display_name}
          </p>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-text-muted hover:text-text-secondary transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Summary */}
      <p className="text-[12px] text-text-secondary leading-relaxed">{summary}</p>

      {/* Gaps list (when low/missing) */}
      {expanded && gaps.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Gaps I see</p>
          {gaps.map((gap, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-muted leading-relaxed">{gap}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {expanded && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Drills', val: drillCount, Icon: Target },
            { label: 'Gates', val: gateCount, Icon: Shield },
            { label: 'Domains', val: '-', Icon: BookOpen },
          ].map(({ label, val, Icon }) => (
            <div key={label} className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-center">
              <Icon className="w-3.5 h-3.5 text-text-muted mx-auto mb-1" />
              <p className="text-[14px] font-mono font-bold text-text-primary">{val}</p>
              <p className="text-[10px] text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.filter(a => a.show).map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            onClick={action}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-lime/20 text-lime hover:bg-lime/10 transition-colors"
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Safety note */}
      <div className="flex items-start gap-2 rounded-xl border border-status-orange/20 bg-status-orange/[0.04] px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          DONNA sees your curriculum database only — not session history or attendance. All drafts go to the Review Queue.
        </p>
      </div>

      <TrendingUp className="hidden" />
    </div>
  )
}
