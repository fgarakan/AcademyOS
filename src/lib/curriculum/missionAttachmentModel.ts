// Sprint 512 — Mission Attachment Model
// Links player missions to curriculum levels.
// Missions are defined in src/lib/player/missionModel.ts.
// This module is the curriculum-side attachment view — no DB mutations.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { MissionId } from '@/lib/player/missionModel'

export interface MissionLevelAttachment {
  attachmentId: string
  missionId: MissionId
  missionLabel: string
  missionCategory: string
  missionDifficulty: 'easy' | 'medium' | 'hard'
  levelId: string
  levelName: string
  isPlayerVisible: boolean
  isParentVisible: boolean
  attachedAt: string
  approvedAt: string | null
  approvedBy: string | null
  activationTrigger: MissionActivationTrigger
  completionTrigger: MissionCompletionTrigger
}

export type MissionActivationTrigger =
  | 'on_level_entry'
  | 'on_gate_progress'
  | 'manual'

export type MissionCompletionTrigger =
  | 'gate_met'
  | 'attendance_count'
  | 'assessment_passed'
  | 'director_marks_complete'
  | 'manual'

export interface MissionAttachmentSummary {
  totalMissions: number
  playerVisibleCount: number
  parentVisibleCount: number
  pendingApprovalCount: number
  byActivationTrigger: Record<MissionActivationTrigger, number>
}

export function buildMissionAttachmentSummary(
  attachments: MissionLevelAttachment[],
): MissionAttachmentSummary {
  const byActivationTrigger: Record<MissionActivationTrigger, number> = {
    on_level_entry: 0,
    on_gate_progress: 0,
    manual: 0,
  }

  for (const a of attachments) {
    byActivationTrigger[a.activationTrigger] = (byActivationTrigger[a.activationTrigger] ?? 0) + 1
  }

  return {
    totalMissions: attachments.length,
    playerVisibleCount: attachments.filter(a => a.isPlayerVisible).length,
    parentVisibleCount: attachments.filter(a => a.isParentVisible).length,
    pendingApprovalCount: attachments.filter(a => a.approvedAt === null).length,
    byActivationTrigger,
  }
}

export function getMissionsForLevel(
  attachments: MissionLevelAttachment[],
  levelId: string,
): MissionLevelAttachment[] {
  return attachments.filter(a => a.levelId === levelId && a.approvedAt !== null)
}

export function getPlayerVisibleMissions(
  attachments: MissionLevelAttachment[],
): MissionLevelAttachment[] {
  return attachments.filter(a => a.isPlayerVisible && a.approvedAt !== null)
}

export function getMissionActivationLabel(trigger: MissionActivationTrigger): string {
  const labels: Record<MissionActivationTrigger, string> = {
    on_level_entry: 'Activated when player enters level',
    on_gate_progress: 'Activated on gate progress',
    manual: 'Manually activated',
  }
  return labels[trigger]
}

export function getMissionCompletionLabel(trigger: MissionCompletionTrigger): string {
  const labels: Record<MissionCompletionTrigger, string> = {
    gate_met: 'Completed when gate is met',
    attendance_count: 'Completed on attendance milestone',
    assessment_passed: 'Completed when assessment passed',
    director_marks_complete: 'Director marks complete',
    manual: 'Manually completed',
  }
  return labels[trigger]
}
