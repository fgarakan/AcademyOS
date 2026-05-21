// Sprint 524 — Template Connection Model
// Models the connection between session templates and curriculum levels.
// Templates carry curriculum context so coaches always train to the right level.
// Pure TypeScript — no DB calls, no AI, no side effects.

import type { CurriculumStage } from './visualMapModel'

export type TemplateConnectionStatus =
  | 'connected'
  | 'partially_connected'
  | 'not_connected'

export interface TemplateConnection {
  templateId: string
  templateName: string
  levelId: string
  levelName: string
  stage: CurriculumStage
  connectionStrength: 'primary' | 'secondary' | 'supplemental'
  drillOverlapCount: number
  gateOverlapCount: number
  approvedAt: string | null
}

export interface LevelTemplateConnectionSummary {
  levelId: string
  levelName: string
  stage: CurriculumStage
  connectedTemplateCount: number
  primaryTemplateCount: number
  status: TemplateConnectionStatus
  templates: TemplateConnection[]
}

export interface CurriculumTemplateConnectionReport {
  levels: LevelTemplateConnectionSummary[]
  totalConnections: number
  disconnectedLevelCount: number
  partiallyConnectedLevelCount: number
  fullyConnectedLevelCount: number
  recommendedConnections: TemplateConnectionRecommendation[]
}

export interface TemplateConnectionRecommendation {
  levelId: string
  levelName: string
  reason: string
  suggestedTemplateType: string
}

export function buildLevelTemplateConnectionSummary(
  levelId: string,
  levelName: string,
  stage: CurriculumStage,
  connections: TemplateConnection[],
): LevelTemplateConnectionSummary {
  const levelConnections = connections.filter(c => c.levelId === levelId && c.approvedAt !== null)
  const primaryCount = levelConnections.filter(c => c.connectionStrength === 'primary').length

  let status: TemplateConnectionStatus
  if (levelConnections.length === 0) {
    status = 'not_connected'
  } else if (primaryCount === 0) {
    status = 'partially_connected'
  } else {
    status = 'connected'
  }

  return {
    levelId,
    levelName,
    stage,
    connectedTemplateCount: levelConnections.length,
    primaryTemplateCount: primaryCount,
    status,
    templates: levelConnections,
  }
}

export function buildCurriculumTemplateConnectionReport(
  levelSummaries: LevelTemplateConnectionSummary[],
): CurriculumTemplateConnectionReport {
  const totalConnections = levelSummaries.reduce((sum, l) => sum + l.connectedTemplateCount, 0)
  const disconnectedLevelCount = levelSummaries.filter(l => l.status === 'not_connected').length
  const partiallyConnectedLevelCount = levelSummaries.filter(l => l.status === 'partially_connected').length
  const fullyConnectedLevelCount = levelSummaries.filter(l => l.status === 'connected').length

  const recommendedConnections: TemplateConnectionRecommendation[] = levelSummaries
    .filter(l => l.status === 'not_connected')
    .map(l => ({
      levelId: l.levelId,
      levelName: l.levelName,
      reason: `No templates connected to ${l.levelName} — coaches have no structured session content for this level.`,
      suggestedTemplateType: `${l.stage} baseline session`,
    }))

  return {
    levels: levelSummaries,
    totalConnections,
    disconnectedLevelCount,
    partiallyConnectedLevelCount,
    fullyConnectedLevelCount,
    recommendedConnections,
  }
}

export function getConnectionStatusLabel(status: TemplateConnectionStatus): string {
  const labels: Record<TemplateConnectionStatus, string> = {
    connected: 'Connected',
    partially_connected: 'Partially connected',
    not_connected: 'Not connected',
  }
  return labels[status]
}

export function getConnectionStrengthLabel(strength: 'primary' | 'secondary' | 'supplemental'): string {
  const labels: Record<'primary' | 'secondary' | 'supplemental', string> = {
    primary: 'Primary',
    secondary: 'Secondary',
    supplemental: 'Supplemental',
  }
  return labels[strength]
}
