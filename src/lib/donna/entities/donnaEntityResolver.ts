// Sprint 1831–1860 — DONNA Intent, Goal & Continuity Engine V1
// Entity Resolution Layer
//
// Sits between Intent and Goal:
//   Intent → Entity → Goal → Workflow → Completion
//
// Resolves named entities from director input — player names, coach names,
// curriculum levels, sessions, templates, parents, assessments.
//
// Important: This layer is HEURISTIC only.
//   - It does NOT query the database.
//   - It returns a best-guess entity label + resolution hint.
//   - Actual DB lookup (player_id, level_id, etc.) happens in a future sprint
//     when the goal is confirmed and the director approves.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Conservative: low confidence when entity is ambiguous.
//   - Approval-safe: entity resolution never triggers mutations.

import {
  matchWeightedSignals,
  toConfidenceLevel,
  CONFIDENCE_LOW_THRESHOLD,
} from '../intent/confidenceScoring'
import type { WeightedSignal, ConfidenceLevel } from '../intent/confidenceScoring'

// ── Entity types ──────────────────────────────────────────────────────────────

export type EntityType =
  | 'player'
  | 'coach'
  | 'parent'
  | 'curriculum_level'
  | 'assessment'
  | 'session'
  | 'template'
  | 'group'
  | 'unknown'

// ── Entity result ─────────────────────────────────────────────────────────────

export interface ResolvedEntity {
  entityType: EntityType
  /** Raw text extracted from the input that triggered this entity */
  rawText: string
  /** Cleaned, human-readable label (e.g. "Orange Ball 2", "Jamie Chen") */
  normalizedLabel: string
  confidence: number
  confidenceLevel: ConfidenceLevel
  /** True when a DB lookup will be needed to get the actual record ID */
  needsResolution: boolean
  /** What to search for (feed to a DB lookup when confirmed) */
  resolutionHint: string
  /** Short explanation of how this entity was recognized */
  reasoning: string
}

export interface EntityResolutionResult {
  /** Primary resolved entity, or null if none found */
  primary: ResolvedEntity | null
  /** All candidates (sorted by confidence) */
  all: ResolvedEntity[]
  /** True when no entity above low-confidence threshold was found */
  noEntityFound: boolean
}

// ── Ball level patterns ───────────────────────────────────────────────────────

const BALL_COLORS = ['red', 'orange', 'green', 'yellow', 'purple', 'blue', 'white']

const BALL_LEVEL_RE = new RegExp(
  `\\b(${BALL_COLORS.join('|')})\\s*(?:ball)?\\s*([1-3]?)\\b`,
  'i',
)

// Short form: "Orange 2", "Red 1"
const BALL_SHORT_RE = new RegExp(
  `\\b(${BALL_COLORS.join('|')})\\s+([1-3])\\b`,
  'i',
)

function extractCurriculumLevel(text: string): ResolvedEntity | null {
  const m = BALL_SHORT_RE.exec(text) ?? BALL_LEVEL_RE.exec(text)
  if (!m) return null

  const color = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()
  const num   = m[2] ? ` ${m[2]}` : ''
  const label = `${color} Ball${num}`

  return {
    entityType: 'curriculum_level',
    rawText: m[0],
    normalizedLabel: label,
    confidence: 0.92,
    confidenceLevel: 'definitive',
    needsResolution: true,
    resolutionHint: label,
    reasoning: `Matched ball level pattern: "${m[0]}"`,
  }
}

// ── Session context patterns ──────────────────────────────────────────────────

const SESSION_SIGNALS: WeightedSignal[] = [
  { signal: "today's session",   weight: 'strong' },
  { signal: 'last session',      weight: 'strong' },
  { signal: 'this session',      weight: 'strong' },
  { signal: 'the session',       weight: 'medium' },
  { signal: 'morning session',   weight: 'strong' },
  { signal: 'afternoon session', weight: 'strong' },
  { signal: 'session today',     weight: 'strong' },
  { signal: 'last class',        weight: 'medium' },
  { signal: 'this class',        weight: 'medium' },
]

function extractSession(text: string): ResolvedEntity | null {
  const result = matchWeightedSignals(text.toLowerCase(), SESSION_SIGNALS)
  if (result.confidence < CONFIDENCE_LOW_THRESHOLD) return null

  const matched = result.matched[0] ?? 'session'
  return {
    entityType: 'session',
    rawText: matched,
    normalizedLabel: matched.charAt(0).toUpperCase() + matched.slice(1),
    confidence: result.confidence,
    confidenceLevel: toConfidenceLevel(result.confidence),
    needsResolution: true,
    resolutionHint: matched,
    reasoning: `Session reference detected: "${matched}"`,
  }
}

// ── Template patterns ─────────────────────────────────────────────────────────

const TEMPLATE_SIGNALS: WeightedSignal[] = [
  { signal: 'this template',     weight: 'strong' },
  { signal: 'the template',      weight: 'medium' },
  { signal: 'class template',    weight: 'strong' },
  { signal: 'session template',  weight: 'strong' },
  { signal: 'fitness template',  weight: 'strong' },
  { signal: 'the plan',          weight: 'medium' },
]

function extractTemplate(text: string): ResolvedEntity | null {
  const result = matchWeightedSignals(text.toLowerCase(), TEMPLATE_SIGNALS)
  if (result.confidence < CONFIDENCE_LOW_THRESHOLD) return null

  const matched = result.matched[0] ?? 'template'
  return {
    entityType: 'template',
    rawText: matched,
    normalizedLabel: matched.charAt(0).toUpperCase() + matched.slice(1),
    confidence: result.confidence,
    confidenceLevel: toConfidenceLevel(result.confidence),
    needsResolution: true,
    resolutionHint: matched,
    reasoning: `Template reference detected: "${matched}"`,
  }
}

// ── Named person extraction ───────────────────────────────────────────────────
// Heuristic: capitalized words that are not common stop words.

const PERSON_STOP_WORDS = new Set([
  'i', 'we', 'you', 'he', 'she', 'they', 'the', 'a', 'an', 'and', 'or',
  'but', 'in', 'on', 'at', 'for', 'to', 'of', 'with', 'from',
  'ok', 'okay', 'yes', 'no', 'not', 'need', 'help', 'ball', 'coach',
  "let's", 'let', 'go', 'back', 'done', 'finish', 'start', 'get',
  'what', 'how', 'why', 'when', 'where', 'who', 'which', 'that',
  'this', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can',
  'could', 'should', 'may', 'might', 'shall', 'orange', 'red', 'green',
  'yellow', 'blue', 'purple', 'white', 'donna', 'academy', 'player',
])

const COACH_PREFIXES = ['coach', 'instructor', 'trainer']
const PARENT_INDICATORS = ["player's parent", "his parent", "her parent", "the parent", "their parent"]
const ASSESSMENT_INDICATORS = ['assessment', 'evaluation', 'the test', 'today\'s assessment', 'the assessment']

function extractNamedPerson(
  text: string,
): { name: string; entityType: 'player' | 'coach' | 'parent' } | null {
  const lower = text.toLowerCase()

  // Coach prefix detection
  for (const prefix of COACH_PREFIXES) {
    const idx = lower.indexOf(prefix + ' ')
    if (idx !== -1) {
      const after = text.slice(idx + prefix.length + 1).split(/\s+/)[0] ?? ''
      const clean = after.replace(/[^a-zA-Z'-]/g, '')
      if (clean.length >= 2 && /^[A-Z]/.test(clean) && !PERSON_STOP_WORDS.has(clean.toLowerCase())) {
        return { name: `Coach ${clean}`, entityType: 'coach' }
      }
    }
  }

  // Parent indicators
  if (PARENT_INDICATORS.some(p => lower.includes(p))) {
    return { name: 'Parent', entityType: 'parent' }
  }

  // Capitalized name tokens (player heuristic)
  const words = text.split(/\s+/)
  const nameTokens: string[] = []
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z'-]/g, '')
    if (
      clean.length >= 2 &&
      /^[A-Z]/.test(clean) &&
      !PERSON_STOP_WORDS.has(clean.toLowerCase())
    ) {
      nameTokens.push(clean)
      if (nameTokens.length >= 2) break
    }
  }

  if (nameTokens.length > 0) {
    return { name: nameTokens.join(' '), entityType: 'player' }
  }

  return null
}

function buildPersonEntity(
  name: string,
  entityType: 'player' | 'coach' | 'parent',
  rawText: string,
): ResolvedEntity {
  // Lower confidence for single first-name matches (common false positives)
  const confidence = name.includes(' ') ? 0.75 : 0.60

  return {
    entityType,
    rawText,
    normalizedLabel: name,
    confidence,
    confidenceLevel: toConfidenceLevel(confidence),
    needsResolution: true,
    resolutionHint: name,
    reasoning: `Heuristic name extraction: "${name}" detected as ${entityType}.`,
  }
}

// ── Assessment extraction ─────────────────────────────────────────────────────

function extractAssessment(text: string): ResolvedEntity | null {
  const lower = text.toLowerCase()
  const matched = ASSESSMENT_INDICATORS.find(i => lower.includes(i))
  if (!matched) return null

  return {
    entityType: 'assessment',
    rawText: matched,
    normalizedLabel: 'Assessment',
    confidence: 0.80,
    confidenceLevel: 'high',
    needsResolution: true,
    resolutionHint: matched,
    reasoning: `Assessment reference detected: "${matched}"`,
  }
}

// ── Main resolver ─────────────────────────────────────────────────────────────

/**
 * Resolve entities from director input.
 * Returns all detected entities sorted by confidence.
 * Does NOT query the database — heuristic detection only.
 * Approval-safe: never triggers mutations.
 */
export function resolveEntities(text: string): EntityResolutionResult {
  const candidates: ResolvedEntity[] = []

  // Curriculum level (highest specificity)
  const level = extractCurriculumLevel(text)
  if (level) candidates.push(level)

  // Assessment
  const assessment = extractAssessment(text)
  if (assessment) candidates.push(assessment)

  // Session reference
  const session = extractSession(text)
  if (session) candidates.push(session)

  // Template reference
  const template = extractTemplate(text)
  if (template) candidates.push(template)

  // Named person (player/coach/parent)
  const person = extractNamedPerson(text)
  if (person) {
    candidates.push(buildPersonEntity(person.name, person.entityType, person.name))
  }

  const sorted = candidates.sort((a, b) => b.confidence - a.confidence)
  const primary = sorted[0] ?? null
  const noEntityFound = primary === null || primary.confidence < CONFIDENCE_LOW_THRESHOLD

  return { primary, all: sorted, noEntityFound }
}

/**
 * Returns just the primary entity label or null.
 * Convenience wrapper for callers that only need the label.
 */
export function resolveEntityLabel(text: string): string | null {
  const result = resolveEntities(text)
  return result.primary?.normalizedLabel ?? null
}
