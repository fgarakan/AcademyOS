// Mega Sprint 1475–1504 — DONNA Player Relationship Resolution V1
// Resolves free-text DONNA answers (coach name, group name, curriculum level)
// into database UUIDs for player creation.
//
// Resolution rules:
//   Single high-confidence match (≥0.80, clear winner by 0.10 gap) → resolved
//   Multiple matches above threshold → ambiguous → director must confirm
//   No match → unresolved → field left null, logged in warnings
//   Secondary coach → no schema support → metadata only, never silently saved

import type {
  CoachContextSummary,
  GroupSummary,
  CurriculumLevelContextSummary,
} from '@/lib/donna/extendedContextLoaders'

// ── Input / output types ──────────────────────────────────────────────────────

export interface PlayerAssignmentInput {
  assignedCoachText:    string | null
  assignedGroupText:    string | null
  recommendedLevelText: string | null
}

export interface AmbiguousMatch {
  field:      'primary_coach' | 'group' | 'curriculum_level'
  inputText:  string
  candidates: Array<{ id: string; displayName: string; confidence: number }>
}

export interface PlayerAssignmentResolution {
  primaryCoachId:   string | null
  currentGroupId:   string | null
  currentLevelId:   string | null
  displayLabels: {
    primaryCoach:  string | null
    currentGroup:  string | null
    currentLevel:  string | null
  }
  ambiguousFields:  AmbiguousMatch[]
  unresolvedFields: string[]
  warnings:         string[]
}

export interface PlayerAssignmentContext {
  coaches:          CoachContextSummary[]
  groups:           GroupSummary[]
  curriculumLevels: CurriculumLevelContextSummary[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HIGH_CONFIDENCE_MIN = 0.80
const MATCH_THRESHOLD     = 0.60
const CLEAR_WIN_GAP       = 0.10

// ── Utilities ─────────────────────────────────────────────────────────────────

function normalizeText(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

function tokenSet(text: string): Set<string> {
  return new Set(normalizeText(text).split(/\s+/).filter(Boolean))
}

// ── Coach matching ─────────────────────────────────────────────────────────────

function matchCoach(
  text:    string,
  coaches: CoachContextSummary[],
): Array<{ id: string; displayName: string; confidence: number }> {
  if (!text || coaches.length === 0) return []

  const lower   = normalizeText(text)
  const tokens  = tokenSet(text)
  const seen    = new Map<string, { id: string; displayName: string; confidence: number }>()

  // "head coach" → first head_coach in roster
  if (/head\s*coach/.test(lower)) {
    const hc = coaches.find(c => c.role === 'head_coach')
    if (hc) seen.set(hc.coachId, { id: hc.coachId, displayName: hc.displayName, confidence: 0.85 })
  }

  const prefixMatch = lower.match(/coach\s+(\w+)/)
  const prefixFirst = prefixMatch ? prefixMatch[1] : null

  for (const coach of coaches) {
    const first   = coach.firstName.toLowerCase()
    const last    = coach.lastName.toLowerCase()
    const display = coach.displayName.toLowerCase()
    const normDisplay = normalizeText(coach.displayName)

    if (normDisplay.length > 0 && lower.includes(normDisplay)) {
      seen.set(coach.coachId, { id: coach.coachId, displayName: coach.displayName, confidence: 0.95 })
      continue
    }
    if (prefixFirst && first.length > 1 && prefixFirst === first) {
      if (!seen.has(coach.coachId)) {
        seen.set(coach.coachId, { id: coach.coachId, displayName: coach.displayName, confidence: 0.90 })
      }
      continue
    }
    if (first.length > 2 && tokens.has(first)) {
      if (!seen.has(coach.coachId)) {
        seen.set(coach.coachId, { id: coach.coachId, displayName: coach.displayName, confidence: 0.68 })
      }
      continue
    }
    if (last.length > 2 && tokens.has(last)) {
      if (!seen.has(coach.coachId)) {
        seen.set(coach.coachId, { id: coach.coachId, displayName: coach.displayName, confidence: 0.62 })
      }
    }
  }

  return Array.from(seen.values())
    .filter(r => r.confidence >= MATCH_THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence)
}

// ── Group matching ─────────────────────────────────────────────────────────────

function matchGroup(
  text:   string,
  groups: GroupSummary[],
): Array<{ id: string; displayName: string; confidence: number }> {
  if (!text || groups.length === 0) return []

  const lower  = normalizeText(text)
  const tokens = tokenSet(text)
  const results: Array<{ id: string; displayName: string; confidence: number }> = []

  for (const group of groups) {
    const normName   = normalizeText(group.name)
    const nameTokens = normName.split(/\s+/).filter(Boolean)

    if (normName.length > 0 && (lower === normName || lower.includes(normName))) {
      results.push({ id: group.groupId, displayName: group.name, confidence: 0.92 })
      continue
    }
    if (nameTokens.length > 1 && nameTokens.every(t => tokens.has(t))) {
      results.push({ id: group.groupId, displayName: group.name, confidence: 0.75 })
      continue
    }
    if (nameTokens.some(t => t.length > 3 && tokens.has(t))) {
      results.push({ id: group.groupId, displayName: group.name, confidence: 0.55 })
    }
  }

  return results
    .filter(r => r.confidence >= MATCH_THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence)
}

// ── Curriculum level matching ─────────────────────────────────────────────────

function matchCurriculumLevel(
  text:   string,
  levels: CurriculumLevelContextSummary[],
): Array<{ id: string; displayName: string; confidence: number }> {
  if (!text || levels.length === 0) return []

  const lower  = normalizeText(text)
  const tokens = tokenSet(text)
  const results: Array<{ id: string; displayName: string; confidence: number }> = []

  for (const level of levels) {
    const normDisplay = normalizeText(level.displayName)
    const displayTokens = normDisplay.split(/\s+/).filter(Boolean)

    if (normDisplay.length > 0 && (lower === normDisplay || lower.includes(normDisplay))) {
      results.push({ id: level.id, displayName: level.displayName, confidence: 0.95 })
      continue
    }
    if (displayTokens.length > 1 && displayTokens.every(t => tokens.has(t))) {
      results.push({ id: level.id, displayName: level.displayName, confidence: 0.80 })
    }
  }

  return results
    .filter(r => r.confidence >= MATCH_THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence)
}

// ── Disambiguation helper ─────────────────────────────────────────────────────

function isClearWinner(
  matches: Array<{ confidence: number }>,
): boolean {
  if (matches.length === 0) return false
  if (matches.length === 1) return matches[0].confidence >= HIGH_CONFIDENCE_MIN
  return (
    matches[0].confidence >= HIGH_CONFIDENCE_MIN &&
    matches[0].confidence - matches[1].confidence >= CLEAR_WIN_GAP
  )
}

// ── Main resolver ─────────────────────────────────────────────────────────────

export function resolvePlayerAssignments(
  input: PlayerAssignmentInput,
  ctx:   PlayerAssignmentContext,
): PlayerAssignmentResolution {
  const resolution: PlayerAssignmentResolution = {
    primaryCoachId:   null,
    currentGroupId:   null,
    currentLevelId:   null,
    displayLabels: { primaryCoach: null, currentGroup: null, currentLevel: null },
    ambiguousFields:  [],
    unresolvedFields: [],
    warnings:         [],
  }

  // ── Primary coach ────────────────────────────────────────────────────────────
  if (input.assignedCoachText) {
    const matches = matchCoach(input.assignedCoachText, ctx.coaches)
    if (matches.length === 0) {
      resolution.unresolvedFields.push('primary_coach')
      resolution.warnings.push(
        `No coach matched "${input.assignedCoachText}" — primary_coach_id will not be set`,
      )
    } else if (isClearWinner(matches)) {
      resolution.primaryCoachId = matches[0].id
      resolution.displayLabels.primaryCoach = matches[0].displayName
    } else {
      resolution.ambiguousFields.push({
        field:      'primary_coach',
        inputText:  input.assignedCoachText,
        candidates: matches.slice(0, 4),
      })
    }
  }

  // ── Secondary coach: schema limitation ───────────────────────────────────────
  // players.secondary_coach_id does not exist; no player_coaches junction table.
  // Text preserved in audit log by the action. No UUID resolution attempted.

  // ── Group ────────────────────────────────────────────────────────────────────
  if (input.assignedGroupText) {
    const matches = matchGroup(input.assignedGroupText, ctx.groups)
    if (matches.length === 0) {
      resolution.unresolvedFields.push('current_group')
      resolution.warnings.push(
        `No group matched "${input.assignedGroupText}" — current_group_id will not be set`,
      )
    } else if (isClearWinner(matches)) {
      resolution.currentGroupId = matches[0].id
      resolution.displayLabels.currentGroup = matches[0].displayName
    } else {
      resolution.ambiguousFields.push({
        field:      'group',
        inputText:  input.assignedGroupText,
        candidates: matches.slice(0, 4),
      })
    }
  }

  // ── Curriculum level ─────────────────────────────────────────────────────────
  if (input.recommendedLevelText) {
    const matches = matchCurriculumLevel(input.recommendedLevelText, ctx.curriculumLevels)
    if (matches.length === 0) {
      resolution.unresolvedFields.push('current_level')
      resolution.warnings.push(
        `No curriculum level matched "${input.recommendedLevelText}" — current_level_id will not be set`,
      )
    } else if (isClearWinner(matches)) {
      resolution.currentLevelId = matches[0].id
      resolution.displayLabels.currentLevel = matches[0].displayName
    } else {
      resolution.ambiguousFields.push({
        field:      'curriculum_level',
        inputText:  input.recommendedLevelText,
        candidates: matches.slice(0, 4),
      })
    }
  }

  return resolution
}
