// Sprint 504 — Curriculum Command Center View Model
// Aggregates curriculum layer data for the director curriculum hub view.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumSetupState } from './curriculumSetupTypes'

export type CurriculumCommandCenterStatus =
  | 'not_started'
  | 'setup_in_progress'
  | 'active'
  | 'needs_review'

export interface LevelSummary {
  levelId: string
  levelName: string
  stage: string
  playerCount: number
  gateCount: number
  drillCount: number
  pendingApprovals: number
  atRiskCount: number
}

export interface CurriculumCommandCenterInput {
  setupState: CurriculumSetupState | null
  levels: LevelSummary[]
  totalPendingApprovals: number
  knowledgeLibraryItemCount: number
  openDraftCount: number
  lastUpdatedAt: string | null
}

export interface CurriculumCommandCenterView {
  status: CurriculumCommandCenterStatus
  statusLabel: string
  statusDescription: string
  levels: LevelSummary[]
  totalLevels: number
  totalPlayers: number
  totalGates: number
  totalDrills: number
  atRiskLevels: LevelSummary[]
  totalPendingApprovals: number
  knowledgeLibraryItemCount: number
  openDraftCount: number
  primaryCtaLabel: string
  primaryCtaHref: string
  lastUpdatedAt: string | null
}

export function buildCurriculumCommandCenter(
  input: CurriculumCommandCenterInput,
): CurriculumCommandCenterView {
  const { setupState, levels, totalPendingApprovals, knowledgeLibraryItemCount, openDraftCount, lastUpdatedAt } = input

  const isSetupComplete = setupState !== null &&
    (setupState.spine_status === 'approved' || setupState.spine_status === 'customized') &&
    setupState.curriculum_source_status === 'selected' &&
    (setupState.domains_status === 'approved' || setupState.domains_status === 'customized')

  let status: CurriculumCommandCenterStatus
  let statusLabel: string
  let statusDescription: string
  let primaryCtaLabel: string
  let primaryCtaHref: string

  if (!setupState || setupState.spine_status === 'not_started') {
    status = 'not_started'
    statusLabel = 'Not started'
    statusDescription = 'Start curriculum setup to create your academy development spine.'
    primaryCtaLabel = 'Start Setup'
    primaryCtaHref = '/director/onboarding/curriculum'
  } else if (!isSetupComplete) {
    status = 'setup_in_progress'
    statusLabel = 'Setup in progress'
    statusDescription = 'Complete the 3 required setup steps to activate your curriculum.'
    primaryCtaLabel = 'Continue Setup'
    primaryCtaHref = '/director/onboarding/curriculum'
  } else if (totalPendingApprovals > 0) {
    status = 'needs_review'
    statusLabel = 'Pending review'
    statusDescription = `${totalPendingApprovals} curriculum change${totalPendingApprovals > 1 ? 's' : ''} waiting for your approval.`
    primaryCtaLabel = 'Review Changes'
    primaryCtaHref = '/director/review'
  } else {
    status = 'active'
    statusLabel = 'Active'
    statusDescription = 'Curriculum is active and connected to players, sessions, and templates.'
    primaryCtaLabel = 'Open Curriculum Builder'
    primaryCtaHref = '/director/curriculum/builder'
  }

  const atRiskLevels = levels.filter(l => l.atRiskCount > 0 || l.pendingApprovals > 0)
  const totalPlayers = levels.reduce((sum, l) => sum + l.playerCount, 0)
  const totalGates = levels.reduce((sum, l) => sum + l.gateCount, 0)
  const totalDrills = levels.reduce((sum, l) => sum + l.drillCount, 0)

  return {
    status,
    statusLabel,
    statusDescription,
    levels,
    totalLevels: levels.length,
    totalPlayers,
    totalGates,
    totalDrills,
    atRiskLevels,
    totalPendingApprovals,
    knowledgeLibraryItemCount,
    openDraftCount,
    primaryCtaLabel,
    primaryCtaHref,
    lastUpdatedAt,
  }
}

export function getCurriculumCommandCenterSummary(view: CurriculumCommandCenterView): string {
  if (view.status === 'not_started') return 'Curriculum not yet started.'
  if (view.status === 'setup_in_progress') return 'Setup in progress — complete required steps.'
  const parts: string[] = []
  parts.push(`${view.totalLevels} levels`)
  parts.push(`${view.totalPlayers} players`)
  if (view.totalPendingApprovals > 0) parts.push(`${view.totalPendingApprovals} pending approvals`)
  if (view.atRiskLevels.length > 0) parts.push(`${view.atRiskLevels.length} levels need attention`)
  return parts.join(' · ')
}
