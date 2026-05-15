'use client'

// Sprint 368 — Donna Message Review Panel V1
// Director can revise Donna's communication drafts and see a clear approval boundary.
// No sending. No API calls. "Approve" only means "ready for director to send via proper screen".

import { useState } from 'react'
import { X, AlertCircle, CheckCircle } from 'lucide-react'
import type { CommunicationDraft } from './donnaCommunicationDraft'
import { applyCommunicationField } from './donnaCommunicationDraft'
import { checkParentSafeContent, PARENT_SAFE_DISCLAIMER } from './donnaParentSafeRules'

interface Props {
  draft: CommunicationDraft
  onUpdate: (updated: CommunicationDraft) => void
  onDiscard: () => void
}

const TYPE_LABELS: Record<string, string> = {
  parent_update:    'Parent Update',
  coach_brief:      'Coach Brief',
  attendance_note:  'Attendance Note',
  progress_summary: 'Progress Summary',
}

export function DonnaMessageReviewPanel({ draft, onUpdate, onDiscard }: Props) {
  const [editedBody, setEditedBody] = useState(draft.body)
  const [approved, setApproved] = useState(false)

  const typeLabel = TYPE_LABELS[draft.type] ?? draft.type

  // Run parent-safe check on the edited body (if applicable)
  const isParentFacing = draft.type === 'parent_update' || draft.type === 'progress_summary'
  const safeCheck = isParentFacing ? checkParentSafeContent(editedBody) : null

  function handleApprove() {
    // Apply the edited body to the draft
    const updatedWithBody = applyCommunicationField(draft, 'body', editedBody)
    // Force ready status (director is approving for use)
    const updatedReady: CommunicationDraft = { ...updatedWithBody, status: 'ready' }
    onUpdate(updatedReady)
    setApproved(true)
  }

  if (approved) {
    return (
      <div
        className="rounded-xl p-3.5 space-y-2"
        style={{ background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-status-green" />
          <p className="text-xs font-semibold text-status-green">Draft approved for review</p>
        </div>
        <p className="text-[11px] text-text-secondary leading-snug">
          Use the Send button on screen — Donna cannot send messages directly.
        </p>
        <p className="text-[10px] text-text-muted leading-snug italic">
          {PARENT_SAFE_DISCLAIMER}
        </p>
        <button
          onClick={onDiscard}
          className="text-[10px] text-text-muted hover:text-status-red transition-colors underline underline-offset-2"
        >
          Discard
        </button>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-3.5 space-y-3"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-lime">
            Review Draft
          </p>
          <p className="text-xs font-semibold text-text-primary mt-0.5">{typeLabel}</p>
        </div>
        <button
          onClick={onDiscard}
          aria-label="Close review panel"
          className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metadata */}
      <div className="text-[11px] text-text-muted space-y-0.5">
        <div>To: <span className="text-text-secondary capitalize">{draft.recipientRole}</span></div>
        {draft.subject && (
          <div>Subject: <span className="text-text-secondary">{draft.subject}</span></div>
        )}
      </div>

      {/* Editable body */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
          Message body — edit as needed
        </p>
        <textarea
          rows={5}
          value={editedBody}
          onChange={e => setEditedBody(e.target.value)}
          placeholder="Message body..."
          className="w-full rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        />
      </div>

      {/* Parent-safe check results */}
      {safeCheck && !safeCheck.safe && (
        <div
          className="rounded-lg px-3 py-2 space-y-1"
          style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.18)' }}
        >
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-status-red shrink-0" />
            <p className="text-[10px] uppercase tracking-widest font-semibold text-status-red">
              Content issues
            </p>
          </div>
          {safeCheck.violations.map((v, i) => (
            <p key={i} className="text-[10px] text-text-muted leading-snug">· {v}</p>
          ))}
          {safeCheck.suggestions.length > 0 && (
            <div className="pt-1 space-y-0.5">
              <p className="text-[10px] text-text-muted font-semibold">Suggestions:</p>
              {safeCheck.suggestions.map((s, i) => (
                <p key={i} className="text-[10px] text-text-muted leading-snug">→ {s}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval boundary — never "Send now" */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)' }}
      >
        <p className="text-[10px] text-text-muted leading-snug">
          Approving marks this draft as ready. Use the Send button on screen — Donna cannot send messages directly.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={!editedBody.trim() || (safeCheck !== null && !safeCheck.safe)}
          className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Approve for review
        </button>
        <button
          onClick={onDiscard}
          className="text-[11px] text-text-muted hover:text-status-red transition-colors underline underline-offset-2"
        >
          Discard
        </button>
      </div>
    </div>
  )
}
