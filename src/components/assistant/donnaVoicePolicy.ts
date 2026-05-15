// Sprint 350 — Voice output policy for Donna.
// Defines the 4 modes in priority order. Pure utility — no React, no side effects.

export type DonnaVoiceOutputMode =
  | 'contract_tts'   // Exact workflow prompt — server TTS via /api/donna/tts
  | 'browser_tts'    // Browser speechSynthesis fallback
  | 'realtime'       // OpenAI Realtime WebRTC (Academy Setup + onboarding primary)
  | 'silent'         // Screen text is source of truth — no audio

export interface DonnaVoicePolicyResult {
  mode: DonnaVoiceOutputMode
  reason: string
}

// Resolve which output mode Donna should use given current capability flags.
export function resolveDonnaVoiceMode(opts: {
  isContractContext: boolean
  realtimeAvailable: boolean
  serverTtsAvailable: boolean
  browserTtsAvailable: boolean
}): DonnaVoicePolicyResult {
  const { isContractContext, realtimeAvailable, serverTtsAvailable, browserTtsAvailable } = opts

  if (isContractContext && serverTtsAvailable) {
    return { mode: 'contract_tts', reason: 'Server TTS available for contract context' }
  }
  if (realtimeAvailable) {
    return { mode: 'realtime', reason: 'Realtime data channel open' }
  }
  if (browserTtsAvailable) {
    return { mode: 'browser_tts', reason: 'Browser speechSynthesis available' }
  }
  return { mode: 'silent', reason: 'No audio output available — screen text is source of truth' }
}

export const DONNA_VOICE_MODE_LABELS: Record<DonnaVoiceOutputMode, string> = {
  contract_tts: 'Server TTS (contract)',
  browser_tts:  'Browser TTS',
  realtime:     'OpenAI Realtime',
  silent:       'Silent (screen only)',
}
