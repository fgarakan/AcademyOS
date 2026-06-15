// Mega Sprint 2801–2830 — DONNA Academy Operating Intelligence V1
// DNA Curriculum Bias: maps Academy DNA to curriculum emphasis and alignment checks.
//
// Three functions:
//   buildDnaCurriculumBias()        — returns DNA-driven curriculum guidance
//   evaluateCurriculumAlignment()   — checks if curriculum structure matches DNA emphasis
//   buildCurriculumPriorityRec()    — surfaces the highest-priority curriculum gap given DNA
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic. No AI required.
//   - Does NOT replace curriculumIntelligenceContext or curriculumGapAnalysis.
//     Instead: overlays DNA lens on top of existing curriculum data.

import type { OperatingModelContext, CurriculumPriorityContext } from './operatingModelContext'
import type { CurriculumLevelSummary } from '@/lib/donna/curriculum/curriculumIntelligenceContext'

// ── Output types ──────────────────────────────────────────────────────────────

export interface DnaCurriculumBias {
  /** Which category should dominate curriculum content */
  primaryCategory:       string
  primaryCategoryWeight: number    // 0–100
  /** Which categories are deliberately de-emphasised */
  secondaryCategories:   string[]
  /** Which categories to avoid over-indexing */
  deEmphasisedCategories: string[]
  /** Human-readable curriculum focus statement */
  curriculumFocusStatement: string
  /** How to think about lesson plan selection for this model */
  lessonSelectionGuidance:  string
  /** How to frame progression discussions for this model */
  progressionFraming:       string
  /** Template selection preference */
  templatePreference:       string
}

export interface CurriculumAlignmentResult {
  isAligned:         boolean
  alignmentScore:    number          // 0–100; 100 = perfect alignment
  misalignedLevels:  MisalignedLevel[]
  topRecommendation: string | null
  summary:           string
}

export interface MisalignedLevel {
  levelId:        string
  levelName:      string
  stage:          string
  issue:          string     // "Sparse coverage in DNA-priority category"
  recommendation: string
}

export interface CurriculumPriorityRecommendation {
  id:         string
  headline:   string
  detail:     string
  domain:     string
  actionHref: string
  dnaReason:  string
}

// ── Builder ───────────────────────────────────────────────────────────────────

const DEEMPHASIS_BY_MODEL: Record<string, string[]> = {
  '12u_foundation':    ['competition'],
  'performance_12plus': ['fun'],
  'college_placement': ['fun', 'games'],
  'club_growth':       ['competition'],
}

const TEMPLATE_PREFERENCE_BY_MODEL: Record<string, string> = {
  '12u_foundation':    'Game-based and movement-rich templates that make technique incidental to play.',
  'performance_12plus': 'Technical drill + tactical scenario templates with clear measurable objectives.',
  'college_placement': 'Match-play simulation templates with tactical decision-making emphasis.',
  'club_growth':       'Community-style, multi-skill templates that create enjoyment and social connection.',
}

/**
 * Build the DNA curriculum bias: what this academy's DNA says curriculum should look like.
 */
export function buildDnaCurriculumBias(ctx: OperatingModelContext): DnaCurriculumBias {
  const { curriculumPriorities, dnaModelId } = ctx
  const top = curriculumPriorities.topCategoryLabel
  const weight = curriculumPriorities.topCategoryWeight
  const secondary = curriculumPriorities.emphasisOrder.slice(1)
  const deEmphasised = DEEMPHASIS_BY_MODEL[dnaModelId] ?? []

  const curriculumFocusStatement =
    `${ctx.dnaModel.name} curriculum should lead with ${top} content (target ${weight}% of session time). ` +
    (secondary.length > 0 ? `Support with ${secondary.join(' and ')}. ` : '') +
    (deEmphasised.length > 0 ? `Minimise ${deEmphasised.join(' and ')} unless explicitly scheduled.` : '')

  return {
    primaryCategory:          top,
    primaryCategoryWeight:    weight,
    secondaryCategories:      secondary,
    deEmphasisedCategories:   deEmphasised,
    curriculumFocusStatement,
    lessonSelectionGuidance:  curriculumPriorities.lessonPlanGuidance,
    progressionFraming:       curriculumPriorities.progressionLanguage,
    templatePreference:       TEMPLATE_PREFERENCE_BY_MODEL[dnaModelId] ?? 'Balanced multi-skill templates.',
  }
}

// ── Alignment evaluation ──────────────────────────────────────────────────────

const DNA_MIN_COVERAGE: Record<string, number> = {
  '12u_foundation':    2,  // at least 2 items per active level is sufficient
  'performance_12plus': 4,  // performance academies need dense coverage
  'college_placement': 3,
  'club_growth':       2,
}

/**
 * Evaluate how well the existing curriculum structure aligns with Academy DNA emphasis.
 */
export function evaluateCurriculumAlignment(
  levels:       CurriculumLevelSummary[],
  ctx:          OperatingModelContext,
): CurriculumAlignmentResult {
  const minCoverage = DNA_MIN_COVERAGE[ctx.dnaModelId] ?? 2
  const activeStages = ctx.dnaModel.defaultActiveStages
  const activeLevels = levels.filter(l => activeStages.includes(l.stage))

  if (activeLevels.length === 0) {
    return {
      isAligned:         false,
      alignmentScore:    0,
      misalignedLevels:  [],
      topRecommendation: 'No active-stage curriculum levels found. Add levels for your active stages.',
      summary:           'Cannot evaluate curriculum alignment — no levels matching active stages.',
    }
  }

  const misaligned: MisalignedLevel[] = []

  for (const level of activeLevels) {
    if (level.isEmpty) {
      misaligned.push({
        levelId:        level.id,
        levelName:      level.displayName,
        stage:          level.stage,
        issue:          `Level has no curriculum content — completely empty`,
        recommendation: `Add at least ${minCoverage} ${ctx.curriculumPriorities.topCategoryLabel}-focused items for ${level.displayName}.`,
      })
    } else if (level.itemCount < minCoverage) {
      misaligned.push({
        levelId:        level.id,
        levelName:      level.displayName,
        stage:          level.stage,
        issue:          `Level has only ${level.itemCount} item${level.itemCount !== 1 ? 's' : ''} — below ${minCoverage} minimum for ${ctx.dnaModel.name}`,
        recommendation: `Add ${minCoverage - level.itemCount} more ${ctx.curriculumPriorities.topCategoryLabel}-focused content item${minCoverage - level.itemCount > 1 ? 's' : ''} to ${level.displayName}.`,
      })
    }
  }

  const alignedCount  = activeLevels.length - misaligned.length
  const alignmentScore = activeLevels.length > 0
    ? Math.round((alignedCount / activeLevels.length) * 100)
    : 0

  const topRecommendation = misaligned.length > 0 ? misaligned[0]?.recommendation ?? null : null

  const summary = misaligned.length === 0
    ? `Curriculum is well-aligned with ${ctx.dnaModel.name} standards. All ${activeLevels.length} active-stage levels meet minimum coverage.`
    : `${misaligned.length} of ${activeLevels.length} active-stage levels are below ${ctx.dnaModel.name} curriculum standards.`

  return {
    isAligned:         misaligned.length === 0,
    alignmentScore,
    misalignedLevels:  misaligned,
    topRecommendation,
    summary,
  }
}

// ── Priority recommendation ───────────────────────────────────────────────────

/**
 * Return the single highest-priority curriculum action given DNA context.
 */
export function buildCurriculumPriorityRec(
  ctx:       OperatingModelContext,
  alignment: CurriculumAlignmentResult,
): CurriculumPriorityRecommendation | null {
  if (alignment.isAligned) return null

  const topMisaligned = alignment.misalignedLevels[0]
  if (!topMisaligned) return null

  const bias = buildDnaCurriculumBias(ctx)

  return {
    id:         `curriculum-priority-${topMisaligned.levelId}`,
    headline:   `${topMisaligned.levelName} needs more ${bias.primaryCategory} content`,
    detail:     topMisaligned.recommendation,
    domain:     bias.primaryCategory,
    actionHref: '/director/curriculum',
    dnaReason:  `${ctx.dnaModel.name} curriculum emphasis: ${bias.curriculumFocusStatement}`,
  }
}
