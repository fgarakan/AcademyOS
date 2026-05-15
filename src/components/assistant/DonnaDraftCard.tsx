'use client'

// Sprint 322 — Donna Draft Card V1
// Visible live draft progress card rendered inside DonnaAssistantButton
// when the conversation controller has an active draft.
// Shows collected fields, progress bar, next question, version, and action buttons.
// No DB writes. No mutations. Pure display + handler callbacks.

import { Undo2, RefreshCw, X, ChevronRight, CheckCircle, AlertCircle, Lock } from 'lucide-react'
import { summarizeDraft, getNextQuestion } from './donnaDraftRuntime'
import type { DonnaDraftState } from './donnaDraftRuntime'
import { DONNA_TASK_CONTRACTS } from './donnaTaskContracts'
import { getWorkflow } from './donnaWorkflowRegistry'
import type { WorkflowId } from './donnaIntentRouter'

interface Props {
  draft: DonnaDraftState
  onUndo: () => void
  onStartOver: () => void
  onDiscard: () => void
  onReview: () => void
}

export function DonnaDraftCard({ draft, onUndo, onStartOver, onDiscard, onReview }: Props) {
  const summary = summarizeDraft(draft)
  const contract = DONNA_TASK_CONTRACTS[draft.taskId]
  const workflow = draft.workflowId ? getWorkflow(draft.workflowId as WorkflowId) : null
  const nextQ = getNextQuestion(draft)

  const version = draft.history.length + 1
  const versionLabel = `v${version}`
  const canUndo = draft.history.length > 0

  return (
    <div
      className="rounded-xl p-3.5 space-y-3"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-lime uppercase tracking-widest">
            {workflow?.label ?? contract?.label ?? 'Draft'}
          </span>
          <span className="text-[10px] text-text-muted">{versionLabel}</span>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={
            draft.phase === 'ready_for_review'
              ? { background: 'rgba(48,209,88,0.12)', color: '#30D158' }
              : { background: 'rgba(200,255,0,0.08)', color: 'var(--lime)' }
          }
        >
          {draft.phase === 'ready_for_review' ? 'Ready to review' : 'Collecting'}
        </span>
      </div>

      {/* Collected fields */}
      {summary.fieldLines.length > 0 && (
        <div className="space-y-1.5">
          {summary.fieldLines.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-lime mt-0.5 shrink-0" />
              <span className="text-[11px]">
                <span className="text-text-muted uppercase tracking-wide text-[10px]">{label}: </span>
                <span className="text-text-primary">{value}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {summary.totalRequired > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-text-muted">
            <span>{summary.answeredCount} of {summary.totalRequired} required</span>
            {summary.missingRequiredIds.length > 0 && (
              <span>{summary.missingRequiredIds.length} remaining</span>
            )}
          </div>
          <div className="h-1 rounded-full" style={{ background: 'var(--border)' }}>
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round((summary.answeredCount / summary.totalRequired) * 100)}%`,
                background: 'var(--lime)',
              }}
            />
          </div>
        </div>
      )}

      {/* Donna's next question */}
      {nextQ && draft.phase === 'collecting' && (
        <div
          className="rounded-lg px-3 py-2.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Donna asks</p>
          <p className="text-[13px] text-text-primary leading-snug">{nextQ.question}</p>
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {canUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary px-2 py-1 rounded transition-colors"
            style={{ border: '1px solid var(--border)' }}
          >
            <Undo2 className="w-3 h-3" />
            Undo
          </button>
        )}
        <button
          onClick={onStartOver}
          className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary px-2 py-1 rounded transition-colors"
          style={{ border: '1px solid var(--border)' }}
        >
          <RefreshCw className="w-3 h-3" />
          Start over
        </button>
        <button
          onClick={onDiscard}
          className="flex items-center gap-1 text-[11px] text-text-muted hover:text-status-red px-2 py-1 rounded transition-colors"
          style={{ border: '1px solid var(--border)' }}
        >
          <X className="w-3 h-3" />
          Discard
        </button>
        {draft.phase === 'ready_for_review' && (
          <button
            onClick={onReview}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded ml-auto transition-opacity hover:opacity-90"
            style={{ background: 'var(--lime)', color: 'var(--base)' }}
          >
            Review draft
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Missing field warning */}
      {summary.missingRequiredIds.length > 0 && draft.phase === 'collecting' && (
        <p className="text-[10px] text-text-muted flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-status-orange shrink-0" />
          Answer Donna's question above by typing or speaking — nothing saves yet.
        </p>
      )}

      {/* Approval disclaimer when ready */}
      {draft.phase === 'ready_for_review' && (
        <p className="text-[10px] text-text-muted flex items-center gap-1">
          <Lock className="w-3 h-3 shrink-0" />
          Nothing saves until you click the on-screen approval button.
        </p>
      )}
    </div>
  )
}
