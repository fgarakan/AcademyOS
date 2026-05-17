'use client'

// Sprint 551 — Voice Transcript Review V1
// Review and edit voice transcript before DONNA structures it.
// No automatic submission — coach must explicitly confirm or discard.

import { useState, useEffect } from 'react'
import { Mic, Edit2, Check, X } from 'lucide-react'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface VoiceTranscriptReviewProps {
  transcript: string
  interimTranscript?: string
  isListening: boolean
  onConfirm: (editedTranscript: string) => void
  onDiscard: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VoiceTranscriptReview({
  transcript,
  interimTranscript = '',
  isListening,
  onConfirm,
  onDiscard,
}: VoiceTranscriptReviewProps) {
  const [editedText, setEditedText] = useState(transcript)
  const [isEditing, setIsEditing] = useState(false)

  // Sync when final transcript arrives
  useEffect(() => {
    if (transcript && !isListening) {
      setEditedText(transcript)
      setIsEditing(false)
    }
  }, [transcript, isListening])

  const hasContent = editedText.trim().length > 0
  const displayText = isListening
    ? (transcript + (interimTranscript ? ' ' + interimTranscript : ''))
    : editedText

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isListening ? 'bg-status-red animate-pulse' : 'bg-text-muted'}`} />
        <p className="text-xs text-text-muted">
          {isListening ? 'Listening…' : 'Review your words'}
        </p>
        {!isListening && hasContent && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="ml-auto flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      {/* ── Transcript display ── */}
      <div className="px-3.5 py-3 min-h-[60px]">
        {isListening ? (
          <div>
            {transcript && (
              <p className="text-sm text-text-primary leading-snug">{transcript}</p>
            )}
            {interimTranscript && (
              <p className="text-sm text-text-muted/70 italic leading-snug">{interimTranscript}</p>
            )}
            {!transcript && !interimTranscript && (
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-status-red animate-pulse" />
                <p className="text-sm text-text-muted italic">Waiting for speech…</p>
              </div>
            )}
          </div>
        ) : isEditing ? (
          <textarea
            value={editedText}
            onChange={e => setEditedText(e.target.value)}
            autoFocus
            rows={3}
            className="w-full resize-none bg-transparent text-sm text-text-primary leading-snug focus:outline-none placeholder:text-text-muted"
            placeholder="Edit your transcript…"
          />
        ) : (
          <p className={`text-sm leading-snug ${hasContent ? 'text-text-primary' : 'text-text-muted italic'}`}>
            {hasContent ? editedText : 'No transcript captured.'}
          </p>
        )}
      </div>

      {/* ── Actions ── */}
      {!isListening && (
        <div className="flex gap-2 px-3.5 py-2.5 border-t border-border">
          <button
            onClick={onDiscard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-text-muted hover:text-status-red hover:border-status-red/40 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Discard
          </button>
          <button
            onClick={() => onConfirm(editedText.trim())}
            disabled={!hasContent}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-lime text-base text-sm font-semibold hover:bg-lime/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" />
            Use this
          </button>
        </div>
      )}
    </div>
  )
}
