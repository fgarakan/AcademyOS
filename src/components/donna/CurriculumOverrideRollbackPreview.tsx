'use client'

// Sprint 587 — Curriculum Override Rollback Preview V1
// Shows what rolling back a curriculum override would do.
// Preview only — no DB write, no mutation.

import { RotateCcw, Shield, AlertTriangle, ArrowLeft } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CurriculumOverrideRollbackPreviewProps {
  overrideId: string
  overrideType: string
  targetLabel: string
  scope: string
  appliedAt: string
  appliedBy: string
  originalChange: Record<string, unknown> | null
  reversedSummary: string
  warnings?: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function summariseChange(change: Record<string, unknown> | null): string {
  if (!change) return 'No change data captured.'
  if (typeof change.summary === 'string') return change.summary
  const keys = Object.keys(change).slice(0, 3)
  return keys.map(k => `${k}: ${String(change[k])}`).join(' · ')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CurriculumOverrideRollbackPreview({
  overrideId,
  overrideType,
  targetLabel,
  scope,
  appliedAt,
  appliedBy,
  originalChange,
  reversedSummary,
  warnings = [],
}: CurriculumOverrideRollbackPreviewProps) {
  const changeSummary = summariseChange(originalChange)

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-status-orange shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">
          Rollback preview — no changes yet
        </p>
      </div>

      {/* ── Rollback banner ── */}
      <div className="flex items-center gap-3 px-3.5 py-3 border-b border-status-orange/20 bg-status-orange/5">
        <div className="w-8 h-8 rounded-full border border-status-orange/20 flex items-center justify-center text-status-orange">
          <RotateCcw className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-status-orange">Override rollback</p>
          <p className="text-sm text-text-primary font-medium truncate">{targetLabel}</p>
          <p className="text-[10px] text-text-muted">{overrideType} · {scope} scope</p>
        </div>
      </div>

      {/* ── What was applied ── */}
      <div className="px-3.5 py-3 border-b border-border/50 space-y-1.5">
        <p className="text-[10px] text-text-muted uppercase tracking-wider">Original override applied</p>
        <p className="text-[11px] text-text-muted">
          Applied {formatDate(appliedAt)} by {appliedBy}
        </p>
        <div className="rounded-md bg-surface border border-border px-2.5 py-1.5">
          <p className="text-[11px] text-text-secondary leading-snug">{changeSummary}</p>
        </div>
      </div>

      {/* ── What rollback restores ── */}
      <div className="px-3.5 py-3 border-b border-border/50 space-y-1.5">
        <p className="text-[10px] text-text-muted uppercase tracking-wider">After rollback</p>
        <div className="flex items-start gap-2">
          <ArrowLeft className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <p className="text-xs text-text-primary leading-snug">{reversedSummary}</p>
        </div>
      </div>

      {/* ── Audit trail note ── */}
      <div className="px-3.5 py-2.5 border-b border-border/50">
        <p className="text-[10px] text-text-muted mb-0.5">Audit trail</p>
        <p className="text-[11px] text-text-secondary leading-snug">
          A rollback record will be written to{' '}
          <code className="text-[9px]">academy_curriculum_overrides</code> (type: remove).
          The original override (ID: {overrideId.slice(0, 8)}…) will be marked{' '}
          <span className="text-text-muted font-medium">rolled_back</span>.
          An <code className="text-[9px]">audit_logs</code> entry will be created.
          The master template is not affected.
        </p>
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

      {/* ── Protected notice ── */}
      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-surface">
        <Shield className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-snug">
          Rollback is director-only. Only applied overrides can be rolled back.
          The master template and all immutable blocks remain unchanged.
          Preview only — no action taken yet.
        </p>
      </div>
    </div>
  )
}
