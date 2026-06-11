// Mega Sprint 1746–1775 — DONNA Philosophy Memory & Academy Evolution Engine V1
// Academy Philosophy Memory: learns what the academy prefers from director behavior.
//
// Distinct from onboarding DNA (stated preferences) and curriculum memory (per-item decisions).
// This layer observes patterns across decisions and builds a behavioral preference record.
//
// Intelligence hierarchy position: Memory layer.
// Inputs: CurriculumMemoryEntry[] + AcademyMemory[] (pre-fetched by caller).
// Storage: academies.settings.donna_philosophy_memory[] (JSONB array — no new table).
// No DB calls. No mutations in analysis functions.

import type { CurriculumMemoryEntry } from '../curriculum/curriculumMemory'
import type { AcademyMemory } from '../memory/donnaAcademyMemoryTypes'

// ── Preference key vocabulary ─────────────────────────────────────────────────

export type PhilosophyPreferenceKey =
  | 'game_based_learning'        // game-type and rally/point-play content
  | 'tactical_focus'             // tactical/strategy/pattern content
  | 'technical_focus'            // drills, skills, technique content
  | 'competition_emphasis'       // competition/match-play content
  | 'assessment_rigor'           // assessment, gate, evaluation content
  | 'fitness_emphasis'           // fitness/movement/physical content
  | 'mental_performance'         // mental skills, mindset, resilience content
  | 'parent_transparency'        // parent guidance and parent-facing content
  | 'player_autonomy'            // player missions, home practice, self-directed content
  | 'coach_autonomy'             // director tendency to modify vs. accept coach proposals
  | 'long_term_development'      // patience with advancement; slow progression indicators
  | 'curriculum_expansion'       // overall appetite for adding curriculum content

export type PhilosophySignalDirection = 'positive' | 'negative'
export type PhilosophySignalStrength  = 'strong' | 'moderate' | 'weak'
export type PhilosophyConfidence      = 'high' | 'medium' | 'low' | 'insufficient'

// ── Memory entry ──────────────────────────────────────────────────────────────

export interface PhilosophyMemoryEntry {
  id:             string
  learnedAt:      string               // ISO date
  source:         'curriculum_decision' | 'proposed_action_decision'
  preferenceKey:  PhilosophyPreferenceKey
  preferenceLabel: string
  /** positive = director endorsed this type; negative = director avoided/removed it */
  signal:         PhilosophySignalDirection
  strength:       PhilosophySignalStrength
  contextLabel:   string              // human-readable e.g. "Added: game at Orange Ball 2"
  relatedMemoryId: string | null
  confidence:     PhilosophyConfidence
}

// ── Content type → preference key ────────────────────────────────────────────

const CONTENT_TYPE_PREFERENCE: Record<string, PhilosophyPreferenceKey | null> = {
  game:             'game_based_learning',
  tactical:         'tactical_focus',
  drill:            'technical_focus',
  skill:            'technical_focus',
  competition:      'competition_emphasis',
  assessment:       'assessment_rigor',
  fitness:          'fitness_emphasis',
  mental_skill:     'mental_performance',
  parent_guidance:  'parent_transparency',
  player_mission:   'player_autonomy',
  coach_cue:        'technical_focus',
  success_criteria: 'assessment_rigor',
  progression:      'long_term_development',
  regression:       'long_term_development',
}

const PREFERENCE_LABELS: Record<PhilosophyPreferenceKey, string> = {
  game_based_learning:   'Game-Based Learning',
  tactical_focus:        'Tactical Focus',
  technical_focus:       'Technical Focus',
  competition_emphasis:  'Competition Emphasis',
  assessment_rigor:      'Assessment Rigor',
  fitness_emphasis:      'Fitness Emphasis',
  mental_performance:    'Mental Performance',
  parent_transparency:   'Parent Transparency',
  player_autonomy:       'Player Autonomy',
  coach_autonomy:        'Coach Autonomy',
  long_term_development: 'Long-Term Development',
  curriculum_expansion:  'Curriculum Expansion',
}

function intentToSignal(intent: CurriculumMemoryEntry['intent']): PhilosophySignalDirection {
  return intent === 'remove' ? 'negative' : 'positive'
}

function intentToStrength(intent: CurriculumMemoryEntry['intent']): PhilosophySignalStrength {
  if (intent === 'add' || intent === 'remove') return 'strong'
  if (intent === 'expand' || intent === 'replace') return 'moderate'
  return 'weak'
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Derives philosophy memory entries from observed director behavior.
 * Call after loading curriculum memory and academy memories.
 * Returns entries that should be appended to donna_philosophy_memory[].
 */
export function buildPhilosophyMemoryFromBehavior(
  curriculumMemory: CurriculumMemoryEntry[],
  academyMemories:  AcademyMemory[],
): PhilosophyMemoryEntry[] {
  const entries: PhilosophyMemoryEntry[] = []

  // ── From curriculum decisions ─────────────────────────────────────────────
  // Each approved curriculum draft signals a preference for its content type.
  for (const entry of curriculumMemory) {
    const prefKey = CONTENT_TYPE_PREFERENCE[entry.contentType ?? ''] ?? null

    // Every approved curriculum change also signals appetite for curriculum expansion
    entries.push({
      id:              `philo_expand_${entry.id}`,
      learnedAt:       entry.createdAt,
      source:          'curriculum_decision',
      preferenceKey:   'curriculum_expansion',
      preferenceLabel: PREFERENCE_LABELS.curriculum_expansion,
      signal:          entry.intent === 'remove' ? 'negative' : 'positive',
      strength:        'weak',
      contextLabel:    `Curriculum ${entry.intent}: ${entry.levelName ?? 'unknown level'}`,
      relatedMemoryId: entry.id,
      confidence:      'low',
    })

    if (!prefKey) continue

    entries.push({
      id:              `philo_curr_${entry.id}`,
      learnedAt:       entry.createdAt,
      source:          'curriculum_decision',
      preferenceKey:   prefKey,
      preferenceLabel: PREFERENCE_LABELS[prefKey],
      signal:          intentToSignal(entry.intent),
      strength:        intentToStrength(entry.intent),
      contextLabel:    `${entry.intent === 'remove' ? 'Removed' : 'Added'}: ${entry.contentType ?? 'content'} at ${entry.levelName ?? 'unknown level'}`,
      relatedMemoryId: entry.id,
      confidence:      'medium',
    })
  }

  // ── From proposed action decisions ────────────────────────────────────────
  // Director overrides signal low coach autonomy preference.
  for (const mem of academyMemories) {
    if (mem.sourceType === 'director_override' && mem.overrideReason) {
      entries.push({
        id:              `philo_override_${mem.id}`,
        learnedAt:       mem.occurredAt,
        source:          'proposed_action_decision',
        preferenceKey:   'coach_autonomy',
        preferenceLabel: PREFERENCE_LABELS.coach_autonomy,
        signal:          'negative',  // director modified → prefers direct control over delegation
        strength:        'moderate',
        contextLabel:    `Director modified: ${mem.headline}`,
        relatedMemoryId: mem.id,
        confidence:      'low',
      })
    }
  }

  return entries
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export function appendPhilosophyMemoryEntries(
  rawSettings:   Record<string, unknown>,
  newEntries:    PhilosophyMemoryEntry[],
): Record<string, unknown> {
  const existing = Array.isArray(rawSettings.donna_philosophy_memory)
    ? (rawSettings.donna_philosophy_memory as PhilosophyMemoryEntry[])
    : []
  const existingIds = new Set(existing.map(e => e.id))
  const dedupedNew  = newEntries.filter(e => !existingIds.has(e.id))
  return { ...rawSettings, donna_philosophy_memory: [...existing, ...dedupedNew] }
}

export function loadPhilosophyMemory(rawSettings: Record<string, unknown>): PhilosophyMemoryEntry[] {
  return Array.isArray(rawSettings.donna_philosophy_memory)
    ? (rawSettings.donna_philosophy_memory as PhilosophyMemoryEntry[])
    : []
}
