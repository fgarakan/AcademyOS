// Sprint 1014 — Player Session Template Context Packaging V1
// Typed context packages: pre-built bundles combining player, session, and template signals.
// Pure data shapes — no DB queries here. Used by DONNA answer engine and UI surfaces.
// No DB writes. No side effects.

import type { COOFieldStatus } from '@/lib/donna/cooDataStatus'
import type { DONNAConfidence } from '@/lib/donna/donnaCOOAnswerEngine'

// ── Player context package ────────────────────────────────────────────────────

export interface PlayerContextPackage {
  playerId: string
  playerName: string
  curriculumLevel: string | null
  curriculumLevelId: string | null
  // Attendance
  recentAbsences: number
  attendanceRisk: 'high' | 'medium' | 'low' | 'none'
  // Observations
  recentObservationCount: number
  hasRecentConcern: boolean
  // Parent
  daysSinceParentUpdate: number | null
  parentUpdatePending: boolean
  // Development
  readinessBlockers: string[]
  nextAction: string | null
  nextActionHref: string | null
  // Meta
  sourceStatus: COOFieldStatus
  confidence: DONNAConfidence
}

// ── Session context package ───────────────────────────────────────────────────

export interface SessionBlockSummary {
  blockId: string
  blockType: string
  blockTitle: string | null
  orderIndex: number
}

export interface SessionContextPackage {
  sessionId: string
  sessionName: string
  scheduledDate: string
  coachId: string | null
  coachName: string | null
  groupId: string | null
  groupName: string | null
  // Template
  templateId: string | null
  templateName: string | null
  curriculumLevel: string | null
  // Blocks
  blocks: SessionBlockSummary[]
  blockCount: number
  // Players
  playerCount: number
  // Wrap-up
  wrapUpSubmitted: boolean
  wrapUpStatus: 'submitted' | 'pending_review' | 'approved' | 'missing' | null
  // Meta
  sourceStatus: COOFieldStatus
  confidence: DONNAConfidence
}

// ── Template context package ──────────────────────────────────────────────────

export interface TemplateBlockSummary {
  blockId: string
  blockType: string
  blockTitle: string | null
  durationMinutes: number | null
  orderIndex: number
}

export interface TemplateContextPackage {
  templateId: string
  templateName: string
  curriculumLevel: string | null
  curriculumLevelId: string | null
  description: string | null
  totalBlocks: number
  blocks: TemplateBlockSummary[]
  estimatedDurationMinutes: number | null
  // Usage
  timesUsedLast30Days: number | null
  // Meta
  sourceStatus: COOFieldStatus
  confidence: DONNAConfidence
}

// ── Combined session + template package ───────────────────────────────────────

export interface SessionWithTemplatePackage {
  session: SessionContextPackage
  template: TemplateContextPackage | null
  // Cross-signals
  curriculumAligned: boolean
  blocksMatchTemplate: boolean | null
  notes: string[]
}

// ── Combined player + sessions package ────────────────────────────────────────

export interface PlayerWithSessionsPackage {
  player: PlayerContextPackage
  recentSessions: SessionContextPackage[]
  totalRecentSessions: number
  // Derived
  lastSessionDate: string | null
  missedRecentSessions: number
  notes: string[]
}

// ── Package builders (from raw data, no DB calls) ─────────────────────────────

export function buildSessionWithTemplate(
  session: SessionContextPackage,
  template: TemplateContextPackage | null,
): SessionWithTemplatePackage {
  const blocksMatchTemplate =
    template !== null ? session.blockCount === template.totalBlocks : null

  const curriculumAligned =
    template !== null
      ? session.curriculumLevel === template.curriculumLevel
      : false

  const notes: string[] = []
  if (!session.wrapUpSubmitted) notes.push('Wrap-up not yet submitted')
  if (template && !curriculumAligned) notes.push('Session curriculum level does not match template')
  if (blocksMatchTemplate === false) notes.push('Block count does not match template')
  if (!template) notes.push('No template linked — freeform session')

  return { session, template, curriculumAligned, blocksMatchTemplate, notes }
}

export function buildPlayerWithSessions(
  player: PlayerContextPackage,
  recentSessions: SessionContextPackage[],
): PlayerWithSessionsPackage {
  const dates = recentSessions
    .map(s => s.scheduledDate)
    .filter(Boolean)
    .sort()
    .reverse()

  const lastSessionDate = dates[0] ?? null

  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const recentSessionDates = recentSessions
    .filter(s => s.scheduledDate >= sevenDaysAgo && s.scheduledDate <= today)
    .map(s => s.scheduledDate)

  const missedRecentSessions = player.recentAbsences

  const notes: string[] = []
  if (player.hasRecentConcern) notes.push('Recent concern observations flagged')
  if (player.attendanceRisk === 'high') notes.push('High attendance risk')
  if (missedRecentSessions > 2) notes.push(`${missedRecentSessions} recent absences`)
  if (player.parentUpdatePending) notes.push('Parent-safe draft pending director approval')
  if (player.readinessBlockers.length > 0) {
    notes.push(`Readiness blockers: ${player.readinessBlockers.join(', ')}`)
  }

  return {
    player,
    recentSessions,
    totalRecentSessions: recentSessions.length,
    lastSessionDate,
    missedRecentSessions,
    notes,
  }
}

// ── Context label helpers ─────────────────────────────────────────────────────

export function getSessionContextLabel(pkg: SessionContextPackage): string {
  const parts: string[] = []
  if (pkg.groupName) parts.push(pkg.groupName)
  if (pkg.coachName) parts.push(`Coach: ${pkg.coachName}`)
  if (pkg.blockCount > 0) parts.push(`${pkg.blockCount} blocks`)
  if (pkg.playerCount > 0) parts.push(`${pkg.playerCount} players`)
  return parts.join(' · ')
}

export function getPlayerContextLabel(pkg: PlayerContextPackage): string {
  const parts: string[] = []
  if (pkg.curriculumLevel) parts.push(`Level: ${pkg.curriculumLevel}`)
  if (pkg.attendanceRisk !== 'none') parts.push(`Attendance: ${pkg.attendanceRisk} risk`)
  if (pkg.hasRecentConcern) parts.push('Concern flagged')
  return parts.join(' · ') || 'No signals'
}

export function getTemplateContextLabel(pkg: TemplateContextPackage): string {
  const parts: string[] = []
  if (pkg.curriculumLevel) parts.push(`Level ${pkg.curriculumLevel}`)
  if (pkg.totalBlocks > 0) parts.push(`${pkg.totalBlocks} blocks`)
  if (pkg.estimatedDurationMinutes) parts.push(`~${pkg.estimatedDurationMinutes}min`)
  return parts.join(' · ')
}
