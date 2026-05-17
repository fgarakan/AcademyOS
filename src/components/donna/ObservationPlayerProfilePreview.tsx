'use client'

// Sprint 575 — Coach Observation Apply Preview V1
// Shows how a coach observation draft would appear on the player profile
// AFTER it is applied. No mutation — preview only.

import { Star, AlertCircle, Minus, Eye, EyeOff, User } from 'lucide-react'

// ── Props ─────────────────────────────────────────────────────────────────────

export type ObservationType = 'positive' | 'concern' | 'neutral'
export type ObservationVisibility = 'coach_only' | 'director' | 'parent_safe'

export interface ObservationPlayerProfilePreviewProps {
  playerName: string
  observation: string
  observationType: ObservationType
  skillTag: string | null
  nextStep: string
  visibility: ObservationVisibility
  isParentSafeCandidate: boolean
  coachName?: string
}

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ObservationType,
  { icon: React.ReactNode; label: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  positive: {
    icon: <Star className="w-3.5 h-3.5" />,
    label: 'Positive standout',
    colorClass: 'text-status-green',
    bgClass: 'bg-status-green/5',
    borderClass: 'border-status-green/20',
  },
  concern: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    label: 'Needs attention',
    colorClass: 'text-status-orange',
    bgClass: 'bg-status-orange/5',
    borderClass: 'border-status-orange/20',
  },
  neutral: {
    icon: <Minus className="w-3.5 h-3.5" />,
    label: 'Observation',
    colorClass: 'text-text-muted',
    bgClass: 'bg-surface',
    borderClass: 'border-border',
  },
}

const VISIBILITY_CONFIG: Record<
  ObservationVisibility,
  { icon: React.ReactNode; label: string }
> = {
  coach_only: {
    icon: <EyeOff className="w-3 h-3" />,
    label: 'Coach only',
  },
  director: {
    icon: <Eye className="w-3 h-3" />,
    label: 'Director visible',
  },
  parent_safe: {
    icon: <Eye className="w-3 h-3" />,
    label: 'Parent-safe (awaiting approval)',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ObservationPlayerProfilePreview({
  playerName,
  observation,
  observationType,
  skillTag,
  nextStep,
  visibility,
  isParentSafeCandidate,
  coachName,
}: ObservationPlayerProfilePreviewProps) {
  const typeCfg = TYPE_CONFIG[observationType]
  const visCfg = VISIBILITY_CONFIG[visibility]

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-status-blue shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">
          Player profile preview — no changes yet
        </p>
      </div>

      {/* ── Player + coach ── */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/50">
        <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <span className="text-xs text-text-primary font-medium">{playerName}</span>
        {coachName && (
          <span className="ml-auto text-[10px] text-text-muted">by {coachName}</span>
        )}
      </div>

      {/* ── Observation card (as it would appear on profile) ── */}
      <div className={`mx-3.5 my-3 rounded-lg border p-3 ${typeCfg.borderClass} ${typeCfg.bgClass}`}>
        {/* Type header */}
        <div className={`flex items-center gap-1.5 mb-2 ${typeCfg.colorClass}`}>
          {typeCfg.icon}
          <span className="text-[10px] font-semibold uppercase tracking-wider">{typeCfg.label}</span>
          {skillTag && (
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded border border-current/20 bg-current/5">
              {skillTag}
            </span>
          )}
        </div>

        {/* Observation text */}
        <p className="text-sm text-text-primary leading-snug mb-2">{observation}</p>

        {/* Next step */}
        {nextStep && (
          <p className="text-[11px] text-text-muted leading-snug border-t border-current/10 pt-1.5">
            <span className="font-medium">Next:</span> {nextStep}
          </p>
        )}
      </div>

      {/* ── Visibility note ── */}
      <div className="flex items-center gap-2 px-3.5 pb-2.5">
        <span className="text-text-muted">{visCfg.icon}</span>
        <p className="text-[10px] text-text-muted">{visCfg.label}</p>
        {isParentSafeCandidate && visibility !== 'parent_safe' && (
          <span className="ml-auto text-[9px] text-status-blue border border-status-blue/20 px-1.5 py-0.5 rounded">
            Parent-safe candidate
          </span>
        )}
      </div>

      {/* ── Disclaimer ── */}
      <div className="px-3.5 py-2 border-t border-border/30 bg-surface">
        <p className="text-[10px] text-text-muted italic text-center">
          Preview only — this observation will not appear on the player profile until applied.
        </p>
      </div>
    </div>
  )
}
