'use client'

// Sprint 1821–1830 — DONNA Guided Completion Experience V1
// Progress card for an active guided completion workflow.
// Renders inside the DONNA panel alongside the chat thread.
// Shows: workflow label, step progress, progress bar, current question, cancel button.
// When complete: shows "All steps done" with prompt to type "show summary".
//
// Design rules:
//   - Read-only display of session state passed from DonnaAssistantButton
//   - No DB calls, no mutations
//   - Approval-safe: never shows save/publish controls directly
//   - Calm, non-intrusive lime accent

import { CheckCircle2 } from 'lucide-react'
import type { GuidedCompletionSessionState } from '@/lib/donna/guidedCompletion/guidedCompletionSessionMemory'
import { getWorkflow } from '@/lib/donna/guidedCompletion/guidedCompletionRegistry'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DonnaGuidedWorkflowCardProps {
  session: GuidedCompletionSessionState
  onCancel: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaGuidedWorkflowCard({ session, onCancel }: DonnaGuidedWorkflowCardProps) {
  const workflow = getWorkflow(session.workflowId)
  const totalSteps = workflow?.requiredSteps.length ?? 0
  const isComplete = session.completionPct >= 100

  return (
    <div
      className="rounded-xl px-3.5 py-3 space-y-2.5"
      style={{
        background: 'rgba(200,255,0,0.04)',
        border: '1px solid rgba(200,255,0,0.16)',
      }}
      aria-label={`Guided workflow: ${workflow?.label ?? session.workflowId}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] uppercase tracking-widest font-semibold text-lime truncate"
        >
          {workflow?.label ?? 'Guided Workflow'}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 text-[10px] text-text-muted hover:text-status-red transition-colors"
          aria-label="Cancel guided workflow"
        >
          Cancel
        </button>
      </div>

      {/* Progress bar + step label */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full bg-lime transition-all duration-300"
              style={{ width: `${session.completionPct}%` }}
            />
          </div>
          <span className="text-[10px] text-text-muted shrink-0 tabular-nums">
            {isComplete ? `${totalSteps}/${totalSteps}` : `${session.currentStepIndex - 1}/${totalSteps}`}
          </span>
        </div>
        {!isComplete && (
          <p className="text-[10px] text-text-muted">
            Step {session.currentStepIndex} of {totalSteps}
          </p>
        )}
      </div>

      {/* Current question or done state */}
      {isComplete ? (
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-status-green shrink-0 mt-0.5" aria-hidden />
          <p className="text-[11px] text-status-green font-medium leading-snug">
            All {totalSteps} steps complete.{' '}
            <span className="text-text-secondary font-normal">
              Type <strong>"show summary"</strong> to review the draft.
            </span>
          </p>
        </div>
      ) : session.nextQuestion ? (
        <p className="text-[12px] font-medium text-text-primary leading-snug">
          {session.nextQuestion}
        </p>
      ) : null}

      {/* Subject label */}
      {session.subjectLabel && (
        <p className="text-[10px] text-text-muted truncate">
          Working on: <span className="text-lime">{session.subjectLabel}</span>
        </p>
      )}
    </div>
  )
}
