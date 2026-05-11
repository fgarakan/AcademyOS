'use client'

import { useState } from 'react'
import { AOSDeck } from './AOSDeck'
import { DECKS } from './decks'
import { markFirstRunDeckSeenAction } from '@/lib/actions/markFirstRunDeckSeenAction'

type Role = 'director' | 'coach' | 'player' | 'parent'

type Props = {
  hasSeenDeck: boolean
  role: Role
  children: React.ReactNode
}

export function FirstRunDeckGate({ hasSeenDeck, role, children }: Props) {
  const [showDeck, setShowDeck] = useState(!hasSeenDeck)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const deck = DECKS[role]

  const dismiss = async () => {
    if (busy) return
    setBusy(true)
    setFailed(false)
    const result = await markFirstRunDeckSeenAction()
    setBusy(false)
    if (!result.ok) {
      // Don't trap the user — dismiss the deck locally even if the DB write
      // failed. They'll see it again on next hard navigation (acceptable).
      setFailed(true)
    }
    setShowDeck(false)
  }

  if (!deck || !showDeck) return <>{children}</>

  return (
    <>
      {/* Full-screen overlay — fixed so it covers sidebar/nav in all layouts */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-label={deck.name}
      >
        <div className="w-full max-w-2xl">
          {failed && (
            <p className="text-center text-xs text-yellow-400/80 mb-3">
              Could not save progress — you can continue anyway.
            </p>
          )}
          <AOSDeck deck={deck} onComplete={dismiss} onSkip={dismiss} />
        </div>
      </div>
      {/* Dashboard renders beneath; overlay covers it until dismissed */}
      {children}
    </>
  )
}
