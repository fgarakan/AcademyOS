'use client'

// Sprint 595 — DONNA Command Confirmation V1
// Final confirmation step before DONNA submits a proposal to proposed_actions.
// Coach confirms intent before any proposal is written.
// No DB write from this component — triggers onConfirm callback.

import { CheckCircle2, Shield, AlertTriangle } from 'lucide-react'
import type { DonnaCommandCategory } from '@/lib/donna/donnaCommandRouter'
import { DONNA_PUBLIC_NAME } from '@/components/assistant/donnaAssistantCopy'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConfirmationSummaryItem {
  label: string
  value: string
}

export interface DONNACommandConfirmationProps {
  category: DonnaCommandCategory
  actionSummary: string
  summaryItems: ConfirmationSummaryItem[]
  requiresDirectorApproval: boolean
  isParentDraft?: boolean           // extra notice: send blocked
  isLevelReadiness?: boolean        // extra notice: no level movement yet
  warnings?: string[]
  onConfirm: () => void
  onEdit?: () => void
  onCancel?: () => void
  isSubmitting?: boolean
}

// ── Category action labels ────────────────────────────────────────────────────

const CATEGORY_ACTION_LABELS: Record<DonnaCommandCategory, string> = {
  attendance: 'Submit attendance proposal',
  session_actual: 'Submit session record proposal',
  coach_observation: 'Submit player observation',
  parent_draft: 'Submit parent draft (not sent)',
  level_readiness: 'Submit readiness signal',
  curriculum_override: 'Submit curriculum override proposal',
  review_queue: 'Open review queue',
  academy_health: 'Get academy health answer',
  wrap_up: 'Start wrap-up flow',
  unknown: 'Confirm',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNACommandConfirmation({
  category,
  actionSummary,
  summaryItems,
  requiresDirectorApproval,
  isParentDraft = false,
  isLevelReadiness = false,
  warnings = [],
  onConfirm,
  onEdit,
  onCancel,
  isSubmitting = false,
}: DONNACommandConfirmationProps) {
  const confirmLabel = CATEGORY_ACTION_LABELS[category]

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-lime shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">{DONNA_PUBLIC_NAME} — confirm proposal</p>
      </div>

      {/* ── Summary ── */}
      <div className="px-3.5 py-3 border-b border-border/50 space-y-2">
        <p className="text-sm text-text-primary font-medium leading-snug">{actionSummary}</p>
        {summaryItems.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {summaryItems.map((item, i) => (
              <div key={i}>
                <p className="text-[10px] text-text-muted">{item.label}</p>
                <p className="text-[11px] text-text-primary font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Director approval notice ── */}
      {requiresDirectorApproval && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 border-b border-status-blue/20 bg-status-blue/5">
          <Shield className="w-3.5 h-3.5 text-status-blue shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-blue leading-snug">
            This proposal will go to the director review queue.
            It will not be applied until a director or head coach approves it.
          </p>
        </div>
      )}

      {/* ── Parent draft notice ── */}
      {isParentDraft && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 border-b border-status-orange/20 bg-status-orange/5">
          <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-orange leading-snug">
            Parent messages are never sent automatically.
            This creates a draft only — a director must approve before any message is sent.
          </p>
        </div>
      )}

      {/* ── Level readiness notice ── */}
      {isLevelReadiness && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 border-b border-border/50 bg-surface">
          <Shield className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-snug">
            This flags a readiness signal only — no level change will occur.
            Level movement requires <code className="text-[9px]">finalize_player_placement()</code> and explicit director action.
          </p>
        </div>
      )}

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

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 btn-lime text-xs py-1.5 flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isSubmitting ? 'Submitting…' : confirmLabel}
        </button>
        {onEdit && (
          <button type="button" onClick={onEdit} disabled={isSubmitting} className="btn-ghost text-xs py-1.5 px-3">
            Edit
          </button>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-ghost text-xs py-1.5 px-3">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
