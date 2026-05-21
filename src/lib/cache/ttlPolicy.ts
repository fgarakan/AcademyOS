// Sprint 405 — Safe Cache Layer + TTL Rules V1
// TTL (time-to-live) definitions in seconds.
// Server-side only — never import from client components.
//
// These TTL values define INTENDED cache durations.
// They are not yet wired to an actual caching layer (as of Sprint 405).
// See docs/CACHE_TTL_IMPLEMENTATION_NOTES.md for the full strategy.

// Tier 0 — Never cache. Always fetch fresh.
// Use for: proposed_actions status, player is_active, voice session state, audit_logs.
export const TTL_NEVER = 0

// Tier 1 — Short-lived (60s). For data that changes on user actions.
// Use for: player profile, player priorities, session list for coach.
export const TTL_SHORT = 60

// Tier 2 — Medium (15 min = 900s). For relatively stable reference data.
// Use for: academy levels, template list, exercise library.
export const TTL_MEDIUM = 900

// Tier 3 — Long (30 min = 1800s). For near-static data.
// Use for: global curriculum spine, academy branding config.
export const TTL_LONG = 1800

// Tier 4 — Very long (24hr = 86400s). For build-time or daily revalidation.
// Use for: static curriculum content (if ISR is configured).
export const TTL_VERY_LONG = 86400

// TTL matrix by data type
export const TTL_POLICIES = {
  // Tier 0 — never cache
  proposedActionsStatus: TTL_NEVER,
  playerIsActive: TTL_NEVER,
  voiceSessionState: TTL_NEVER,
  auditLogs: TTL_NEVER,
  guardianContactInfo: TTL_NEVER,

  // Tier 1 — short (60s)
  playerProfile: TTL_SHORT,
  playerPriorities: TTL_SHORT,
  playerDevelopmentSummary: TTL_SHORT,
  sessionList: TTL_SHORT,
  coachWorkspace: TTL_SHORT,

  // Tier 2 — medium (15 min)
  academyLevels: TTL_MEDIUM,
  templateList: TTL_MEDIUM,
  exerciseLibrary: TTL_MEDIUM,
  groupList: TTL_MEDIUM,
  kpiSummary: TTL_MEDIUM,
  donnaPlayerContext: TTL_MEDIUM,

  // Tier 3 — long (30 min)
  globalCurriculum: TTL_LONG,
  academyBranding: TTL_LONG,

  // Tier 4 — very long (24hr)
  staticCurriculumContent: TTL_VERY_LONG,
} as const

export type TTLPolicyKey = keyof typeof TTL_POLICIES

// NO-CACHE ZONES (data that must NEVER be cached — security-sensitive or staleness-critical)
export const NO_CACHE_ZONES = [
  'proposed_actions.status',
  'player.is_active',
  'voice_sessions (live state)',
  'audit_logs',
  'guardians.email / phone',
  'player_development_summary (parent/student visibility flags)',
  'academy_memberships (role checks)',
] as const
