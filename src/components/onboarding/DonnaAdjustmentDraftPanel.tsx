'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, ChevronDown, ChevronUp } from 'lucide-react'
import type { OnboardingDraft } from './OnboardingShell'

interface Suggestion {
  id: string
  category: 'coaching' | 'session' | 'parent' | 'player' | 'identity'
  text: string
  donna: string
  apply: (draft: OnboardingDraft) => Partial<OnboardingDraft>
}

const QUICK_SUGGESTIONS: Suggestion[] = [
  {
    id: 'add-game-based',
    category: 'coaching',
    text: 'Add game-based learning to coaching DNA',
    donna: 'Added "Game-Based Learning" to your coaching styles. Session templates will now lead with constraint games and live-ball blocks.',
    apply: (d) => ({
      coachingStyles: d.coachingStyles.includes('game-based')
        ? d.coachingStyles
        : [...d.coachingStyles.slice(0, 2), 'game-based'],
    }),
  },
  {
    id: 'add-tactical',
    category: 'session',
    text: 'Prioritize tactical development',
    donna: 'Added "Tactical IQ" as a top development priority. DONNA will weight session templates toward point construction and decision-making blocks.',
    apply: (d) => ({
      developmentPriorities: d.developmentPriorities.includes('tactical-iq')
        ? d.developmentPriorities
        : ['tactical-iq', ...d.developmentPriorities.filter(p => p !== 'tactical-iq').slice(0, 4)],
    }),
  },
  {
    id: 'protect-parents',
    category: 'parent',
    text: 'Maximize parent privacy protection',
    donna: 'All five parent visibility rules are now set to protected. Raw notes, rankings, comparisons, director notes, and AI drafts are all hidden from the parent portal.',
    apply: () => ({
      parentVisibilityRules: {
        hideRawCoachNotes: true,
        hideInternalDirectorNotes: true,
        hideRankings: true,
        hideComparisons: true,
        hideUnapprovedAI: true,
      },
    }),
  },
  {
    id: 'add-competition',
    category: 'session',
    text: 'Add point play to every session',
    donna: 'Added "Point Play Progression" to your default session blocks. Sessions will include a progression from cooperative rally to competitive rally to live point play.',
    apply: (d) => ({
      sessionBlocks: d.sessionBlocks.includes('point-play')
        ? d.sessionBlocks
        : [...d.sessionBlocks, 'point-play'],
    }),
  },
  {
    id: 'player-challenge',
    category: 'player',
    text: 'Frame players as challenge seekers',
    donna: 'Set player mission style to "Challenge Seeker". Player portal missions and dashboard copy will use stretch goals and competitive milestone language.',
    apply: () => ({
      playerMissionStyle: 'challenge-seeker',
    }),
  },
  {
    id: 'calm-voice',
    category: 'coaching',
    text: 'Set a calm, precise coaching voice',
    donna: 'Set primary communication to "Calm + Precise". Coach notes, session cues, and player feedback will use low-noise, technical language.',
    apply: () => ({
      primaryCommunication: 'calm-precise',
    }),
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  coaching: 'bg-lime/8 border-lime/20 text-lime',
  session: 'bg-status-blue/8 border-status-blue/20 text-status-blue',
  parent: 'bg-status-orange/8 border-status-orange/20 text-status-orange',
  player: 'bg-status-green/8 border-status-green/20 text-status-green',
  identity: 'bg-surface-raised border-border text-text-muted',
}

const CATEGORY_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  session: 'Session',
  parent: 'Parent',
  player: 'Player',
  identity: 'Identity',
}

interface ChatMessage {
  role: 'user' | 'donna'
  text: string
}

interface Props {
  draft: OnboardingDraft
  updateDraft: (p: Partial<OnboardingDraft>) => void
}

export function DonnaAdjustmentDraftPanel({ draft, updateDraft }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'donna',
      text: 'I\'ve reviewed your Academy DNA draft. Want to fine-tune anything? Use the suggestions below or tell me what you\'d like to adjust.',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [appliedIds, setAppliedIds] = useState<string[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const applySuggestion = (suggestion: Suggestion) => {
    if (appliedIds.includes(suggestion.id)) return
    const changes = suggestion.apply(draft)
    updateDraft(changes)
    setAppliedIds(prev => [...prev, suggestion.id])
    setMessages(prev => [
      ...prev,
      { role: 'user', text: suggestion.text },
      { role: 'donna', text: suggestion.donna },
    ])
  }

  const handleSend = () => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      {
        role: 'donna',
        text: 'I\'ve noted that. For full Academy DNA adjustments, I\'ll apply changes in the next version of this flow. For now, use the quick suggestions or navigate back to any step to edit directly.',
      },
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-raised border-b border-border hover:bg-surface-raised/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-lime" />
          </div>
          <span className="text-sm font-semibold text-text-primary">Adjust with DONNA</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-lime/60 bg-lime/8 border border-lime/15 rounded px-1.5 py-0.5">
            Draft only
          </span>
        </div>
        {isExpanded
          ? <ChevronUp className="w-4 h-4 text-text-muted" />
          : <ChevronDown className="w-4 h-4 text-text-muted" />
        }
      </button>

      {isExpanded && (
        <>
          {/* Chat history */}
          <div className="px-4 py-3 space-y-3 max-h-48 overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={[
                  'flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                ].join(' ')}
              >
                {msg.role === 'donna' && (
                  <div className="w-5 h-5 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-lime" />
                  </div>
                )}
                <div
                  className={[
                    'max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed',
                    msg.role === 'donna'
                      ? 'bg-surface-raised border border-border text-text-secondary'
                      : 'bg-lime/10 border border-lime/20 text-lime',
                  ].join(' ')}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-4 pb-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Quick Adjustments</p>
            <div className="flex flex-col gap-1.5">
              {QUICK_SUGGESTIONS.map(suggestion => {
                const isApplied = appliedIds.includes(suggestion.id)
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => applySuggestion(suggestion)}
                    disabled={isApplied}
                    className={[
                      'flex items-center gap-2 text-left rounded-lg border px-3 py-2 transition-all text-[11px]',
                      isApplied
                        ? 'bg-lime/5 border-lime/15 text-lime/50 cursor-default'
                        : 'bg-surface border-border text-text-secondary hover:bg-surface-raised hover:border-border-strong hover:text-text-primary',
                    ].join(' ')}
                  >
                    <span className={[
                      'shrink-0 text-[8px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border',
                      CATEGORY_COLORS[suggestion.category],
                    ].join(' ')}>
                      {CATEGORY_LABELS[suggestion.category]}
                    </span>
                    <span className="flex-1">{suggestion.text}</span>
                    {isApplied && (
                      <span className="text-[9px] font-semibold text-lime/60 shrink-0">Applied to draft</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Input */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell DONNA what to adjust..."
                className="flex-1 bg-transparent text-[11px] text-text-secondary placeholder:text-text-muted outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={[
                  'p-1 rounded-lg transition-all',
                  inputValue.trim()
                    ? 'text-lime hover:bg-lime/10'
                    : 'text-text-muted/30 cursor-not-allowed',
                ].join(' ')}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-text-muted/40 mt-1.5 text-center">
              Draft adjustments only — nothing applied until Activation Checklist.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
