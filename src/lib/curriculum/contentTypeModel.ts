// Sprint 508 — Curriculum Content Type Model
// Registry of "+ Add" content types for curriculum level nodes.
// All additions go through proposed_actions → director approval. Never auto-applied.
// Pure TypeScript — no DB calls, no AI, no side effects.

export type CurriculumContentType =
  | 'drill'
  | 'coach_cue'
  | 'assessment_criterion'
  | 'mission'
  | 'badge'
  | 'parent_guidance'
  | 'learning_module'
  | 'skill'
  | 'sub_skill'
  | 'evidence_requirement'

export interface ContentTypeDefinition {
  type: CurriculumContentType
  label: string
  description: string
  requiresApproval: boolean
  isParentVisible: boolean
  isPlayerVisible: boolean
  isCoachOnly: boolean
  iconName: string
  addCtaLabel: string
  emptyStateText: string
}

export const CONTENT_TYPE_DEFINITIONS: Record<CurriculumContentType, ContentTypeDefinition> = {
  drill: {
    type: 'drill',
    label: 'Drill',
    description: 'Attach an existing drill or create a new drill reference for this level.',
    requiresApproval: true,
    isParentVisible: false,
    isPlayerVisible: true,
    isCoachOnly: false,
    iconName: 'Zap',
    addCtaLabel: 'Add Drill',
    emptyStateText: 'No drills attached to this level yet.',
  },
  coach_cue: {
    type: 'coach_cue',
    label: 'Coach Cue',
    description: 'Add observation language and coaching prompts for this level.',
    requiresApproval: true,
    isParentVisible: false,
    isPlayerVisible: false,
    isCoachOnly: true,
    iconName: 'MessageSquare',
    addCtaLabel: 'Add Coach Cue',
    emptyStateText: 'No coach cues added for this level.',
  },
  assessment_criterion: {
    type: 'assessment_criterion',
    label: 'Assessment Criterion',
    description: 'Add a formal assessment gate requiring documented evidence.',
    requiresApproval: true,
    isParentVisible: false,
    isPlayerVisible: false,
    isCoachOnly: false,
    iconName: 'ClipboardCheck',
    addCtaLabel: 'Add Assessment Criterion',
    emptyStateText: 'No assessment criteria defined for this level.',
  },
  mission: {
    type: 'mission',
    label: 'Mission',
    description: 'Link an existing mission to this curriculum level as a player goal.',
    requiresApproval: true,
    isParentVisible: true,
    isPlayerVisible: true,
    isCoachOnly: false,
    iconName: 'Target',
    addCtaLabel: 'Link Mission',
    emptyStateText: 'No missions linked to this level.',
  },
  badge: {
    type: 'badge',
    label: 'Badge',
    description: 'Link a badge trigger so players earn recognition at this level.',
    requiresApproval: true,
    isParentVisible: true,
    isPlayerVisible: true,
    isCoachOnly: false,
    iconName: 'Award',
    addCtaLabel: 'Link Badge',
    emptyStateText: 'No badges linked to this level.',
  },
  parent_guidance: {
    type: 'parent_guidance',
    label: 'Parent Guidance',
    description: 'Add parent-facing explanation of what their child is working on at this level.',
    requiresApproval: true,
    isParentVisible: true,
    isPlayerVisible: false,
    isCoachOnly: false,
    iconName: 'Heart',
    addCtaLabel: 'Add Parent Guidance',
    emptyStateText: 'No parent guidance added for this level.',
  },
  learning_module: {
    type: 'learning_module',
    label: 'Learning Module',
    description: 'Add a player-facing learning module reference for this level.',
    requiresApproval: true,
    isParentVisible: false,
    isPlayerVisible: true,
    isCoachOnly: false,
    iconName: 'BookOpen',
    addCtaLabel: 'Add Learning Module',
    emptyStateText: 'No learning modules linked to this level.',
  },
  skill: {
    type: 'skill',
    label: 'Skill',
    description: 'Add a skill that players develop at this curriculum level.',
    requiresApproval: true,
    isParentVisible: false,
    isPlayerVisible: true,
    isCoachOnly: false,
    iconName: 'Star',
    addCtaLabel: 'Add Skill',
    emptyStateText: 'No skills defined for this level.',
  },
  sub_skill: {
    type: 'sub_skill',
    label: 'Sub-Skill',
    description: 'Add a sub-skill component of a parent skill at this level.',
    requiresApproval: true,
    isParentVisible: false,
    isPlayerVisible: false,
    isCoachOnly: false,
    iconName: 'GitBranch',
    addCtaLabel: 'Add Sub-Skill',
    emptyStateText: 'No sub-skills defined.',
  },
  evidence_requirement: {
    type: 'evidence_requirement',
    label: 'Evidence Requirement',
    description: 'Define what counts as evidence for a gate criterion.',
    requiresApproval: true,
    isParentVisible: false,
    isPlayerVisible: false,
    isCoachOnly: false,
    iconName: 'FileText',
    addCtaLabel: 'Add Evidence Requirement',
    emptyStateText: 'No evidence requirements defined for this gate.',
  },
}

export const LEVEL_ADD_CONTENT_TYPES: CurriculumContentType[] = [
  'drill',
  'coach_cue',
  'assessment_criterion',
  'mission',
  'badge',
  'parent_guidance',
  'learning_module',
  'skill',
  'evidence_requirement',
]

export function getContentTypeDefinition(type: CurriculumContentType): ContentTypeDefinition {
  return CONTENT_TYPE_DEFINITIONS[type]
}

export function getAddableContentTypes(): ContentTypeDefinition[] {
  return LEVEL_ADD_CONTENT_TYPES.map(t => CONTENT_TYPE_DEFINITIONS[t])
}

export function getParentVisibleContentTypes(): CurriculumContentType[] {
  return LEVEL_ADD_CONTENT_TYPES.filter(t => CONTENT_TYPE_DEFINITIONS[t].isParentVisible)
}

export function getPlayerVisibleContentTypes(): CurriculumContentType[] {
  return LEVEL_ADD_CONTENT_TYPES.filter(t => CONTENT_TYPE_DEFINITIONS[t].isPlayerVisible)
}

export function getCoachOnlyContentTypes(): CurriculumContentType[] {
  return LEVEL_ADD_CONTENT_TYPES.filter(t => CONTENT_TYPE_DEFINITIONS[t].isCoachOnly)
}
