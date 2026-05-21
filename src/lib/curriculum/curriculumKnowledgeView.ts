// Sprint 551 — Curriculum Knowledge View
// Connects curriculum level views to the Knowledge Engine.
// Provides a unified view of curriculum + knowledge for the director.
// Directors see both curriculum content and relevant knowledge items side-by-side.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { KnowledgeItem } from '@/lib/knowledge/knowledgeTypes'
import type { KnowledgeGapMatch } from '@/lib/knowledge/knowledgeCurriculumIntelligence'
import type { CurriculumStage } from './visualMapModel'
import type { LevelCoverageScore } from './coverageModel'
import type { LevelHealthReport } from './levelHealthReport'

export interface CurriculumKnowledgePanelView {
  levelId: string
  levelName: string
  stage: CurriculumStage
  coverage: LevelCoverageScore
  health: LevelHealthReport
  relevantKnowledgeItems: KnowledgeItem[]
  gapMatchedItems: KnowledgeGapMatch[]
  knowledgeItemCount: number
  gapMatchCount: number
  hasKnowledgeSupport: boolean
  promotableCandidates: KnowledgeItem[]
  promotableCandidateCount: number
  requiresDirectorAction: boolean
  primaryDirectorAction: string | null
  isParentVisible: false
  isPlayerVisible: false
}

export function buildCurriculumKnowledgePanelView(
  levelId: string,
  levelName: string,
  stage: CurriculumStage,
  coverage: LevelCoverageScore,
  health: LevelHealthReport,
  relevantKnowledgeItems: KnowledgeItem[],
  gapMatches: KnowledgeGapMatch[],
): CurriculumKnowledgePanelView {
  const levelGapMatches = gapMatches.filter(m => m.gap.levelId === levelId && m.matchingItems.length > 0)
  const knowledgeItemCount = relevantKnowledgeItems.length
  const gapMatchCount = levelGapMatches.length
  const hasKnowledgeSupport = knowledgeItemCount > 0

  const promotableCandidates = relevantKnowledgeItems.filter(
    item => item.status === 'approved_general',
  )

  let requiresDirectorAction = false
  let primaryDirectorAction: string | null = null

  if (health.healthStatus === 'critical' && promotableCandidates.length > 0) {
    requiresDirectorAction = true
    primaryDirectorAction = `Review ${promotableCandidates.length} knowledge item${promotableCandidates.length > 1 ? 's' : ''} that could help fill critical gaps at ${levelName}.`
  } else if (health.healthStatus === 'at_risk' && gapMatchCount > 0) {
    requiresDirectorAction = true
    primaryDirectorAction = `${gapMatchCount} knowledge item${gapMatchCount > 1 ? 's' : ''} matched to gaps at ${levelName} — review and promote if suitable.`
  }

  return {
    levelId,
    levelName,
    stage,
    coverage,
    health,
    relevantKnowledgeItems,
    gapMatchedItems: levelGapMatches,
    knowledgeItemCount,
    gapMatchCount,
    hasKnowledgeSupport,
    promotableCandidates,
    promotableCandidateCount: promotableCandidates.length,
    requiresDirectorAction,
    primaryDirectorAction,
    isParentVisible: false,
    isPlayerVisible: false,
  }
}

export function getCurriculumKnowledgePanelSummary(panel: CurriculumKnowledgePanelView): string {
  const parts: string[] = []
  if (panel.knowledgeItemCount > 0) {
    parts.push(`${panel.knowledgeItemCount} knowledge item${panel.knowledgeItemCount > 1 ? 's' : ''} available`)
  }
  if (panel.promotableCandidateCount > 0) {
    parts.push(`${panel.promotableCandidateCount} eligible for curriculum promotion`)
  }
  if (panel.gapMatchCount > 0) {
    parts.push(`${panel.gapMatchCount} gap${panel.gapMatchCount > 1 ? 's' : ''} matched`)
  }
  if (parts.length === 0) return 'No knowledge support for this level yet.'
  return parts.join(' · ')
}
