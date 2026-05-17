'use client'

// Sprint 593 — DONNA Safe Command Preview V1
// Shows what a DONNA command would do after intent classification and routing.
// Preview only — no execution, no DB write.

import { Shield, ArrowRight, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import type { DonnaCommandCategory, DonnaCommandDestination } from '@/lib/donna/donnaCommandRouter'
import type { IntentClassificationResult } from '@/lib/donna/donnaIntentClassifier'
import { DONNA_PUBLIC_NAME } from '@/components/assistant/donnaAssistantCopy'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DONNACommandPreviewCardProps {
  rawInput: string
  classification: IntentClassificationResult
  destination: DonnaCommandDestination | null
  requiresDirectorApproval: boolean
  isReadOnly: boolean
  routingNote: string | null
  onProceed?: () => void
  onClarify?: () => void
  onCancel?: () => void
}

// ── Destination labels ────────────────────────────────────────────────────────

const DESTINATION_LABELS: Record<DonnaCommandDestination, string> = {
  attendance_preview: 'Attendance preview',
  session_actual_preview: 'Session record preview',
  observation_preview: 'Player observation preview',
  parent_draft_preview: 'Parent draft (send blocked)',
  level_readiness_preview: 'Level readiness preview',
  curriculum_override_preview: 'Curriculum override preview',
  review_queue_surface: 'Review queue (read-only)',
  academy_health_answer: 'Academy health answer (read-only)',
  wrap_up_flow: 'Coach wrap-up flow',
  clarification_required: 'Needs clarification',
}

// ── Category labels ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<DonnaCommandCategory, string> = {
  attendance: 'Attendance',
  session_actual: 'Session record',
  coach_observation: 'Player observation',
  parent_draft: 'Parent draft',
  level_readiness: 'Level readiness',
  curriculum_override: 'Curriculum override',
  review_queue: 'Review queue',
  academy_health: 'Academy health',
  wrap_up: 'Session wrap-up',
  unknown: 'Unknown',
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: IntentClassificationResult['confidence'] }) {
  const cfg = {
    high: { label: 'High confidence', color: 'text-status-green bg-status-green/10 border-status-green/20' },
    medium: { label: 'Medium confidence', color: 'text-status-orange bg-status-orange/10 border-status-orange/20' },
    low: { label: 'Low confidence', color: 'text-status-red bg-status-red/10 border-status-red/20' },
  }[confidence]
  return (
    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNACommandPreviewCard({
  rawInput,
  classification,
  destination,
  requiresDirectorApproval,
  isReadOnly,
  routingNote,
  onProceed,
  onClarify,
  onCancel,
}: DONNACommandPreviewCardProps) {
  const needsClarification = classification.requiresClarification || !destination || destination === 'clarification_required'

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-lime shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">
          {DONNA_PUBLIC_NAME} — command preview
        </p>
      </div>

      {/* ── Input echo ── */}
      <div className="px-3.5 py-2.5 border-b border-border/50">
        <p className="text-[10px] text-text-muted mb-1">You said</p>
        <p className="text-xs text-text-primary italic leading-snug">
          &ldquo;{rawInput}&rdquo;
        </p>
      </div>

      {/* ── Classification ── */}
      <div className="px-3.5 py-2.5 border-b border-border/50 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[10px] text-text-muted">Classified as</p>
          <span className="text-[11px] font-semibold text-text-primary">
            {CATEGORY_LABELS[classification.category]}
          </span>
          <ConfidenceBadge confidence={classification.confidence} />
        </div>
        {classification.matchedSignals.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {classification.matchedSignals.slice(0, 4).map((s, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Route ── */}
      {!needsClarification && destination && (
        <div className="px-3.5 py-2.5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-text-muted">Route to</p>
            <ArrowRight className="w-3 h-3 text-text-muted" />
            <p className="text-xs text-text-primary font-medium">{DESTINATION_LABELS[destination]}</p>
          </div>
          {routingNote && (
            <p className="text-[10px] text-text-muted mt-1 leading-snug">{routingNote}</p>
          )}
        </div>
      )}

      {/* ── Safety flags ── */}
      <div className="px-3.5 py-2.5 border-b border-border/50 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          {requiresDirectorApproval
            ? <CheckCircle2 className="w-3.5 h-3.5 text-status-blue" />
            : <CheckCircle2 className="w-3.5 h-3.5 text-text-muted" />
          }
          <p className="text-[10px] text-text-muted">
            {requiresDirectorApproval ? 'Director approval required' : 'No approval needed (read-only)'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isReadOnly
            ? <Shield className="w-3.5 h-3.5 text-status-green" />
            : <Shield className="w-3.5 h-3.5 text-status-orange" />
          }
          <p className="text-[10px] text-text-muted">
            {isReadOnly ? 'Read-only preview' : 'Will write to proposed_actions'}
          </p>
        </div>
      </div>

      {/* ── Clarification needed ── */}
      {needsClarification && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 border-b border-status-orange/20 bg-status-orange/5">
          <HelpCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-orange leading-snug">
            {classification.clarificationPrompt ?? 'I need a bit more context before I can route this request.'}
          </p>
        </div>
      )}

      {/* ── Warning: ambiguous ── */}
      {classification.confidence === 'low' && !needsClarification && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 border-b border-status-orange/20 bg-status-orange/5">
          <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-orange leading-snug">
            Low confidence classification — confirm this is correct before proceeding.
          </p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        {needsClarification && onClarify && (
          <button
            type="button"
            onClick={onClarify}
            className="flex-1 btn-lime text-xs py-1.5"
          >
            Clarify
          </button>
        )}
        {!needsClarification && onProceed && (
          <button
            type="button"
            onClick={onProceed}
            className="flex-1 btn-lime text-xs py-1.5"
          >
            Proceed
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
