// Sprint 498 — Curriculum Draft Helpers V1
// Builds curriculum change draft proposals for the director review queue.
// Takes CurriculumInboxItem → builds proposed_action payload.
// All curriculum changes require director approval via the proposed_actions pipeline.
// Pure TypeScript — no DB calls.

import type { CurriculumInboxItem, CurriculumDomain } from './inbox'

export type CurriculumChangeType =
  | 'add_requirement'
  | 'remove_requirement'
  | 'modify_requirement'
  | 'add_exercise'
  | 'modify_level'
  | 'note'

export interface CurriculumDraftProposal {
  inboxItemId: string
  changeType: CurriculumChangeType
  targetLevelId: string | null
  targetDomain: CurriculumDomain | null
  proposedText: string
  rationale: string | null
  riskLevel: 'low' | 'medium' | 'high'
  requiresDirectorApproval: true
  affectedPlayerCount: number | null
  proposedActionPayload: Record<string, unknown>
  createdAt: string
}

export interface CurriculumDraftValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateCurriculumDraft(
  item: CurriculumInboxItem,
  changeType: CurriculumChangeType,
): CurriculumDraftValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!item.idea || item.idea.trim().length < 10) {
    errors.push('Curriculum idea text is too short to create a draft proposal.')
  }

  if (changeType === 'remove_requirement' || changeType === 'modify_level') {
    warnings.push('This change type affects existing players — review impact carefully before approving.')
  }

  if (item.similarityFlag) {
    warnings.push('Similar curriculum idea already exists — review for duplication before approving.')
  }

  return { valid: errors.length === 0, errors, warnings }
}

function inferChangeType(item: CurriculumInboxItem): CurriculumChangeType {
  const text = item.idea.toLowerCase()
  if (text.includes('remove') || text.includes('drop') || text.includes('delete')) return 'remove_requirement'
  if (text.includes('modify') || text.includes('change') || text.includes('update')) return 'modify_requirement'
  if (text.includes('exercise') || text.includes('drill') || text.includes('activity')) return 'add_exercise'
  return 'add_requirement'
}

function inferRiskLevel(changeType: CurriculumChangeType, item: CurriculumInboxItem): 'low' | 'medium' | 'high' {
  if (changeType === 'remove_requirement' || changeType === 'modify_level') return 'high'
  if (changeType === 'modify_requirement') return 'medium'
  if (item.similarityFlag) return 'medium'
  return 'low'
}

export function buildCurriculumDraftProposal(
  item: CurriculumInboxItem,
  overrideChangeType?: CurriculumChangeType,
  rationale?: string | null,
  targetLevelId?: string | null,
  affectedPlayerCount?: number | null,
): CurriculumDraftProposal {
  const changeType = overrideChangeType ?? inferChangeType(item)
  const riskLevel = inferRiskLevel(changeType, item)

  const proposedActionPayload: Record<string, unknown> = {
    inboxItemId: item.id,
    idea: item.idea,
    domain: item.domain,
    sourceType: item.sourceType,
    proposedLevel: item.proposedLevel ?? targetLevelId ?? null,
    changeType,
    requiresDirectorApproval: true,
    neverAutoApply: true,
  }

  return {
    inboxItemId: item.id,
    changeType,
    targetLevelId: targetLevelId ?? item.proposedLevel ?? null,
    targetDomain: item.domain,
    proposedText: item.idea,
    rationale: rationale ?? null,
    riskLevel,
    requiresDirectorApproval: true,
    affectedPlayerCount: affectedPlayerCount ?? null,
    proposedActionPayload,
    createdAt: new Date().toISOString(),
  }
}

export function formatCurriculumDraftLabel(draft: CurriculumDraftProposal): string {
  const changeLabel: Record<CurriculumChangeType, string> = {
    add_requirement: 'Add requirement',
    remove_requirement: 'Remove requirement',
    modify_requirement: 'Modify requirement',
    add_exercise: 'Add exercise',
    modify_level: 'Modify level',
    note: 'Curriculum note',
  }
  const domainLabel = draft.targetDomain ? ` (${draft.targetDomain})` : ''
  const levelLabel = draft.targetLevelId ? ` — ${draft.targetLevelId}` : ''
  return `${changeLabel[draft.changeType]}${domainLabel}${levelLabel}: "${draft.proposedText.slice(0, 60)}${draft.proposedText.length > 60 ? '…' : ''}"`
}

export function getCurriculumChangeRiskLabel(riskLevel: 'low' | 'medium' | 'high'): string {
  return { low: 'Low risk', medium: 'Moderate risk', high: 'High risk — director approval required' }[riskLevel]
}
