// Sprint 507 — Curriculum Node Detail Drawer
// Typed model for the level node detail drawer — tabs, field builders, context.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'

export type NodeDetailTab =
  | 'overview'
  | 'gates'
  | 'skills'
  | 'drills'
  | 'coach_cues'
  | 'missions_badges'
  | 'parent_guidance'
  | 'assessment'

export const NODE_DETAIL_TABS: { id: NodeDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'gates', label: 'Gates + Evidence' },
  { id: 'skills', label: 'Skills' },
  { id: 'drills', label: 'Drills' },
  { id: 'coach_cues', label: 'Coach Cues' },
  { id: 'missions_badges', label: 'Missions / Badges' },
  { id: 'parent_guidance', label: 'Parent Guidance' },
  { id: 'assessment', label: 'Assessment' },
]

export interface NodeDetailField {
  label: string
  value: string | null
  isVisible: boolean
  isParentVisible: boolean
  isPlayerVisible: boolean
  isEditable: boolean
  hint: string | null
}

export interface NodeDetailGateRow {
  gateId: string
  domain: string
  criterion: string
  threshold: string
  evidenceCount: number
  isMet: boolean
  isParentVisible: boolean
}

export interface NodeDetailDrawerContext {
  levelId: string
  levelName: string
  stage: CurriculumStage
  playerCount: number
  pendingApprovals: number
  openDraftCount: number
  lastReviewedAt: string | null
}

export interface NodeDetailDrawerView {
  context: NodeDetailDrawerContext
  activeTab: NodeDetailTab
  tabs: { id: NodeDetailTab; label: string; badgeCount?: number }[]
  overviewFields: NodeDetailField[]
  gates: NodeDetailGateRow[]
  gateCount: number
  metGateCount: number
  gateCompletionPct: number
  drillCount: number
  coachCueCount: number
  missionCount: number
  badgeCount: number
  parentGuidanceCount: number
  assessmentCriterionCount: number
  hasUnapprovedChanges: boolean
}

export function buildNodeDetailDrawerView(
  context: NodeDetailDrawerContext,
  activeTab: NodeDetailTab,
  gates: NodeDetailGateRow[],
  counts: {
    drills: number
    coachCues: number
    missions: number
    badges: number
    parentGuidance: number
    assessmentCriteria: number
  },
): NodeDetailDrawerView {
  const metGateCount = gates.filter(g => g.isMet).length
  const gateCompletionPct = gates.length > 0
    ? Math.round((metGateCount / gates.length) * 100)
    : 0

  const tabs = NODE_DETAIL_TABS.map(tab => {
    let badgeCount: number | undefined
    if (tab.id === 'gates') badgeCount = gates.length || undefined
    if (tab.id === 'drills') badgeCount = counts.drills || undefined
    if (tab.id === 'coach_cues') badgeCount = counts.coachCues || undefined
    if (tab.id === 'missions_badges') {
      const total = counts.missions + counts.badges
      badgeCount = total || undefined
    }
    if (tab.id === 'parent_guidance') badgeCount = counts.parentGuidance || undefined
    if (tab.id === 'assessment') badgeCount = counts.assessmentCriteria || undefined
    return { id: tab.id, label: tab.label, badgeCount }
  })

  const overviewFields: NodeDetailField[] = [
    {
      label: 'Level',
      value: context.levelName,
      isVisible: true,
      isParentVisible: true,
      isPlayerVisible: true,
      isEditable: true,
      hint: 'The display name shown to coaches, players, and parents.',
    },
    {
      label: 'Stage',
      value: context.stage,
      isVisible: true,
      isParentVisible: true,
      isPlayerVisible: true,
      isEditable: false,
      hint: 'Stage is set by the spine structure and cannot be changed here.',
    },
    {
      label: 'Players at this level',
      value: String(context.playerCount),
      isVisible: true,
      isParentVisible: false,
      isPlayerVisible: false,
      isEditable: false,
      hint: 'Count is live — updates as players advance.',
    },
    {
      label: 'Gate completion',
      value: `${gateCompletionPct}% (${metGateCount}/${gates.length} gates met)`,
      isVisible: true,
      isParentVisible: false,
      isPlayerVisible: false,
      isEditable: false,
      hint: 'Average across all players at this level.',
    },
    {
      label: 'Pending approvals',
      value: context.pendingApprovals > 0 ? String(context.pendingApprovals) : null,
      isVisible: context.pendingApprovals > 0,
      isParentVisible: false,
      isPlayerVisible: false,
      isEditable: false,
      hint: 'Curriculum changes waiting for director approval.',
    },
    {
      label: 'Last reviewed',
      value: context.lastReviewedAt,
      isVisible: true,
      isParentVisible: false,
      isPlayerVisible: false,
      isEditable: false,
      hint: null,
    },
  ]

  return {
    context,
    activeTab,
    tabs,
    overviewFields,
    gates,
    gateCount: gates.length,
    metGateCount,
    gateCompletionPct,
    drillCount: counts.drills,
    coachCueCount: counts.coachCues,
    missionCount: counts.missions,
    badgeCount: counts.badges,
    parentGuidanceCount: counts.parentGuidance,
    assessmentCriterionCount: counts.assessmentCriteria,
    hasUnapprovedChanges: context.openDraftCount > 0,
  }
}

export function getDrawerTabLabel(tab: NodeDetailTab): string {
  return NODE_DETAIL_TABS.find(t => t.id === tab)?.label ?? tab
}
