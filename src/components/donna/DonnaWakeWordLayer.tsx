'use client'

// Sprint 1791–1800 — DONNA Persistent Conversation Mode V1
// Sprint 1861–1880 — Auto-start: "Hey Donna" works without pressing the DONNA button.
//
// Floating wake-word / conversation session indicator for the director portal.
// Renders a bottom-left pill showing session state.
//
// Auto-start behavior (Sprint 1861–1880):
//   - On mount, reads localStorage key 'donna_wake_autostart'.
//   - If 'true', calls startListening() automatically — no button press required.
//   - If mic permission was previously granted by the browser, this works silently.
//   - If mic permission has not been granted yet, the browser may prompt once.
//   - If mic is denied, the permission error card appears with a clear explanation.
//   - First-time users (no localStorage key): shown "Enable Hey Donna" card — one tap enables.
//   - Preference persists: enabling/disabling is remembered across page loads.
//
// No DB calls. No mutations. Never approves, promotes, publishes, or changes records.

import { useEffect, useCallback } from 'react'
import { Mic, MicOff, Square, Pause, Play, Sparkles } from 'lucide-react'
import { useDonnaWakeWord, type WakeWordState } from '@/lib/donna/useDonnaWakeWord'

// ── localStorage key ──────────────────────────────────────────────────────────

const WAKE_AUTOSTART_KEY = 'donna_wake_autostart'

function readAutoStartPreference(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(WAKE_AUTOSTART_KEY) === 'true'
}

function saveAutoStartPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WAKE_AUTOSTART_KEY, enabled ? 'true' : 'false')
}

// ── State message labels ──────────────────────────────────────────────────────

function getStateLabel(state: WakeWordState): string {
  switch (state) {
    case 'dormant':      return 'Hey Donna'
    case 'listening':    return 'Listening…'
    case 'wakeDetected': return "I'm here."
    case 'active':       return 'DONNA is listening.'
    case 'processing':   return 'Working on it…'
    case 'timedOut':     return 'Say "Hey Donna" to continue.'
    case 'paused':       return 'DONNA paused.'
    case 'stopped':      return 'Stopped.'
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

// ── Enable Hey Donna card — first-time users ──────────────────────────────────

interface EnableHeyDonnaCardProps {
  onEnable: () => void
}

function EnableHeyDonnaCard({ onEnable }: EnableHeyDonnaCardProps) {
  return (
    <div
      className="fixed bottom-20 left-4 z-40 hidden lg:flex flex-col items-start gap-1.5"
      aria-label="Enable Hey Donna"
    >
      <button
        type="button"
        onClick={onEnable}
        className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 select-none transition-all duration-200 hover:border-lime/40 group"
        style={{
          background: 'rgba(17,17,17,0.95)',
          border: '1px solid rgba(34,34,34,0.9)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
        aria-label="Enable Hey Donna wake word"
        title="Enable Hey Donna"
      >
        <Sparkles
          className="w-3.5 h-3.5 shrink-0 transition-colors group-hover:text-lime"
          style={{ color: '#555555' }}
        />
        <div className="flex flex-col items-start gap-0.5">
          <span
            className="text-[11px] font-semibold leading-none transition-colors group-hover:text-white"
            style={{ color: '#AAAAAA' }}
          >
            Enable Hey Donna
          </span>
          <span className="text-[10px] leading-none" style={{ color: '#444444' }}>
            Say "Hey Donna" from anywhere
          </span>
        </div>
      </button>
      <p className="text-[10px] px-1 leading-snug" style={{ color: '#333333' }}>
        Requires mic permission · Chrome / Edge
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

  // ── Auto-start: read localStorage on mount ────────────────────────────────
  // If the director previously enabled Hey Donna, restart it automatically.
  // No button press required — "Hey Donna" works from the moment the page loads.

  useEffect(() => {
    if (!isSupported) return
    if (readAutoStartPreference()) {
      startListening()
    }
  // startListening is stable (useCallback with no deps) — safe to include
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported])

  // ── Enable: persist preference + start ───────────────────────────────────

  const handleEnable = useCallback(() => {
    saveAutoStartPreference(true)
    startListening()
  }, [startListening])

  // ── Disable: persist preference + stop ───────────────────────────────────

  const handleStop = useCallback(() => {
    saveAutoStartPreference(false)
    stopListening()
  }, [stopListening])

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

  // ── First-time enable card ────────────────────────────────────────────────
  // Show the "Enable Hey Donna" card when dormant AND no permission error AND
  // the user has not previously enabled (i.e. auto-start preference is not set).
  // Once enabled or after an error, switch to the standard pill.

  const showEnableCard =
    isDormant && !permissionError && !readAutoStartPreference()

  if (showEnableCard) {
    return <EnableHeyDonnaCard onEnable={handleEnable} />
  }

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
      {/* Permission error — shown with re-enable option */}
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
          // Dormant / Stopped — show re-enable button (preference was previously set)
          <button
            type="button"
            onClick={handleEnable}
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
              onClick={handleStop}
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
              onClick={handleStop}
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
            onClick={handleStop}
            aria-label="Stop Hey Donna listening"
            className="ml-1 shrink-0 rounded-full p-1 transition-colors hover:bg-white/10"
            title="Stop listening"
          >
            <Square className="w-3 h-3" style={{ color: '#555555' }} />
          </button>
        )}
      </div>

      {/* Mic active indicator — shown when not in a session */}
      {(wakeState === 'listening' || wakeState === 'timedOut') && !isSessionActive && (
        <p
          className="text-[10px] px-2 leading-snug"
          style={{ color: '#333333' }}
        >
          Mic is active · Say "Hey Donna"
        </p>
      )}
    </div>
  )
}
