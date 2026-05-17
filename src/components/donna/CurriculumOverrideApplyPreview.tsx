'use client'

// Sprint 586 — Curriculum Override Apply Preview V1
// Shows what a curriculum override would change before director applies it.
// Preview only — no DB write, no template mutation.

import { Layers, Tag, Activity, MapPin, ArrowRight, Shield, AlertTriangle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CurriculumOverrideType =
  | 'level_adjustment'
  | 'focus_shift'
  | 'pathway_change'
  | 'scope_change'
  | 'custom'

export type CurriculumOverrideScope = 'session' | 'player_session' | 'group' | 'program'

export interface CurriculumOverrideChange {
  field: string
  before: string | null
  after: string
}

export interface CurriculumOverrideApplyPreviewProps {
  overrideType: CurriculumOverrideType
  scope: CurriculumOverrideScope
  targetLabel: string          // e.g. "Session #12 — U14 Advanced" or "Marcus R."
  changes: CurriculumOverrideChange[]
  overrideReason: string
  proposedBy: string
  templateImmutable?: boolean  // always true — shown as a reminder
  warnings?: string[]
}

// ── Override type config ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  CurriculumOverrideType,
  { label: string; icon: React.ReactNode; colorClass: string; borderClass: string; bgClass: string }
> = {
  level_adjustment: {
    label: 'Level adjustment',
    icon: <Layers className="w-4 h-4" />,
    colorClass: 'text-status-blue',
    borderClass: 'border-status-blue/20',
    bgClass: 'bg-status-blue/5',
  },
  focus_shift: {
    label: 'Focus shift',
    icon: <Activity className="w-4 h-4" />,
    colorClass: 'text-lime',
    borderClass: 'border-lime/20',
    bgClass: 'bg-lime/5',
  },
  pathway_change: {
    label: 'Pathway change',
    icon: <Tag className="w-4 h-4" />,
    colorClass: 'text-status-orange',
    borderClass: 'border-status-orange/20',
    bgClass: 'bg-status-orange/5',
  },
  scope_change: {
    label: 'Scope change',
    icon: <MapPin className="w-4 h-4" />,
    colorClass: 'text-text-secondary',
    borderClass: 'border-border',
    bgClass: 'bg-surface-raised',
  },
  custom: {
    label: 'Custom override',
    icon: <Layers className="w-4 h-4" />,
    colorClass: 'text-text-secondary',
    borderClass: 'border-border',
    bgClass: 'bg-surface-raised',
  },
}

// ── Scope label ───────────────────────────────────────────────────────────────

const SCOPE_LABEL: Record<CurriculumOverrideScope, string> = {
  session: 'Session',
  player_session: 'Player × Session',
  group: 'Group',
  program: 'Program',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CurriculumOverrideApplyPreview({
  overrideType,
  scope,
  targetLabel,
  changes,
  overrideReason,
  proposedBy,
  templateImmutable = true,
  warnings = [],
}: CurriculumOverrideApplyPreviewProps) {
  const cfg = TYPE_CONFIG[overrideType]

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-status-blue shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">
          Curriculum override preview — no changes yet
        </p>
      </div>

      {/* ── Type banner ── */}
      <div className={`flex items-center gap-3 px-3.5 py-3 border-b ${cfg.borderClass} ${cfg.bgClass}`}>
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${cfg.borderClass} ${cfg.colorClass}`}>
          {cfg.icon}
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${cfg.colorClass}`}>{cfg.label}</p>
          <p className="text-sm text-text-primary font-medium truncate">{targetLabel}</p>
          <p className="text-[10px] text-text-muted">{SCOPE_LABEL[scope]} scope</p>
        </div>
      </div>

      {/* ── Changes ── */}
      {changes.length > 0 && (
        <div className="px-3.5 py-3 border-b border-border/50 space-y-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">What would change</p>
          {changes.map((change, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[10px] text-text-muted capitalize">{change.field}</p>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div className="rounded-md bg-surface border border-border px-2.5 py-1.5">
                  <p className="text-[11px] text-text-muted">
                    {change.before ?? <span className="italic">None (global default)</span>}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <div className="rounded-md bg-surface border border-lime/20 px-2.5 py-1.5">
                  <p className="text-[11px] text-text-primary font-medium">{change.after}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Reason ── */}
      <div className="px-3.5 py-2.5 border-b border-border/50">
        <p className="text-[10px] text-text-muted mb-0.5">Proposed by {proposedBy}</p>
        <p className="text-xs text-text-primary leading-snug">{overrideReason}</p>
      </div>

      {/* ── Warnings ── */}
      {warnings.length > 0 && (
        <div className="px-3.5 py-2.5 border-b border-status-orange/20 bg-status-orange/5 space-y-1.5">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[11px] text-status-orange leading-snug">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Template immutability notice ── */}
      {templateImmutable && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 bg-surface">
          <Shield className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-snug">
            Template blocks are <span className="font-medium">not modified</span> by this override.
            The override writes to the <code className="text-[9px]">curriculum_overrides</code> table only —
            a session-level layer on top of the immutable template. Director approval required to apply.
            Preview only — no action taken yet.
          </p>
        </div>
      )}
    </div>
  )
}
