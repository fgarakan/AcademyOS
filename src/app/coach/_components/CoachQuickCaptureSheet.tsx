'use client'

// Sprint 587 — Coach Quick Capture V2
// 7 capture types: player note, session note, curriculum idea, drill idea,
// assessment note, parent follow-up idea, readiness flag.
// All output is local draft state only — no DB write from this component.

import { useState } from 'react'
import { X, CheckCircle, ChevronRight, Zap } from 'lucide-react'

export type QuickCaptureType =
  | 'player_note'
  | 'session_note'
  | 'curriculum_idea'
  | 'drill_idea'
  | 'assessment_note'
  | 'parent_followup'
  | 'readiness_flag'

export interface QuickCaptureDraft {
  captureType: QuickCaptureType
  playerRef: string
  text: string
  capturedAt: string
}

interface Props {
  onClose: () => void
  onCaptureSaved?: (draft: QuickCaptureDraft) => void
}

const CAPTURE_OPTIONS: Array<{
  type: QuickCaptureType
  label: string
  emoji: string
  placeholder: string
  needsPlayer: boolean
  colour: string
}> = [
  {
    type: 'player_note',
    label: 'Player note',
    emoji: '👤',
    placeholder: 'What did you observe about this player today?',
    needsPlayer: true,
    colour: 'border-lime/30 bg-lime/5 text-lime',
  },
  {
    type: 'session_note',
    label: 'Session note',
    emoji: '📋',
    placeholder: 'What happened in this session? What changed from the plan?',
    needsPlayer: false,
    colour: 'border-status-blue/30 bg-status-blue/5 text-status-blue',
  },
  {
    type: 'curriculum_idea',
    label: 'Curriculum idea',
    emoji: '📚',
    placeholder: 'What curriculum content idea do you want to flag for the director?',
    needsPlayer: false,
    colour: 'border-status-green/30 bg-status-green/5 text-status-green',
  },
  {
    type: 'drill_idea',
    label: 'Drill idea',
    emoji: '🎾',
    placeholder: 'Describe the drill — what skill it targets, how it runs, progressions.',
    needsPlayer: false,
    colour: 'border-status-green/30 bg-status-green/5 text-status-green',
  },
  {
    type: 'assessment_note',
    label: 'Assessment note',
    emoji: '📊',
    placeholder: 'What did you observe about this player\'s skill level or development?',
    needsPlayer: true,
    colour: 'border-lime/30 bg-lime/5 text-lime',
  },
  {
    type: 'parent_followup',
    label: 'Parent follow-up idea',
    emoji: '👨‍👩‍👧',
    placeholder: 'What should be communicated to this player\'s parent? Director will review first.',
    needsPlayer: true,
    colour: 'border-status-orange/30 bg-status-orange/5 text-status-orange',
  },
  {
    type: 'readiness_flag',
    label: 'Readiness flag',
    emoji: '⚑',
    placeholder: 'Flag any concern about player readiness — low energy, pain mention, attitude shift. Director will review.',
    needsPlayer: true,
    colour: 'border-status-red/30 bg-status-red/5 text-status-red',
  },
]

export function CoachQuickCaptureSheet({ onClose, onCaptureSaved }: Props) {
  const [selectedType, setSelectedType] = useState<QuickCaptureType | null>(null)
  const [playerRef, setPlayerRef] = useState('')
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [savedDraft, setSavedDraft] = useState<QuickCaptureDraft | null>(null)

  const option = CAPTURE_OPTIONS.find(o => o.type === selectedType) ?? null
  const isValid = text.trim().length > 0 && (!option?.needsPlayer || playerRef.trim().length > 0)

  function handleSave() {
    if (!selectedType || !isValid) return
    const draft: QuickCaptureDraft = {
      captureType: selectedType,
      playerRef: playerRef.trim(),
      text: text.trim(),
      capturedAt: new Date().toISOString(),
    }
    setSavedDraft(draft)
    setSaved(true)
    onCaptureSaved?.(draft)
  }

  function handleReset() {
    setSelectedType(null)
    setPlayerRef('')
    setText('')
    setSaved(false)
    setSavedDraft(null)
  }

  return (
    <div className="fixed inset-0 z-50 bg-base flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-lime shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-lime/70">Quick Capture</p>
            <p className="text-sm font-semibold text-text-primary">
              {option ? option.label : 'What are you capturing?'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

        {saved && savedDraft ? (
          <SavedView draft={savedDraft} onReset={handleReset} onClose={onClose} />
        ) : !selectedType ? (
          /* Type selector */
          <div className="space-y-2">
            <p className="text-[11px] text-text-muted">Select what you want to capture:</p>
            {CAPTURE_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => setSelectedType(opt.type)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${opt.colour} hover:opacity-90`}
              >
                <span className="text-xl shrink-0">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">{opt.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        ) : (
          /* Capture form */
          <div className="space-y-4">
            <button
              onClick={() => setSelectedType(null)}
              className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              ← Change type
            </button>

            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${option?.colour ?? ''}`}>
              <span>{option?.emoji}</span>
              <span className="text-[11px] font-semibold">{option?.label}</span>
            </div>

            {option?.needsPlayer && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Player name *</p>
                <input
                  type="text"
                  value={playerRef}
                  onChange={e => setPlayerRef(e.target.value)}
                  placeholder="First name or full name…"
                  autoFocus
                  className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Note *</p>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={option?.placeholder ?? ''}
                rows={5}
                autoFocus={!option?.needsPlayer}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 transition-colors"
              />
            </div>

            <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
              <p className="text-[10px] text-text-muted leading-relaxed">
                <span className="text-text-secondary font-medium">Draft only.</span>{' '}
                This capture stays local until you wrap up your session. Nothing is sent to players or parents automatically.
                {selectedType === 'readiness_flag' && (
                  <span className="block mt-1 text-status-red/80">
                    Readiness flags go to director review. Use descriptive, observable language only.
                  </span>
                )}
                {selectedType === 'parent_followup' && (
                  <span className="block mt-1 text-status-orange/80">
                    Parent follow-up ideas are reviewed by the director before any communication.
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={!isValid}
              className="btn-lime w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Draft
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SavedView({
  draft,
  onReset,
  onClose,
}: {
  draft: QuickCaptureDraft
  onReset: () => void
  onClose: () => void
}) {
  const opt = CAPTURE_OPTIONS.find(o => o.type === draft.captureType)

  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-lime" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Draft captured</p>
          <p className="text-xs text-text-muted mt-0.5">
            Saved locally. Submit during session wrap-up for director review.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <span>{opt?.emoji}</span>
          <span className="text-[11px] font-semibold text-lime">{opt?.label}</span>
        </div>
        {draft.playerRef && (
          <p className="text-[11px] text-text-muted">
            Player: <span className="text-text-secondary">{draft.playerRef}</span>
          </p>
        )}
        <p className="text-sm text-text-primary leading-relaxed">{draft.text}</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onReset} className="flex-1 btn-ghost">
          Capture another
        </button>
        <button onClick={onClose} className="flex-1 btn-lime">
          Done
        </button>
      </div>
    </div>
  )
}
