'use client'

// Sprint 1025 — Director Approval Action Flow V1
// UI panel for director review of DONNA-proposed approval-required actions.
// Shows: headline, context, what changes, safety notes, risk badge.
// Approve/Reject/Note buttons dispatch to the caller via callbacks.
// No DB writes directly — caller provides onApprove/onReject handlers.

import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info, ShieldCheck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui'
import type { DonnaApprovalRequest, DirectorReviewContext } from '@/lib/donna/donnaApprovalActions'
import { getApprovalRiskBadge } from '@/lib/donna/donnaApprovalActions'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DirectorApprovalActionFlowProps {
  request: DonnaApprovalRequest
  onApprove: (request: DonnaApprovalRequest, notes: string) => void
  onReject: (request: DonnaApprovalRequest, reason: string) => void
  isSubmitting?: boolean
  className?: string
}

// ── Risk icon ─────────────────────────────────────────────────────────────────

function RiskIcon({ risk }: { risk: 'high' | 'medium' | 'low' }) {
  if (risk === 'high') return <AlertTriangle className="w-3.5 h-3.5" />
  if (risk === 'medium') return <Info className="w-3.5 h-3.5" />
  return <CheckCircle2 className="w-3.5 h-3.5" />
}

// ── Review context panel ──────────────────────────────────────────────────────

function ReviewContextPanel({ ctx }: { ctx: DirectorReviewContext }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary leading-relaxed">{ctx.summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface-raised p-3">
          <p className="label-xs mb-2">What changes</p>
          <ul className="space-y-1">
            {ctx.whatChanges.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-status-orange" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface-raised p-3">
          <p className="label-xs mb-2">What stays the same</p>
          <ul className="space-y-1">
            {ctx.whatDoesNotChange.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-status-green" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {ctx.reversalNote && (
        <p className="text-[11px] text-text-muted">
          {ctx.reversible ? 'Reversible.' : 'Not reversible.'} {ctx.reversalNote}
        </p>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DirectorApprovalActionFlow({
  request,
  onApprove,
  onReject,
  isSubmitting = false,
  className = '',
}: DirectorApprovalActionFlowProps) {
  const [showContext, setShowContext] = useState(false)
  const [notes, setNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const ctx = request.directorReviewContext
  const riskBadgeClass = getApprovalRiskBadge(request.riskLevel)

  function handleApprove() {
    if (isSubmitting) return
    onApprove(request, notes)
  }

  function handleReject() {
    if (isSubmitting) return
    onReject(request, rejectReason)
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary leading-snug">{ctx.headline}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{request.actionLabel}</p>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium ${riskBadgeClass}`}>
            <RiskIcon risk={request.riskLevel} />
            {request.riskLevel} risk
          </span>
        </div>

        {/* Context toggle */}
        <button
          type="button"
          onClick={() => setShowContext(v => !v)}
          className="flex items-center gap-1.5 text-[11px] text-lime hover:text-lime/80 transition-colors"
        >
          {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showContext ? 'Hide context' : 'Show context'}
        </button>

        {showContext && <ReviewContextPanel ctx={ctx} />}

        {/* Safety notes */}
        {request.safetyNotes.length > 0 && (
          <div className="rounded-xl border border-lime/20 bg-lime/5 px-3.5 py-3 space-y-1">
            {request.safetyNotes.map((note, i) => (
              <div key={i} className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
                <p className="text-[11px] text-lime/80 leading-relaxed">{note}</p>
              </div>
            ))}
          </div>
        )}

        {/* Director notes input */}
        {!showRejectForm && (
          <div>
            <label className="label-xs block mb-1">Director notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add context for the record..."
              rows={2}
              className="w-full rounded-xl border border-border bg-surface-raised text-xs text-text-primary placeholder-text-muted px-3 py-2 resize-none focus:outline-none focus:border-lime/40 transition-colors"
            />
          </div>
        )}

        {/* Reject form */}
        {showRejectForm && (
          <div>
            <label className="label-xs block mb-1">Rejection reason</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Why is this being rejected?"
              rows={2}
              className="w-full rounded-xl border border-status-red/20 bg-status-red/5 text-xs text-text-primary placeholder-text-muted px-3 py-2 resize-none focus:outline-none focus:border-status-red/40 transition-colors"
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!showRejectForm ? (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="btn-lime text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {ctx.approvalLabel}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
                className="btn-ghost text-xs px-4 py-2 disabled:opacity-50 text-status-red hover:text-status-red/80 flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                {ctx.rejectionLabel}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="btn-danger text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Confirm rejection
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                disabled={isSubmitting}
                className="btn-ghost text-xs px-4 py-2"
              >
                Cancel
              </button>
            </>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
