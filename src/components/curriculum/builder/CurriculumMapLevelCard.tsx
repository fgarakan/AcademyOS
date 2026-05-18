'use client'

import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'
import type { CurriculumLevel, CurriculumDrill } from '@/lib/backend/curriculumExplorer'

// ─── Stage intent text ────────────────────────────────────────────────────────

const STAGE_INTENT: Record<string, string> = {
  red_foundation:     'Movement fundamentals, hand-eye coordination, and first contact with the game.',
  orange_development: 'Stroke consistency, rally patterns, and technical building blocks.',
  green_performance:  'Tactical awareness, depth control, and serve introduction.',
  yellow_competitive: 'Match preparation, consistency under pressure, and net play.',
  high_performance:   'Elite refinement, advanced competition, and performance mindset.',
}

// ─── Readiness calculation ───────────────────────────────────────────────────
// UI indicator only — not official level assessment data.

function getReadiness(gateCount: number, drillCount: number): {
  pct: number
  label: string
  color: string
  bg: string
} {
  if (gateCount >= 2 && drillCount >= 3) {
    return { pct: 100, label: 'Ready',          color: '#30D158', bg: 'rgba(48,209,88,0.12)'  }
  }
  if (gateCount >= 1 && drillCount >= 1) {
    return { pct: 65,  label: 'Needs Review',   color: '#FF9500', bg: 'rgba(255,149,0,0.12)'  }
  }
  if (gateCount >= 1 || drillCount >= 1) {
    return { pct: 35,  label: 'Getting Started', color: '#FF9500', bg: 'rgba(255,149,0,0.10)'  }
  }
  return   { pct: 10,  label: 'Incomplete',     color: '#FF3B30', bg: 'rgba(255,59,48,0.12)'  }
}

// ─── Missing items ────────────────────────────────────────────────────────────

function getMissingItems(gateCount: number, drillCount: number): string[] {
  const items: string[] = []
  if (gateCount === 0) items.push('No assessment gates')
  else if (gateCount < 2)  items.push(`Add ${2 - gateCount} more gate${2 - gateCount > 1 ? 's' : ''}`)
  if (drillCount === 0) items.push('No drills added')
  else if (drillCount < 3) items.push(`Add ${3 - drillCount} more drill${3 - drillCount > 1 ? 's' : ''}`)
  return items
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  level: CurriculumLevel
  gateCount: number
  drillCount: number
  levelDrills: CurriculumDrill[]
  stageDot: string
  stageBorder: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CurriculumMapLevelCard({
  level,
  gateCount,
  drillCount,
  levelDrills,
  stageDot,
  stageBorder,
}: Props) {
  const readiness = getReadiness(gateCount, drillCount)
  const missingItems = getMissingItems(gateCount, drillCount)
  const intent = STAGE_INTENT[level.stage] ?? ''

  // Count unique skill domains at this level
  const skillDomainCount = new Set(levelDrills.map(d => d.domain).filter(Boolean)).size

  // Format created date
  const createdDate = level.created_at
    ? new Date(level.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null

  return (
    <Link
      href={`/director/curriculum/level/${level.id}`}
      className="group flex flex-col rounded-xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-lime/50"
      style={{
        background: 'rgba(0,0,0,0.30)',
        border: `1px solid ${stageBorder}`,
      }}
    >
      {/* Top accent bar — readiness fill */}
      <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${readiness.pct}%`, background: readiness.color }}
        />
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Header row: level name + readiness % */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0 mt-0.5"
              style={{ background: stageDot }}
            />
            <p className="text-[13px] font-semibold text-text-primary leading-snug line-clamp-2">
              {level.display_name}
            </p>
          </div>
          <span
            className="text-[11px] font-mono font-bold shrink-0 mt-0.5"
            style={{ color: readiness.color }}
          >
            {readiness.pct}%
          </span>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: readiness.bg, color: readiness.color }}
          >
            {readiness.label}
          </span>
        </div>

        {/* Intent text */}
        {intent && (
          <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
            {intent}
          </p>
        )}

        {/* Counts row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-text-muted">
            <span className="font-mono font-semibold text-text-secondary">{skillDomainCount}</span>
            {' '}skill{skillDomainCount !== 1 ? 's' : ''}
          </span>
          <span className="text-[10px] text-text-muted">
            <span className="font-mono font-semibold text-text-secondary">{drillCount}</span>
            {' '}drill{drillCount !== 1 ? 's' : ''}
          </span>
          <span className="text-[10px] text-text-muted">
            <span className="font-mono font-semibold text-text-secondary">{gateCount}</span>
            {' '}gate{gateCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Missing items */}
        {missingItems.length > 0 && (
          <div className="space-y-1">
            {missingItems.map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <AlertCircle className="w-2.5 h-2.5 shrink-0" style={{ color: '#FF3B30' }} />
                <span className="text-[10px]" style={{ color: '#FF3B30' }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer: date + open affordance */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/[0.05]">
          {createdDate ? (
            <span className="text-[9px] text-text-muted">Added {createdDate}</span>
          ) : (
            <span />
          )}
          <span
            className="flex items-center gap-1 text-[10px] font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Open
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
