// Sprint 510 — Drill Attachment Model
// Typed model for drills attached to curriculum levels.
// Drills are defined in the exercise_library / session_blocks tables.
// This module provides the attachment view layer — no DB mutations.
// Pure TypeScript — no DB calls, no AI, no side effects.

export type DrillDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type DrillDomain = 'technical' | 'tactical' | 'physical' | 'mental' | 'competition' | 'footwork'

export interface DrillAttachment {
  attachmentId: string
  drillId: string
  levelId: string
  levelName: string
  drillName: string
  drillDescription: string | null
  domain: DrillDomain
  difficulty: DrillDifficulty
  durationMinutes: number | null
  playerCount: string | null
  equipment: string[]
  coachNotes: string | null
  isPlayerVisible: boolean
  isParentVisible: boolean
  attachedAt: string
  attachedBy: string | null
  approvedAt: string | null
  approvedBy: string | null
}

export interface DrillAttachmentInput {
  attachmentId: string
  drillId: string
  levelId: string
  levelName: string
  drillName: string
  drillDescription: string | null
  domain: DrillDomain
  difficulty: DrillDifficulty
  durationMinutes: number | null
  playerCount: string | null
  equipment: string[]
  coachNotes: string | null
  isPlayerVisible: boolean
  isParentVisible: boolean
  attachedAt: string
  attachedBy: string | null
  approvedAt: string | null
  approvedBy: string | null
}

export interface DrillAttachmentSummary {
  totalDrills: number
  byDomain: Record<DrillDomain, number>
  byDifficulty: Record<DrillDifficulty, number>
  playerVisibleCount: number
  pendingApprovalCount: number
}

export function buildDrillAttachmentSummary(attachments: DrillAttachment[]): DrillAttachmentSummary {
  const byDomain: Record<DrillDomain, number> = {
    technical: 0, tactical: 0, physical: 0, mental: 0, competition: 0, footwork: 0,
  }
  const byDifficulty: Record<DrillDifficulty, number> = {
    beginner: 0, intermediate: 0, advanced: 0,
  }

  for (const a of attachments) {
    byDomain[a.domain] = (byDomain[a.domain] ?? 0) + 1
    byDifficulty[a.difficulty] = (byDifficulty[a.difficulty] ?? 0) + 1
  }

  return {
    totalDrills: attachments.length,
    byDomain,
    byDifficulty,
    playerVisibleCount: attachments.filter(a => a.isPlayerVisible).length,
    pendingApprovalCount: attachments.filter(a => a.approvedAt === null).length,
  }
}

export function getDrillsForLevel(
  attachments: DrillAttachment[],
  levelId: string,
): DrillAttachment[] {
  return attachments.filter(a => a.levelId === levelId)
}

export function getDrillsForDomain(
  attachments: DrillAttachment[],
  domain: DrillDomain,
): DrillAttachment[] {
  return attachments.filter(a => a.domain === domain)
}

export function getPlayerVisibleDrills(attachments: DrillAttachment[]): DrillAttachment[] {
  return attachments.filter(a => a.isPlayerVisible && a.approvedAt !== null)
}

export function getDrillDifficultyLabel(difficulty: DrillDifficulty): string {
  const labels: Record<DrillDifficulty, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  }
  return labels[difficulty]
}

export function getDrillDomainLabel(domain: DrillDomain): string {
  const labels: Record<DrillDomain, string> = {
    technical: 'Technical',
    tactical: 'Tactical',
    physical: 'Physical',
    mental: 'Mental',
    competition: 'Competition',
    footwork: 'Footwork',
  }
  return labels[domain]
}
