'use client'

// Sprint 552 — Voice Error and Fallback UX V1
// Friendly error UI for all voice failure scenarios.
// Always shows a text-entry fallback — never leaves coach stuck.

import { MicOff, AlertCircle, WifiOff, Ban, HelpCircle } from 'lucide-react'
import type { VoiceDictationError } from '@/lib/donna/useVoiceDictation'

// ── Error config map ──────────────────────────────────────────────────────────

interface ErrorConfig {
  icon: React.ReactNode
  title: string
  message: string
  action: string
}

const ERROR_CONFIG: Record<VoiceDictationError | 'unavailable', ErrorConfig> = {
  unavailable: {
    icon: <Ban className="w-4 h-4 text-text-muted" />,
    title: 'Voice not supported',
    message: 'Your browser doesn\'t support voice input. Type your response below.',
    action: 'Use text input',
  },
  permission_denied: {
    icon: <MicOff className="w-4 h-4 text-status-orange" />,
    title: 'Microphone access denied',
    message: 'Allow microphone access in your browser settings, then try again.',
    action: 'Type instead',
  },
  no_speech: {
    icon: <MicOff className="w-4 h-4 text-text-muted" />,
    title: 'No speech detected',
    message: 'Nothing was picked up. Speak clearly or type your response.',
    action: 'Try again or type',
  },
  aborted: {
    icon: <AlertCircle className="w-4 h-4 text-text-muted" />,
    title: 'Recording stopped',
    message: 'Voice capture was cancelled. You can try again or type your answer.',
    action: 'Type instead',
  },
  network: {
    icon: <WifiOff className="w-4 h-4 text-status-orange" />,
    title: 'Connection issue',
    message: 'Voice recognition needs a network connection. Check your connection and try again.',
    action: 'Type instead',
  },
  unsupported: {
    icon: <Ban className="w-4 h-4 text-text-muted" />,
    title: 'Voice not available',
    message: 'Voice recognition is not available right now. Type your response instead.',
    action: 'Use text input',
  },
  unknown: {
    icon: <HelpCircle className="w-4 h-4 text-text-muted" />,
    title: 'Something went wrong',
    message: 'Voice input encountered an issue. Type your response to continue.',
    action: 'Type instead',
  },
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface VoiceErrorFallbackProps {
  error: VoiceDictationError | 'unavailable'
  onRetry?: () => void
  onUseFallback: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VoiceErrorFallback({ error, onRetry, onUseFallback }: VoiceErrorFallbackProps) {
  const config = ERROR_CONFIG[error] ?? ERROR_CONFIG.unknown
  const canRetry = onRetry !== undefined && error !== 'unavailable' && error !== 'unsupported'

  return (
    <div className="rounded-xl border border-border bg-surface-raised px-4 py-3.5 flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-primary mb-0.5">{config.title}</p>
          <p className="text-xs text-text-muted leading-snug">{config.message}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {canRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Try again
          </button>
        )}
        <button
          onClick={onUseFallback}
          className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-surface border border-lime/30 text-xs text-lime hover:bg-lime/10 transition-colors"
        >
          {config.action}
        </button>
      </div>
    </div>
  )
}

// ── Unavailable notice (inline, no action needed) ─────────────────────────────

export function VoiceUnavailableNotice() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <Ban className="w-3.5 h-3.5 text-text-muted shrink-0" />
      <p className="text-[10px] text-text-muted">
        Voice input not available in this browser — type your response below.
      </p>
    </div>
  )
}
