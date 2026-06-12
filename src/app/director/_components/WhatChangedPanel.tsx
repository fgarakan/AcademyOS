'use client'
// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// What Changed Since Last Visit: shows up to 5 meaningful changes since the
// Director was last here. Ranked by impact. Reads + writes localStorage.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui'
import type { WhatChangedResult, AcademyChange, ChangeType } from '@/lib/donna/operations/academyChangeEngine'

interface Props {
  whatChanged: WhatChangedResult
}

const LAST_VISIT_KEY = 'donna_last_visit_at'

function ChangeIcon({ type }: { type: ChangeType }) {
  if (type === 'positive')  return <TrendingUp  size={16} className="text-status-green flex-shrink-0 mt-0.5" />
  if (type === 'negative')  return <TrendingDown size={16} className="text-status-red   flex-shrink-0 mt-0.5" />
  return <Activity size={16} className="text-status-blue flex-shrink-0 mt-0.5" />
}

function ChangeRow({ change }: { change: AcademyChange }) {
  const content = (
    <div className="flex gap-3 p-3 rounded-xl hover:bg-surface-raised/60 transition-colors">
      <ChangeIcon type={change.changeType} />
      <div className="flex-1 min-w-0">
        <p className="text-base text-text-primary font-medium leading-snug">{change.headline}</p>
        <p className="text-sm text-text-secondary mt-1 leading-relaxed">{change.detail}</p>
      </div>
    </div>
  )

  return change.route ? (
    <Link href={change.route} className="block">{content}</Link>
  ) : (
    content
  )
}

export function WhatChangedPanel({ whatChanged }: Props) {
  const [lastVisitLabel, setLastVisitLabel] = useState<string>(`last ${whatChanged.periodDays} days`)
  const [expanded, setExpanded]            = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(LAST_VISIT_KEY)
    if (stored) {
      const diffMs  = Date.now() - Number(stored)
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 60) {
        setLastVisitLabel('the last hour')
      } else {
        const diffHr = Math.floor(diffMin / 60)
        if (diffHr < 24) setLastVisitLabel(`the last ${diffHr} hour${diffHr > 1 ? 's' : ''}`)
        else {
          const diffDay = Math.floor(diffHr / 24)
          setLastVisitLabel(`the last ${diffDay} day${diffDay > 1 ? 's' : ''}`)
        }
      }
    }
    // Record this visit
    localStorage.setItem(LAST_VISIT_KEY, String(Date.now()))
  }, [])

  if (!whatChanged.hasChanges) return null

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-raised/50 transition-colors min-h-[56px]"
      >
        <div>
          <p className="text-base font-semibold text-text-primary">What Changed Since You Were Last Here</p>
          <p className="text-sm text-text-secondary mt-0.5">Since {lastVisitLabel} — {whatChanged.changes.length} update{whatChanged.changes.length > 1 ? 's' : ''}</p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-text-secondary" />
        ) : (
          <ChevronDown size={16} className="text-text-secondary" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-4 border-t border-border space-y-0.5 pt-2">
          {whatChanged.changes.map((change, i) => (
            <ChangeRow key={i} change={change} />
          ))}
        </div>
      )}
    </Card>
  )
}
