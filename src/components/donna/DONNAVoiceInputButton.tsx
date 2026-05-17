'use client'

// Sprint 620 — DONNA Voice Input Polish V1
// Polished voice input button with states, animations, and graceful fallback.
// Standalone reusable button — used inside larger shells.
// No DB. No execution.

import { Mic, MicOff, Loader2 } from 'lucide-react'
import type { VoiceDictationStatus } from '@/lib/donna/useVoiceDictation'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DONNAVoiceInputButtonProps {
  status: VoiceDictationStatus
  isAvailable: boolean
  onStart: () => void
  onStop: () => void
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

// ── Size config ───────────────────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { button: 'w-9 h-9', icon: 'w-4 h-4', label: 'text-[10px]' },
  md: { button: 'w-12 h-12', icon: 'w-5 h-5', label: 'text-xs' },
  lg: { button: 'w-16 h-16', icon: 'w-6 h-6', label: 'text-sm' },
}

// ── Status config ─────────────────────────────────────────────────────────────

function getButtonStyle(status: VoiceDictationStatus, isAvailable: boolean): string {
  if (!isAvailable) {
    return 'bg-surface border-border text-text-muted opacity-50 cursor-not-allowed'
  }
  switch (status) {
    case 'listening':
      return 'bg-lime/10 border-lime text-lime ring-2 ring-lime/20'
    case 'processing':
      return 'bg-surface border-border text-text-muted animate-pulse'
    case 'done':
      return 'bg-status-green/10 border-status-green text-status-green'
    case 'error':
      return 'bg-status-red/10 border-status-red/40 text-status-red'
    case 'idle':
    default:
      return 'bg-surface border-border text-text-muted hover:border-lime/40 hover:text-lime hover:bg-lime/5'
  }
}

function getStatusLabel(status: VoiceDictationStatus, isAvailable: boolean, customLabel?: string): string {
  if (!isAvailable) return 'Voice unavailable'
  if (customLabel && status === 'idle') return customLabel
  switch (status) {
    case 'listening': return 'Listening…'
    case 'processing': return 'Processing…'
    case 'done': return 'Done'
    case 'error': return 'Try again'
    case 'idle': return customLabel ?? 'Tap to speak'
    default: return 'Tap to speak'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DONNAVoiceInputButton({
  status,
  isAvailable,
  onStart,
  onStop,
  size = 'md',
  label,
}: DONNAVoiceInputButtonProps) {
  const sizeCfg = SIZE_CONFIG[size]
  const buttonStyle = getButtonStyle(status, isAvailable)
  const statusLabel = getStatusLabel(status, isAvailable, label)

  function handleClick() {
    if (!isAvailable) return
    if (status === 'listening') {
      onStop()
    } else if (status === 'idle' || status === 'error' || status === 'done') {
      onStart()
    }
  }

  const icon = status === 'processing'
    ? <Loader2 className={`${sizeCfg.icon} animate-spin`} />
    : status === 'listening'
    ? <MicOff className={sizeCfg.icon} />
    : <Mic className={sizeCfg.icon} />

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={!isAvailable || status === 'processing'}
        aria-label={statusLabel}
        className={`rounded-full border-2 flex items-center justify-center transition-all ${sizeCfg.button} ${buttonStyle}`}
      >
        {icon}
      </button>
      <p className={`${sizeCfg.label} text-text-muted text-center`}>{statusLabel}</p>
    </div>
  )
}
