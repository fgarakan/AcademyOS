'use client'

import { useState } from 'react'
import { AOSDeck } from '@/components/onboarding/AOSDeck'
import { DECKS } from '@/components/onboarding/decks'

type Role = 'director' | 'coach' | 'player' | 'parent'

const ROLES: { key: Role; label: string; slides: number }[] = [
  { key: 'director', label: 'Director', slides: DECKS.director.slides.length },
  { key: 'coach',    label: 'Coach',    slides: DECKS.coach.slides.length },
  { key: 'player',   label: 'Player',   slides: DECKS.player.slides.length },
  { key: 'parent',   label: 'Parent',   slides: DECKS.parent.slides.length },
]

export default function OnboardingPreviewPage() {
  const [role, setRole] = useState<Role>('director')
  // Incrementing this key remounts AOSDeck, resetting it to slide 0
  const [resetKey, setResetKey] = useState(0)

  const switchRole = (next: Role) => {
    setRole(next)
    setResetKey(k => k + 1)
  }

  const handleDismiss = () => {
    // Preview only — restart the deck instead of marking it seen
    setResetKey(k => k + 1)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{ background: 'var(--bg-app)' }}
    >
      {/* Dev banner */}
      <div className="w-full max-w-2xl mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
        <p className="text-xs font-mono text-yellow-400/80 tracking-wide text-center">
          V3 — Sound + Animation Preview · Dev only · No DB writes
        </p>
        <p className="text-[11px] text-yellow-400/50 text-center mt-1">
          Sound toggle is in the deck top-right. Preference saved to localStorage.
        </p>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 mb-8">
        {ROLES.map(({ key, label, slides }) => (
          <button
            key={key}
            onClick={() => switchRole(key)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
              role === key
                ? 'bg-lime text-black border-lime'
                : 'bg-transparent text-text-secondary border-border hover:border-lime/40 hover:text-text-primary',
            ].join(' ')}
          >
            {label}
            <span
              className={[
                'ml-2 text-[10px] font-mono',
                role === key ? 'text-black/60' : 'text-text-muted',
              ].join(' ')}
            >
              {slides}
            </span>
          </button>
        ))}
      </div>

      {/* Deck */}
      <div className="w-full max-w-2xl">
        <AOSDeck
          key={`${role}-${resetKey}`}
          deck={DECKS[role]}
          onComplete={handleDismiss}
          onSkip={handleDismiss}
        />
      </div>

      {/* Footer note */}
      <p className="mt-8 text-[11px] text-text-muted font-mono tracking-widest uppercase">
        Skip / Get Started resets the deck — no DB writes
      </p>
    </div>
  )
}
