// Sprint 515 — Coach Cue Library
// Coach observation language and prompts attached to curriculum levels.
// Coach cues are NEVER parent or player visible.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { SkillDomain } from './skillHierarchyModel'

export type CoachCueType =
  | 'observation_prompt'
  | 'correction_language'
  | 'reinforcement_language'
  | 'gate_check_prompt'
  | 'session_setup_note'

export interface CoachCue {
  cueId: string
  levelId: string
  levelName: string
  domain: SkillDomain
  type: CoachCueType
  prompt: string
  context: string | null
  linkedGateId: string | null
  linkedSkillId: string | null
  isParentVisible: false
  isPlayerVisible: false
  attachedAt: string
  approvedAt: string | null
  approvedBy: string | null
  displayOrder: number
}

export interface CoachCueLibrarySummary {
  totalCues: number
  byDomain: Record<SkillDomain, number>
  byType: Record<CoachCueType, number>
  gateLinkedCount: number
  skillLinkedCount: number
  pendingApprovalCount: number
}

export function buildCoachCueLibrarySummary(cues: CoachCue[]): CoachCueLibrarySummary {
  const byDomain: Record<SkillDomain, number> = {
    technical: 0,
    tactical: 0,
    footwork: 0,
    serve_return: 0,
    rally: 0,
    net_play: 0,
    competition: 0,
    fitness: 0,
    mental: 0,
  }
  const byType: Record<CoachCueType, number> = {
    observation_prompt: 0,
    correction_language: 0,
    reinforcement_language: 0,
    gate_check_prompt: 0,
    session_setup_note: 0,
  }

  for (const cue of cues) {
    byDomain[cue.domain] = (byDomain[cue.domain] ?? 0) + 1
    byType[cue.type] = (byType[cue.type] ?? 0) + 1
  }

  return {
    totalCues: cues.length,
    byDomain,
    byType,
    gateLinkedCount: cues.filter(c => c.linkedGateId !== null).length,
    skillLinkedCount: cues.filter(c => c.linkedSkillId !== null).length,
    pendingApprovalCount: cues.filter(c => c.approvedAt === null).length,
  }
}

export function getCuesForLevel(cues: CoachCue[], levelId: string): CoachCue[] {
  return cues
    .filter(c => c.levelId === levelId && c.approvedAt !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

export function getCuesForGate(cues: CoachCue[], gateId: string): CoachCue[] {
  return cues.filter(c => c.linkedGateId === gateId && c.approvedAt !== null)
}

export function getCuesForDomain(cues: CoachCue[], domain: SkillDomain): CoachCue[] {
  return cues.filter(c => c.domain === domain && c.approvedAt !== null)
}

export function getObservationPrompts(cues: CoachCue[], levelId: string): CoachCue[] {
  return cues.filter(
    c => c.levelId === levelId && c.type === 'observation_prompt' && c.approvedAt !== null,
  )
}

export function getGateCheckPrompts(cues: CoachCue[], gateId: string): CoachCue[] {
  return cues.filter(
    c => c.linkedGateId === gateId && c.type === 'gate_check_prompt' && c.approvedAt !== null,
  )
}

export function getCoachCueTypeLabel(type: CoachCueType): string {
  const labels: Record<CoachCueType, string> = {
    observation_prompt: 'Observation prompt',
    correction_language: 'Correction language',
    reinforcement_language: 'Reinforcement language',
    gate_check_prompt: 'Gate check prompt',
    session_setup_note: 'Session setup note',
  }
  return labels[type]
}
