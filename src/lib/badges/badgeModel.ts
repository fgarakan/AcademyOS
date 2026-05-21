// Sprint 492 — Badge System Model V1
// Pure TypeScript badge type definitions, criteria, and award logic.
// No DB tables for badges yet — badge state is computed from player_requirement_progress.
// Badges are earned by completing curriculum milestones or reaching achievement thresholds.
// No side effects. No DB calls.

export type BadgeId =
  | 'first_step'
  | 'consistent_player'
  | 'level_complete'
  | 'domain_champion'
  | 'attendance_streak'
  | 'assessment_ready'
  | 'wrap_up_champion'
  | 'mental_edge'
  | 'curriculum_explorer'
  | 'promotion_ready'

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'legendary'
export type BadgeCategory = 'progress' | 'attendance' | 'curriculum' | 'achievement' | 'mental'

export type BadgeCriteriaType =
  | 'requirements_completed_gte'
  | 'completion_pct_gte'
  | 'attendance_streak_gte'
  | 'level_completed'
  | 'domain_completed'
  | 'assessment_score_gte'
  | 'custom'

export interface BadgeCriteria {
  type: BadgeCriteriaType
  value: number | string | null
  description: string
}

export interface BadgeDefinition {
  id: BadgeId
  name: string
  description: string
  category: BadgeCategory
  rarity: BadgeRarity
  criteria: BadgeCriteria[]
  isPlayerVisible: boolean
  isParentVisible: boolean
  iconKey: string
}

export type BadgeStatus = 'earned' | 'in_progress' | 'locked'

export interface BadgeAward {
  badgeId: BadgeId
  playerId: string
  status: BadgeStatus
  earnedAt: string | null
  progress: number
  progressMax: number
  progressLabel: string
}

export const BADGE_DEFINITIONS: Record<BadgeId, BadgeDefinition> = {
  first_step: {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your first curriculum requirement',
    category: 'progress',
    rarity: 'common',
    criteria: [{ type: 'requirements_completed_gte', value: 1, description: '1 requirement completed' }],
    isPlayerVisible: true,
    isParentVisible: true,
    iconKey: 'footsteps',
  },
  consistent_player: {
    id: 'consistent_player',
    name: 'Consistent Player',
    description: 'Complete 5 requirements in your current level',
    category: 'progress',
    rarity: 'common',
    criteria: [{ type: 'requirements_completed_gte', value: 5, description: '5 requirements completed' }],
    isPlayerVisible: true,
    isParentVisible: true,
    iconKey: 'star',
  },
  level_complete: {
    id: 'level_complete',
    name: 'Level Complete',
    description: 'Complete all requirements for a curriculum level',
    category: 'achievement',
    rarity: 'uncommon',
    criteria: [{ type: 'level_completed', value: null, description: 'All level requirements achieved' }],
    isPlayerVisible: true,
    isParentVisible: true,
    iconKey: 'trophy',
  },
  domain_champion: {
    id: 'domain_champion',
    name: 'Domain Champion',
    description: 'Complete all requirements in a single curriculum domain',
    category: 'curriculum',
    rarity: 'rare',
    criteria: [{ type: 'domain_completed', value: null, description: 'All domain requirements achieved' }],
    isPlayerVisible: true,
    isParentVisible: true,
    iconKey: 'shield',
  },
  attendance_streak: {
    id: 'attendance_streak',
    name: 'Attendance Streak',
    description: 'Attend 10 sessions without an absence',
    category: 'attendance',
    rarity: 'uncommon',
    criteria: [{ type: 'attendance_streak_gte', value: 10, description: '10 consecutive sessions attended' }],
    isPlayerVisible: true,
    isParentVisible: true,
    iconKey: 'flame',
  },
  assessment_ready: {
    id: 'assessment_ready',
    name: 'Assessment Ready',
    description: 'Reach 80% completion and be marked promotion-ready',
    category: 'achievement',
    rarity: 'uncommon',
    criteria: [{ type: 'completion_pct_gte', value: 80, description: '80% requirements complete' }],
    isPlayerVisible: true,
    isParentVisible: true,
    iconKey: 'check_circle',
  },
  wrap_up_champion: {
    id: 'wrap_up_champion',
    name: 'Wrap-Up Champion',
    description: 'Coach achieves 100% wrap-up rate across 10 sessions',
    category: 'achievement',
    rarity: 'rare',
    criteria: [{ type: 'custom', value: null, description: '100% wrap-up rate across 10+ sessions' }],
    isPlayerVisible: false,
    isParentVisible: false,
    iconKey: 'clipboard',
  },
  mental_edge: {
    id: 'mental_edge',
    name: 'Mental Edge',
    description: 'Complete all mental performance requirements for current level',
    category: 'mental',
    rarity: 'rare',
    criteria: [{ type: 'domain_completed', value: 'mental', description: 'All mental requirements achieved' }],
    isPlayerVisible: true,
    isParentVisible: true,
    iconKey: 'brain',
  },
  curriculum_explorer: {
    id: 'curriculum_explorer',
    name: 'Curriculum Explorer',
    description: 'Complete requirements across 3 different curriculum domains',
    category: 'curriculum',
    rarity: 'uncommon',
    criteria: [{ type: 'custom', value: 3, description: 'Requirements completed in 3+ domains' }],
    isPlayerVisible: true,
    isParentVisible: true,
    iconKey: 'compass',
  },
  promotion_ready: {
    id: 'promotion_ready',
    name: 'Promotion Ready',
    description: 'Complete 100% of all level requirements',
    category: 'achievement',
    rarity: 'legendary',
    criteria: [{ type: 'completion_pct_gte', value: 100, description: '100% of requirements completed' }],
    isPlayerVisible: true,
    isParentVisible: true,
    iconKey: 'crown',
  },
}

export function getBadgeDefinition(id: BadgeId): BadgeDefinition {
  return BADGE_DEFINITIONS[id]
}

export function getVisibleBadgesForPlayer(): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS).filter(b => b.isPlayerVisible)
}

export function getVisibleBadgesForParent(): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS).filter(b => b.isParentVisible)
}

export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS).filter(b => b.category === category)
}

export function getRarityLabel(rarity: BadgeRarity): string {
  const labels: Record<BadgeRarity, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    legendary: 'Legendary',
  }
  return labels[rarity]
}
