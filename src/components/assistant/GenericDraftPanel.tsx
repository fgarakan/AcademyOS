'use client'

import { useState } from 'react'
import { X, Edit2, CheckCircle2, AlertCircle } from 'lucide-react'
import { DONNA_TASK_CONTRACTS } from './donnaTaskContracts'
import type { DonnaTaskQuestion } from './donnaTaskContracts'
import {
  getNextMissingQuestion,
  isTaskDraftComplete,
  getMissingRequiredFieldIds,
  countAnsweredRequired,
} from './donnaMissingQuestionEngine'
import type { GenericTaskDraft } from './donnaGenericDraftTypes'
import { applyAnswerToGenericDraft } from './donnaGenericDraftTypes'
import type { DonnaApprovalExecutionResult } from './donnaApprovalExecutionTypes'

// ─── Props ────────────────────────────────────────────────────────────────────

interface GenericDraftPanelProps {
  draft: GenericTaskDraft
  onUpdateDraft: (draft: GenericTaskDraft) => void
  onCancel: () => void
  fromVoice?: boolean
  onQuestionAnswered?: (
    nextQuestion: DonnaTaskQuestion | null,
    updatedDraft: GenericTaskDraft,
  ) => void
  /** If provided, clicking Approve calls this and shows the result inline */
  onApprove?: (draft: GenericTaskDraft) => Promise<DonnaApprovalExecutionResult>
  /** True when the task has a wired server action — shows Approve button instead of "not yet available" */
  isWired?: boolean
}

type ApproveState = 'idle' | 'saving' | 'saved' | 'error'

// ─── Component ────────────────────────────────────────────────────────────────

export function GenericDraftPanel({
  draft,
  onUpdateDraft,
  onCancel,
  fromVoice,
  onQuestionAnswered,
  onApprove,
  isWired,
}: GenericDraftPanelProps) {
  const [answerInput, setAnswerInput] = useState('')
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editInput, setEditInput] = useState('')
  const [approveState, setApproveState] = useState<ApproveState>('idle')
  const [approveResult, setApproveResult] = useState<DonnaApprovalExecutionResult | null>(null)

  const contract = DONNA_TASK_CONTRACTS[draft.taskId]
  if (!contract) return null

  const currentQuestion = getNextMissingQuestion(draft.taskId, draft.collectedFields)
  const isComplete = isTaskDraftComplete(draft.taskId, draft.collectedFields)
  const totalRequired = contract.requiredFields.length
  const answeredCount = countAnsweredRequired(draft.taskId, draft.collectedFields)
  const remainingCount = getMissingRequiredFieldIds(draft.taskId, draft.collectedFields).length

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAnswerSubmit() {
    if (!answerInput.trim() || !currentQuestion) return
    const updated = applyAnswerToGenericDraft(draft, currentQuestion.fieldId, answerInput.trim())
    onUpdateDraft(updated)
    setAnswerInput('')
    const nextQ = getNextMissingQuestion(updated.taskId, updated.collectedFields)
    onQuestionAnswered?.(nextQ, updated)
  }

  function handleEditField(fieldId: string) {
    setEditingFieldId(fieldId)
    setEditInput(draft.collectedFields[fieldId] ?? '')
  }

  function handleSaveEdit() {
    if (!editingFieldId) return
    const value = editInput.trim()
    if (value) {
      const updated = applyAnswerToGenericDraft(draft, editingFieldId, value)
      onUpdateDraft(updated)
    }
    setEditingFieldId(null)
    setEditInput('')
  }

  async function handleApprove() {
    if (!onApprove || approveState === 'saving') return
    setApproveState('saving')
    setApproveResult(null)
    try {
      const result = await onApprove(draft)
      setApproveResult(result)
      setApproveState(result.ok ? 'saved' : 'error')
    } catch {
      setApproveResult({
        ok: false,
        status: 'error',
        message: 'An unexpected error occurred. Please try again.',
      })
      setApproveState('error')
    }
  }

  function getFieldLabel(fieldId: string): string {
    const field = [...contract.requiredFields, ...contract.optionalFields].find(
      f => f.fieldId === fieldId,
    )
    return field?.label ?? fieldId.replace(/_/g, ' ')
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2.5">

      {/* Guided setup status bar */}
      <div
        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
        style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)' }}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted leading-none">
            Guided setup
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5 leading-snug truncate">
            {contract.label}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-text-muted whitespace-nowrap">
            {answeredCount} of {totalRequired}
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={
              isComplete
                ? {
                    background: 'rgba(48,209,88,0.1)',
                    color: '#30D158',
                    border: '1px solid rgba(48,209,88,0.25)',
                  }
                : {
                    background: 'rgba(255,149,0,0.08)',
                    color: '#FF9500',
                    border: '1px solid rgba(255,149,0,0.22)',
                  }
            }
          >
            {isComplete ? 'Ready' : `${remainingCount} left`}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-text-muted">
            {contract.label} Draft
          </p>
          <span
            className="inline-block mt-0.5 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border"
            style={{
              borderColor: 'rgba(255,149,0,0.4)',
              color: '#FF9500',
              background: 'rgba(255,149,0,0.06)',
            }}
          >
            Draft only — not saved
          </span>
        </div>
        <button
          onClick={onCancel}
          aria-label="Cancel draft"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all shrink-0 mt-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Voice capture notice */}
      {fromVoice && (
        <div
          className="rounded-lg px-3 py-2"
          style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.15)',
          }}
        >
          <p className="text-[11px] text-text-secondary leading-snug">
            I captured a {contract.label.toLowerCase()} request. Review the draft below —
            nothing is saved until you approve.
          </p>
        </div>
      )}

      {/* Current missing question */}
      {currentQuestion && (
        <div
          className="rounded-xl px-3.5 py-3 space-y-2.5"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <div>
            <p
              className="text-[10px] uppercase tracking-widest font-semibold mb-1"
              style={{ color: '#8b5cf6' }}
            >
              Missing info
            </p>
            <p className="text-[12px] text-text-primary font-medium leading-snug">
              {currentQuestion.question}
            </p>
            <p className="text-[10px] text-text-muted mt-1 leading-snug">
              Answer by voice or type below. I&apos;ll ask one question at a time.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={answerInput}
              onChange={e => setAnswerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnswerSubmit()}
              placeholder="Type your answer…"
              className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            />
            <button
              onClick={handleAnswerSubmit}
              disabled={!answerInput.trim()}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40"
              style={{
                background: 'rgba(139,92,246,0.15)',
                color: '#8b5cf6',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Collected fields — shown as soon as at least one field is answered */}
      {Object.keys(draft.collectedFields).length > 0 && (
        <div
          className="rounded-xl px-3.5 py-3 space-y-2.5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
            Draft so far
          </p>
          {Object.entries(draft.collectedFields).map(([fieldId, value]) => (
            <div key={fieldId}>
              {editingFieldId === fieldId ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editInput}
                    onChange={e => setEditInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                    autoFocus
                    className="flex-1 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(139,92,246,0.3)',
                    }}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="text-[10px] font-semibold text-lime shrink-0"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingFieldId(null)}
                    className="text-[10px] text-text-muted shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest leading-none">
                      {getFieldLabel(fieldId)}
                    </p>
                    <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
                      {value}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditField(fieldId)}
                    aria-label={`Edit ${getFieldLabel(fieldId)}`}
                    className="shrink-0 mt-0.5 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Complete state — all required fields answered */}
      {isComplete && approveState !== 'saved' && (
        <div
          className="rounded-xl px-3.5 py-3 space-y-2.5"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(200,255,0,0.2)',
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#30D158' }} />
            <p className="text-[12px] font-semibold text-text-primary">
              {contract.label} draft is ready.
            </p>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Review your answers above. You can edit any field before saving.
          </p>

          {isWired && onApprove ? (
            /* ── Wired task: Approve and Save button ── */
            <>
              {/* What will be saved */}
              <div
                className="rounded-lg px-3 py-2"
                style={{
                  background: 'rgba(200,255,0,0.04)',
                  border: '1px solid rgba(200,255,0,0.15)',
                }}
              >
                <p
                  className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                  style={{ color: '#C8FF00' }}
                >
                  What will be saved
                </p>
                <ul className="space-y-0.5">
                  {DONNA_TASK_CONTRACTS[draft.taskId]?.unsafeWithoutApproval.length === 0
                    ? <li className="text-[11px] text-text-muted">This draft will be saved after approval.</li>
                    : null}
                  {draft.taskId === 'create_fitness_template' && (
                    <>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        A fitness template record (tagged fitness_template:true)
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Template blocks for each category you listed
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        No session is created — scheduling is a separate step
                      </li>
                    </>
                  )}
                  {draft.taskId === 'capture_coach_note' && (
                    <>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Internal only — not visible to parents or players
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        A pending-review voice note saved to your Review Queue
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Does not update player level
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Does not send any communication
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Director review may still be required
                      </li>
                    </>
                  )}
                  {draft.taskId === 'draft_player_note' && (
                    <>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Internal only — not visible to parents or players
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Updates coach summary and development focus in the player&apos;s development record
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Does not change show_to_parent or show_to_student — director must explicitly enable visibility
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Does not update player level
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Does not send any communication
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Director review may still be required
                      </li>
                    </>
                  )}
                  {draft.taskId === 'create_session' && (
                    <>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        An internal planned session record (status: planned)
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Session blocks are not copied in this step — use &ldquo;Populate Session Blocks&rdquo; after creation
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        This creates an internal record only — no coach, parent, or player is notified
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        No attendance records are created
                      </li>
                    </>
                  )}
                  {draft.taskId === 'populate_session_from_template' && (
                    <>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Session blocks copied from the template into this session
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        A local coach brief is generated for your review — not sent or stored
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        No coach, parent, or player is notified
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Blocked if the session already has blocks (duplicate guard)
                      </li>
                    </>
                  )}
                  {draft.taskId === 'handle_attendance_exception' && (
                    <>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Internal only — not visible to parents or players
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        A proposed_actions draft row created for director review
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        No attendance records written — apply the draft in Review Queue to record official attendance
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Unrostered attendees flagged for director review — not added to roster or attendance
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        No billing, enrollment, or roster change
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        No parent, player, or coach notification
                      </li>
                    </>
                  )}
                  {draft.taskId === 'draft_parent_update' && (
                    <>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Draft only — saved for director review, not sent to parent
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        A proposed_actions draft row created in the Review Queue
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Parent and player see nothing — no visibility flags changed
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        show_to_parent and show_to_student are not touched
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        No player level, roster, or billing change
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Director approval required before any external communication
                      </li>
                    </>
                  )}
                  {draft.taskId === 'review_level_readiness' && (
                    <>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Readiness review only — player level is NOT changed
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        A proposed_actions draft row created for director decision
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Evidence and missing-evidence summary built from curriculum state and latest assessment
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        No parent, player, or coach notification
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Director must explicitly approve advancement from the Review Queue
                      </li>
                    </>
                  )}
                  {draft.taskId === 'adjust_curriculum' && (
                    <>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Proposal only — curriculum data is NOT changed
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        A proposed_actions draft row created for director review
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        No curriculum table, template, or player requirement is modified
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Not visible to parents, players, or coaches
                      </li>
                      <li className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                        <span className="shrink-0 mt-px" style={{ color: '#C8FF00' }}>·</span>
                        Director approval required before any curriculum change is applied
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Error state */}
              {approveState === 'error' && approveResult && (
                <div
                  className="rounded-lg px-3 py-2 flex items-start gap-2"
                  style={{
                    background: 'rgba(255,59,48,0.07)',
                    border: '1px solid rgba(255,59,48,0.25)',
                  }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" style={{ color: '#FF3B30' }} />
                  <p className="text-[11px] text-text-secondary leading-snug">
                    {approveResult.message}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleApprove}
                  disabled={approveState === 'saving'}
                  className="btn-lime text-xs px-3.5 py-1.5 disabled:opacity-60"
                >
                  {approveState === 'saving' ? 'Saving…' : 'Approve and Save'}
                </button>
                <button
                  onClick={onCancel}
                  className="text-[11px] text-text-muted hover:text-status-red transition-colors"
                >
                  Discard Draft
                </button>
              </div>
            </>
          ) : (
            /* ── Not wired: honest notice ── */
            <>
              <div
                className="rounded-lg px-3 py-2"
                style={{
                  background: 'rgba(255,149,0,0.06)',
                  border: '1px solid rgba(255,149,0,0.2)',
                }}
              >
                <p
                  className="text-[10px] uppercase tracking-widest font-semibold mb-0.5"
                  style={{ color: '#FF9500' }}
                >
                  Save not yet available
                </p>
                <p className="text-[11px] text-text-muted leading-snug">
                  The save action for {contract.label.toLowerCase()} is coming in a future sprint.
                  Your draft is held here for your review.
                </p>
              </div>

              <button
                onClick={onCancel}
                className="text-[11px] text-text-muted hover:text-status-red transition-colors"
              >
                Discard Draft
              </button>
            </>
          )}
        </div>
      )}

      {/* Saved state — shown after successful approval */}
      {approveState === 'saved' && approveResult?.ok && (
        <div
          className="rounded-xl px-3.5 py-3 space-y-2.5"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(48,209,88,0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#30D158' }} />
            <p className="text-[12px] font-semibold text-text-primary">Saved successfully.</p>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {approveResult.message}
          </p>
          {approveResult.safetyNotes && approveResult.safetyNotes.length > 0 && (
            <ul className="space-y-0.5">
              {approveResult.safetyNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-1 text-[11px] text-text-muted leading-snug">
                  <span className="shrink-0 mt-px" style={{ color: '#30D158' }}>·</span>
                  {note}
                </li>
              ))}
            </ul>
          )}
          {approveResult.details && (
            <div
              className="rounded-lg px-3 py-2.5"
              style={{
                background: 'rgba(139,92,246,0.05)',
                border: '1px solid rgba(139,92,246,0.18)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                style={{ color: '#8b5cf6' }}
              >
                Coach Brief Draft
              </p>
              <pre className="text-[10px] text-text-muted leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
                {approveResult.details}
              </pre>
            </div>
          )}
          <button
            onClick={onCancel}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Close
          </button>
        </div>
      )}

    </div>
  )
}
