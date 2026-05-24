// Sprint 742C — DONNA Curriculum-to-Template Coverage Gap Detector V1
// Pure function: detects which curriculum levels have active players but no active class template.
// No DB calls. No side effects. No mutations. Fails safely with [] if data is unavailable.
// Operates on already-loaded DirectorDonnaContext summaries (Sprint 742B).
//
// Matching logic:
//   player_curriculum_states.current_level_id (UUID) ←→ templates.curriculum_level_id (UUID)
//   Both UUIDs reference curriculum_levels.id (global table, no academy_id).
//   Display names come from the curriculum_levels join in the player state loader.
//
// Limitation: templates with curriculum_level_id = null are "unassigned" — they count as
// no coverage for any level. A separate "unassigned templates" signal is surfaced separately.

import type { PlayerCurriculumStateSummary, TemplateSummary } from '@/lib/donna/extendedContextLoaders'

// ── Types ─────────────────────────────────────────────────────────────────────

export type CoverageGapSeverity = 'high' | 'medium' | 'low'

export interface CurriculumTemplateCoverageGap {
  levelId: string
  levelDisplayName: string
  playerCountAtLevel: number
  matchingTemplateCount: number
  severity: CoverageGapSeverity
  reason: string
  recommendedAction: string
  href: string
}

export interface CurriculumTemplateCoverageResult {
  gaps: CurriculumTemplateCoverageGap[]
  levelsWithPlayers: number
  levelsWithTemplates: number
  unassignedTemplateCount: number
  coverageAvailable: boolean
}

// ── Context shape accepted by the detector ────────────────────────────────────

interface CoverageGapInput {
  playerCurriculumStateSummaries: PlayerCurriculumStateSummary[]
  templateSummaries: TemplateSummary[]
  playerProgressContextAvailable: boolean
  templateContextAvailable: boolean
}

// ── Main detector ─────────────────────────────────────────────────────────────

export function detectCurriculumTemplateCoverageGaps(
  ctx: CoverageGapInput,
): CurriculumTemplateCoverageResult {
  // Fail safely when either context domain is not yet live
  if (!ctx.playerProgressContextAvailable || !ctx.templateContextAvailable) {
    return {
      gaps: [],
      levelsWithPlayers: 0,
      levelsWithTemplates: 0,
      unassignedTemplateCount: 0,
      coverageAvailable: false,
    }
  }

  // ── Step 1: aggregate player counts per level UUID ─────────────────────────

  // Map: levelId (UUID) → { count, displayName }
  const levelPlayerMap = new Map<string, { count: number; displayName: string }>()

  for (const state of ctx.playerCurriculumStateSummaries) {
    const existing = levelPlayerMap.get(state.currentLevelId)
    if (existing) {
      existing.count += 1
    } else {
      levelPlayerMap.set(state.currentLevelId, {
        count: 1,
        displayName: state.currentLevelDisplayName ?? `Level ${state.currentLevelId.slice(0, 8)}`,
      })
    }
  }

  // ── Step 2: build template coverage set by level UUID ─────────────────────

  // Set of level UUIDs that have at least one active template assigned
  const coveredLevelIds = new Set<string>()
  // Map: levelId → template count (for detail reporting)
  const templateCountByLevel = new Map<string, number>()

  let unassignedTemplateCount = 0

  for (const tmpl of ctx.templateSummaries) {
    if (!tmpl.curriculumLevelId) {
      unassignedTemplateCount += 1
      continue
    }
    coveredLevelIds.add(tmpl.curriculumLevelId)
    templateCountByLevel.set(
      tmpl.curriculumLevelId,
      (templateCountByLevel.get(tmpl.curriculumLevelId) ?? 0) + 1,
    )
  }

  // ── Step 3: compute gaps ───────────────────────────────────────────────────

  const gaps: CurriculumTemplateCoverageGap[] = []

  Array.from(levelPlayerMap.entries()).forEach(([levelId, { count, displayName }]) => {
    const templateCount = templateCountByLevel.get(levelId) ?? 0

    if (templateCount === 0) {
      const severity: CoverageGapSeverity = count >= 3 ? 'high' : count >= 1 ? 'medium' : 'low'

      gaps.push({
        levelId,
        levelDisplayName: displayName,
        playerCountAtLevel: count,
        matchingTemplateCount: 0,
        severity,
        reason: `${count} active player${count !== 1 ? 's' : ''} at ${displayName} but no class template is assigned to this level.`,
        recommendedAction: `Create a class template for ${displayName} so coaches have a structured plan for these players.`,
        href: '/director/templates',
      })
    }
  })

  // Sort: high → medium → low, then by player count descending within severity
  const SEVERITY_ORDER: Record<CoverageGapSeverity, number> = { high: 0, medium: 1, low: 2 }
  gaps.sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (severityDiff !== 0) return severityDiff
    return b.playerCountAtLevel - a.playerCountAtLevel
  })

  return {
    gaps,
    levelsWithPlayers: levelPlayerMap.size,
    levelsWithTemplates: coveredLevelIds.size,
    unassignedTemplateCount,
    coverageAvailable: true,
  }
}

// ── Summary helper ─────────────────────────────────────────────────────────────
// Produces a short human-readable summary of the coverage result.
// Used by DONNA answer builders.

export function summarizeCoverageGaps(result: CurriculumTemplateCoverageResult): string {
  if (!result.coverageAvailable) {
    return 'Template coverage analysis is not yet available — player curriculum states and templates must both be loaded.'
  }

  if (result.gaps.length === 0) {
    if (result.levelsWithPlayers === 0) {
      return 'No players have curriculum states yet — coverage cannot be computed.'
    }
    return `All ${result.levelsWithPlayers} active level${result.levelsWithPlayers !== 1 ? 's' : ''} with players have at least one class template assigned. Template coverage looks good.`
  }

  const highCount = result.gaps.filter(g => g.severity === 'high').length
  const lines = result.gaps.slice(0, 5).map(g => {
    const badge = g.severity === 'high' ? '🔴' : g.severity === 'medium' ? '🟡' : '⚪'
    return `${badge} ${g.levelDisplayName} — ${g.playerCountAtLevel} player${g.playerCountAtLevel !== 1 ? 's' : ''}, no template assigned`
  })

  const intro = highCount > 0
    ? `${result.gaps.length} curriculum level${result.gaps.length !== 1 ? 's' : ''} have active players but no class template. ${highCount} ${highCount !== 1 ? 'are' : 'is'} high priority:`
    : `${result.gaps.length} curriculum level${result.gaps.length !== 1 ? 's' : ''} have active players but no class template:`

  const suffix = result.gaps.length > 5
    ? `\n…and ${result.gaps.length - 5} more. Go to Templates to create them.`
    : ''

  return [intro, '', ...lines, suffix].filter(l => l !== undefined).join('\n').trim()
}
