'use client'

// Mega Sprint 2681–2740 — DONNA Guided Execution OS V2
// DonnaExecutionModeCard — lightweight execution mode card in the DONNA panel.
//
// Displays the current active task with:
//   - Task title
//   - Why it matters (reason)
//   - Completion criteria (done when)
//   - Quick-action buttons: Help, Take me there, Done, Next
//
// Design rules:
//   - Low cognitive load — one task at a time
//   - No duplicate of the dashboard
//   - Minimum text surface: the Director is executing, not reading
//   - All buttons emit natural-language phrases handled by the orchestrator

import { CheckCircle, HelpCircle, ArrowRight, ChevronRight, X } from 'lucide-react'
import type { NextBestAction } from '@/lib/donna/guided/nextBestAction'

interface DonnaExecutionModeCardProps {
  action:       NextBestAction
  onSubmit:     (text: string) => void
  onDismiss:    () => void
}

export function DonnaExecutionModeCard({
  action,
  onSubmit,
  onDismiss,
}: DonnaExecutionModeCardProps) {
  return (
    <div className="mx-4 mb-3 rounded-lg border border-lime/30 bg-surface-raised overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-lime mt-0.5" />
          <span className="text-[11px] uppercase tracking-widest text-lime font-semibold">
            Current Task
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
          aria-label="Dismiss execution card"
        >
          <X size={13} />
        </button>
      </div>

      {/* Task body */}
      <div className="px-3 py-2">
        <p className="text-sm text-text-primary font-medium leading-snug">
          {action.title}
        </p>
        {action.reason && (
          <p className="mt-1 text-[12px] text-text-secondary leading-relaxed">
            {action.reason}
          </p>
        )}
        {action.completionCriteria && (
          <div className="mt-2 flex items-start gap-1.5">
            <CheckCircle size={11} className="text-lime flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-muted leading-relaxed">
              {action.completionCriteria}
            </p>
          </div>
        )}
        {action.estimatedMinutes && (
          <p className="mt-1.5 text-[11px] text-text-muted">
            ⏱ {action.estimatedMinutes}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-3 pb-3 flex flex-wrap gap-2">
        <button
          onClick={() => onSubmit('Help.')}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-surface border border-border text-text-secondary hover:border-text-muted hover:text-text-primary transition-colors"
        >
          <HelpCircle size={11} />
          Help
        </button>

        {action.route && (
          <button
            onClick={() => onSubmit('Take me there.')}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-surface border border-border text-text-secondary hover:border-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowRight size={11} />
            Take me there
          </button>
        )}

        <button
          onClick={() => onSubmit('Done.')}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-lime/10 border border-lime/30 text-lime hover:bg-lime/20 transition-colors"
        >
          <CheckCircle size={11} />
          Done
        </button>

        <button
          onClick={() => onSubmit('What else?')}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-surface border border-border text-text-secondary hover:border-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronRight size={11} />
          What else?
        </button>
      </div>
    </div>
  )
}
