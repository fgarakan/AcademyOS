// Sprint 925 — Entity Summary Auto-Population V1
// Deterministic summary generators for player, group, and curriculum level entities.
// Called after key academy events — never blocks the main workflow.
// No LLM. No external API calls. Pure structured data → safe text.
//
// Safety:
//   - Failure never propagates — all functions return { ok, error? }
//   - No sensitive raw notes in summaryText
//   - No raw IDs in summaryText
//   - academy_id always scoped via upsertEntitySummary

import type { DB } from '@/lib/types/db'
import { upsertEntitySummary } from '@/lib/donna/donnaEntitySummaries'

// ── Player summary ────────────────────────────────────────────────────────────

interface PlayerSummaryInput {
  academyId: string
  playerId: string
  playerName: string
  curriculumLevel?: string | null
  activePriorityCount?: number
  recentObservationCount?: number
  lastObservationDate?: string | null
  attendanceRate?: number | null
}

export async function upsertPlayerEntitySummary(
  db: DB,
  input: PlayerSummaryInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const parts: string[] = []
    if (input.curriculumLevel) parts.push(`Level: ${input.curriculumLevel}.`)
    if (input.activePriorityCount !== undefined && input.activePriorityCount > 0) {
      parts.push(`${input.activePriorityCount} active development priorit${input.activePriorityCount !== 1 ? 'ies' : 'y'}.`)
    }
    if (input.recentObservationCount !== undefined && input.recentObservationCount > 0) {
      parts.push(`${input.recentObservationCount} coach observation${input.recentObservationCount !== 1 ? 's' : ''} in recent sessions.`)
    }
    if (input.lastObservationDate) {
      const d = new Date(input.lastObservationDate)
      parts.push(`Last observation: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`)
    }
    if (input.attendanceRate !== null && input.attendanceRate !== undefined) {
      parts.push(`Attendance: ${Math.round(input.attendanceRate * 100)}%.`)
    }
    if (parts.length === 0) parts.push(`${input.playerName} is active in the academy.`)

    const summaryText = `${input.playerName}. ${parts.join(' ')}`

    return await upsertEntitySummary(db, {
      academyId: input.academyId,
      entityType: 'player',
      entityId: input.playerId,
      summaryKind: 'progress',
      summaryText,
      confidence: input.recentObservationCount && input.recentObservationCount >= 3 ? 'high' : 'medium',
      visibilityScope: 'director',
    })
  } catch (e: unknown) {
    return { ok: false, error: String(e) }
  }
}

// ── Group summary ─────────────────────────────────────────────────────────────

interface GroupSummaryInput {
  academyId: string
  groupId: string
  groupName: string
  playerCount?: number
  recentSessionCount?: number
  wrapUpCoverage?: number | null  // 0–1
  atRiskCount?: number
}

export async function upsertGroupEntitySummary(
  db: DB,
  input: GroupSummaryInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const parts: string[] = []
    if (input.playerCount !== undefined) parts.push(`${input.playerCount} player${input.playerCount !== 1 ? 's' : ''}.`)
    if (input.recentSessionCount !== undefined) {
      parts.push(`${input.recentSessionCount} session${input.recentSessionCount !== 1 ? 's' : ''} recently.`)
    }
    if (input.wrapUpCoverage !== null && input.wrapUpCoverage !== undefined) {
      const pct = Math.round(input.wrapUpCoverage * 100)
      parts.push(`${pct}% wrap-up coverage.`)
    }
    if (input.atRiskCount !== undefined && input.atRiskCount > 0) {
      parts.push(`${input.atRiskCount} player${input.atRiskCount !== 1 ? 's' : ''} flagged for attention.`)
    }
    if (parts.length === 0) parts.push(`${input.groupName} is an active academy group.`)

    const summaryText = `Group: ${input.groupName}. ${parts.join(' ')}`

    return await upsertEntitySummary(db, {
      academyId: input.academyId,
      entityType: 'group',
      entityId: input.groupId,
      summaryKind: 'operating',
      summaryText,
      confidence: 'medium',
      visibilityScope: 'director',
    })
  } catch (e: unknown) {
    return { ok: false, error: String(e) }
  }
}

// ── Curriculum level summary ───────────────────────────────────────────────────

interface CurriculumLevelSummaryInput {
  academyId: string
  levelId: string
  levelName: string
  playerCount?: number
  templateCount?: number
  hasGaps?: boolean
  advancementEligibleCount?: number
}

export async function upsertCurriculumLevelEntitySummary(
  db: DB,
  input: CurriculumLevelSummaryInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const parts: string[] = []
    if (input.playerCount !== undefined) parts.push(`${input.playerCount} player${input.playerCount !== 1 ? 's' : ''} at this level.`)
    if (input.templateCount !== undefined) {
      parts.push(input.templateCount > 0
        ? `${input.templateCount} session template${input.templateCount !== 1 ? 's' : ''} available.`
        : 'No session templates assigned yet.')
    }
    if (input.hasGaps) parts.push('Curriculum coverage gaps detected.')
    if (input.advancementEligibleCount !== undefined && input.advancementEligibleCount > 0) {
      parts.push(`${input.advancementEligibleCount} player${input.advancementEligibleCount !== 1 ? 's' : ''} may be ready to advance.`)
    }
    if (parts.length === 0) parts.push(`${input.levelName} is an active curriculum level.`)

    const summaryText = `Level: ${input.levelName}. ${parts.join(' ')}`

    return await upsertEntitySummary(db, {
      academyId: input.academyId,
      entityType: 'curriculum_level',
      entityId: input.levelId,
      summaryKind: 'curriculum',
      summaryText,
      confidence: input.playerCount !== undefined ? 'high' : 'medium',
      visibilityScope: 'director',
    })
  } catch (e: unknown) {
    return { ok: false, error: String(e) }
  }
}

// ── Trigger: after session wrap-up submitted ───────────────────────────────────

export async function triggerEntitySummaryAfterWrapUp(
  db: DB,
  input: {
    academyId: string
    groupId: string | null
    groupName?: string | null
    playerIds?: string[]
    sessionCount?: number
    wrapUpCoverage?: number | null
  },
): Promise<void> {
  // Fire-and-forget: never throw, never await in critical path
  if (input.groupId && input.groupName) {
    void upsertGroupEntitySummary(db, {
      academyId: input.academyId,
      groupId: input.groupId,
      groupName: input.groupName,
      recentSessionCount: input.sessionCount,
      wrapUpCoverage: input.wrapUpCoverage ?? null,
    }).catch(() => { /* silent */ })
  }
}

// ── Trigger: after player observation added ────────────────────────────────────

export async function triggerEntitySummaryAfterObservation(
  db: DB,
  input: {
    academyId: string
    playerId: string
    playerName: string
    curriculumLevel?: string | null
    observationCount?: number
    lastObservationDate?: string
  },
): Promise<void> {
  void upsertPlayerEntitySummary(db, {
    academyId: input.academyId,
    playerId: input.playerId,
    playerName: input.playerName,
    curriculumLevel: input.curriculumLevel ?? null,
    recentObservationCount: input.observationCount,
    lastObservationDate: input.lastObservationDate,
  }).catch(() => { /* silent */ })
}

// ── Trigger: after player priority updated ─────────────────────────────────────

export async function triggerEntitySummaryAfterPriorityUpdate(
  db: DB,
  input: {
    academyId: string
    playerId: string
    playerName: string
    curriculumLevel?: string | null
    activePriorityCount?: number
  },
): Promise<void> {
  void upsertPlayerEntitySummary(db, {
    academyId: input.academyId,
    playerId: input.playerId,
    playerName: input.playerName,
    curriculumLevel: input.curriculumLevel ?? null,
    activePriorityCount: input.activePriorityCount,
  }).catch(() => { /* silent */ })
}
