'use client'

import { useState } from 'react'
import { MessageSquare, CheckCircle2, Lock, Shield, Loader2 } from 'lucide-react'
import { submitCoachCurriculumSuggestion } from '@/lib/actions/coachCurriculumSuggestion'

interface Props {
  levelId: string
  levelName: string
  coachName?: string
}

export function CoachCurriculumSuggestionPanel({ levelId, levelName, coachName }: Props) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit() {
    if (text.trim().length < 10) return
    setStatus('saving')
    setErrorMsg(null)
    const result = await submitCoachCurriculumSuggestion({
      levelId,
      levelName,
      suggestionText: text.trim(),
    })
    if (result.ok) {
      setStatus('done')
    } else {
      setStatus('error')
      setErrorMsg(result.error)
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-status-green/20 bg-status-green/[0.04] p-5 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-[12px] font-semibold text-status-green">Suggestion sent to director</p>
        </div>
        <p className="text-[11px] text-text-muted leading-relaxed">
          Your suggestion for <span className="text-text-secondary font-semibold">{levelName}</span> is in the Review Queue.
          The director will see it and can draft a curriculum change from it. No curriculum content has been changed.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 text-status-blue shrink-0" />
        <p className="text-[12px] font-semibold text-text-primary">Suggest a curriculum change</p>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-text-muted">
          <Lock className="w-3 h-3" />
          Coach view
        </span>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Context */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Level</p>
          <p className="text-[12px] text-text-primary">{levelName}</p>
        </div>

        {/* Suggestion text */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1.5">Your suggestion</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Describe what you think should change and why. For example: 'The backhand cross-court drill is too complex for players at this stage — I'd suggest splitting it into two progressions.'"
            className="w-full h-28 bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40"
          />
          <p className="text-[10px] text-text-muted mt-1">{text.trim().length} / 10 min characters</p>
        </div>

        {/* Safety note */}
        <div className="flex items-start gap-2 rounded-xl border border-lime/10 bg-lime/[0.02] px-3 py-2">
          <Shield className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-muted leading-relaxed">
            Your suggestion goes to the director — no curriculum content is changed. The director decides whether to draft a change.
          </p>
        </div>

        {status === 'error' && errorMsg && (
          <p className="text-[11px] text-status-red">{errorMsg}</p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3">
        <p className="text-[10px] text-text-muted">{coachName ? `Submitting as ${coachName}` : 'Submitting as coach'}</p>
        <button
          onClick={handleSubmit}
          disabled={text.trim().length < 10 || status === 'saving'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: '#C8FF00', color: '#0A0A0A' }}
        >
          {status === 'saving' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5" />
          )}
          {status === 'saving' ? 'Sending…' : 'Send to director'}
        </button>
      </div>
    </div>
  )
}
