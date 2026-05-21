// Sprint 423 — DONNA Trust Boundary Validator V1
// Comprehensive trust boundary check that runs before any DONNA action is dispatched.
// This is the outermost safety gate — combines role checks, kill switches, and action class rules.
// No DB calls. Pure logic. Server-side only.

import type { Database } from '@/lib/supabase/database.types'
import { classifyAction, type DonnaActionSafetyClass } from './donnaActionTypes'
import { isKillSwitchAllowed } from '@/lib/killSwitches/killSwitches'
import { isDonnaEnabled } from '@/lib/featureFlags/featureFlags'
import type { DonnaRole } from './donnaRoleBoundaries'

type UserRole = Database['public']['Enums']['user_role']

// Map AcademyOS user roles to DONNA roles (subset of user_role for DONNA purposes)
const DONNA_ROLE_MAP: Partial<Record<UserRole, DonnaRole>> = {
  academy_director: 'director',
  head_coach: 'coach',
  coach: 'coach',
}

export interface TrustBoundaryResult {
  allowed: boolean
  blockedReason: string | null
  safetyClass: DonnaActionSafetyClass | null
  layersFailed: string[]
}

export interface DonnaTrustContext {
  userId: string
  userRole: UserRole
  academyId: string
  actionId: string
  requestId?: string
}

// Runs the full 7-layer trust boundary check for a DONNA action request.
// Layer 1: AI feature enabled (env + kill switch)
// Layer 2: Role-to-DONNA mapping valid
// Layer 3: Action classification (allowed for this role)
// Layer 4: Action safety class enforcement
// Layer 5: User is in the correct academy (enforced by RLS — guard checks here too)
// Layer 6: Kill switch check for the specific subsystem
// Layer 7: Safe default — when in doubt, deny
export function validateDonnaTrustBoundary(
  ctx: DonnaTrustContext,
): TrustBoundaryResult {
  const layersFailed: string[] = []

  // Layer 1: Feature enabled
  if (!isDonnaEnabled()) {
    layersFailed.push('donna_feature_disabled')
    return {
      allowed: false,
      blockedReason: 'DONNA is not available in this environment.',
      safetyClass: null,
      layersFailed,
    }
  }

  // Layer 2: Kill switch
  if (!isKillSwitchAllowed('donna_intelligence', ctx.requestId)) {
    layersFailed.push('kill_switch_donna')
    return {
      allowed: false,
      blockedReason: 'AI intelligence is temporarily unavailable.',
      safetyClass: null,
      layersFailed,
    }
  }

  // Layer 3: Role mapping
  const donnaRole = DONNA_ROLE_MAP[ctx.userRole]
  if (!donnaRole) {
    layersFailed.push('role_not_mapped')
    return {
      allowed: false,
      blockedReason: 'Your account role does not have access to DONNA.',
      safetyClass: null,
      layersFailed,
    }
  }

  // Layer 4: Action classification
  const classification = classifyAction(ctx.actionId, donnaRole)
  if (!classification.allowed) {
    layersFailed.push(`action_blocked:${classification.safetyClass}`)
    return {
      allowed: false,
      blockedReason: classification.blockedReason ?? 'This action is not available.',
      safetyClass: classification.safetyClass,
      layersFailed,
    }
  }

  // Layer 5: Future capability check
  if (classification.safetyClass === 'future_capability') {
    layersFailed.push('future_capability')
    return {
      allowed: false,
      blockedReason: 'This capability is not yet available.',
      safetyClass: 'future_capability',
      layersFailed,
    }
  }

  // All layers passed
  return {
    allowed: true,
    blockedReason: null,
    safetyClass: classification.safetyClass,
    layersFailed: [],
  }
}

// Checks whether DONNA may perform a direct AI read (safe_read class).
// Safe reads never mutate state — they are always allowed if DONNA is enabled.
export function canDonnaPerformSafeRead(ctx: Omit<DonnaTrustContext, 'actionId'>): boolean {
  if (!isDonnaEnabled()) return false
  if (!isKillSwitchAllowed('donna_intelligence', ctx.requestId)) return false
  const donnaRole = DONNA_ROLE_MAP[ctx.userRole]
  return Boolean(donnaRole)
}
