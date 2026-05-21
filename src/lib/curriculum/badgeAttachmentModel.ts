// Sprint 513 — Badge Attachment Model
// Links badge definitions to curriculum levels as recognition triggers.
// Badges are defined in src/lib/badges/badgeModel.ts.
// This module is the curriculum-side attachment view — no DB mutations.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { BadgeId } from '@/lib/badges/badgeModel'

export type BadgeTriggerType =
  | 'level_complete'
  | 'all_gates_met'
  | 'gate_count_reached'
  | 'assessment_passed'
  | 'director_awards'

export interface BadgeLevelAttachment {
  attachmentId: string
  badgeId: BadgeId
  badgeLabel: string
  badgeRarity: 'common' | 'rare' | 'legendary'
  levelId: string
  levelName: string
  triggerType: BadgeTriggerType
  triggerThreshold: number | null
  isPlayerVisible: boolean
  isParentVisible: boolean
  attachedAt: string
  approvedAt: string | null
  approvedBy: string | null
}

export interface BadgeAttachmentSummary {
  totalBadges: number
  playerVisibleCount: number
  parentVisibleCount: number
  pendingApprovalCount: number
  byTriggerType: Record<BadgeTriggerType, number>
  byRarity: Record<'common' | 'rare' | 'legendary', number>
}

export function buildBadgeAttachmentSummary(
  attachments: BadgeLevelAttachment[],
): BadgeAttachmentSummary {
  const byTriggerType: Record<BadgeTriggerType, number> = {
    level_complete: 0,
    all_gates_met: 0,
    gate_count_reached: 0,
    assessment_passed: 0,
    director_awards: 0,
  }
  const byRarity: Record<'common' | 'rare' | 'legendary', number> = {
    common: 0, rare: 0, legendary: 0,
  }

  for (const a of attachments) {
    byTriggerType[a.triggerType] = (byTriggerType[a.triggerType] ?? 0) + 1
    byRarity[a.badgeRarity] = (byRarity[a.badgeRarity] ?? 0) + 1
  }

  return {
    totalBadges: attachments.length,
    playerVisibleCount: attachments.filter(a => a.isPlayerVisible).length,
    parentVisibleCount: attachments.filter(a => a.isParentVisible).length,
    pendingApprovalCount: attachments.filter(a => a.approvedAt === null).length,
    byTriggerType,
    byRarity,
  }
}

export function getBadgesForLevel(
  attachments: BadgeLevelAttachment[],
  levelId: string,
): BadgeLevelAttachment[] {
  return attachments.filter(a => a.levelId === levelId && a.approvedAt !== null)
}

export function getPlayerVisibleBadges(
  attachments: BadgeLevelAttachment[],
): BadgeLevelAttachment[] {
  return attachments.filter(a => a.isPlayerVisible && a.approvedAt !== null)
}

export function getBadgeTriggerLabel(triggerType: BadgeTriggerType): string {
  const labels: Record<BadgeTriggerType, string> = {
    level_complete: 'Awarded when level is completed',
    all_gates_met: 'Awarded when all gates are met',
    gate_count_reached: 'Awarded on gate count milestone',
    assessment_passed: 'Awarded when assessment is passed',
    director_awards: 'Director awards manually',
  }
  return labels[triggerType]
}

export function getBadgeRarityLabel(rarity: 'common' | 'rare' | 'legendary'): string {
  const labels: Record<'common' | 'rare' | 'legendary', string> = {
    common: 'Common',
    rare: 'Rare',
    legendary: 'Legendary',
  }
  return labels[rarity]
}
