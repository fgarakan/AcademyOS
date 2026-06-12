// DONNA Curriculum Intelligence Engine V1 — Mega Sprint 1836–1865
// Duplicate Detector: checks a draft against existing academy curriculum items.
//
// Pure TypeScript — no DB calls, no mutations.
// Operates on CurriculumItemSummary[] loaded in the intelligence context.
//
// Comparison dimensions (all deterministic):
//   1. Title similarity   — normalised edit-distance-style token overlap
//   2. Purpose match      — keyword overlap with existing item domain/title tokens
//   3. Tactical objective — shared tactical domain keyword
//   4. Related skill area — content type + domain alignment
//   5. Stage              — same curriculum stage (ball color group)
//
// Returns DuplicateCheckResult with:
//   risk         — 'none' | 'possible' | 'likely'
//   matches      — items that triggered the check
//   matchedField — which dimension triggered the highest-confidence match
//   recommendation — 'improve_existing' | 'keep_separate' | 'no_action'
//   explanation  — human-readable reason shown in DONNA review panel

import type { CurriculumDraftObject } from './curriculumDraftObject'
import type { CurriculumItemSummary } from './curriculumIntelligenceContext'

// ── Result types ──────────────────────────────────────────────────────────────

export type DuplicateRisk = 'none' | 'possible' | 'likely'

export type DuplicateRecommendation =
  | 'improve_existing'  // Draft is so similar that adding would create bloat
  | 'keep_separate'     // Some overlap but distinct enough to coexist
  | 'no_action'         // No meaningful duplicate risk

export interface DuplicateMatch {
  itemId:      string
  itemTitle:   string
  levelName:   string
  contentType: string
  matchedOn:   string   // Dimension that triggered the match
  score:       number   // 0–100 similarity score
}

export interface DuplicateCheckResult {
  risk:           DuplicateRisk
  matches:        DuplicateMatch[]
  matchedField:   string | null
  recommendation: DuplicateRecommendation
  explanation:    string
}

// ── Text normalisation ────────────────────────────────────────────────────────

function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !STOP_WORDS.has(t)),
  )
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'this', 'that', 'with', 'from', 'into',
  'drill', 'game', 'skill', 'exercise', 'activity', 'item',
])

function tokenOverlap(a: string, b: string): number {
  if (!a.trim() || !b.trim()) return 0
  const ta = tokenise(a)
  const tb = tokenise(b)
  if (ta.size === 0 || tb.size === 0) return 0

  let shared = 0
  ta.forEach(t => { if (tb.has(t)) shared++ })
  return Math.round((shared / Math.max(ta.size, tb.size)) * 100)
}

// ── Tactical domain keywords ──────────────────────────────────────────────────

const TACTICAL_DOMAINS = [
  'serve', 'return', 'volley', 'overhead', 'forehand', 'backhand',
  'approach', 'rally', 'crosscourt', 'down the line', 'short ball',
  'defensive', 'offensive', 'neutral', 'transition', 'endgame',
  'net play', 'baseline', 'movement', 'footwork', 'positioning',
]

function extractTacticalDomain(text: string): string | null {
  const lower = text.toLowerCase()
  return TACTICAL_DOMAINS.find(d => lower.includes(d)) ?? null
}

// ── Stage grouping ────────────────────────────────────────────────────────────
// Groups levels by ball colour stage to avoid false positives across stages.

function extractStage(levelName: string): string {
  const lower = levelName.toLowerCase()
  if (lower.includes('red'))    return 'red'
  if (lower.includes('orange')) return 'orange'
  if (lower.includes('green'))  return 'green'
  if (lower.includes('yellow')) return 'yellow'
  if (lower.includes('high'))   return 'high_performance'
  return 'unknown'
}

// ── Core check ────────────────────────────────────────────────────────────────

export function checkForDuplicates(
  draft: CurriculumDraftObject,
  existingItems: CurriculumItemSummary[],
): DuplicateCheckResult {
  // Only check for add / expand intents — modify/move/replace/remove are
  // intentional operations on existing items, not duplicate risks.
  if (draft.intent !== 'add' && draft.intent !== 'expand') {
    return noRisk()
  }

  if (!draft.title.trim() && !draft.contentType) return noRisk()

  const draftTitle    = draft.title.trim()
  const draftType     = draft.contentType
  const draftLevelId  = draft.levelId
  const draftStage    = draft.levelName ? extractStage(draft.levelName) : null
  const draftTactical = extractTacticalDomain(draftTitle + ' ' + (draft.purpose ?? ''))

  const matches: DuplicateMatch[] = []

  for (const item of existingItems) {
    // Skip items at completely different stages — they are intentionally separate progressions
    if (draftStage && draftStage !== 'unknown') {
      const itemStage = extractStage(item.levelName)
      if (itemStage !== 'unknown' && itemStage !== draftStage) continue
    }

    let highestScore = 0
    let matchedOn    = ''

    // ── Dimension 1: Title similarity ──────────────────────────────────────
    const titleScore = tokenOverlap(draftTitle, item.title)
    if (titleScore > highestScore) {
      highestScore = titleScore
      matchedOn    = 'title'
    }

    // ── Dimension 2: Purpose / description keyword overlap ─────────────────
    if (draft.purpose && item.title) {
      const purposeScore = tokenOverlap(draft.purpose, item.title) * 0.7
      if (purposeScore > highestScore) {
        highestScore = Math.round(purposeScore)
        matchedOn    = 'purpose'
      }
    }

    // ── Dimension 3: Tactical objective match ──────────────────────────────
    const itemTactical = extractTacticalDomain(item.title)
    if (draftTactical && itemTactical && draftTactical === itemTactical) {
      // Tactical match only triggers if same level AND same content type
      if (draftLevelId && item.levelId === draftLevelId && item.contentType === draftType) {
        const tacScore = 60
        if (tacScore > highestScore) {
          highestScore = tacScore
          matchedOn    = 'tactical_objective'
        }
      }
    }

    // ── Dimension 4: Related skill area (content type + domain) ────────────
    if (
      item.contentType === draftType &&
      draftLevelId && item.levelId === draftLevelId
    ) {
      const domainScore = item.domain
        ? tokenOverlap(
            (draft.relatedSkills ?? []).join(' ') + ' ' + (draft.purpose ?? ''),
            item.domain + ' ' + item.title,
          )
        : 0
      if (domainScore > highestScore) {
        highestScore = domainScore
        matchedOn    = 'skill_area'
      }
    }

    // ── Dimension 5: Exact level + type + title trigram ───────────────────
    // High-confidence: same level, same type, title tokens overlap ≥ 50%
    if (
      draftLevelId && item.levelId === draftLevelId &&
      item.contentType === draftType &&
      titleScore >= 50
    ) {
      highestScore = Math.max(highestScore, titleScore + 10)
      matchedOn    = 'title_and_level'
    }

    if (highestScore >= 30) {
      matches.push({
        itemId:      item.id,
        itemTitle:   item.title,
        levelName:   item.levelName,
        contentType: item.contentType,
        matchedOn,
        score:       highestScore,
      })
    }
  }

  // Sort matches highest score first, cap at 3 shown
  matches.sort((a, b) => b.score - a.score)
  const topMatches = matches.slice(0, 3)

  if (topMatches.length === 0) return noRisk()

  const topScore = topMatches[0].score

  if (topScore >= 65) {
    return {
      risk:           'likely',
      matches:        topMatches,
      matchedField:   topMatches[0].matchedOn,
      recommendation: 'improve_existing',
      explanation:    buildExplanation('likely', topMatches[0], draftTitle),
    }
  }

  if (topScore >= 40) {
    return {
      risk:           'possible',
      matches:        topMatches,
      matchedField:   topMatches[0].matchedOn,
      recommendation: 'keep_separate',
      explanation:    buildExplanation('possible', topMatches[0], draftTitle),
    }
  }

  return noRisk()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function noRisk(): DuplicateCheckResult {
  return {
    risk:           'none',
    matches:        [],
    matchedField:   null,
    recommendation: 'no_action',
    explanation:    '',
  }
}

function buildExplanation(
  risk: DuplicateRisk,
  match: DuplicateMatch,
  draftTitle: string,
): string {
  if (risk === 'likely') {
    return (
      `"${match.itemTitle}" at ${match.levelName} appears to cover the same ground as "${draftTitle}". ` +
      `DONNA recommends improving the existing item instead of adding a duplicate.`
    )
  }
  return (
    `"${match.itemTitle}" at ${match.levelName} has some overlap with "${draftTitle}". ` +
    `Review both to confirm they serve distinct purposes before saving.`
  )
}
