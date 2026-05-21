'use client'

// Sprint 588 — Coach Voice-to-Curriculum Draft UI V1
// Coach types/speaks a curriculum idea; DONNA returns a structured draft card.
// No official curriculum write. Draft-only.

import { useState } from 'react'
import { X, BookOpen, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react'
import type { QuickCaptureDraft } from './CoachQuickCaptureSheet'

interface Props {
  onClose: () => void
  onDraftSaved?: (draft: QuickCaptureDraft) => void
}

type CurriculumContentType =
  | 'drill'
  | 'coach_cue'
  | 'curriculum_idea'
  | 'mental_performance'
  | 'tactical_concept'
  | 'skill_note'
  | 'video_link'

type CurriculumStageTarget =
  | 'red_foundation'
  | 'orange_development'
  | 'green_performance'
  | 'yellow_competitive'
  | 'high_performance'
  | 'all_stages'

interface CurriculumDraft {
  rawInput: string
  detectedContentType: CurriculumContentType
  detectedStage: CurriculumStageTarget
  playerSafeTitle: string
  coachNote: string
  donnaComment: string
  confidence: 'high' | 'medium' | 'low'
  reviewStatus: 'pending_director_review'
}

const CONTENT_TYPE_KEYWORDS: Record<CurriculumContentType, string[]> = {
  drill: ['drill', 'exercise', 'warm-up', 'activity', 'feed', 'rally', 'game', 'practice'],
  coach_cue: ['cue', 'tell them', 'say to', 'language', 'phrase', 'prompt', 'correction', 'observe'],
  curriculum_idea: ['add to', 'put in', 'include in', 'curriculum', 'level', 'pathway', 'stage'],
  mental_performance: ['mental', 'mindset', 'resilience', 'focus', 'confidence', 'pressure', 'attitude', 'routine'],
  tactical_concept: ['tactical', 'pattern', 'strategy', 'crosscourt', 'net approach', 'play to', 'formation'],
  skill_note: ['skill', 'forehand', 'backhand', 'serve', 'volley', 'footwork', 'technique', 'stroke'],
  video_link: ['video', 'youtube', 'watch', 'link', 'clip', 'show them', 'demonstrate'],
}

const STAGE_KEYWORDS: Record<CurriculumStageTarget, string[]> = {
  red_foundation: ['red', 'red ball', 'foundation', 'beginner', 'starter', 'youngest'],
  orange_development: ['orange', 'orange ball', 'development', 'developing'],
  green_performance: ['green', 'green ball', 'performance', 'intermediate'],
  yellow_competitive: ['yellow', 'yellow ball', 'competitive', 'advanced', 'tournament'],
  high_performance: ['high performance', 'elite', 'national'],
  all_stages: ['all', 'every level', 'everyone', 'any stage'],
}

const CONTENT_TYPE_LABELS: Record<CurriculumContentType, string> = {
  drill: 'Drill / Exercise',
  coach_cue: 'Coach Cue / Language',
  curriculum_idea: 'Curriculum Idea',
  mental_performance: 'Mental Performance Concept',
  tactical_concept: 'Tactical Concept',
  skill_note: 'Skill Note',
  video_link: 'Video Reference',
}

const STAGE_LABELS: Record<CurriculumStageTarget, string> = {
  red_foundation: 'Red Ball — Foundation',
  orange_development: 'Orange Ball — Development',
  green_performance: 'Green Ball — Performance',
  yellow_competitive: 'Yellow Ball — Competitive',
  high_performance: 'High Performance',
  all_stages: 'All Stages',
}

function detectContentType(input: string): { type: CurriculumContentType; confidence: 'high' | 'medium' | 'low' } {
  const lower = input.toLowerCase()
  const scores: Record<CurriculumContentType, number> = {
    drill: 0, coach_cue: 0, curriculum_idea: 0, mental_performance: 0,
    tactical_concept: 0, skill_note: 0, video_link: 0,
  }
  for (const [type, kws] of Object.entries(CONTENT_TYPE_KEYWORDS) as [CurriculumContentType, string[]][]) {
    for (const kw of kws) {
      if (lower.includes(kw)) scores[type] += 1
    }
  }
  const sorted = (Object.entries(scores) as [CurriculumContentType, number][]).sort((a, b) => b[1] - a[1])
  const [top, topScore] = sorted[0]
  const [, second] = sorted[1]
  if (topScore === 0) return { type: 'curriculum_idea', confidence: 'low' }
  if (topScore >= 2 && topScore > second * 1.5) return { type: top, confidence: 'high' }
  return { type: top, confidence: 'medium' }
}

function detectStage(input: string): CurriculumStageTarget {
  const lower = input.toLowerCase()
  for (const [stage, kws] of Object.entries(STAGE_KEYWORDS) as [CurriculumStageTarget, string[]][]) {
    if (kws.some(kw => lower.includes(kw))) return stage
  }
  return 'all_stages'
}

function generateDraft(rawInput: string): CurriculumDraft {
  const { type: contentType, confidence } = detectContentType(rawInput)
  const stage = detectStage(rawInput)

  const playerSafeTitle = rawInput.length > 60
    ? rawInput.slice(0, 57) + '…'
    : rawInput

  const stageLabel = STAGE_LABELS[stage]
  const typeLabel = CONTENT_TYPE_LABELS[contentType]

  let coachNote = ''
  if (contentType === 'coach_cue') {
    coachNote = 'Coach cues are visible to coaches and directors only — not shared with players or parents until the director reviews and promotes them.'
  } else if (contentType === 'mental_performance') {
    coachNote = 'Mental performance concepts require director review before adding to the player-facing curriculum.'
  } else if (contentType === 'video_link') {
    coachNote = 'Video references need director approval before linking to curriculum content.'
  } else {
    coachNote = `This ${typeLabel.toLowerCase()} idea will go to director review before appearing in any official curriculum view.`
  }

  let donnaComment = ''
  if (confidence === 'low') {
    donnaComment = `I classified this as a ${typeLabel} idea for ${stageLabel}, but I'm not certain. Please confirm the type and target stage before submitting.`
  } else {
    donnaComment = `Looks like a ${typeLabel} idea for ${stageLabel}. Review the details and confirm before submitting to the director.`
  }

  return {
    rawInput,
    detectedContentType: contentType,
    detectedStage: stage,
    playerSafeTitle,
    coachNote,
    donnaComment,
    confidence,
    reviewStatus: 'pending_director_review',
  }
}

const EXAMPLE_PROMPTS = [
  'Add this to Green 2 — use the short angle drill to force net approach decisions',
  'Make this a mental performance concept for Orange — mistake response routine',
  'Add as a coach cue for Red ball: "Watch the ball all the way to your strings"',
  'Good video for Yellow competitive — crosscourt rally pattern at 30-30',
]

export function CoachCurriculumDraftCapture({ onClose, onDraftSaved }: Props) {
  const [input, setInput] = useState('')
  const [draft, setDraft] = useState<CurriculumDraft | null>(null)
  const [adjustedType, setAdjustedType] = useState<CurriculumContentType | null>(null)
  const [adjustedStage, setAdjustedStage] = useState<CurriculumStageTarget | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const effectiveDraft = draft
    ? { ...draft, detectedContentType: adjustedType ?? draft.detectedContentType, detectedStage: adjustedStage ?? draft.detectedStage }
    : null

  function handleStructure() {
    if (!input.trim()) return
    const d = generateDraft(input.trim())
    setDraft(d)
    setAdjustedType(null)
    setAdjustedStage(null)
  }

  function handleSubmit() {
    if (!effectiveDraft) return
    onDraftSaved?.({
      captureType: 'curriculum_idea',
      playerRef: '',
      text: `[${CONTENT_TYPE_LABELS[effectiveDraft.detectedContentType]} → ${STAGE_LABELS[effectiveDraft.detectedStage]}] ${effectiveDraft.rawInput}`,
      capturedAt: new Date().toISOString(),
    })
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-status-blue shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-status-blue/70">Coach Input</p>
            <p className="text-sm font-semibold text-text-primary">Curriculum Draft Idea</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {submitted ? (
          <SubmittedView onClose={onClose} onReset={() => { setInput(''); setDraft(null); setSubmitted(false) }} />
        ) : draft && effectiveDraft ? (
          /* Draft review */
          <div className="space-y-4">
            <div className="rounded-xl border border-status-blue/20 bg-status-blue/5 px-4 py-3 space-y-2">
              <p className="text-[10px] text-status-blue/70">DONNA says</p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{effectiveDraft.donnaComment}</p>
            </div>

            <div className="rounded-xl border border-border bg-surface px-4 py-3 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Structured draft</p>

              <div>
                <p className="text-[10px] text-text-muted mb-1">Content type</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(CONTENT_TYPE_LABELS) as CurriculumContentType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setAdjustedType(t)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${
                        (adjustedType ?? effectiveDraft.detectedContentType) === t
                          ? 'border-status-blue/40 bg-status-blue/10 text-status-blue'
                          : 'border-border bg-surface-raised text-text-muted hover:border-status-blue/20'
                      }`}
                    >
                      {CONTENT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-text-muted mb-1">Target stage</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(STAGE_LABELS) as CurriculumStageTarget[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setAdjustedStage(s)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${
                        (adjustedStage ?? effectiveDraft.detectedStage) === s
                          ? 'border-lime/30 bg-lime/10 text-lime'
                          : 'border-border bg-surface-raised text-text-muted hover:border-lime/20'
                      }`}
                    >
                      {STAGE_LABELS[s].split(' — ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-text-muted mb-1">Your input</p>
                <p className="text-[12px] text-text-secondary leading-relaxed">{effectiveDraft.rawInput}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-status-orange/20 bg-status-orange/5">
              <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
              <p className="text-[10px] text-text-muted leading-relaxed">
                {effectiveDraft.coachNote}
                {' '}<span className="text-text-secondary font-medium">Nothing official changed yet.</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setDraft(null)} className="flex-1 btn-ghost">
                Edit input
              </button>
              <button onClick={handleSubmit} className="flex-1 btn-lime">
                Submit for Review
              </button>
            </div>
          </div>
        ) : (
          /* Input form */
          <div className="space-y-4">
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Describe your idea in plain language. DONNA will structure it into a draft for director review.
            </p>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder='e.g. "Add this drill to Green 2 — short angle crosscourt to force net approach…"'
              rows={5}
              autoFocus
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-status-blue/40 transition-colors"
            />

            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Try an example</p>
              {EXAMPLE_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border bg-surface text-[11px] text-text-muted hover:border-status-blue/30 hover:text-text-secondary transition-colors flex items-center gap-2"
                >
                  <ChevronRight className="w-3 h-3 shrink-0 text-status-blue/50" />
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={handleStructure}
              disabled={!input.trim()}
              className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Structure with DONNA
            </button>

            <p className="text-[10px] text-text-muted text-center">
              No AI API call — DONNA uses pattern matching to classify your idea.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function SubmittedView({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-8">
      <div className="w-12 h-12 rounded-full bg-status-green/10 border border-status-green/30 flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-status-green" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">Curriculum draft submitted</p>
        <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto leading-relaxed">
          Saved as a director review draft. Nothing has been added to the official curriculum.
          Your director will classify and approve before it appears anywhere.
        </p>
      </div>
      <div className="flex gap-3 w-full">
        <button onClick={onReset} className="flex-1 btn-ghost">Add another</button>
        <button onClick={onClose} className="flex-1 btn-lime">Done</button>
      </div>
    </div>
  )
}
