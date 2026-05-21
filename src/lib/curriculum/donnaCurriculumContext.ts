// Sprint 509 — DONNA Curriculum Context Awareness
// Typed model for DONNA's view of a curriculum node — drafts, proposals, knowledge items.
// DONNA can draft proposals. DONNA cannot publish, directly modify, or auto-promote anything.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'
import type { CurriculumDomain } from './inbox'

export type DonnaCurriculumAction =
  | 'draft_change_proposal'
  | 'summarize_level_gaps'
  | 'surface_knowledge_items'
  | 'suggest_drill_attachments'
  | 'suggest_coach_cues'
  | 'suggest_parent_guidance'

export interface DonnaCurriculumContextInput {
  levelId: string
  levelName: string
  stage: CurriculumStage
  openDraftCount: number
  pendingApprovalCount: number
  knowledgeItemCount: number
  gapCount: number
  recentVoiceIdeas: string[]
}

export interface DonnaCurriculumContextView {
  levelId: string
  levelName: string
  stage: CurriculumStage
  summary: string
  availableActions: DonnaCurriculumActionDef[]
  pendingApprovalCount: number
  openDraftCount: number
  knowledgeItemCount: number
  gapCount: number
  recentVoiceIdeas: string[]
  canPublish: false
  canAutoApply: false
  requiresDirectorApproval: true
  neverAutoApply: true
}

export interface DonnaCurriculumActionDef {
  action: DonnaCurriculumAction
  label: string
  description: string
  outputsProposedAction: boolean
  isAvailable: boolean
  unavailableReason: string | null
}

const DONNA_ACTION_DEFS: Record<DonnaCurriculumAction, Omit<DonnaCurriculumActionDef, 'isAvailable' | 'unavailableReason'>> = {
  draft_change_proposal: {
    action: 'draft_change_proposal',
    label: 'Draft a curriculum change',
    description: 'Create a change proposal for director review. Never auto-applied.',
    outputsProposedAction: true,
  },
  summarize_level_gaps: {
    action: 'summarize_level_gaps',
    label: 'Summarize level gaps',
    description: 'Identify what is missing at this level based on current gates and drills.',
    outputsProposedAction: false,
  },
  surface_knowledge_items: {
    action: 'surface_knowledge_items',
    label: 'Surface knowledge library items',
    description: 'Show knowledge library items tagged to this level for director review.',
    outputsProposedAction: false,
  },
  suggest_drill_attachments: {
    action: 'suggest_drill_attachments',
    label: 'Suggest drills',
    description: 'Surface relevant drills for director to review and attach.',
    outputsProposedAction: false,
  },
  suggest_coach_cues: {
    action: 'suggest_coach_cues',
    label: 'Suggest coach cues',
    description: 'Generate coach observation language for director to review.',
    outputsProposedAction: true,
  },
  suggest_parent_guidance: {
    action: 'suggest_parent_guidance',
    label: 'Suggest parent guidance',
    description: 'Draft parent-facing text for director to review before publishing.',
    outputsProposedAction: true,
  },
}

export function buildDonnaCurriculumContextView(
  input: DonnaCurriculumContextInput,
): DonnaCurriculumContextView {
  const { levelId, levelName, stage, openDraftCount, pendingApprovalCount, knowledgeItemCount, gapCount, recentVoiceIdeas } = input

  const availableActions: DonnaCurriculumActionDef[] = Object.values(DONNA_ACTION_DEFS).map(def => {
    let isAvailable = true
    let unavailableReason: string | null = null

    if (def.action === 'surface_knowledge_items' && knowledgeItemCount === 0) {
      isAvailable = false
      unavailableReason = 'No knowledge library items tagged to this level.'
    }

    return { ...def, isAvailable, unavailableReason }
  })

  const summaryParts: string[] = []
  if (gapCount > 0) summaryParts.push(`${gapCount} gap${gapCount > 1 ? 's' : ''} identified`)
  if (openDraftCount > 0) summaryParts.push(`${openDraftCount} open draft${openDraftCount > 1 ? 's' : ''}`)
  if (pendingApprovalCount > 0) summaryParts.push(`${pendingApprovalCount} pending approval${pendingApprovalCount > 1 ? 's' : ''}`)
  if (knowledgeItemCount > 0) summaryParts.push(`${knowledgeItemCount} knowledge item${knowledgeItemCount > 1 ? 's' : ''} available`)
  if (recentVoiceIdeas.length > 0) summaryParts.push(`${recentVoiceIdeas.length} recent voice idea${recentVoiceIdeas.length > 1 ? 's' : ''}`)
  const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : `${levelName} looks complete.`

  return {
    levelId,
    levelName,
    stage,
    summary,
    availableActions,
    pendingApprovalCount,
    openDraftCount,
    knowledgeItemCount,
    gapCount,
    recentVoiceIdeas,
    canPublish: false,
    canAutoApply: false,
    requiresDirectorApproval: true,
    neverAutoApply: true,
  }
}

export interface DonnaCurriculumDraftAttachment {
  draftId: string
  levelId: string
  levelName: string
  domain: CurriculumDomain | null
  draftText: string
  attachedAt: string
  requiresDirectorApproval: true
  neverAutoApply: true
  status: 'open' | 'submitted' | 'approved' | 'rejected'
}

export function buildDonnaCurriculumDraftAttachment(
  draftId: string,
  levelId: string,
  levelName: string,
  domain: CurriculumDomain | null,
  draftText: string,
): DonnaCurriculumDraftAttachment {
  return {
    draftId,
    levelId,
    levelName,
    domain,
    draftText,
    attachedAt: new Date().toISOString(),
    requiresDirectorApproval: true,
    neverAutoApply: true,
    status: 'open',
  }
}
