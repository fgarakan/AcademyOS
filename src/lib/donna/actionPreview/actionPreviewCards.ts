// Sprint 469 — DONNA Action Preview Cards V1
// Typed model for action preview cards shown before director approval.
// Every proposed action must be previewed before it enters the approval pipeline.
// Pure types and builders. No DB calls.

import type { Database } from '@/lib/supabase/database.types'

type ActionType = Database['public']['Enums']['action_type']

// ── Risk levels ────────────────────────────────────────────────────────────────

export type ActionRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export const RISK_LEVEL_LABELS: Record<ActionRiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  critical: 'Critical — director required',
}

export const RISK_LEVEL_COLORS: Record<ActionRiskLevel, string> = {
  low: 'text-status-green',
  medium: 'text-status-orange',
  high: 'text-status-red',
  critical: 'text-status-red',
}

// ── Action preview card model ─────────────────────────────────────────────────

export interface AffectedEntity {
  type: 'player' | 'group' | 'coach' | 'template' | 'session' | 'curriculum' | 'badge' | 'mission'
  id: string | null
  label: string
}

export interface ActionPreviewCard {
  actionType: ActionType
  actionLabel: string
  summary: string
  donnaReasoning: string
  affectedEntities: AffectedEntity[]
  riskLevel: ActionRiskLevel
  requiresDirectorApproval: boolean
  whatWillChange: string[]
  whatWillNotChange: string[]
  dataSource: string | null
  confidence: 'high' | 'partial' | 'low'
  expiresInHours: number
}

// ── Risk inference ────────────────────────────────────────────────────────────

const HIGH_RISK_ACTION_TYPES: ActionType[] = [
  'move_player_group',
  'create_placement_assessment',
  'generate_parent_update',
  'flag_player',
]

const MEDIUM_RISK_ACTION_TYPES: ActionType[] = [
  'modify_session',
  'modify_template',
  'create_session',
  'schedule_reassessment',
  'assign_group',
]

export function inferActionRisk(actionType: ActionType): ActionRiskLevel {
  if (HIGH_RISK_ACTION_TYPES.includes(actionType)) return 'high'
  if (MEDIUM_RISK_ACTION_TYPES.includes(actionType)) return 'medium'
  return 'low'
}

// ── Preview card builder ──────────────────────────────────────────────────────

export function buildActionPreviewCard(params: {
  actionType: ActionType
  actionLabel: string
  summary: string
  donnaReasoning: string
  affectedEntities: AffectedEntity[]
  whatWillChange: string[]
  whatWillNotChange?: string[]
  dataSource?: string | null
  confidence?: 'high' | 'partial' | 'low'
  expiresInHours?: number
}): ActionPreviewCard {
  const riskLevel = inferActionRisk(params.actionType)

  return {
    actionType: params.actionType,
    actionLabel: params.actionLabel,
    summary: params.summary,
    donnaReasoning: params.donnaReasoning,
    affectedEntities: params.affectedEntities,
    riskLevel,
    requiresDirectorApproval: riskLevel === 'high' || riskLevel === 'critical',
    whatWillChange: params.whatWillChange,
    whatWillNotChange: params.whatWillNotChange ?? [
      'No data is deleted.',
      'No communications are sent automatically.',
      'Changes can be reviewed in the audit log.',
    ],
    dataSource: params.dataSource ?? null,
    confidence: params.confidence ?? 'partial',
    expiresInHours: params.expiresInHours ?? 72,
  }
}

// ── Preview card summary text ─────────────────────────────────────────────────

export function getPreviewCardSummaryLine(card: ActionPreviewCard): string {
  const entities = card.affectedEntities.map(e => e.label).join(', ')
  return `${card.actionLabel} — affects: ${entities || 'no specific entity'}`
}

export function getPreviewCardRiskLabel(card: ActionPreviewCard): string {
  return RISK_LEVEL_LABELS[card.riskLevel]
}
