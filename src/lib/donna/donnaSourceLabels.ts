// Sprint 1017 — DONNA Answer Source Labels V1
// Defines the vocabulary of source labels for all DONNA answers.
// Every DONNA answer should cite its source — this module provides the shapes and builders.
// No DB calls. No DB writes.

import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'

// ── Source domain ─────────────────────────────────────────────────────────────

export type DonnaSourceDomain =
  | 'sessions'
  | 'players'
  | 'coaches'
  | 'templates'
  | 'curriculum'
  | 'review_queue'
  | 'wrap_ups'
  | 'attendance'
  | 'observations'
  | 'parent_updates'
  | 'academy_health'
  | 'demo'
  | 'unknown'

// ── Source label shape ────────────────────────────────────────────────────────

export interface DonnaSourceLabel {
  domain: DonnaSourceDomain
  domainLabel: string
  tableOrLoader: string
  fieldStatus: COOFieldStatus
  confidence: DONNAConfidence
  caveat: string | null
}

// ── Domain labels ─────────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<DonnaSourceDomain, string> = {
  sessions: 'Sessions',
  players: 'Player profiles',
  coaches: 'Coach records',
  templates: 'Session templates',
  curriculum: 'Curriculum',
  review_queue: 'Review queue',
  wrap_ups: 'Coach wrap-ups',
  attendance: 'Attendance',
  observations: 'Observations',
  parent_updates: 'Parent updates',
  academy_health: 'Academy health',
  demo: 'Demo data',
  unknown: 'Unknown source',
}

// ── Status-aware caveats ──────────────────────────────────────────────────────

const STATUS_CAVEATS: Partial<Record<COOFieldStatus, string>> = {
  partial: 'Partial data — some records may be missing',
  insufficient_data: 'No data yet — will populate as the system is used',
  blocked_by_schema: 'Schema migration pending — not available until migration is applied',
  blocked_by_rls: 'Access restricted for this role',
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildSourceLabel(
  domain: DonnaSourceDomain,
  tableOrLoader: string,
  fieldStatus: COOFieldStatus,
  confidence: DONNAConfidence,
  extraCaveat?: string,
): DonnaSourceLabel {
  const statusCaveat = STATUS_CAVEATS[fieldStatus] ?? null
  const caveat = extraCaveat ?? statusCaveat

  return {
    domain,
    domainLabel: DOMAIN_LABELS[domain],
    tableOrLoader,
    fieldStatus,
    confidence,
    caveat,
  }
}

// ── Pre-built source labels for common data points ────────────────────────────

export const SOURCE_LABELS = {
  sessionsToday: buildSourceLabel('sessions', 'sessions table', 'live', 'high'),
  sessionBlocks: buildSourceLabel('sessions', 'session_blocks table', 'live', 'high'),
  wrapUpCoverage: buildSourceLabel('wrap_ups', 'proposed_actions (target_module=session_wrap_up_v1)', 'live', 'high'),
  attendanceToday: buildSourceLabel('attendance', 'session_attendance table', 'live', 'high'),
  pendingReviews: buildSourceLabel('review_queue', 'proposed_actions (status=pending_review)', 'live', 'high'),
  coachObservations: buildSourceLabel('observations', 'coach_observations table', 'live', 'high'),
  playerAttentionRisk: buildSourceLabel('players', 'playerAttentionRiskLoader', 'partial', 'partial', 'Rule-based — derived from observations and absences'),
  parentUpdates: buildSourceLabel('parent_updates', 'proposed_actions (target_module=parent_communication)', 'live', 'high', 'Director approval required before any send'),
  levelReadiness: buildSourceLabel('curriculum', 'proposed_actions (target_module=level_review)', 'live', 'partial', 'Director decision required — DONNA never moves levels automatically'),
  curriculumGates: buildSourceLabel('curriculum', 'player_gate_status', 'live', 'partial', 'Gates active — evidence accumulates as coaches observe and assess'),
  curriculumBottleneck: buildSourceLabel('curriculum', 'curriculumBottleneckLoader', 'live', 'partial', 'Reads player_requirement_progress — data grows as requirements are tracked'),
  templateList: buildSourceLabel('templates', 'templates table', 'live', 'high'),
  academyHealthKPIs: buildSourceLabel('academy_health', 'academyHealthSourceMap', 'partial', 'partial', 'Some KPIs require pending migrations'),
  demoFallback: buildSourceLabel('demo', 'demo seed data', 'insufficient_data', 'insufficient', 'Not from your live academy — connect to see real data'),
} as const

// ── Source label renderer helpers ─────────────────────────────────────────────

export function getSourceLabelText(label: DonnaSourceLabel): string {
  return `${label.domainLabel} — ${label.tableOrLoader}`
}

export function getSourceConfidenceText(confidence: DONNAConfidence): string {
  switch (confidence) {
    case 'high': return 'Live data'
    case 'partial': return 'Partial data'
    case 'insufficient': return 'No data yet'
    case 'blocked': return 'Blocked'
  }
}

export function getSourceStatusColor(fieldStatus: COOFieldStatus): string {
  switch (fieldStatus) {
    case 'live': return 'text-status-green'
    case 'partial': return 'text-status-orange'
    case 'insufficient_data': return 'text-text-muted'
    case 'blocked_by_schema': return 'text-status-red'
    case 'blocked_by_rls': return 'text-status-red'
  }
}

// ── Multi-source label builder ────────────────────────────────────────────────

export interface MultiSourceLabelResult {
  labels: DonnaSourceLabel[]
  overallConfidence: DONNAConfidence
  hasCaveats: boolean
  caveatSummary: string | null
}

export function buildMultiSourceLabel(labels: DonnaSourceLabel[]): MultiSourceLabelResult {
  const confidenceOrder: DONNAConfidence[] = ['insufficient', 'blocked', 'partial', 'high']
  const lowestConfidence = labels.reduce<DONNAConfidence>((min, l) => {
    return confidenceOrder.indexOf(l.confidence) < confidenceOrder.indexOf(min) ? l.confidence : min
  }, 'high')

  const caveats = labels.map(l => l.caveat).filter((c): c is string => c !== null)
  const hasCaveats = caveats.length > 0
  const caveatSummary = hasCaveats ? caveats[0] : null

  return {
    labels,
    overallConfidence: lowestConfidence,
    hasCaveats,
    caveatSummary,
  }
}
