'use client'

import { useState } from 'react'
import { Sparkles, Send, X, AlertCircle } from 'lucide-react'
import type { CurriculumLevel } from '@/lib/backend/curriculumExplorer'

interface Message {
  role: 'director' | 'donna'
  text: string
}

interface Props {
  level: CurriculumLevel
  onClose: () => void
}

const DONNA_RESPONSES: Record<number, string> = {
  0: "I've read your request. To help draft the best content, let me ask: is this change targeting players who are new to the level, or those who have been there a while?",
  1: "Got it. One more question — is the primary goal technical development, tactical awareness, or physical conditioning?",
  2: "Thank you. Based on what you've described, I'll draft a structured change proposal. It will go to your Review Queue — nothing changes until you approve it there. Ready to create the draft?",
}

export function DonnaConversationDraftPanel({ level, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'donna', text: `Hi. What curriculum change are you considering for ${level.display_name}?` },
  ])
  const [input, setInput] = useState('')
  const [turn, setTurn] = useState(0)
  const [finalised, setFinalised] = useState(false)

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed) return

    const updated: Message[] = [
      ...messages,
      { role: 'director', text: trimmed },
    ]

    if (turn < 2) {
      updated.push({ role: 'donna', text: DONNA_RESPONSES[turn] })
      setTurn(t => t + 1)
    } else if (turn === 2) {
      updated.push({ role: 'donna', text: DONNA_RESPONSES[2] })
      setTurn(3)
    }

    setMessages(updated)
    setInput('')
  }

  function handleCreateDraft() {
    setFinalised(true)
  }

  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/[0.02] overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-lime/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime shrink-0" />
          <p className="text-[12px] font-semibold text-text-primary">DONNA — Curriculum conversation</p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-lime transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {finalised ? (
        <div className="p-5 space-y-3">
          <p className="text-[12px] font-semibold text-status-green">Draft queued — check Review Queue</p>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            DONNA has created a structured draft from your conversation. Nothing is applied until you review and approve it.
          </p>
          <button onClick={onClose} className="text-[11px] text-lime hover:text-lime/80 transition-colors">Close</button>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          <div className="px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'director' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                  msg.role === 'director'
                    ? 'bg-lime/15 text-text-primary border border-lime/20'
                    : 'bg-surface border border-border text-text-secondary'
                }`}>
                  {msg.role === 'donna' && <span className="text-[10px] text-lime font-semibold block mb-0.5">DONNA</span>}
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {turn === 3 ? (
            <div className="border-t border-lime/10 px-4 py-3 space-y-2">
              <div className="flex items-start gap-2 rounded-xl border border-status-orange/20 bg-status-orange/[0.04] px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
                <p className="text-[10px] text-text-muted">This is a UI prototype. In V2, this conversation will create a real draft in your Review Queue.</p>
              </div>
              <button onClick={handleCreateDraft} className="btn-lime w-full text-[12px] py-2">
                Create draft from conversation
              </button>
            </div>
          ) : (
            <div className="border-t border-lime/10 px-4 py-3 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your response..."
                className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/40"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="btn-lime px-3 py-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
