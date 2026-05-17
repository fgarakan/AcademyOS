'use client'

// Sprint 583 — Level Readiness Apply Preview V1
// Shows what a level movement would mean for a player — evidence, impact, and context.
// No mutation — preview only. Director must take explicit action.

import { ArrowUp, ArrowDown, Minus, CheckCircle2, AlertCircle, Shield } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type LevelMovementDirection = 'promotion' | 'demotion' | 'lateral' | 'initial_placement'

export interface LevelReadinessEvidenceItem {
  label: string
  met: boolean
  note?: string
}

export interface LevelReadinessApplyPreviewProps {
  playerName: string
  currentLevel: string | null
  proposedLevel: string
  direction: LevelMovementDirection
  evidenceItems: LevelReadinessEvidenceItem[]
  readinessScore: number | null  // 0-100
  proposedBy: string
  proposedReason: string
}

// ── Direction config ──────────────────────────────────────────────────────────

const DIRECTION_CONFIG: Record<
  LevelMovementDirection,
  { icon: React.ReactNode; label: string; colorClass: string; borderClass: string; bgClass: string }
> = {
  promotion: {
    icon: <ArrowUp className="w-4 h-4" />,
    label: 'Level promotion',
    colorClass: 'text-status-green',
    borderClass: 'border-status-green/20',
    bgClass: 'bg-status-green/5',
  },
  demotion: {
    icon: <ArrowDown className="w-4 h-4" />,
    label: 'Level reassignment',
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/20',
    bgClass: 'bg-status-orange/5',
  },
  lateral: {
    icon: <Minus className="w-4 h-4" />,
    label: 'Group transfer',
    colorClass: 'text-status-blue',
    borderClass: 'border-status-blue/20',
    bgClass: 'bg-status-blue/5',
  },
  initial_placement: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Initial placement',
    colorClass: 'text-lime',
    borderClass: 'border-lime/20',
    bgClass: 'bg-lime/5',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LevelReadinessApplyPreview({
  playerName,
  currentLevel,
  proposedLevel,
  direction,
  evidenceItems,
  readinessScore,
  proposedBy,
  proposedReason,
}: LevelReadinessApplyPreviewProps) {
  const cfg = DIRECTION_CONFIG[direction]
  const metCount = evidenceItems.filter(e => e.met).length
  const totalCount = evidenceItems.length
  const allMet = metCount === totalCount

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-status-blue shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">Level readiness preview — no changes yet</p>
      </div>

      {/* ── Direction banner ── */}
      <div className={`flex items-center gap-3 px-3.5 py-3 border-b ${cfg.borderClass} ${cfg.bgClass}`}>
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${cfg.borderClass} ${cfg.colorClass}`}>
          {cfg.icon}
        </div>
        <div>
          <p className={`text-xs font-semibold ${cfg.colorClass}`}>{cfg.label}</p>
          <p className="text-sm text-text-primary">
            <span className="font-semibold">{playerName}</span>
            {currentLevel ? (
              <> · {currentLevel} → <span className="font-semibold">{proposedLevel}</span></>
            ) : (
              <> → <span className="font-semibold">{proposedLevel}</span></>
            )}
          </p>
        </div>
        {readinessScore !== null && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-text-muted">Readiness</p>
            <p className={`text-lg font-mono font-bold ${cfg.colorClass}`}>{readinessScore}%</p>
          </div>
        )}
      </div>

      {/* ── Evidence ── */}
      {evidenceItems.length > 0 && (
        <div className="px-3.5 py-3 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Evidence</p>
            <span className="ml-auto text-[10px] text-text-muted">
              {metCount}/{totalCount} criteria met
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {evidenceItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                {item.met ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-xs ${item.met ? 'text-text-primary' : 'text-text-muted'}`}>
                    {item.label}
                  </p>
                  {item.note && (
                    <p className="text-[10px] text-text-muted">{item.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reason ── */}
      <div className="px-3.5 py-2.5 border-b border-border/50">
        <p className="text-[10px] text-text-muted mb-0.5">Proposed by {proposedBy}</p>
        <p className="text-xs text-text-primary leading-snug">{proposedReason}</p>
      </div>

      {/* ── Warning ── */}
      {!allMet && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 border-b border-status-orange/20 bg-status-orange/5">
          <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-orange leading-snug">
            Not all readiness criteria are met. Director should review evidence carefully before approving.
          </p>
        </div>
      )}

      {/* ── Protected action notice ── */}
      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-surface">
        <Shield className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-snug">
          Level changes are protected. Only a director can apply this via the <span className="font-medium">Placement</span> workflow using <code className="text-[9px]">finalize_player_placement()</code>.
          Preview only — no action taken yet.
        </p>
      </div>
    </div>
  )
}
