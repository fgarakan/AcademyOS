'use client'

// Sprint 912.3 — DONNA Conversation State Foundation V1
// State management hook for DONNA God Mode director conversation.
// Pure state — no DOM, no voice, no TTS side effects.
// All audio/voice side effects remain in DonnaVoiceReadyShell.
//
// Design: the hook tracks "intent" state (conversation mode on/off,
// pending confirmation, pause) while the shell computes the full
// display state from this + existing voice/TTS booleans.

import { useState, useCallback } from 'react'

// ── God Mode display state ────────────────────────────────────────────────────
// Derived in DonnaVoiceReadyShell from hook state + voice/TTS booleans.
// Defined here so it is the single source of truth for the type.

export type DonnaGodModeState =
  | 'idle'                  // Ready, no active voice or processing
  | 'listening'             // Mic active, capturing director speech
  | 'thinking'              // DONNA processing (response in flight)
  | 'speaking'              // TTS playing DONNA response
  | 'auto_listening'        // Conversation mode: brief gap before mic restarts
  | 'awaiting_confirmation' // DONNA proposed action; waiting for director yes/no
  | 'executing'             // Draft being created/submitted
  | 'paused'                // Director paused conversation mode
  | 'error'                 // Unrecoverable voice or TTS error

// ── Pending confirmation ──────────────────────────────────────────────────────

export interface DonnaPendingConfirmation {
  /** Short identifier for the action type, e.g. 'curriculum_draft'. */
  actionType: string
  /** Human-readable description DONNA says before asking for confirmation. */
  description: string
  /** Called when director confirms. Must resolve quickly — shown as 'executing'. */
  execute: () => Promise<{ ok: boolean; message: string }>
}

// ── Hook return type ──────────────────────────────────────────────────────────

export interface UseDonnaConversationModeReturn {
  /** True when Conversation Mode is active. */
  conversationMode: boolean
  /** True when the director has manually paused Conversation Mode. */
  isPaused: boolean
  /** Pending action waiting for director yes/no confirmation. */
  pendingConfirmation: DonnaPendingConfirmation | null
  /** True during the brief auto-listen gap after TTS finishes. */
  isAutoListening: boolean
  /**
   * Count of consecutive no-speech errors in the current auto-listen cycle.
   * Shell stops auto-listen when this reaches MAX_NO_SPEECH_RETRIES.
   */
  noSpeechCount: number

  /** Toggle Conversation Mode on/off. Clears pending confirmation on off. */
  toggleConversationMode: () => void
  enableConversationMode: () => void
  /** Turn off Conversation Mode and clear all transient state. */
  disableConversationMode: () => void

  /** Pause auto-listening (keeps conversation mode setting). */
  pauseConversation: () => void
  /** Resume from paused state. */
  resumeConversation: () => void

  /** Set/clear the pending confirmation. */
  setPendingConfirmation: (c: DonnaPendingConfirmation | null) => void
  clearPendingConfirmation: () => void

  /** Mark that the auto-listen gap has started. */
  beginAutoListen: () => void
  /** Mark that auto-listening is complete (mic has restarted). */
  endAutoListen: () => void

  /** Increment no-speech counter; returns the new count. */
  incrementNoSpeech: () => number
  /** Reset no-speech counter (call when director speaks successfully). */
  resetNoSpeechCount: () => void

  /** Full reset to initial idle state. */
  resetConversation: () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Max consecutive no-speech recognitions before auto-listen pauses itself. */
export const MAX_NO_SPEECH_RETRIES = 3

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDonnaConversationMode(): UseDonnaConversationModeReturn {
  const [conversationMode, setConversationMode] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [pendingConfirmation, setPendingConfirmationState] = useState<DonnaPendingConfirmation | null>(null)
  const [isAutoListening, setIsAutoListening] = useState(false)
  const [noSpeechCount, setNoSpeechCount] = useState(0)

  const enableConversationMode = useCallback(() => {
    setConversationMode(true)
    setIsPaused(false)
    setNoSpeechCount(0)
  }, [])

  const disableConversationMode = useCallback(() => {
    setConversationMode(false)
    setIsPaused(false)
    setPendingConfirmationState(null)
    setIsAutoListening(false)
    setNoSpeechCount(0)
  }, [])

  const toggleConversationMode = useCallback(() => {
    setConversationMode(prev => {
      if (prev) {
        // Turning off — clear all transient state
        setIsPaused(false)
        setPendingConfirmationState(null)
        setIsAutoListening(false)
        setNoSpeechCount(0)
      } else {
        // Turning on — reset counters
        setIsPaused(false)
        setNoSpeechCount(0)
      }
      return !prev
    })
  }, [])

  const pauseConversation = useCallback(() => {
    setIsPaused(true)
    setIsAutoListening(false)
  }, [])

  const resumeConversation = useCallback(() => {
    setIsPaused(false)
    setNoSpeechCount(0)
  }, [])

  const setPendingConfirmation = useCallback((c: DonnaPendingConfirmation | null) => {
    setPendingConfirmationState(c)
    if (c) setIsAutoListening(false)
  }, [])

  const clearPendingConfirmation = useCallback(() => {
    setPendingConfirmationState(null)
  }, [])

  const beginAutoListen = useCallback(() => {
    setIsAutoListening(true)
  }, [])

  const endAutoListen = useCallback(() => {
    setIsAutoListening(false)
  }, [])

  const incrementNoSpeech = useCallback((): number => {
    let next = 0
    setNoSpeechCount(prev => {
      next = prev + 1
      return next
    })
    return next
  }, [])

  const resetNoSpeechCount = useCallback(() => {
    setNoSpeechCount(0)
  }, [])

  const resetConversation = useCallback(() => {
    setConversationMode(false)
    setIsPaused(false)
    setPendingConfirmationState(null)
    setIsAutoListening(false)
    setNoSpeechCount(0)
  }, [])

  return {
    conversationMode,
    isPaused,
    pendingConfirmation,
    isAutoListening,
    noSpeechCount,
    toggleConversationMode,
    enableConversationMode,
    disableConversationMode,
    pauseConversation,
    resumeConversation,
    setPendingConfirmation,
    clearPendingConfirmation,
    beginAutoListen,
    endAutoListen,
    incrementNoSpeech,
    resetNoSpeechCount,
    resetConversation,
  }
}

// ── God Mode state computation ─────────────────────────────────────────────────
// Pure function — computes the display state from all inputs.
// Used by DonnaVoiceReadyShell to derive a single unified state.

export function computeGodModeState(opts: {
  conversationMode: boolean
  isPaused: boolean
  pendingConfirmation: DonnaPendingConfirmation | null
  isAutoListening: boolean
  isSpeaking: boolean
  isTyping: boolean
  isExecuting: boolean
  voiceIsListening: boolean
}): DonnaGodModeState {
  const {
    isPaused,
    pendingConfirmation,
    isAutoListening,
    isSpeaking,
    isTyping,
    isExecuting,
    voiceIsListening,
  } = opts

  if (isPaused)               return 'paused'
  if (pendingConfirmation)    return 'awaiting_confirmation'
  if (isExecuting)            return 'executing'
  if (isSpeaking)             return 'speaking'
  if (isTyping)               return 'thinking'
  if (voiceIsListening)       return 'listening'
  if (isAutoListening)        return 'auto_listening'
  return 'idle'
}

// ── State display labels ───────────────────────────────────────────────────────

export function getGodModeStateLabel(state: DonnaGodModeState): string | null {
  switch (state) {
    case 'idle':                  return null
    case 'listening':             return 'Listening…'
    case 'thinking':              return 'Thinking…'
    case 'speaking':              return 'Speaking…'
    case 'auto_listening':        return 'Auto-listening…'
    case 'awaiting_confirmation': return 'Waiting for your confirmation'
    case 'executing':             return 'Creating draft…'
    case 'paused':                return 'Paused'
    case 'error':                 return 'Voice unavailable'
  }
}
