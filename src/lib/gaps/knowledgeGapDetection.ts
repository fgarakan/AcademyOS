// Knowledge Gap Detection — Sprint 233
// Pure deterministic helper. No DB calls. No AI. No side effects. No writes.
// Detects knowledge and conceptual gaps from curriculum, gate, and coaching data.
// Caller fetches the required data and passes it in.
// Output: IdpKnowledgeGap[] — consumed by buildIndividualDevelopmentPlan().

import type { IdpKnowledgeGap, IdpGapSeverity } from '@/lib/player/individualDevelopmentPlan'
import type { LearningModuleDomain } from '@/lib/curriculum/learningModules'

// ── Input type ──────────────────────────────────────────────────────────────────

export interface KnowledgeGapInput {
  player_id: string
  // Curriculum level context
  current_level: string | null
  current_stage?: string | null
  // Open gates (from curriculum_gates where is_active = true for this level)
  open_gates: Array<{ domain: string; criterion: string }>
  // Coach language availability (from curriculum_coach_language)
  has_coach_language: boolean
  coach_language_domains: string[]
  // Drill availability (count of curriculum_drills for this level)
  available_drill_count: number
  // Learning module domains available for this level
  available_module_domains?: string[]
}

// ── Severity sort order ─────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<IdpGapSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
  insufficient_data: 3,
}

// ── Domain normalizer → LearningModuleDomain ────────────────────────────────────

const DOMAIN_MAP: Array<{ keywords: string[]; module: LearningModuleDomain }> = [
  { keywords: ['technical', 'technique', 'stroke', 'grip', 'swing'],  module: 'Technical' },
  { keywords: ['tactical', 'tactics', 'strategy', 'pattern'],         module: 'Tactical' },
  { keywords: ['movement', 'footwork', 'agility', 'positioning'],     module: 'Movement' },
  { keywords: ['competition', 'match', 'game', 'tournament'],         module: 'Competition' },
  { keywords: ['mentality', 'mental', 'focus', 'confidence'],         module: 'Mentality' },
  { keywords: ['fitness', 'conditioning', 'strength', 'endurance'],   module: 'Fitness' },
  { keywords: ['recovery', 'rest', 'sleep', 'nutrition'],             module: 'Recovery' },
  { keywords: ['lifestyle', 'routine', 'habits'],                     module: 'Lifestyle' },
]

function normalizeToModuleDomain(domain: string): LearningModuleDomain {
  const lower = domain.toLowerCase()
  for (const entry of DOMAIN_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return entry.module
    }
  }
  return 'Technical'
}

// ── Domain frequency counter (returns sorted array) ─────────────────────────────

function topDomainsByCount(
  gates: Array<{ domain: string }>,
): Array<{ domain: string; count: number }> {
  const acc: Record<string, number> = {}
  for (const gate of gates) {
    acc[gate.domain] = (acc[gate.domain] ?? 0) + 1
  }
  return Object.entries(acc)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
}

// ── Main detector ───────────────────────────────────────────────────────────────

export function detectKnowledgeGaps(input: KnowledgeGapInput): IdpKnowledgeGap[] {
  const {
    current_level,
    open_gates,
    has_coach_language,
    coach_language_domains,
    available_drill_count,
    available_module_domains = [],
  } = input

  // No curriculum level assigned — cannot assess any knowledge gaps
  if (!current_level) {
    return [
      {
        gap_type: 'no_curriculum_level',
        domain: null,
        description:
          'No curriculum level has been assigned to this player. Assign a level to enable gap detection, coaching guidance, and learning module recommendations.',
        severity: 'high',
        suggested_module_domain: null,
      },
    ]
  }

  // No gates, no coach language, no drills — nothing to evaluate
  if (
    open_gates.length === 0 &&
    !has_coach_language &&
    available_drill_count === 0
  ) {
    return [
      {
        gap_type: 'insufficient_data',
        domain: null,
        description:
          `Curriculum data for level "${current_level}" is not yet fully configured. No gates, coach language, or drills found.`,
        severity: 'insufficient_data',
        suggested_module_domain: null,
      },
    ]
  }

  const gaps: IdpKnowledgeGap[] = []

  // ── No coach language ────────────────────────────────────────────────────────
  if (!has_coach_language) {
    const suggestedDomain: LearningModuleDomain = available_module_domains.length > 0
      ? normalizeToModuleDomain(available_module_domains[0])
      : 'Technical'
    gaps.push({
      gap_type: 'no_coach_language',
      domain: null,
      description:
        `No coaching language or cues are defined for level "${current_level}". Add working_on, current_focus, and next_step cues to enable meaningful guidance.`,
      severity: 'medium',
      suggested_module_domain: suggestedDomain,
    })
  }

  // ── No drills available ──────────────────────────────────────────────────────
  if (available_drill_count === 0) {
    gaps.push({
      gap_type: 'no_drills_available',
      domain: null,
      description:
        `No curriculum drills are mapped to level "${current_level}". Players at this level have no structured practice vehicles.`,
      severity: 'medium',
      suggested_module_domain: 'Technical',
    })
  }

  // ── Domain gap cluster ───────────────────────────────────────────────────────
  if (open_gates.length >= 2) {
    const ranked = topDomainsByCount(open_gates)
    const top = ranked[0]
    if (top && top.count / open_gates.length >= 0.7) {
      gaps.push({
        gap_type: 'domain_gap_cluster',
        domain: top.domain,
        description:
          `${top.count} of ${open_gates.length} open advancement gates are concentrated in the ${top.domain} domain (${Math.round((top.count / open_gates.length) * 100)}%). Focused work in this area is needed.`,
        severity: 'medium',
        suggested_module_domain: normalizeToModuleDomain(top.domain),
      })
    }
  }

  // ── Many open gates — broad coverage gap ────────────────────────────────────
  if (open_gates.length >= 5) {
    const ranked = topDomainsByCount(open_gates)
    const topDomain = ranked[0]?.domain ?? ''
    gaps.push({
      gap_type: 'many_open_gates',
      domain: null,
      description:
        `${open_gates.length} advancement gates are still open. Broad curriculum exposure across multiple domains is needed before advancement is realistic.`,
      severity: 'low',
      suggested_module_domain: topDomain ? normalizeToModuleDomain(topDomain) : 'Technical',
    })
  }

  // ── No learning module domain match ─────────────────────────────────────────
  if (
    open_gates.length > 0 &&
    available_module_domains.length > 0 &&
    coach_language_domains.length > 0
  ) {
    const gateDomains = open_gates.map(g => normalizeToModuleDomain(g.domain))
    const moduleDomains = available_module_domains.map(d => normalizeToModuleDomain(d))
    const hasMatch = gateDomains.some(gd => moduleDomains.includes(gd))

    if (!hasMatch) {
      const suggestedDomain = open_gates[0]
        ? normalizeToModuleDomain(open_gates[0].domain)
        : null
      gaps.push({
        gap_type: 'no_module_domain_match',
        domain: null,
        description:
          'No learning module domain aligns with the current open gate domains. Consider adding modules that match the current gate focus areas.',
        severity: 'low',
        suggested_module_domain: suggestedDomain,
      })
    }
  }

  // Sort: high → medium → low → insufficient_data
  gaps.sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
  )

  return gaps
}
