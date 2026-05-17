'use client'

// Sprint 624 — DONNA Draft Parent Updates From Evidence Safe Preview V1
// Shows DONNA's drafted parent-safe update from player evidence.
// Preview only — no DB writes, no sends from this component.

import { Shield, Eye, EyeOff, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type EvidenceSourceType =
  | 'coach_observation'
  | 'assessment_result'
  | 'attendance_record'
  | 'session_note'
  | 'level_readiness_flag'

export type EvidenceSafetyLevel =
  | 'parent_safe'      // appropriate to share with parent
  | 'sensitive'        // filtered out — not shared with parent
  | 'internal_only'    // never shared; director/coach only

export interface EvidenceSource {
  id: string
  type: EvidenceSourceType
  summary: string
  safetyLevel: EvidenceSafetyLevel
  date: string
}

export interface DONNAParentUpdateDraftPreviewProps {
  playerName: string
  draftText: string
  evidenceSources: EvidenceSource[]
  /** How many evidence items were filtered for parent safety */
  filteredCount: number
  draftedAt: string
  onSubmitForReview?: () => void
  onDiscard?: () => void
  className?: string
}

// ── Config ────────────────────────────────────────────────────────────────────

const EVIDENCE_TYPE_LABELS: Record<EvidenceSourceType, string> = {
  coach_observation: 'Coach observation',
  assessment_result: 'Assessment result',
  attendance_record: 'Attendance record',
  session_note: 'Session note',
  level_readiness_flag: 'Level readiness',
}

const SAFETY_CONFIG: Record<EvidenceSafetyLevel, { label: string; dotClass: string; shown: boolean }> = {
  parent_safe:   { label: 'Included', dotClass: 'bg-status-green', shown: true },
  sensitive:     { label: 'Filtered', dotClass: 'bg-status-orange', shown: false },
  internal_only: { label: 'Filtered', dotClass: 'bg-status-red', shown: false },
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Evidence row ──────────────────────────────────────────────────────────────

function EvidenceRow({ source }: { source: EvidenceSource }) {
  const cfg = SAFETY_CONFIG[source.safetyLevel]
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${cfg.dotClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] text-text-muted">{EVIDENCE_TYPE_LABELS[source.type]}</span>
          <span className="text-[9px] text-text-muted">·</span>
          <span className="text-[9px] text-text-muted">{formatDate(source.date)}</span>
          {!cfg.shown && (
            <span className="ml-auto flex items-center gap-0.5 text-[9px] text-status-orange">
              <EyeOff className="w-2.5 h-2.5" />
              Filtered
            </span>
          )}
        </div>
        <p className={`text-[11px] leading-snug ${cfg.shown ? 'text-text-secondary' : 'text-text-muted line-through opacity-60'}`}>
          {source.summary}
        </p>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAParentUpdateDraftPreview({
  playerName,
  draftText,
  evidenceSources,
  filteredCount,
  draftedAt,
  onSubmitForReview,
  onDiscard,
  className = '',
}: DONNAParentUpdateDraftPreviewProps) {
  const [showEvidence, setShowEvidence] = useState(false)
  const includedSources = evidenceSources.filter(e => e.safetyLevel === 'parent_safe')

  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-text-muted" />
          <p className="text-sm font-medium text-text-primary">Parent update draft</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-status-green" />
          <span className="text-[10px] text-status-green font-medium">Preview only</span>
        </div>
      </div>

      {/* Player + safety notice */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] text-text-muted mb-2">
          For: <span className="text-text-secondary font-medium">{playerName}</span>
          <span className="ml-2 text-[10px] text-text-muted">· Drafted {formatDate(draftedAt)}</span>
        </p>

        {filteredCount > 0 && (
          <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-status-orange/5 border border-status-orange/15 mb-3">
            <EyeOff className="w-3 h-3 text-status-orange mt-0.5 shrink-0" />
            <p className="text-[10px] text-status-orange leading-snug">
              {filteredCount} sensitive item{filteredCount !== 1 ? 's' : ''} filtered — not included in parent update.
            </p>
          </div>
        )}
      </div>

      {/* Draft text */}
      <div className="px-4 pb-3 border-b border-border/50">
        <div className="rounded-lg bg-surface-raised border border-border px-3.5 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] text-text-muted uppercase tracking-widest">Draft message</span>
          </div>
          <p className="text-[12px] text-text-primary leading-relaxed">{draftText}</p>
        </div>
      </div>

      {/* Evidence toggle */}
      <div className="px-4 py-2 border-b border-border/50">
        <button
          onClick={() => setShowEvidence(v => !v)}
          className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
        >
          {showEvidence ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {includedSources.length} source{includedSources.length !== 1 ? 's' : ''} used
          {filteredCount > 0 && ` · ${filteredCount} filtered`}
        </button>

        {showEvidence && (
          <div className="mt-1.5 divide-y divide-border/30">
            {evidenceSources.map(src => (
              <EvidenceRow key={src.id} source={src} />
            ))}
          </div>
        )}
      </div>

      {/* Safety reminder */}
      <div className="px-4 py-2.5 border-b border-border/50">
        <div className="flex items-start gap-1.5">
          <AlertCircle className="w-3 h-3 text-text-muted mt-0.5 shrink-0" />
          <p className="text-[10px] text-text-muted leading-snug">
            This draft requires director approval before it appears in the parent portal. Nothing is sent automatically.
          </p>
        </div>
      </div>

      {/* Actions */}
      {(onSubmitForReview || onDiscard) && (
        <div className="flex items-center gap-3 px-4 py-2.5">
          {onSubmitForReview && (
            <button
              onClick={onSubmitForReview}
              className="text-xs font-medium text-lime hover:text-lime/80 transition-colors"
            >
              Submit for director review
            </button>
          )}
          {onDiscard && (
            <button
              onClick={onDiscard}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Discard
            </button>
          )}
        </div>
      )}
    </div>
  )
}
