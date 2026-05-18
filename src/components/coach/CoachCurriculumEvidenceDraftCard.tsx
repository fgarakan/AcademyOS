'use client'

import { useState } from 'react'
import { BookOpen, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

export type EvidenceConfidence = 'high' | 'medium' | 'low'
export type EvidenceStatus = 'suggested' | 'pending_review' | 'accepted' | 'rejected'

export interface CurriculumGateEvidence {
  id: string
  playerName: string
  curriculumLevel: string
  gateLabel: string
  gateCriteria: string
  evidenceExcerpt: string
  sourceQuestion: string
  confidence: EvidenceConfidence
  status: EvidenceStatus
  coachNote: string | null
}

// ── Display config ────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<EvidenceConfidence, { label: string; color: string; dotColor: string }> = {
  high:   { label: 'High confidence',   color: 'text-status-green',  dotColor: 'bg-status-green' },
  medium: { label: 'Medium confidence', color: 'text-status-orange', dotColor: 'bg-status-orange' },
  low:    { label: 'Low confidence',    color: 'text-text-muted',    dotColor: 'bg-text-muted' },
}

const STATUS_CONFIG: Record<EvidenceStatus, { label: string; color: string }> = {
  suggested:      { label: 'Suggested',      color: 'text-text-muted border-border bg-surface-raised' },
  pending_review: { label: 'Pending Review', color: 'text-status-orange border-status-orange/30 bg-status-orange/5' },
  accepted:       { label: 'Accepted',       color: 'text-status-green border-status-green/30 bg-status-green/5' },
  rejected:       { label: 'Rejected',       color: 'text-status-red border-status-red/30 bg-status-red/5' },
}

function StatusPill({ status }: { status: EvidenceStatus }) {
  const { label, color } = STATUS_CONFIG[status]
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  )
}

// ── Single evidence card ──────────────────────────────────────

interface CardProps {
  evidence: CurriculumGateEvidence
}

export function CoachCurriculumEvidenceDraftCard({ evidence }: CardProps) {
  const [showCriteria, setShowCriteria] = useState(false)
  const conf = CONFIDENCE_CONFIG[evidence.confidence]

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <BookOpen className="w-3 h-3 text-text-muted shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-text-muted truncate">
              Curriculum Evidence — {evidence.curriculumLevel}
            </p>
          </div>
          <p className="text-sm font-semibold text-text-primary">{evidence.playerName}</p>
        </div>
        <StatusPill status={evidence.status} />
      </div>

      {/* Gate label */}
      <div className="rounded-xl bg-surface-raised border border-border px-3 py-2">
        <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">Gate Criterion</p>
        <p className="text-xs font-medium text-text-primary">{evidence.gateLabel}</p>
        {showCriteria && (
          <p className="text-[10px] text-text-secondary leading-snug mt-1">{evidence.gateCriteria}</p>
        )}
        <button
          onClick={() => setShowCriteria(v => !v)}
          className="flex items-center gap-1 mt-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        >
          {showCriteria ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showCriteria ? 'Hide full criteria' : 'Show full criteria'}
        </button>
      </div>

      {/* Evidence excerpt */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">
          From wrap-up — {evidence.sourceQuestion}
        </p>
        <p className="text-xs text-text-secondary leading-relaxed italic">
          &ldquo;{evidence.evidenceExcerpt}&rdquo;
        </p>
      </div>

      {/* Coach note */}
      {evidence.coachNote && (
        <p className="text-[10px] text-text-muted leading-snug">{evidence.coachNote}</p>
      )}

      {/* Confidence */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dotColor}`} />
        <span className={`text-[10px] ${conf.color}`}>{conf.label}</span>
        {evidence.confidence === 'low' && (
          <span className="text-[10px] text-text-muted">— additional observation recommended</span>
        )}
      </div>

      {/* Safety notice */}
      <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-surface-raised border border-border">
        <ShieldCheck className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-snug">
          Suggested only — director review required before this evidence links to any curriculum gate or triggers level movement.
        </p>
      </div>
    </div>
  )
}

// ── Evidence draft list ───────────────────────────────────────

interface ListProps {
  evidences: CurriculumGateEvidence[]
}

export function CoachCurriculumEvidenceDraftList({ evidences }: ListProps) {
  const [showAll, setShowAll] = useState(false)

  const pendingCount = evidences.filter(e => e.status === 'pending_review' || e.status === 'suggested').length
  const visible = showAll ? evidences : evidences.slice(0, 3)

  if (evidences.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <BookOpen className="w-5 h-5 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-secondary">No curriculum evidence links yet.</p>
        <p className="text-xs text-text-muted mt-1">
          Wrap-up answers that suggest curriculum gate progress appear here for director review.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-status-orange/5 border border-status-orange/20">
          <Clock className="w-3.5 h-3.5 text-status-orange shrink-0" />
          <p className="text-[10px] text-text-secondary">
            <span className="font-semibold text-status-orange">{pendingCount}</span> evidence link{pendingCount !== 1 ? 's' : ''} awaiting director review
          </p>
        </div>
      )}
      {visible.map(e => (
        <CoachCurriculumEvidenceDraftCard key={e.id} evidence={e} />
      ))}
      {evidences.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2.5 rounded-xl border border-border text-xs text-text-muted hover:bg-surface-raised transition-all"
        >
          Show {evidences.length - 3} more
        </button>
      )}
    </div>
  )
}
