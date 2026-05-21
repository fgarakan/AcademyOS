// Sprint 426 — DONNA Health Status Reporter V1
// Returns the current operational health of the DONNA pipeline.
// Used by the diagnostics console and can be exposed via an internal health API.
// No DB calls. Pure env-check. Server-side only.

import { isDonnaEnabled, isVoiceTranscriptionEnabled, isRealtimeVoiceEnabled, isTtsEnabled } from '@/lib/featureFlags/featureFlags'
import { getAllKillSwitchStates } from '@/lib/killSwitches/killSwitches'
import { RATE_LIMIT_POLICIES } from '@/lib/rateLimit/rateLimitPolicy'
import { getRegisteredActionTypes } from './actionExecutionGuards'

export type DonnaSubsystemStatus = 'operational' | 'degraded' | 'offline'

export interface DonnaSubsystemHealth {
  name: string
  status: DonnaSubsystemStatus
  detail: string
}

export interface DonnaPipelineHealth {
  overall: DonnaSubsystemStatus
  subsystems: DonnaSubsystemHealth[]
  registeredActionTypes: string[]
  rateLimitPolicies: Array<{
    name: string
    scope: string
    limit: number
    windowMinutes: number
  }>
  checkedAt: string
}

function healthStatus(enabled: boolean, killSwitchAllowed: boolean): DonnaSubsystemStatus {
  if (!enabled) return 'offline'
  if (!killSwitchAllowed) return 'degraded'
  return 'operational'
}

// Returns a snapshot of the DONNA pipeline health. Not cached — always live.
export function getDonnaHealthStatus(): DonnaPipelineHealth {
  const killSwitches = getAllKillSwitchStates()

  const subsystems: DonnaSubsystemHealth[] = [
    {
      name: 'DONNA Intelligence (Anthropic)',
      status: healthStatus(isDonnaEnabled(), killSwitches.donna_intelligence),
      detail: isDonnaEnabled()
        ? killSwitches.donna_intelligence ? 'API key present; kill switch ALLOWED' : 'API key present; kill switch BLOCKED'
        : 'ANTHROPIC_API_KEY not set',
    },
    {
      name: 'Voice Transcription (Whisper)',
      status: healthStatus(isVoiceTranscriptionEnabled(), killSwitches.voice_processing),
      detail: isVoiceTranscriptionEnabled()
        ? killSwitches.voice_processing ? 'API key present; kill switch ALLOWED' : 'API key present; kill switch BLOCKED'
        : 'OPENAI_API_KEY not set',
    },
    {
      name: 'Realtime Voice (OpenAI Realtime)',
      status: healthStatus(isRealtimeVoiceEnabled(), killSwitches.voice_processing),
      detail: isRealtimeVoiceEnabled()
        ? killSwitches.voice_processing ? 'API key present; kill switch ALLOWED' : 'API key present; kill switch BLOCKED'
        : 'OPENAI_REALTIME_API_KEY not set',
    },
    {
      name: 'Text-to-Speech',
      status: healthStatus(isTtsEnabled(), killSwitches.voice_processing),
      detail: isTtsEnabled() ? 'OPENAI_API_KEY present' : 'OPENAI_API_KEY not set',
    },
    {
      name: 'Action Execution',
      status: killSwitches.action_execution ? 'operational' : 'degraded',
      detail: killSwitches.action_execution
        ? 'KILL_SWITCH_ALLOW_ACTION_EXECUTION set'
        : 'KILL_SWITCH_ALLOW_ACTION_EXECUTION not set — execution blocked',
    },
    {
      name: 'AI Proposed Actions',
      status: killSwitches.ai_proposed_actions ? 'operational' : 'degraded',
      detail: killSwitches.ai_proposed_actions
        ? 'KILL_SWITCH_ALLOW_AI_PROPOSED_ACTIONS set'
        : 'AI-generated proposed_actions blocked',
    },
  ]

  const offlineCount = subsystems.filter(s => s.status === 'offline').length
  const degradedCount = subsystems.filter(s => s.status === 'degraded').length
  const overall: DonnaSubsystemStatus =
    offlineCount > 2 ? 'offline' :
    offlineCount > 0 || degradedCount > 0 ? 'degraded' :
    'operational'

  return {
    overall,
    subsystems,
    registeredActionTypes: getRegisteredActionTypes(),
    rateLimitPolicies: Object.values(RATE_LIMIT_POLICIES).map(p => ({
      name: p.name,
      scope: p.scope,
      limit: p.limit,
      windowMinutes: p.windowMs / 60_000,
    })),
    checkedAt: new Date().toISOString(),
  }
}
