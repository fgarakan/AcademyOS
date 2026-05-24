// Sprint 742G — DONNA Player Progress Stall Detector V1
// Pure TypeScript. No DB calls. No mutations. Operates on DirectorDonnaContext.
//
// Detects players who have been at their current curriculum level for >90 days
// without advancing — a "stall" signal. Uses lastAdvancedAt and enrolledAt
// from PlayerCurriculumStateSummary (already loaded in DirectorDonnaContext).
//
// Distinct from advancementEligible: stalled players are NOT yet flagged as
// advancement-eligible — they're stuck without a clear readiness signal.

import type { DirectorDonnaContext } from '@/lib/donna/directorDonnaContext'
import type { PlayerCurriculumStateSummary } from '@/lib/donna/extendedContextLoaders'
import type { DonnaSafeReadAnswer } from '@/lib/donna/donnaSafeReadActions'

// ── Detector input ─────────────────────────────────────────────────────────────

export interface PlayerProgressStallInput {
  playerCurriculumStateSummaries: PlayerCurriculumStateSummary[]
  playerProgressContextAvailable: boolean
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type StallSeverity = 'high' | 'medium'

export interface PlayerProgressStall {
  playerId: string
  playerName: string
  currentLevelDisplayName: string | null
  daysAtCurrentLevel: number
  stallSeverity: StallSeverity
}

export interface PlayerProgressStallResult {
  stalls: PlayerProgressStall[]
  highCount: number
  mediumCount: number
  stallContextAvailable: boolean
}

// ── Detector ───────────────────────────────────────────────────────────────────

const STALL_THRESHOLD_HIGH_DAYS = 180
const STALL_THRESHOLD_MEDIUM_DAYS = 90

export function detectPlayerProgressStalls(input: PlayerProgressStallInput): PlayerProgressStallResult {
  // Context must be available and contain data
  if (
    !input.playerProgressContextAvailable ||
    input.playerCurriculumStateSummaries.length === 0
  ) {
    return { stalls: [], highCount: 0, mediumCount: 0, stallContextAvailable: false }
  }

  const now = Date.now()
  const stalls: PlayerProgressStall[] = []

  for (const pcs of input.playerCurriculumStateSummaries) {
    // Skip players who are already flagged as advancement-eligible
    // (they're handled by the advancement-eligible signal)
    if (pcs.advancementEligible) continue

    // enrolled_at is when the player was placed at their current level.
    // This is the correct reference date for "how long at this level."
    const refDateStr = pcs.enrolledAt
    if (!refDateStr) continue // No date info — skip

    let refTs: number
    try {
      refTs = new Date(refDateStr).getTime()
    } catch {
      continue // Unparseable date — skip
    }

    if (isNaN(refTs)) continue

    const daysAtLevel = Math.floor((now - refTs) / (1000 * 60 * 60 * 24))

    if (daysAtLevel < STALL_THRESHOLD_MEDIUM_DAYS) continue // Not stalled

    const stallSeverity: StallSeverity =
      daysAtLevel >= STALL_THRESHOLD_HIGH_DAYS ? 'high' : 'medium'

    stalls.push({
      playerId: pcs.playerId,
      playerName: pcs.playerName,
      currentLevelDisplayName: pcs.currentLevelDisplayName,
      daysAtCurrentLevel: daysAtLevel,
      stallSeverity,
    })
  }

  // Sort: high severity first, then by daysAtCurrentLevel descending
  stalls.sort((a, b) => {
    if (a.stallSeverity !== b.stallSeverity) {
      return a.stallSeverity === 'high' ? -1 : 1
    }
    return b.daysAtCurrentLevel - a.daysAtCurrentLevel
  })

  const highCount = stalls.filter(s => s.stallSeverity === 'high').length
  const mediumCount = stalls.filter(s => s.stallSeverity === 'medium').length

  return { stalls, highCount, mediumCount, stallContextAvailable: true }
}

// ── Pattern matcher ────────────────────────────────────────────────────────────

export const PLAYER_PROGRESS_STALL_PATTERNS =
  /\b(player.{0,20}(stall(ed|ing)?|stuck|not (advancing|progressing)|progress.{0,10}gap|no progress|progress (gap|issue|problem|concern))|who.{0,20}(is|are) (stall(ed|ing)?|stuck|not advancing|not progressing)|stall(ed|ing)? (players?|progress|at level)|progress (gap|gaps?)|which players?.{0,20}(haven.t|have not|not) (advanced|progressed)|level.{0,20}stuck|stuck.{0,20}level|player progress (gap|issues?|analysis|check|status|overview)|how.{0,20}players?.{0,20}(progressing|doing|advancing))\b/i

// ── Answer builder ─────────────────────────────────────────────────────────────

export function buildPlayerProgressStallAnswer(ctx: DirectorDonnaContext): DonnaSafeReadAnswer {
  const result = detectPlayerProgressStalls(ctx)

  if (!result.stallContextAvailable) {
    return {
      actionId: 'player_progress_stall_unavailable',
      text: [
        '📊 **Player progress analysis:**',
        '',
        "Player curriculum state data isn't loaded yet. This typically means players haven't been placed through the Placement Engine.",
        '',
        'Once players have curriculum levels assigned, DONNA can detect who has been at the same level for 90+ days without advancing.',
      ].join('\n'),
      confidence: 'partial',
      sourceNote: 'Player curriculum state context not available',
      followUp: 'Take me to Players',
      href: '/director/players',
      isAnswerable: true,
    }
  }

  if (result.stalls.length === 0) {
    const adv = ctx.advancementEligibleCount
    return {
      actionId: 'player_progress_no_stalls',
      text: [
        '✅ **Player progress looks healthy:**',
        '',
        'No players have been at the same curriculum level for more than 90 days without progressing.',
        adv > 0
          ? `\n${adv} player${adv !== 1 ? 's are' : ' is'} currently marked advancement-eligible — they're ready to move up.`
          : '',
        '',
        'Keep up the regular assessment cadence to catch stalls early.',
      ].join('\n'),
      confidence: 'high',
      sourceNote: 'Live player curriculum state analysis (90-day threshold)',
      followUp: adv > 0 ? 'Review advancement-eligible players' : 'Take me to Players',
      href: '/director/players',
      isAnswerable: true,
    }
  }

  const lines: string[] = []

  if (result.highCount > 0) {
    lines.push(`🔴 **High concern (${result.highCount}) — stalled 180+ days:**`)
    for (const s of result.stalls.filter(x => x.stallSeverity === 'high').slice(0, 3)) {
      const level = s.currentLevelDisplayName ?? 'Unknown level'
      lines.push(`• ${s.playerName} — ${level} — ${s.daysAtCurrentLevel} days`)
    }
  }

  if (result.mediumCount > 0) {
    lines.push('')
    lines.push(`🟡 **Medium concern (${result.mediumCount}) — stalled 90–179 days:**`)
    for (const s of result.stalls.filter(x => x.stallSeverity === 'medium').slice(0, 3)) {
      const level = s.currentLevelDisplayName ?? 'Unknown level'
      lines.push(`• ${s.playerName} — ${level} — ${s.daysAtCurrentLevel} days`)
    }
  }

  const topStall = result.stalls[0]

  return {
    actionId: 'player_progress_stalls_found',
    text: [
      `📊 **Player progress gaps (${result.stalls.length} stalled):**`,
      '',
      ...lines,
      '',
      'These players have not advanced levels in 90+ days and are not yet flagged as advancement-eligible.',
      `**Recommended:** Schedule an assessment for ${topStall.playerName} to clarify curriculum readiness.`,
    ].join('\n'),
    confidence: 'high',
    sourceNote: 'Live player curriculum state — stall threshold: 90 days',
    followUp: 'Take me to Players',
    href: '/director/players',
    isAnswerable: true,
  }
}
