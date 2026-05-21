// Sprint 565 — Video Visibility + Ownership Rules V1
// Role-safe visibility and access helpers for curriculum media assets.
// Determines what each role can see and provides blocked-reason copy.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { MediaAsset, MediaVisibilityLevel } from './mediaAssetTypes'

export type ViewerRole = 'director' | 'coach' | 'parent' | 'player'

export type VisibilityBlockedReason =
  | 'internal_only'
  | 'coach_director_only'
  | 'not_reviewed'
  | 'not_parent_safe'
  | 'not_player_safe'
  | 'licensing_restricted'
  | 'platform_owner_only'

export interface VisibilityResult {
  canView: boolean
  reason: VisibilityBlockedReason | null
}

const ROLE_ALLOWED_VISIBILITY: Record<ViewerRole, MediaVisibilityLevel[]> = {
  director: [
    'internal_only',
    'coach_director_only',
    'parent_safe',
    'player_safe',
    'parent_player_safe',
    'platform_owner_only',
    'licensed_partner_content',
  ],
  coach: [
    'coach_director_only',
    'parent_safe',
    'player_safe',
    'parent_player_safe',
    'licensed_partner_content',
  ],
  parent: [
    'parent_safe',
    'parent_player_safe',
  ],
  player: [
    'player_safe',
    'parent_player_safe',
  ],
}

export function canRoleViewMedia(role: ViewerRole, asset: MediaAsset): VisibilityResult {
  if (asset.reviewStatus !== 'approved') {
    if (role === 'director') return { canView: true, reason: null }
    return { canView: false, reason: 'not_reviewed' }
  }

  const allowed = ROLE_ALLOWED_VISIBILITY[role] ?? []
  if (!allowed.includes(asset.visibilityLevel)) {
    return {
      canView: false,
      reason: resolveBlockedReason(role, asset.visibilityLevel),
    }
  }

  return { canView: true, reason: null }
}

function resolveBlockedReason(
  role: ViewerRole,
  visibility: MediaVisibilityLevel,
): VisibilityBlockedReason {
  if (visibility === 'internal_only') return 'internal_only'
  if (visibility === 'platform_owner_only') return 'platform_owner_only'
  if (visibility === 'licensed_partner_content') return 'licensing_restricted'
  if (visibility === 'coach_director_only') return 'coach_director_only'
  if (role === 'parent') return 'not_parent_safe'
  if (role === 'player') return 'not_player_safe'
  return 'internal_only'
}

export function isMediaSafeForRole(role: ViewerRole, asset: MediaAsset): boolean {
  return canRoleViewMedia(role, asset).canView
}

export const BLOCKED_REASON_LABELS: Record<VisibilityBlockedReason, string> = {
  internal_only:        'Internal use only — not shared outside the coaching team',
  coach_director_only:  'Coach and director access only — not shared with families',
  not_reviewed:         'Not yet reviewed — requires director approval before sharing',
  not_parent_safe:      'Not designated as parent-safe content',
  not_player_safe:      'Not designated as player-safe content',
  licensing_restricted: 'Licensing restricts who can access this content',
  platform_owner_only:  'Restricted to platform administration',
}

export function getVisibilityLabel(level: MediaVisibilityLevel): string {
  const labels: Record<MediaVisibilityLevel, string> = {
    internal_only:           'Internal Only',
    coach_director_only:     'Coach & Director',
    parent_safe:             'Parent Safe',
    player_safe:             'Player Safe',
    parent_player_safe:      'Parent & Player Safe',
    platform_owner_only:     'Platform Owner Only',
    licensed_partner_content: 'Licensed Partner',
  }
  return labels[level]
}

export function getMediaVisibilityBadgeClass(level: MediaVisibilityLevel): string {
  switch (level) {
    case 'parent_player_safe':   return 'text-status-green border-status-green/30 bg-status-green/5'
    case 'player_safe':          return 'text-status-blue  border-status-blue/30  bg-status-blue/5'
    case 'parent_safe':          return 'text-status-blue  border-status-blue/30  bg-status-blue/5'
    case 'coach_director_only':  return 'text-yellow-400   border-yellow-400/30   bg-yellow-400/5'
    case 'internal_only':        return 'text-text-muted   border-border           bg-surface-raised'
    case 'licensed_partner_content': return 'text-violet-400 border-violet-400/30 bg-violet-400/5'
    case 'platform_owner_only':  return 'text-status-red   border-status-red/30   bg-status-red/5'
    default:                     return 'text-text-muted   border-border           bg-surface-raised'
  }
}
