// Sprint 425 — DONNA Gateway V1
// Single entry-point that applies rate limiting, kill switch, and trust boundary checks
// before any DONNA AI call proceeds. All DONNA server actions should call checkDonnaGateway()
// at the top of the function.
//
// Returns allowed or a structured block response — callers must check before proceeding.
// Server-side only.

import type { Database } from '@/lib/supabase/database.types'
import { checkRateLimit, rateLimitErrorMessage } from '@/lib/rateLimit/inProcessRateLimit'
import { RATE_LIMIT_POLICIES } from '@/lib/rateLimit/rateLimitPolicy'
import { isKillSwitchAllowed, killSwitchBlockedMessage } from '@/lib/killSwitches/killSwitches'
import { isDonnaEnabled } from '@/lib/featureFlags/featureFlags'
import { logUsageEvent } from '@/lib/usage/usageTracker'
import { logWarn } from '@/lib/observability/logger'

type UserRole = Database['public']['Enums']['user_role']

export type DonnaGatewayAction =
  | 'intelligence'     // Full DONNA intelligence / context building
  | 'voice_transcription'
  | 'voice_structuring'
  | 'portal_ai_question'
  | 'tts'
  | 'template_generation'
  | 'wrap_up_draft'

export interface DonnaGatewayResult {
  allowed: boolean
  blockedReason: string | null
  blockedLayer: 'feature_flag' | 'kill_switch' | 'rate_limit' | null
}

export interface DonnaGatewayContext {
  userId: string
  academyId: string
  userRole: UserRole
  requestId?: string
}

const GATEWAY_ALLOWED: DonnaGatewayResult = {
  allowed: true,
  blockedReason: null,
  blockedLayer: null,
}

// Run all gateway checks for a DONNA action. Call at the top of every DONNA server action.
export function checkDonnaGateway(
  action: DonnaGatewayAction,
  ctx: DonnaGatewayContext,
): DonnaGatewayResult {
  // Layer 1: Feature flag
  if (!isDonnaEnabled() && action !== 'voice_transcription') {
    logWarn('donna_gateway_feature_blocked', {
      action,
      requestId: ctx.requestId,
    })
    return {
      allowed: false,
      blockedReason: 'AI features are not configured in this environment.',
      blockedLayer: 'feature_flag',
    }
  }

  // Layer 2: Kill switch
  const killSwitchName =
    action === 'intelligence' ? 'donna_intelligence' :
    action === 'voice_transcription' || action === 'voice_structuring' ? 'voice_processing' :
    'donna_intelligence'

  if (!isKillSwitchAllowed(killSwitchName, ctx.requestId)) {
    logUsageEvent({
      eventType: action === 'intelligence' ? 'donna_intelligence_call' : 'voice_transcription',
      academyId: ctx.academyId,
      userId: ctx.userId,
      requestId: ctx.requestId,
      blocked: true,
      blockedReason: 'kill_switch',
    })
    return {
      allowed: false,
      blockedReason: killSwitchBlockedMessage(killSwitchName),
      blockedLayer: 'kill_switch',
    }
  }

  // Layer 3: Rate limiting
  const policy = action === 'intelligence' ? RATE_LIMIT_POLICIES.DONNA_INTELLIGENCE :
    action === 'voice_transcription' ? RATE_LIMIT_POLICIES.VOICE_TRANSCRIPTION :
    action === 'voice_structuring' ? RATE_LIMIT_POLICIES.COACH_RECAP_STRUCTURING :
    action === 'portal_ai_question' ? RATE_LIMIT_POLICIES.PORTAL_AI_QUESTION :
    action === 'tts' ? RATE_LIMIT_POLICIES.TTS_RESPONSE :
    action === 'template_generation' ? RATE_LIMIT_POLICIES.TEMPLATE_GENERATION :
    RATE_LIMIT_POLICIES.WRAP_UP_DRAFT

  const actorKey =
    policy.scope === 'academy' ? ctx.academyId :
    `${ctx.userId}:${ctx.academyId}`

  const rateLimitResult = checkRateLimit(policy, actorKey, ctx.requestId)
  if (!rateLimitResult.allowed) {
    logUsageEvent({
      eventType: action === 'intelligence' ? 'donna_intelligence_call' : 'voice_transcription',
      academyId: ctx.academyId,
      userId: ctx.userId,
      requestId: ctx.requestId,
      blocked: true,
      blockedReason: 'rate_limit',
    })
    return {
      allowed: false,
      blockedReason: rateLimitErrorMessage(policy),
      blockedLayer: 'rate_limit',
    }
  }

  return GATEWAY_ALLOWED
}
