'use client'

// Sprint 1791–1800 — DONNA Persistent Conversation Mode V1
// Floating wake-word / conversation session indicator for the director portal.
// Renders a bottom-left pill showing session state.
// After "Hey Donna" starts a session, all commands route without re-waking.
// No DB calls. No mutations. Never approves, promotes, publishes, or changes records.

import { Mic, MicOff, Square, Pause, Play } from 'lucide-react'
import { useDonnaWakeWord, type WakeWordState } from '@/lib/donna/useDonnaWakeWord'

// ── State message labels ──────────────────────────────────────────────────────

function getStateLabel(state: WakeWordState): string {
  switch (state) {
    case 'dormant':      return 'Say "Hey Donna" to start.'
    case 'listening':    return 'Listening for Hey Donna…'
    case 'wakeDetected': return "I'm here. What do you need?"
    case 'active':       return 'DONNA is listening.'
    case 'processing':   return 'Working on it…'
    case 'timedOut':     return 'Say "Hey Donna" to continue.'
    case 'paused':       return 'DONNA paused.'
    case 'stopped':      return 'Say "Hey Donna" to start again.'
  }
}

// ── Fallback button for unsupported browsers ──────────────────────────────────

function DonnaFallbackButton() {
  function handleClick() {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('donna:open', { detail: {} }))
  }

  return (
    <div
      className="fixed bottom-20 left-4 z-40 hidden lg:flex flex-col items-start gap-1.5"
      aria-label="DONNA assistant"
    >
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 rounded-full px-3 py-2 select-none transition-all duration-200 hover:bg-white/5"
        style={{
          background: 'rgba(17,17,17,0.92)',
          border: '1px solid rgba(34,34,34,0.9)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
        aria-label="Open DONNA"
        title="Open DONNA"
      >
        <Mic className="w-3.5 h-3.5" style={{ color: '#555555' }} />
        <span className="text-[11px] font-medium leading-none" style={{ color: '#555555' }}>
          Start Donna
        </span>
      </button>
      <p className="text-[10px] px-2 leading-snug" style={{ color: '#333333' }}>
        Use Chrome or Edge for voice support
      </p>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DonnaWakeWordLayer() {
  const {
    wakeState,
    isSupported,
    permissionError,
    startListening,
    stopListening,
    pauseSession,
    resumeSession,
  } = useDonnaWakeWord()

  // Unsupported browser — show manual fallback instead of hiding
  if (!isSupported) return <DonnaFallbackButton />

  const isDormant = wakeState === 'dormant'
  const isSessionActive =
    wakeState === 'active' ||
    wakeState === 'wakeDetected' ||
    wakeState === 'processing' ||
    wakeState === 'paused'
  const isMicLive =
    wakeState === 'listening' ||
    wakeState === 'wakeDetected' ||
    wakeState === 'active'
  const isProcessing = wakeState === 'processing'
  const isPaused = wakeState === 'paused'
  const isStopped = wakeState === 'stopped'

  const stateLabel = getStateLabel(wakeState)

  // Pill appearance — lime glow during active session, subtle otherwise
  const pillStyle: React.CSSProperties = isSessionActive
    ? {
        background: 'rgba(200,255,0,0.10)',
        border: '1px solid rgba(200,255,0,0.35)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 0 16px rgba(200,255,0,0.12)',
      }
    : {
        background: 'rgba(17,17,17,0.92)',
        border: isStopped
          ? '1px solid rgba(85,85,85,0.5)'
          : '1px solid rgba(34,34,34,0.9)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }

  const labelColor = isSessionActive ? '#C8FF00' : isStopped ? '#AAAAAA' : '#555555'

  return (
    <div
      className="fixed bottom-20 left-4 z-40 hidden lg:flex flex-col items-start gap-1.5"
      aria-label="DONNA conversation session indicator"
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

      {/* Session active badge — only shown when DONNA is in a persistent session */}
      {isSessionActive && (
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{
            background: 'rgba(200,255,0,0.12)',
            border: '1px solid rgba(200,255,0,0.25)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#C8FF00' }}
          />
          <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#C8FF00' }}>
            SESSION ACTIVE
          </span>
        </div>
      )}

      {/* Main pill */}
      <div
        className="flex items-center gap-2 rounded-full px-3 py-2 select-none transition-all duration-200"
        style={pillStyle}
      >
        {/* Mic icon */}
        <div className="relative shrink-0">
          {isPaused ? (
            <Mic className="w-3.5 h-3.5" style={{ color: '#555555' }} />
          ) : isMicLive ? (
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
          ) : isProcessing ? (
            <Mic className="w-3.5 h-3.5 animate-pulse" style={{ color: '#C8FF00' }} />
          ) : (
            <MicOff className="w-3.5 h-3.5" style={{ color: '#555555' }} />
          )}
        </div>

        {/* State label */}
        <span
          className="text-[11px] font-medium leading-none whitespace-nowrap"
          style={{ color: labelColor }}
        >
          {stateLabel}
        </span>

        {/* Controls */}
        {isDormant || isStopped ? (
          // Dormant / Stopped — show start button
          <button
            type="button"
            onClick={startListening}
            aria-label="Enable Hey Donna wake word"
            className="ml-1 shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
            title="Enable Hey Donna"
          >
            <Mic className="w-3 h-3" style={{ color: '#555555' }} />
          </button>
        ) : isPaused ? (
          // Paused — show resume + stop
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={resumeSession}
              aria-label="Resume DONNA session"
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
              title="Resume DONNA"
            >
              <Play className="w-3 h-3" style={{ color: '#C8FF00' }} />
            </button>
            <button
              type="button"
              onClick={stopListening}
              aria-label="Stop DONNA session"
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
              title="Stop DONNA"
            >
              <Square className="w-3 h-3" style={{ color: '#555555' }} />
            </button>
          </div>
        ) : isSessionActive ? (
          // Active session — show pause + stop
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={pauseSession}
              aria-label="Pause DONNA session"
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
              title="Pause DONNA"
            >
              <Pause className="w-3 h-3" style={{ color: '#AAAAAA' }} />
            </button>
            <button
              type="button"
              onClick={stopListening}
              aria-label="Stop DONNA session"
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
              title="Stop DONNA"
            >
              <Square className="w-3 h-3" style={{ color: '#555555' }} />
            </button>
          </div>
        ) : (
          // Pre-session listening or processing — stop button only
          <button
            type="button"
            onClick={stopListening}
            aria-label="Stop Hey Donna listening"
            className="ml-1 shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
            title="Stop listening"
          >
            <Square className="w-3 h-3" style={{ color: '#555555' }} />
          </button>
        )}
      </div>

      {/* Browser hint — dormant only */}
      {isDormant && !permissionError && (
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
