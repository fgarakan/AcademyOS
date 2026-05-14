'use client'

// Donna Voice QA Harness — Mega Sprint 297–310
// Dev-only diagnostic panel. Never shown in production.
// Shows current voice state and allows manual testing of all voice paths.

import { useState } from 'react'
import type { DonnaRealtimeStatus } from './useDonnaRealtimeVoice'
import type { DonnaVoiceMode } from './donnaVoiceRuntime'

interface DonnaVoiceDiagnosticsProps {
  realtimeStatus: DonnaRealtimeStatus
  realtimeUnavailableReason: string | null
  voiceGreetingStatus: 'idle' | 'starting' | 'speaking' | 'stalled' | 'done' | 'error'
  isSpeaking: boolean
  isVoiceListening: boolean
  isVoiceSupported: boolean | null
  voiceMode: DonnaVoiceMode
  wakeListeningActive: boolean
  onTestRealtime: () => void
  onTestBrowserVoice: () => void
  onResetVoice: () => void
}

export function DonnaVoiceDiagnostics({
  realtimeStatus,
  realtimeUnavailableReason,
  voiceGreetingStatus,
  isSpeaking,
  isVoiceListening,
  isVoiceSupported,
  voiceMode,
  wakeListeningActive,
  onTestRealtime,
  onTestBrowserVoice,
  onResetVoice,
}: DonnaVoiceDiagnosticsProps) {
  // Never render in production
  if (process.env.NODE_ENV !== 'development') return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [expanded, setExpanded] = useState(false)

  type Row = { label: string; value: string; ok: boolean | null }
  const rows: Row[] = [
    { label: 'Voice mode', value: voiceMode, ok: true },
    {
      label: 'Realtime status',
      value: realtimeStatus,
      ok: realtimeStatus === 'ready' || realtimeStatus === 'speaking',
    },
    {
      label: 'Realtime unavailable reason',
      value: realtimeUnavailableReason ?? '—',
      ok: realtimeStatus !== 'unavailable' && realtimeStatus !== 'error',
    },
    {
      label: 'Greeting status',
      value: voiceGreetingStatus,
      ok: voiceGreetingStatus === 'done' || voiceGreetingStatus === 'speaking',
    },
    { label: 'Browser TTS speaking', value: String(isSpeaking), ok: null },
    { label: 'Mic listening', value: String(isVoiceListening), ok: null },
    { label: 'Wake phrase active', value: String(wakeListeningActive), ok: null },
    {
      label: 'SpeechRecognition supported',
      value: isVoiceSupported === null ? 'checking…' : String(isVoiceSupported),
      ok: isVoiceSupported === true,
    },
  ]

  return (
    <div
      className="rounded-xl px-3 py-2.5 space-y-2"
      style={{ background: 'rgba(200,255,0,0.03)', border: '1px solid rgba(200,255,0,0.1)' }}
    >
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between text-[10px] text-text-muted hover:text-text-secondary transition-colors"
      >
        <span className="font-mono tracking-wide">🔧 Voice QA — dev only</span>
        <span className="font-mono">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <>
          <div className="space-y-0.5">
            {rows.map(r => (
              <div key={r.label} className="flex items-start gap-2 text-[10px] font-mono">
                <span
                  className="shrink-0 mt-px"
                  style={{
                    color: r.ok === null ? '#555555' : r.ok ? '#30D158' : '#FF9500',
                  }}
                >
                  ●
                </span>
                <span className="text-text-muted">{r.label}:</span>
                <span className="text-text-secondary break-all">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={onTestRealtime}
              className="text-[10px] px-2 py-1 rounded-lg border border-border text-text-muted
                hover:text-text-primary hover:border-lime/20 transition-colors"
            >
              Test Realtime
            </button>
            <button
              type="button"
              onClick={onTestBrowserVoice}
              className="text-[10px] px-2 py-1 rounded-lg border border-border text-text-muted
                hover:text-text-primary hover:border-lime/20 transition-colors"
            >
              Test Browser Voice
            </button>
            <button
              type="button"
              onClick={onResetVoice}
              className="text-[10px] px-2 py-1 rounded-lg border border-border
                hover:border-status-red/30 transition-colors"
              style={{ color: '#FF3B30' }}
            >
              Reset Voice
            </button>
          </div>

          <div
            className="rounded-lg px-2.5 py-1.5 space-y-1"
            style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.08)' }}
          >
            <p className="text-[9px] font-semibold text-lime uppercase tracking-widest">
              QA checklist
            </p>
            {[
              'Test Realtime voice — confirm audio heard',
              'Test Browser voice — confirm audio heard',
              'Test mic — speak and confirm transcript',
              'Test wake phrase — say "Hey Donna"',
              'Test approval refusal — say "approve it"',
              'Test typed fallback — click Type instead',
              'Test reset voice — confirm clean state',
              'Test onboarding routing — say "Academy setup"',
            ].map((item, i) => (
              <p key={i} className="text-[9px] text-text-muted font-mono leading-snug">
                □ {item}
              </p>
            ))}
          </div>

          <p className="text-[9px] text-text-muted leading-snug">
            Visible in development only. Not shown to directors in production.
          </p>
        </>
      )}
    </div>
  )
}
