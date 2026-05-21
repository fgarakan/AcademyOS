// Sprint 415 — Kill Switches V1
// Hard-coded kill switch checks that can disable critical features instantly.
// Kill switches are checked at the entry point of every guarded server action.
// A missing or false value means the feature is OFF — safe by default.
//
// Hierarchy: Kill switches > Feature flags > Business logic
// If a kill switch is off, the feature stops regardless of feature flag state.
//
// See docs/feature-flags-and-kill-switches.md for the full doctrine.
// Server-side only.

import { logWarn } from '@/lib/observability/logger'

export type KillSwitchName =
  | 'voice_processing'       // All voice input (transcription + DONNA structuring)
  | 'donna_intelligence'     // DONNA AI analysis and context building
  | 'ai_proposed_actions'    // Creating new proposed_actions via AI
  | 'action_execution'       // Executing approved proposed_actions
  | 'parent_portal_updates'  // Sending development updates to parents
  | 'utr_sync'               // External UTR data sync
  | 'background_jobs'        // Background job dispatcher

// Maps kill switch names to their governing environment variable.
// The variable must be set to '1', 'true', or 'yes' to ENABLE the feature.
// When absent, the feature is DISABLED.
const KILL_SWITCH_ENV: Record<KillSwitchName, string> = {
  voice_processing:      'KILL_SWITCH_ALLOW_VOICE_PROCESSING',
  donna_intelligence:    'KILL_SWITCH_ALLOW_DONNA_INTELLIGENCE',
  ai_proposed_actions:   'KILL_SWITCH_ALLOW_AI_PROPOSED_ACTIONS',
  action_execution:      'KILL_SWITCH_ALLOW_ACTION_EXECUTION',
  parent_portal_updates: 'KILL_SWITCH_ALLOW_PARENT_PORTAL_UPDATES',
  utr_sync:              'KILL_SWITCH_ALLOW_UTR_SYNC',
  background_jobs:       'KILL_SWITCH_ALLOW_BACKGROUND_JOBS',
}

// When ACADEMYOS_DISABLE_ALL_KILL_SWITCHES is set to '1', all features are allowed.
// Use ONLY in local development — never in production or staging.
const DISABLE_ALL =
  process.env.ACADEMYOS_DISABLE_ALL_KILL_SWITCHES === '1' &&
  process.env.NODE_ENV !== 'production'

function isAllowed(envVar: string): boolean {
  if (DISABLE_ALL) return true
  const val = process.env[envVar]?.trim().toLowerCase()
  return val === '1' || val === 'true' || val === 'yes'
}

// Returns whether the given feature is currently allowed by its kill switch.
export function isKillSwitchAllowed(name: KillSwitchName, requestId?: string): boolean {
  const envVar = KILL_SWITCH_ENV[name]
  const allowed = isAllowed(envVar)
  if (!allowed) {
    logWarn('kill_switch_blocked', { killSwitch: name, envVar, requestId })
  }
  return allowed
}

// Returns a user-visible error message when a kill switch blocks a request.
export function killSwitchBlockedMessage(name: KillSwitchName): string {
  const messages: Record<KillSwitchName, string> = {
    voice_processing:      'Voice processing is temporarily unavailable.',
    donna_intelligence:    'AI analysis is temporarily unavailable.',
    ai_proposed_actions:   'AI-generated actions are temporarily unavailable.',
    action_execution:      'Action execution is temporarily unavailable.',
    parent_portal_updates: 'Parent updates are temporarily unavailable.',
    utr_sync:              'UTR data sync is temporarily unavailable.',
    background_jobs:       'Background processing is temporarily unavailable.',
  }
  return messages[name]
}

// Returns the state of all kill switches. Used by the diagnostics console.
export function getAllKillSwitchStates(): Record<KillSwitchName, boolean> {
  const names = Object.keys(KILL_SWITCH_ENV) as KillSwitchName[]
  return Object.fromEntries(
    names.map(name => [name, isAllowed(KILL_SWITCH_ENV[name])])
  ) as Record<KillSwitchName, boolean>
}
