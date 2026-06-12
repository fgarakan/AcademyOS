// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1836–1865
// Impact Preview: structured preview of what a curriculum draft will affect.
//
// Pure TypeScript — no DB calls, no mutations.
// Input: draft + loaded intelligence context.
//
// Produces ImpactPreview with four sections:
//   expectedBenefit   — what improves and for whom
//   possibleRisk      — gate dependencies, player disruption, redundancy
//   whoIsAffected     — coaches, players, parents with counts
//   whatToReviewNext  — follow-on items DONNA recommends checking after approval

import type { CurriculumDraftObject } from './curriculumDraftObject'
import type { CurriculumIntelligenceContext } from './curriculumIntelligenceContext'

// ── Impact preview types ──────────────────────────────────────────────────────

export interface ImpactLine {
  text:     string
  severity: 'positive' | 'neutral' | 'warning'
}

export interface ImpactPreview {
  expectedBenefit:  ImpactLine[]
  possibleRisk:     ImpactLine[]
  whoIsAffected:    ImpactLine[]
  whatToReviewNext: ImpactLine[]
  /** True when at least one warning-severity risk was found */
  hasWarnings: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pos(text: string): ImpactLine  { return { text, severity: 'positive' } }
function neu(text: string): ImpactLine  { return { text, severity: 'neutral'  } }
function warn(text: string): ImpactLine { return { text, severity: 'warning'  } }

// ── Section builders ──────────────────────────────────────────────────────────

function buildExpectedBenefit(
  draft: CurriculumDraftObject,
  ctx: CurriculumIntelligenceContext,
): ImpactLine[] {
  const lines: ImpactLine[] = []
  const levelName = draft.levelName ?? 'the selected level'
  const contentType = draft.contentType

  if (draft.intent === 'add' || draft.intent === 'expand') {
    lines.push(pos(`Adds a new ${contentType} to ${levelName} curriculum.`))

    // Player count benefit
    const playerLevel = ctx.playerByLevel.find(p => p.levelId === draft.levelId)
    if (playerLevel && playerLevel.playerCount > 0) {
      lines.push(
        pos(
          `${playerLevel.playerCount} player${playerLevel.playerCount !== 1 ? 's' : ''} at ` +
          `${levelName} will have access to this content immediately upon approval.`,
        ),
      )
    }

    // Gap fill benefit
    const level = ctx.levels.find(l => l.id === draft.levelId)
    if (level?.isEmpty) {
      lines.push(pos(`This is the first item at ${levelName} — establishes the curriculum foundation.`))
    } else if (level?.isSparse) {
      lines.push(pos(`${levelName} currently has low coverage — this meaningfully increases it.`))
    }

    // Content type gap fill
    const underrepresented = ctx.gapReport.underrepresentedTypes.find(
      u => u.levelId === draft.levelId && u.contentType === contentType,
    )
    if (underrepresented) {
      lines.push(pos(`Fills a content-type gap — ${levelName} had no "${contentType}" content.`))
    }

    // Drill-heavy correction
    const drillHeavy = ctx.gapReport.drillHeavyLevels.find(d => d.levelId === draft.levelId)
    if (drillHeavy && (contentType === 'game' || contentType === 'tactical')) {
      lines.push(pos(`Helps balance ${levelName}'s drill-heavy curriculum with game-based content.`))
    }

    // Advancement eligible uplift
    if ((ctx.playerByLevel.find(p => p.levelId === draft.levelId)?.advancementEligibleCount ?? 0) > 0) {
      lines.push(neu(`May support advancement-eligible players at ${levelName} in their final preparation.`))
    }
  }

  if (draft.intent === 'modify') {
    lines.push(neu(`Updates an existing item at ${levelName} — coaches will see the updated version immediately after approval.`))
  }

  if (draft.intent === 'remove') {
    lines.push(neu(`Removes an item from ${levelName} curriculum — reduces clutter if item is no longer in use.`))
  }

  if (draft.intent === 'move') {
    lines.push(neu(`Relocates the item to ${levelName} — better alignment with player readiness at that stage.`))
  }

  if (draft.intent === 'replace') {
    lines.push(pos(`Replaces an outdated item — keeps the curriculum current without increasing overall size.`))
  }

  return lines
}

function buildPossibleRisk(
  draft: CurriculumDraftObject,
  ctx: CurriculumIntelligenceContext,
): ImpactLine[] {
  const lines: ImpactLine[] = []
  const levelName = draft.levelName ?? 'the selected level'

  // Gate dependency warning
  const gatesAtLevel = ctx.gates.filter(
    g => g.fromLevelId === draft.levelId || g.toLevelId === draft.levelId,
  )
  if (gatesAtLevel.length > 0 && (draft.intent === 'remove' || draft.intent === 'replace' || draft.intent === 'move')) {
    lines.push(
      warn(
        `${levelName} has ${gatesAtLevel.length} advancement gate${gatesAtLevel.length !== 1 ? 's' : ''} — ` +
        `removing or moving items may create gaps in gate evidence coverage.`,
      ),
    )
  }

  // Player disruption for destructive intents
  const playerLevel = ctx.playerByLevel.find(p => p.levelId === draft.levelId)
  if (playerLevel && playerLevel.playerCount > 0) {
    if (draft.intent === 'remove') {
      lines.push(
        warn(
          `${playerLevel.playerCount} player${playerLevel.playerCount !== 1 ? 's are' : ' is'} currently at ` +
          `${levelName} — removing this item affects their active curriculum immediately after approval.`,
        ),
      )
    }
    if (draft.intent === 'modify') {
      lines.push(
        neu(
          `${playerLevel.playerCount} player${playerLevel.playerCount !== 1 ? 's are' : ' is'} at ` +
          `${levelName} — coaches will see the updated version in their next session plan.`,
        ),
      )
    }
  }

  // Duplicate risk
  const level = ctx.levels.find(l => l.id === draft.levelId)
  if (
    (draft.intent === 'add' || draft.intent === 'expand') &&
    level && !level.isEmpty &&
    (level.itemCountByType[draft.contentType] ?? 0) >= 3
  ) {
    lines.push(
      warn(
        `${levelName} already has ${level.itemCountByType[draft.contentType]} "${draft.contentType}" items — ` +
        `review DONNA's duplicate check above before saving.`,
      ),
    )
  }

  // Gate support gap for new content
  const gateSupportGap = ctx.gapReport.gateSupportGaps.find(g => g.levelId === draft.levelId)
  if (gateSupportGap && draft.intent === 'add') {
    lines.push(
      neu(
        `Gate "${gateSupportGap.criterion}" at ${levelName} currently lacks supporting content — ` +
        `check whether this new item addresses that gap.`,
      ),
    )
  }

  // Pending overrides warning
  const pendingAtLevel = ctx.pendingOverrides.filter(o => o.levelId === draft.levelId)
  if (pendingAtLevel.length > 0) {
    lines.push(
      warn(
        `${pendingAtLevel.length} change${pendingAtLevel.length !== 1 ? 's are' : ' is'} already pending ` +
        `review for ${levelName} — approve or reject them before adding more.`,
      ),
    )
  }

  if (lines.length === 0) {
    lines.push(neu('No gate dependencies or player disruption risks identified.'))
  }

  return lines
}

function buildWhoIsAffected(
  draft: CurriculumDraftObject,
  ctx: CurriculumIntelligenceContext,
): ImpactLine[] {
  const lines: ImpactLine[] = []
  const levelName = draft.levelName ?? 'the selected level'

  // Players
  const playerLevel = ctx.playerByLevel.find(p => p.levelId === draft.levelId)
  if (playerLevel && playerLevel.playerCount > 0) {
    lines.push(
      neu(
        `Players (${playerLevel.playerCount} at ${levelName}` +
        (playerLevel.advancementEligibleCount > 0
          ? `, ${playerLevel.advancementEligibleCount} advancement-eligible`
          : '') +
        ').',
      ),
    )
  } else {
    lines.push(neu(`Players — no players currently at ${levelName}.`))
  }

  // Coaches
  lines.push(
    neu(
      `Coaches — session plans for ${levelName} groups will reflect this change after approval.`,
    ),
  )

  // Parent visibility
  if (draft.parentExplanation) {
    lines.push(
      neu('Parents — this item has a parent-facing explanation and will be visible in the parent portal after approval.'),
    )
  } else if (draft.contentType === 'player_mission' || draft.contentType === 'parent_guidance') {
    lines.push(
      neu('Parents — this content type is typically visible to parents; a parent explanation is recommended.'),
    )
  }

  // Gates
  const gatesAtLevel = ctx.gates.filter(g => g.fromLevelId === draft.levelId)
  if (gatesAtLevel.length > 0) {
    lines.push(
      neu(
        `Advancement gates — ${gatesAtLevel.length} gate${gatesAtLevel.length !== 1 ? 's' : ''} at ` +
        `${levelName} may reference this content for advancement evidence.`,
      ),
    )
  }

  return lines
}

function buildWhatToReviewNext(
  draft: CurriculumDraftObject,
  ctx: CurriculumIntelligenceContext,
): ImpactLine[] {
  const lines: ImpactLine[] = []
  const levelName = draft.levelName ?? 'the selected level'

  // Gate support
  const gateSupportGaps = ctx.gapReport.gateSupportGaps.filter(g => g.levelId === draft.levelId)
  if (gateSupportGaps.length > 0) {
    lines.push(
      neu(`Review advancement gates at ${levelName} — ${gateSupportGaps.length} gate${gateSupportGaps.length !== 1 ? 's need' : ' needs'} supporting content.`),
    )
  }

  // Progression gaps
  const progressionGap = ctx.gapReport.progressionGaps.find(g => g.levelId === draft.levelId)
  if (progressionGap && draft.contentType === 'drill') {
    lines.push(
      neu(`Add a progression for this drill — ${levelName} is missing progressions to differentiate challenge.`),
    )
  }

  // Adjacent level
  const level = ctx.levels.find(l => l.id === draft.levelId)
  if (level) {
    const nextLevel = ctx.levels.find(
      l => l.sortOrder === level.sortOrder + 1,
    )
    if (nextLevel && nextLevel.isEmpty) {
      lines.push(neu(`${nextLevel.displayName} (the next level) has no content — consider adding curriculum there next.`))
    }
  }

  // Parent explanation prompt
  if ((draft.intent === 'add' || draft.intent === 'expand') && !draft.parentExplanation) {
    if (draft.contentType === 'drill' || draft.contentType === 'player_mission') {
      lines.push(
        neu('Add a parent-friendly explanation — parents benefit from knowing how this fits their child\'s development.'),
      )
    }
  }

  // Pending queue
  if (ctx.pendingOverrideCount > 0) {
    lines.push(
      neu(`Review queue — ${ctx.pendingOverrideCount} pending change${ctx.pendingOverrideCount !== 1 ? 's are' : ' is'} waiting for approval.`),
    )
  }

  if (lines.length === 0) {
    lines.push(neu('No immediate follow-up items identified.'))
  }

  return lines
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildImpactPreview(
  draft: CurriculumDraftObject,
  ctx: CurriculumIntelligenceContext,
): ImpactPreview {
  const expectedBenefit  = buildExpectedBenefit(draft, ctx)
  const possibleRisk     = buildPossibleRisk(draft, ctx)
  const whoIsAffected    = buildWhoIsAffected(draft, ctx)
  const whatToReviewNext = buildWhatToReviewNext(draft, ctx)

  const hasWarnings = possibleRisk.some(l => l.severity === 'warning')

  return {
    expectedBenefit,
    possibleRisk,
    whoIsAffected,
    whatToReviewNext,
    hasWarnings,
  }
}
