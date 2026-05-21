'use client'

// Sprint 584 — Coach Mobile Home Polish V1
// On-court action hub for the coach home screen.
// Large touch-friendly buttons → Quick Capture, Assessment Draft, Curriculum Idea, Wrap-Up.
// Manages inline fullscreen panel state (no route change needed for quick actions).

import { useState } from 'react'
import { Zap, ClipboardList, BookOpen, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { CoachQuickCaptureSheet } from './CoachQuickCaptureSheet'
import { CoachAssessmentDraftCapture } from './CoachAssessmentDraftCapture'
import { CoachCurriculumDraftCapture } from './CoachCurriculumDraftCapture'
import { CoachCurriculumFeedbackCard } from './CoachCurriculumFeedbackCard'
import type { QuickCaptureDraft } from './CoachQuickCaptureSheet'

type ActivePanel = 'capture' | 'assessment' | 'curriculum' | null

interface CurriculumFeedback {
  contentType: string
  stageTarget: string
  ideaSummary: string
  submittedAt: string
}

export function CoachOnCourtActionsBar() {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [lastCapture, setLastCapture] = useState<QuickCaptureDraft | null>(null)
  const [curriculumFeedback, setCurriculumFeedback] = useState<CurriculumFeedback | null>(null)

  function handleCaptureSaved(draft: QuickCaptureDraft) {
    setLastCapture(draft)
    setActivePanel(null)
  }

  function handleCurriculumDraftSaved(draft: QuickCaptureDraft) {
    // Extract structured feedback from the draft text
    const match = draft.text.match(/^\[(.+?) → (.+?)\] (.+)$/)
    setCurriculumFeedback({
      contentType: match?.[1] ?? 'Curriculum Idea',
      stageTarget: match?.[2] ?? 'All Stages',
      ideaSummary: match?.[3] ?? draft.text,
      submittedAt: draft.capturedAt,
    })
    setActivePanel(null)
  }

  return (
    <>
      {/* Inline fullscreen panels */}
      {activePanel === 'capture' && (
        <CoachQuickCaptureSheet
          onClose={() => setActivePanel(null)}
          onCaptureSaved={handleCaptureSaved}
        />
      )}
      {activePanel === 'assessment' && (
        <CoachAssessmentDraftCapture
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === 'curriculum' && (
        <CoachCurriculumDraftCapture
          onClose={() => setActivePanel(null)}
          onDraftSaved={handleCurriculumDraftSaved}
        />
      )}

      {/* Curriculum feedback loop card */}
      {curriculumFeedback && activePanel === null && (
        <CoachCurriculumFeedbackCard
          contentType={curriculumFeedback.contentType}
          stageTarget={curriculumFeedback.stageTarget}
          ideaSummary={curriculumFeedback.ideaSummary}
          submittedAt={curriculumFeedback.submittedAt}
          onDismiss={() => setCurriculumFeedback(null)}
        />
      )}

      {/* Last capture confirmation (inline, not a sheet) */}
      {lastCapture && activePanel === null && (
        <div className="px-4 py-3 rounded-xl border border-lime/20 bg-lime/5 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-lime">Last capture</p>
          <p className="text-[12px] text-text-secondary line-clamp-2">{lastCapture.text}</p>
          <button
            onClick={() => setLastCapture(null)}
            className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* On-court action grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Quick Capture */}
        <button
          onClick={() => setActivePanel('capture')}
          className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-lime/10 border border-lime/20 hover:border-lime/40 hover:bg-lime/15 transition-all text-left active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-lime/20 border border-lime/30 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-lime" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-lime leading-tight">Quick Capture</p>
            <p className="text-[10px] text-lime/70 mt-0.5 leading-snug">Player, session, drill or idea</p>
          </div>
          <ChevronRight className="w-3 h-3 text-lime/40 self-end" />
        </button>

        {/* Start Assessment Draft */}
        <button
          onClick={() => setActivePanel('assessment')}
          className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-surface border border-border hover:border-lime/30 hover:bg-surface-raised transition-all text-left active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
            <ClipboardList className="w-4.5 h-4.5 text-text-muted" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-text-primary leading-tight">Assessment</p>
            <p className="text-[10px] text-text-muted mt-0.5 leading-snug">Voice-to-draft, DONNA review</p>
          </div>
          <ChevronRight className="w-3 h-3 text-text-muted/40 self-end" />
        </button>

        {/* Curriculum idea */}
        <button
          onClick={() => setActivePanel('curriculum')}
          className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-surface border border-border hover:border-status-blue/30 hover:bg-surface-raised transition-all text-left active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
            <BookOpen className="w-4.5 h-4.5 text-text-muted" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-text-primary leading-tight">Curriculum Idea</p>
            <p className="text-[10px] text-text-muted mt-0.5 leading-snug">Drill, cue, or concept draft</p>
          </div>
          <ChevronRight className="w-3 h-3 text-text-muted/40 self-end" />
        </button>

        {/* Wrap-Up */}
        <Link
          href="/coach/recap"
          className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-surface border border-border hover:border-status-orange/30 hover:bg-surface-raised transition-all active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border flex items-center justify-center">
            <span className="text-[16px]">✓</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-text-primary leading-tight">Wrap-Up</p>
            <p className="text-[10px] text-text-muted mt-0.5 leading-snug">End-of-session recap flow</p>
          </div>
          <ChevronRight className="w-3 h-3 text-text-muted/40 self-end" />
        </Link>
      </div>
    </>
  )
}
