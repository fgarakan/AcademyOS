// Sprint 506 — Curriculum Expandable Tree
// Types and state helpers for the expandable curriculum tree in the builder.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'

export type TreeNodeType =
  | 'stage'
  | 'level'
  | 'gates_group'
  | 'gate'
  | 'drills_group'
  | 'drill'
  | 'skills_group'
  | 'skill'
  | 'sub_skill'
  | 'coach_cues_group'
  | 'coach_cue'
  | 'missions_group'
  | 'mission'
  | 'badges_group'
  | 'badge'
  | 'parent_guidance_group'
  | 'parent_guidance'
  | 'assessment_criteria_group'
  | 'assessment_criterion'
  | 'evidence_group'
  | 'evidence_requirement'

export interface TreeNode {
  id: string
  type: TreeNodeType
  label: string
  parentId: string | null
  depth: number
  hasChildren: boolean
  childCount: number
  isExpanded: boolean
  isSelected: boolean
  metadata: TreeNodeMetadata
}

export interface TreeNodeMetadata {
  stage?: CurriculumStage
  levelId?: string
  gateId?: string
  drillId?: string
  skillId?: string
  pendingApprovals?: number
  atRiskCount?: number
  playerCount?: number
  isParentVisible?: boolean
  isPlayerVisible?: boolean
}

export interface ExpandableTreeState {
  nodes: TreeNode[]
  expandedIds: string[]
  selectedId: string | null
}

export function createTreeState(nodes: TreeNode[]): ExpandableTreeState {
  return { nodes, expandedIds: [], selectedId: null }
}

export function toggleExpand(state: ExpandableTreeState, nodeId: string): ExpandableTreeState {
  const isExpanded = state.expandedIds.includes(nodeId)
  const expandedIds = isExpanded
    ? state.expandedIds.filter(id => id !== nodeId)
    : [...state.expandedIds, nodeId]
  const nodes = state.nodes.map(n =>
    n.id === nodeId ? { ...n, isExpanded: !isExpanded } : n,
  )
  return { ...state, nodes, expandedIds }
}

export function selectNode(state: ExpandableTreeState, nodeId: string): ExpandableTreeState {
  const nodes = state.nodes.map(n => ({ ...n, isSelected: n.id === nodeId }))
  return { ...state, nodes, selectedId: nodeId }
}

export function expandAll(state: ExpandableTreeState): ExpandableTreeState {
  const expandedIds = state.nodes.filter(n => n.hasChildren).map(n => n.id)
  const nodes = state.nodes.map(n => ({ ...n, isExpanded: n.hasChildren }))
  return { ...state, nodes, expandedIds }
}

export function collapseAll(state: ExpandableTreeState): ExpandableTreeState {
  const nodes = state.nodes.map(n => ({ ...n, isExpanded: false }))
  return { ...state, nodes, expandedIds: [] }
}

export function expandToNode(state: ExpandableTreeState, nodeId: string): ExpandableTreeState {
  const targetNode = state.nodes.find(n => n.id === nodeId)
  if (!targetNode) return state

  const ancestorIds: string[] = []
  let currentParentId = targetNode.parentId
  while (currentParentId !== null) {
    ancestorIds.push(currentParentId)
    const parent = state.nodes.find(n => n.id === currentParentId)
    currentParentId = parent?.parentId ?? null
  }

  const expandedIds = Array.from(new Set([...state.expandedIds, ...ancestorIds]))
  const nodes = state.nodes.map(n => ({
    ...n,
    isExpanded: expandedIds.includes(n.id),
    isSelected: n.id === nodeId,
  }))
  return { ...state, nodes, expandedIds, selectedId: nodeId }
}

export function getVisibleNodes(state: ExpandableTreeState): TreeNode[] {
  const result: TreeNode[] = []
  for (const node of state.nodes) {
    if (node.depth === 0) {
      result.push(node)
      continue
    }
    if (node.parentId !== null && state.expandedIds.includes(node.parentId)) {
      result.push(node)
    }
  }
  return result
}

export function getChildNodes(state: ExpandableTreeState, parentId: string): TreeNode[] {
  return state.nodes.filter(n => n.parentId === parentId)
}

export function buildGroupNode(
  id: string,
  type: TreeNodeType,
  label: string,
  parentId: string,
  depth: number,
  childCount: number,
  metadata: TreeNodeMetadata = {},
): TreeNode {
  return {
    id,
    type,
    label: childCount > 0 ? `${label} (${childCount})` : label,
    parentId,
    depth,
    hasChildren: childCount > 0,
    childCount,
    isExpanded: false,
    isSelected: false,
    metadata,
  }
}
