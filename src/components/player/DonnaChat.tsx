'use client'

// Sprint 758 — Player portal DONNA text input with dispatcher wiring.
// Enables typed questions. Wires dispatchUIIntent for blocked-action enforcement
// and player-portal navigation. Chips remain as primary guidance surface.
// No AI calls. No raw coach notes. No parent/player data beyond what is passed as props.

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { MessageCircle, Send } from 'lucide-react'
import { dispatchUIIntent } from '@/lib/donna/donnaUIActionDispatcher'

export interface DonnaChip {
  id: string
  label: string
  response: string
}

interface Props {
  chips: DonnaChip[]
}

// Player portal local navigation patterns — routes within /player/*
const PLAYER_NAV: Array<{ patterns: string[]; route: string; label: string }> = [
  { patterns: ['missions', 'mission'], route: '/player/missions', label: 'Missions' },
  { patterns: ['skill path', 'skill-path', 'skills'], route: '/player/skill-path', label: 'Skill Path' },
  { patterns: ['level up', 'level-up', 'advance', 'next level'], route: '/player/level-up', label: 'Level Up' },
  { patterns: ['competition', 'match', 'tournament'], route: '/player/competition-path', label: 'Competition Path' },
  { patterns: ['fitness path', 'fitness-path', 'fitness'], route: '/player/fitness-path', label: 'Fitness Path' },
  { patterns: ['practice'], route: '/player/practice', label: 'Practice' },
  { patterns: ['wins', 'achievements', 'celebration'], route: '/player/celebration', label: 'Wins & Achievements' },
  { patterns: ['home', 'dashboard', 'start', 'main'], route: '/player', label: 'Home' },
  { patterns: ['ask donna', 'donna'], route: '/player/ask-donna', label: 'Ask DONNA' },
]

function resolvePlayerNavigation(text: string): { route: string; label: string } | null {
  const lower = text.toLowerCase()
  for (const { patterns, route, label } of PLAYER_NAV) {
    if (patterns.some(p => lower.includes(p))) return { route, label }
  }
  return null
}

interface DispatchResponse {
  message: string
  type: 'info' | 'honest'
  navigated?: boolean
}

export function DonnaChat({ chips }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [typedText, setTypedText] = useState('')
  const [dispatchResponse, setDispatchResponse] = useState<DispatchResponse | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const active = chips.find(c => c.id === activeId) ?? null

  function handleSubmit() {
    const text = typedText.trim()
    if (!text) return
    setTypedText('')
    setActiveId(null)

    // 1. Check architecture invariants via dispatcher (blocked patterns)
    const result = dispatchUIIntent(text, 'player', pathname)
    if (result.kind === 'blocked' && result.confidence === 'blocked') {
      setDispatchResponse({ message: result.message, type: 'honest' })
      return
    }

    // 2. Player portal navigation
    const nav = resolvePlayerNavigation(text)
    if (nav) {
      setDispatchResponse({
        message: `Taking you to ${nav.label}…`,
        type: 'info',
        navigated: true,
      })
      router.push(nav.route)
      return
    }

    // 3. Dispatcher navigation (handles broader patterns)
    if (result.kind === 'navigate' && result.route && result.confidence === 'high') {
      setDispatchResponse({ message: `Navigating…`, type: 'info', navigated: true })
      router.push(result.route)
      return
    }

    // 4. Clarification / fallback
    setDispatchResponse({
      message: 'I can help you navigate your portal. Try asking about your missions, skill path, level up requirements, or competition path.',
      type: 'info',
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="space-y-3">
      {/* Suggested chips */}
      <div>
        <p className="text-xs text-text-muted mb-2.5">Tap a question to get DONNA&apos;s answer</p>
        <div className="flex flex-wrap gap-2">
          {chips.map(chip => (
            <button
              key={chip.id}
              onClick={() => { setActiveId(chip.id === activeId ? null : chip.id); setDispatchResponse(null) }}
              className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                chip.id === activeId
                  ? 'bg-status-blue/15 border-status-blue/40 text-status-blue font-medium'
                  : 'bg-surface-raised border-border text-text-secondary hover:border-status-blue/30'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chip response */}
      {active && !dispatchResponse && (
        <div className="rounded-xl bg-status-blue/5 border border-status-blue/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-status-blue/15 border border-status-blue/20 flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="w-3.5 h-3.5 text-status-blue" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-status-blue mb-1.5 uppercase tracking-widest">DONNA</p>
              <p className="text-sm text-text-primary leading-relaxed">{active.response}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dispatcher response */}
      {dispatchResponse && (
        <div className={`rounded-xl p-4 border ${
          dispatchResponse.type === 'honest'
            ? 'bg-status-orange/5 border-status-orange/20'
            : 'bg-status-blue/5 border-status-blue/20'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              dispatchResponse.type === 'honest'
                ? 'bg-status-orange/15 border border-status-orange/20'
                : 'bg-status-blue/15 border border-status-blue/20'
            }`}>
              <MessageCircle className={`w-3.5 h-3.5 ${dispatchResponse.type === 'honest' ? 'text-status-orange' : 'text-status-blue'}`} />
            </div>
            <div className="flex-1">
              <p className={`text-[10px] font-semibold mb-1.5 uppercase tracking-widest ${dispatchResponse.type === 'honest' ? 'text-status-orange' : 'text-status-blue'}`}>DONNA</p>
              <p className="text-sm text-text-primary leading-relaxed">{dispatchResponse.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Text input — Sprint 758: enabled with dispatcher */}
      <div className="rounded-xl border border-border bg-surface-raised px-4 py-3">
        <p className="text-xs text-text-muted mb-2">Ask DONNA a question</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={typedText}
            onChange={e => setTypedText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Go to missions, how do I level up…"
            className="flex-1 text-xs bg-surface border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-status-blue/40"
          />
          <button
            onClick={handleSubmit}
            disabled={!typedText.trim()}
            className="px-3 py-2.5 rounded-lg bg-status-blue/10 border border-status-blue/30 text-status-blue disabled:opacity-40 disabled:cursor-not-allowed hover:bg-status-blue/20 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-2">
          DONNA guides navigation. Official changes require coach or director approval.
        </p>
      </div>
    </div>
  )
}
