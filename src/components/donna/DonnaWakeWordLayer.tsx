'use client'

// Sprint 1791–1800 — DONNA Wake Word V1
// Persistent floating wake-word indicator for the director portal.
// Renders a small bottom-left pill when enabled.
// Listens for "Hey Donna" via useDonnaWakeWord and routes commands through
// the existing donna:open event pipeline.
// No DB calls. No mutations. Never approves, promotes, publishes, or changes records.

import { Mic, MicOff, Square } from 'lucide-react'
import { useDonnaWakeWord, type WakeWordState } from '@/lib/donna/useDonnaWakeWord'

// ── State message labels ──────────────────────────────────────────────────────

function getStateLabel(state: WakeWordState): string {
  switch (state) {
    case 'dormant':      return 'Say Hey Donna'
    case 'listening':    return 'Listening for Hey Donna…'
    case 'wakeDetected': return "Hi, I'm listening."
    case 'active':       return 'Listening…'
    case 'processing':   return 'Working on it…'
    case 'timedOut':     return 'Say Hey Donna to continue.'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaWakeWordLayer() {
  const { wakeState, isSupported, permissionError, startListening, stopListening } =
    useDonnaWakeWord()

  // Hide on unsupported browsers (Firefox, Safari < 14.1)
  if (!isSupported) return null

  const isActive = wakeState !== 'dormant'
  const isListeningOrActive =
    wakeState === 'listening' ||
    wakeState === 'wakeDetected' ||
    wakeState === 'active'

  const stateLabel = getStateLabel(wakeState)

  return (
    <div
      className="fixed bottom-20 left-4 z-40 hidden lg:flex flex-col items-start gap-1.5"
      aria-label="DONNA wake word indicator"
    >
      {/* Permission error */}
      {permissionError && (
        <div
          className="rounded-lg px-3 py-2 text-[11px] max-w-xs leading-snug"
          style={{
            background: 'var(--bg-surface-raised)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          {permissionError}
        </div>
      )}

      {/* Main wake word pill */}
      <div
        className="flex items-center gap-2 rounded-full px-3 py-2 select-none transition-all duration-200"
        style={{
          background: isActive
            ? 'rgba(200,255,0,0.08)'
            : 'rgba(17,17,17,0.92)',
          border: isActive
            ? '1px solid rgba(200,255,0,0.25)'
            : '1px solid rgba(34,34,34,0.9)',
          backdropFilter: 'blur(8px)',
          boxShadow: isActive
            ? '0 0 12px rgba(200,255,0,0.08)'
            : '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Mic icon with animated pulse when listening */}
        <div className="relative shrink-0">
          {isListeningOrActive ? (
            <>
              <Mic className="w-3.5 h-3.5" style={{ color: '#C8FF00' }} />
              {wakeState === 'listening' && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: '#C8FF00' }}
                />
              )}
              {(wakeState === 'wakeDetected' || wakeState === 'active') && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping"
                  style={{ background: '#C8FF00' }}
                />
              )}
            </>
          ) : wakeState === 'processing' ? (
            <Mic className="w-3.5 h-3.5 animate-pulse" style={{ color: '#C8FF00' }} />
          ) : (
            <MicOff className="w-3.5 h-3.5" style={{ color: '#555555' }} />
          )}
        </div>

        {/* State label */}
        <span
          className="text-[11px] font-medium leading-none whitespace-nowrap"
          style={{ color: isActive ? '#C8FF00' : '#555555' }}
        >
          {stateLabel}
        </span>

        {/* Start / Stop button */}
        {isActive ? (
          <button
            type="button"
            onClick={stopListening}
            aria-label="Stop Hey Donna listening"
            className="ml-1 shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
            title="Stop listening"
          >
            <Square className="w-3 h-3" style={{ color: '#555555' }} />
          </button>
        ) : (
          <button
            type="button"
            onClick={startListening}
            aria-label="Start Hey Donna listening"
            className="ml-1 shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
            title="Enable Hey Donna wake word"
          >
            <Mic className="w-3 h-3" style={{ color: '#555555' }} />
          </button>
        )}
      </div>

      {/* Browser hint — shown only in dormant state, once per session */}
      {wakeState === 'dormant' && !permissionError && (
        <p
          className="text-[10px] px-2 leading-snug"
          style={{ color: '#333333' }}
        >
          Chrome / Edge recommended
        </p>
      )}
    </div>
  )
}
