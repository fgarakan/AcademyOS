// Sprint 1019 — Academy Philosophy Profile V1
// Defines the academy's coaching philosophy as a structured data object
// that DONNA can reference in curriculum strategy conversations.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   When DONNA answers curriculum strategy questions, it should be able to
//   reference the academy's stated coaching philosophy:
//     - What age groups and developmental stages do they focus on?
//     - What is their approach to skill development vs. competition?
//     - What content domains are prioritized?
//     - What is the expected session frequency?
//
// V1 philosophy profile is derived from curriculum context signals (level count, stages).
// Sprint 1020+ can extend this with a DB-backed philosophy table.
//
// Safety:
//   Philosophy profiles never contain player names, coach performance data, or private notes.
//   All profiles are advisory — they inform DONNA's suggestions, not director decisions.

// ── Profile types ─────────────────────────────────────────────────────────────

export type CurriculumStage =
  | 'red'       // Beginner / early development
  | 'orange'    // Intermediate / skill building
  | 'green'     // Advanced intermediate / competitive readiness
  | 'yellow'    // Advanced / high performance
  | 'purple'    // Elite / specialization
  | 'custom'    // Academy-defined stages

export type DevelopmentEmphasis =
  | 'skill_first'         // Technical skill development is the primary focus
  | 'competition_first'   // Match play and competition is the primary focus
  | 'balanced'            // Equal emphasis on skill and competition
  | 'fitness_first'       // Physical development is the primary focus

export type ContentDomainPriority = {
  domain: 'technical' | 'tactical' | 'fitness' | 'mental' | 'competition'
  priority: 1 | 2 | 3 | 4 | 5  // 1 = highest priority
}

export interface AcademyPhilosophyProfile {
  /** Human-readable name for this philosophy profile */
  profileName: string
  /** Primary stages served by this academy */
  primaryStages: CurriculumStage[]
  /** Development emphasis philosophy */
  developmentEmphasis: DevelopmentEmphasis
  /** Content domain priorities (1 = highest priority) */
  contentDomainPriorities: ContentDomainPriority[]
  /** Target sessions per player per week */
  targetSessionsPerWeek: number
  /** Whether the academy has a defined curriculum document */
  hasFormalCurriculum: boolean
  /** Whether the academy participates in competitive events */
  hasCompetitiveProgram: boolean
  /** Coach-to-player ratio goal (e.g. 1:4) */
  coachPlayerRatioGoal: string | null
  /** Any noted philosophy notes (advisory — never contains private data) */
  philosophyNotes: string | null
  /** Source of this profile (derived = computed from signals, director_defined = set by director) */
  source: 'derived' | 'director_defined'
}

// ── Default profile builder ───────────────────────────────────────────────────

/**
 * Build a default philosophy profile from available curriculum signals.
 * Used in V1 when no director-defined profile exists.
 *
 * Derivation rules:
 *   - If levels > 4: multi-stage → primaryStages includes red through yellow
 *   - If levels 2-4: early development focus → red/orange
 *   - If levels ≤ 1 or 0: undefined → red only (starter)
 *   - Development emphasis defaults to 'balanced'
 *   - Content domains default to equal weighting
 */
export function buildDefaultPhilosophyProfile(signals: {
  totalLevels: number
  academyName?: string
}): AcademyPhilosophyProfile {
  const { totalLevels, academyName } = signals

  const primaryStages: CurriculumStage[] = totalLevels >= 4
    ? ['red', 'orange', 'green', 'yellow']
    : totalLevels >= 2
    ? ['red', 'orange']
    : ['red']

  return {
    profileName: academyName ? `${academyName} Philosophy Profile` : 'Academy Philosophy Profile',
    primaryStages,
    developmentEmphasis: 'balanced',
    contentDomainPriorities: [
      { domain: 'technical', priority: 1 },
      { domain: 'tactical', priority: 2 },
      { domain: 'fitness', priority: 3 },
      { domain: 'mental', priority: 4 },
      { domain: 'competition', priority: 5 },
    ],
    targetSessionsPerWeek: 3,
    hasFormalCurriculum: totalLevels > 0,
    hasCompetitiveProgram: totalLevels >= 3,
    coachPlayerRatioGoal: null,
    philosophyNotes: null,
    source: 'derived',
  }
}

// ── Philosophy context builder ────────────────────────────────────────────────

/**
 * Build a safe DONNA context string from a philosophy profile.
 * Used to inject philosophy context into LLM system prompts.
 * Never includes player names, coach performance data, or private notes.
 */
export function buildPhilosophyContextString(profile: AcademyPhilosophyProfile): string {
  const lines: string[] = []

  lines.push(`## Academy Philosophy Context`)
  lines.push(`Profile: ${profile.profileName}`)
  lines.push(`Primary curriculum stages: ${profile.primaryStages.join(', ')}`)
  lines.push(`Development emphasis: ${profile.developmentEmphasis.replace(/_/g, ' ')}`)

  const topDomains = [...profile.contentDomainPriorities]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(d => d.domain)
    .join(', ')
  lines.push(`Top content domain priorities: ${topDomains}`)

  lines.push(`Target sessions per week: ${profile.targetSessionsPerWeek}`)
  lines.push(`Formal curriculum: ${profile.hasFormalCurriculum ? 'yes' : 'not yet defined'}`)
  lines.push(`Competitive program: ${profile.hasCompetitiveProgram ? 'yes' : 'not established'}`)

  if (profile.source === 'derived') {
    lines.push('Note: This profile is derived from curriculum signals — it is an estimate, not a director-defined statement.')
  }

  return lines.join('\n')
}

// ── Gap analysis helper ───────────────────────────────────────────────────────

export interface PhilosophyGapSignal {
  domain: ContentDomainPriority['domain']
  priority: number
  gapDescription: string
}

/**
 * Identify curriculum content gaps relative to the philosophy profile.
 * Conservative — only flags gaps when signals are clear.
 * Returns signals (not directives) for DONNA to reference.
 */
export function identifyPhilosophyGaps(
  profile: AcademyPhilosophyProfile,
  signals: {
    hasAnyContent: boolean
    stagesCovered: CurriculumStage[]
  },
): PhilosophyGapSignal[] {
  const gaps: PhilosophyGapSignal[] = []

  // Gap: primary stages without content
  const missingStages = profile.primaryStages.filter(
    stage => !signals.stagesCovered.includes(stage),
  )
  if (missingStages.length > 0 && signals.hasAnyContent) {
    gaps.push({
      domain: 'technical',
      priority: 1,
      gapDescription: `Primary stage(s) ${missingStages.join(', ')} may not have content defined.`,
    })
  }

  // Gap: no content at all
  if (!signals.hasAnyContent) {
    gaps.push({
      domain: 'technical',
      priority: 1,
      gapDescription: 'No curriculum content has been defined yet.',
    })
  }

  return gaps
}
