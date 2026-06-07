// Mega Sprint 904–933C — DONNA Brain Runtime Wiring V1
//
// Single canonical access layer for the DONNA Global Brain.
// All runtime brain lookups go through this file.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Reads INITIAL_BRAIN_SEED only — no other brain source exists yet.
//   - Does NOT import from donnaKnowledgeContextAdapter (avoids circular dep).
//   - Does NOT import from processDonnaMessage (avoids circular dep).
//   - Does NOT do intent classification — that remains in donnaIntentEngine.
//   - Conservative query matching: only surfaces brain entries when highly relevant.
//   - All vocabulary/intent/decision_rule/philosophy lookups are O(21) — trivial cost.
//
// Certification: docs/qa/DONNA_INITIAL_BRAIN_CERTIFICATION_904.md
// Architecture: docs/brain/DONNA_INITIAL_BRAIN_904.md
// Seed:         src/lib/donna/brain/initialBrainSeed.ts

import {
  INITIAL_BRAIN_SEED,
  getSeedByKey,
  getSeedByType,
} from './initialBrainSeed'
import type { SeedBrainEntry } from './initialBrainSeed'
import type { GlobalBrainEntryType } from './donnaBrainGovernance'

// ── Query input ────────────────────────────────────────────────────────────────

export interface BrainQueryParams {
  query: string
  role: 'director' | 'coach' | 'parent' | 'player'
  currentRoute?: string | null
}

// ── Query result ───────────────────────────────────────────────────────────────
//
// Returned by queryBrain(). Consumed by donnaKnowledgeContextAdapter.ts
// to build a KnowledgeContext without creating a circular import.

export interface BrainQueryResult {
  matched: SeedBrainEntry[]
  hasMatches: boolean
  queryNormalized: string
  matchReasons: string[]
}

// ── Role-based visibility ──────────────────────────────────────────────────────
//
// All 21 brain entries are global. Visibility filtering is:
//   - vocabulary:    director, coach (not surfaced to parent/player — internal terminology)
//   - intent:        director only (routing concepts; not useful to coach/parent/player)
//   - decision_rule: director, coach (coaches need to know stall thresholds)
//   - philosophy:    all roles (product principles apply to everyone)

function isEntryVisibleToRole(
  entry: SeedBrainEntry,
  role: BrainQueryParams['role'],
): boolean {
  if (role === 'director') return true
  if (role === 'parent' || role === 'player') return entry.type === 'philosophy'
  // coach
  return entry.type !== 'intent'
}

// ── Vocabulary query matchers ──────────────────────────────────────────────────
//
// Matches when the query asks "what is a X?" or contains the term directly.
// Covers the canonical term + common synonyms.

const VOCAB_QUERY_TERMS: Record<string, string[]> = {
  'vocabulary.group':           ['what is a group', 'what are groups', 'define group', 'what does group mean', 'training group', 'what is a training group'],
  'vocabulary.session':         ['what is a session', 'what are sessions', 'define session', 'what does session mean'],
  'vocabulary.wrap_up':         ['what is a wrap-up', 'what is wrap up', 'what are wrap-ups', 'define wrap-up', 'what does wrap-up mean', 'explain wrap-up', 'what is a wrapup'],
  'vocabulary.level':           ['what is a level', 'what are levels', 'define level', 'curriculum level', 'what does level mean', 'ball level', 'orange ball', 'red ball'],
  'vocabulary.template':        ['what is a template', 'what are templates', 'define template', 'class template', 'session template', 'what does template mean'],
  'vocabulary.coach':           ['what is a coach', 'define coach', 'what does coach mean', 'what is head coach', 'role of coach'],
  'vocabulary.player':          ['what is a player', 'what are players', 'define player', 'what does player mean'],
  'vocabulary.proposed_action': ['what is a proposed action', 'what are proposed actions', 'define proposed action', 'what does proposed action mean', 'how does donna propose'],
}

// ── Decision rule query matchers ───────────────────────────────────────────────

const RULE_QUERY_TERMS: Record<string, string[]> = {
  'decision_rule.player_stall_medium': [
    'what is a stall', 'stalled player', 'what counts as stalled',
    'when is a player stalled', 'stall threshold', '90 days', 'stall criteria',
  ],
  'decision_rule.player_stall_high': [
    'high stall', '180 days', 'severe stall', 'serious stall',
    'how long before high stall',
  ],
  'decision_rule.assessment_overdue': [
    'assessment overdue', 'when is assessment overdue', 'overdue assessment',
    'how long before assessment overdue', 'assessment threshold',
  ],
  'decision_rule.mutation_requires_approval': [
    'why approval', 'why does donna need approval', 'why does it need approval',
    'approval required', 'why can\'t donna', 'why can\'t it just',
    'approval for', 'require approval', 'needs approval',
  ],
}

// ── Philosophy query matchers ──────────────────────────────────────────────────

const PHILOSOPHY_QUERY_TERMS: Record<string, string[]> = {
  'philosophy.voice_creates_ui_confirms': [
    'how does donna work', 'how does voice work', 'voice model',
    'operating model', 'how does the system work', 'voice to database',
  ],
  'philosophy.ai_proposes_director_approves': [
    'why does donna need approval', 'ai proposes', 'why must i approve',
    'approval model', 'why approval', 'donna proposes', 'director approves',
  ],
  'philosophy.data_never_invented': [
    'does donna make things up', 'can donna invent', 'donna accuracy',
    'how accurate is donna', 'does donna guess', 'donna makes up',
    'not enough data',
  ],
}

// ── Core matcher ───────────────────────────────────────────────────────────────

function matchVocabulary(lower: string): SeedBrainEntry[] {
  const matches: SeedBrainEntry[] = []
  for (const [key, terms] of Object.entries(VOCAB_QUERY_TERMS)) {
    if (terms.some(t => lower.includes(t))) {
      const entry = getSeedByKey(key)
      if (entry) matches.push(entry)
    }
  }
  return matches
}

function matchDecisionRules(lower: string): SeedBrainEntry[] {
  const matches: SeedBrainEntry[] = []
  for (const [key, terms] of Object.entries(RULE_QUERY_TERMS)) {
    if (terms.some(t => lower.includes(t))) {
      const entry = getSeedByKey(key)
      if (entry) matches.push(entry)
    }
  }
  return matches
}

function matchPhilosophy(lower: string): SeedBrainEntry[] {
  const matches: SeedBrainEntry[] = []
  for (const [key, terms] of Object.entries(PHILOSOPHY_QUERY_TERMS)) {
    if (terms.some(t => lower.includes(t))) {
      const entry = getSeedByKey(key)
      if (entry) matches.push(entry)
    }
  }
  return matches
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Query the Global Brain for entries relevant to a director/coach query.
 * Returns matched entries with reasons. O(21) — trivial cost.
 * Does NOT do intent classification — that remains in donnaIntentEngine.
 * Does NOT surface intent entries as query responses — they are for documentation only.
 */
export function queryBrain(params: BrainQueryParams): BrainQueryResult {
  const lower = params.query.toLowerCase().trim()
  const reasons: string[] = []

  const vocabMatches   = matchVocabulary(lower)
  const ruleMatches    = matchDecisionRules(lower)
  const philoMatches   = matchPhilosophy(lower)

  if (vocabMatches.length > 0)  reasons.push(`vocabulary match on: ${vocabMatches.map(e => e.key).join(', ')}`)
  if (ruleMatches.length > 0)   reasons.push(`decision rule match on: ${ruleMatches.map(e => e.key).join(', ')}`)
  if (philoMatches.length > 0)  reasons.push(`philosophy match on: ${philoMatches.map(e => e.key).join(', ')}`)

  const allMatched = [...vocabMatches, ...ruleMatches, ...philoMatches]
    .filter(e => isEntryVisibleToRole(e, params.role))

  // De-duplicate by key
  const seen = new Set<string>()
  const deduped = allMatched.filter(e => {
    if (seen.has(e.key)) return false
    seen.add(e.key)
    return true
  })

  return {
    matched:          deduped,
    hasMatches:       deduped.length > 0,
    queryNormalized:  lower,
    matchReasons:     reasons,
  }
}

// ── Individual lookup functions ────────────────────────────────────────────────

/** Look up any brain entry by its canonical key. */
export function lookupBrainEntry(key: string): SeedBrainEntry | null {
  return getSeedByKey(key)
}

/** Look up all vocabulary entries. */
export function getVocabularyEntries(): SeedBrainEntry[] {
  return getSeedByType('vocabulary')
}

/** Look up all intent entries. */
export function getIntentEntries(): SeedBrainEntry[] {
  return getSeedByType('intent')
}

/** Look up all decision rule entries. */
export function getDecisionRuleEntries(): SeedBrainEntry[] {
  return getSeedByType('decision_rule')
}

/** Look up all philosophy entries. */
export function getPhilosophyEntries(): SeedBrainEntry[] {
  return getSeedByType('philosophy')
}

/**
 * Look up the canonical vocabulary definition for a term.
 * Returns the definition string if found, null otherwise.
 */
export function lookupVocabularyDefinition(term: string): string | null {
  const lower = term.toLowerCase().trim()
  for (const [key, terms] of Object.entries(VOCAB_QUERY_TERMS)) {
    // Also try direct term match against key slug
    const keySlug = key.replace('vocabulary.', '').replace('_', ' ')
    if (lower === keySlug || terms.some(t => t === lower || t === `what is a ${lower}`)) {
      return getSeedByKey(key)?.definition ?? null
    }
  }
  return null
}

/**
 * Look up a decision rule by key and return its definition.
 * Useful when DONNA needs to cite a rule threshold in an explanation.
 */
export function lookupDecisionRuleDefinition(key: string): string | null {
  const entry = getSeedByKey(key)
  if (!entry || entry.type !== 'decision_rule') return null
  return entry.definition
}

/**
 * Look up a philosophy principle by key and return its definition.
 * Used when DONNA needs to explain approval requirements or operating model.
 */
export function lookupPhilosophyStatement(key: string): string | null {
  const entry = getSeedByKey(key)
  if (!entry || entry.type !== 'philosophy') return null
  return entry.definition
}

/**
 * Get all brain entries of a given type.
 * Alias for getSeedByType with external accessibility.
 */
export function getBrainEntriesByType(type: GlobalBrainEntryType): SeedBrainEntry[] {
  return getSeedByType(type)
}

/**
 * Format a single brain entry as a short DONNA-readable statement.
 * Used when injecting brain knowledge into a response.
 */
export function formatBrainEntryForResponse(entry: SeedBrainEntry): string {
  switch (entry.type) {
    case 'vocabulary':
      return `**${entry.label}**: ${entry.definition}`
    case 'decision_rule':
      return `**${entry.label}** (AcademyOS rule): ${entry.definition}`
    case 'philosophy':
      return `**${entry.label}** (AcademyOS principle): ${entry.definition}`
    case 'intent':
      return `**${entry.label}**: ${entry.definition}`
    default:
      return entry.definition
  }
}

/**
 * Format all matched brain entries from a query result into a response block.
 * Returns null if no matches. Caps at 3 entries to avoid verbose responses.
 */
export function formatBrainQueryResult(result: BrainQueryResult): string | null {
  if (!result.hasMatches) return null

  const lines: string[] = []
  const toFormat = result.matched.slice(0, 3)

  for (const entry of toFormat) {
    lines.push(formatBrainEntryForResponse(entry))
    if (entry.examples.length > 0) {
      lines.push(`_Example: ${entry.examples[0]}_`)
    }
  }

  return lines.join('\n\n')
}

// ── Brain stats ────────────────────────────────────────────────────────────────

export const BRAIN_RUNTIME_STATS = {
  totalEntries:   INITIAL_BRAIN_SEED.length,
  vocabularyKeys: INITIAL_BRAIN_SEED.filter(e => e.type === 'vocabulary').map(e => e.key),
  intentKeys:     INITIAL_BRAIN_SEED.filter(e => e.type === 'intent').map(e => e.key),
  ruleKeys:       INITIAL_BRAIN_SEED.filter(e => e.type === 'decision_rule').map(e => e.key),
  philosophyKeys: INITIAL_BRAIN_SEED.filter(e => e.type === 'philosophy').map(e => e.key),
  sourceFile:     'src/lib/donna/brain/initialBrainSeed.ts',
  certifiedBy:    'docs/qa/DONNA_INITIAL_BRAIN_CERTIFICATION_904.md',
} as const
