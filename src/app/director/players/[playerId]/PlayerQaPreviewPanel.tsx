'use client'

// Sprint 218 — Player Q&A Preview (director-facing only)
// Read-only. No writes. No AI calls. No parent/player exposure.
// Uses curriculum level, gates, drills, and coach language — no internal notes.

import { useState } from 'react'
import { MessageCircle, ChevronRight, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import {
  parsePlayerProgressQuestion,
  buildPlayerProgressAnswer,
  type PlayerProgressQaInput,
  type PlayerProgressQaAnswer,
} from '@/lib/player/playerProgressQa'
import { getSafeResponseBoundary } from '@/lib/commands/roleGuardrails'

const SAMPLE_QUESTIONS = [
  'What level am I?',
  'What do I need to do next?',
  'How do I move up?',
  'What should I practice?',
]

type Props = PlayerProgressQaInput

export function PlayerQaPreviewPanel(props: Props) {
  const [answer, setAnswer] = useState<PlayerProgressQaAnswer | null>(null)
  const [activeQuestion, setActiveQuestion] = useState<string>('')
  const [customInput, setCustomInput] = useState('')

  function handleQuestion(question: string) {
    setActiveQuestion(question)
    const intent = parsePlayerProgressQuestion(question)
    const result = buildPlayerProgressAnswer(intent, props)
    setAnswer(result)
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = customInput.trim()
    if (trimmed) {
      handleQuestion(trimmed)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-text-muted" />
            <p className="label-xs">Player Q&amp;A Preview</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-lime/30 bg-lime/5 text-[9px] font-semibold text-lime shrink-0">
            <Shield className="w-2.5 h-2.5" />
            Director preview — read-only
          </span>
        </div>
        <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
          Uses curriculum level, gates, drills, and coach language only. Internal notes are not shown.
        </p>
        <p className="text-[9px] text-text-muted mt-0.5 italic">
          Player boundary: {getSafeResponseBoundary('player')}
        </p>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">

        {/* Sample question buttons */}
        <div>
          <p className="text-[10px] text-text-muted mb-2">Sample player questions</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleQuestion(q)}
                className={`px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${
                  activeQuestion === q
                    ? 'border-lime/50 bg-lime/10 text-lime'
                    : 'border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-lime'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Custom input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Ask a custom question..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-lime/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface-raised text-text-secondary hover:border-lime/30 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        {/* Answer card */}
        {answer && (
          <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-text-primary leading-snug">{answer.title}</p>
              {answer.question_intent !== 'unknown' && (
                <span className="text-[9px] font-mono text-text-muted shrink-0 mt-0.5 bg-surface px-1.5 py-0.5 rounded border border-border">
                  {answer.question_intent.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <p className="text-[12px] text-text-secondary leading-relaxed">{answer.answer}</p>

            {answer.bullets.length > 0 && (
              <ul className="space-y-1.5">
                {answer.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-[11px] text-text-secondary">
                    <span className="text-lime shrink-0 mt-0.5">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {answer.next_mission && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-text-muted mb-0.5">Mission</p>
                <p className="text-[11px] text-lime font-medium">{answer.next_mission}</p>
              </div>
            )}

            {answer.try_this && (
              <div>
                <p className="text-[10px] text-text-muted mb-0.5">Try this</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">{answer.try_this}</p>
              </div>
            )}

            {answer.mini_challenge && (
              <div>
                <p className="text-[10px] text-text-muted mb-0.5">This week&apos;s challenge</p>
                <p className="text-[11px] text-text-secondary leading-relaxed">{answer.mini_challenge}</p>
              </div>
            )}

            {answer.reflection_question && (
              <div>
                <p className="text-[10px] text-text-muted mb-0.5">Reflection</p>
                <p className="text-[11px] text-text-secondary italic leading-relaxed">{answer.reflection_question}</p>
              </div>
            )}

            {answer.source_labels.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {answer.source_labels.map((s) => (
                  <span
                    key={s}
                    className="px-1.5 py-0.5 rounded border border-border bg-surface text-[9px] text-text-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  )
}
