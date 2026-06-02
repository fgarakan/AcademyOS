// Sprint 1074 — DONNA Academy Profile Context Engine V1
//
// Provides a structured AcademyProfileContext for DONNA to understand the
// current academy's identity, setup, curriculum, roster, and preferences.
//
// Design rules:
//   - Never fake unavailable data. Missing fields are tracked in `missingFields`.
//   - No DB queries in this file. The builder accepts pre-fetched optional data.
//   - Callers (server components, server actions) that already have academy data
//     pass it via BuildAcademyProfileInput. When data is unavailable, use
//     buildEmptyAcademyProfile() for an honest fallback.
//   - dataSource = 'live' when all identity fields are present,
//                  'partial' when some are missing,
//                  'fallback' when only academyId is known.
//
// Future wiring: pass AcademyProfileContext into DONNA's context packet builder
// (donnaContextPacketBuilder.ts) and the LLM orchestrator context payload.
// Not wired in this sprint.
//
// Pure TypeScript — no DB, no API, no React, no mutations, no side effects.

import {
  DEFAULT_DONNA_PREFERENCES,
} from '@/lib/donna/preferences/academyPreferences'
import type { AcademyDonnaPreferences } from '@/lib/donna/preferences/academyPreferences'

// ── Operating lens types ──────────────────────────────────────────────────────

/**
 * The academy's operational identity as captured by the DNA Shell onboarding.
 * Sourced from `academies.settings.academyOperatingLens`.
 * Null when the director has not completed the DNA Shell or the data has not been persisted.
 */
export interface AcademyOperatingLens {
  mission: string[]
  playerDevelopmentPhilosophy: string
  coachingStyle: string[]
  developmentPriorities: string[]
  curriculumPreference: string
  parentCommunicationStyle: string[]
  coachRecapExpectations: string
  donnaCommunicationStyle: string
  playerMissionStyle: string
  setupMode: string
}

// ── Setup gap types ───────────────────────────────────────────────────────────

/**
 * Keys that correspond to onboarding completion flags in `academies.settings` JSON.
 * These map 1:1 to the flags already parsed in `src/app/director/layout.tsx`.
 */
export type AcademySetupGapField =
  | 'academy_identity'
  | 'director_interview'
  | 'curriculum_setup'
  | 'level_gates'
  | 'programs_groups'
  | 'coaches_permissions'
  | 'players_placement'

/** A single onboarding setup gap with completion status and action link. */
export interface AcademySetupGap {
  field: AcademySetupGapField
  label: string
  isComplete: boolean
  /** Where the director should go to complete this step. */
  actionHref: string
}

// ── Main interface ────────────────────────────────────────────────────────────

/**
 * Structured academy profile context for DONNA answer generation.
 *
 * All fields that could not be resolved are listed in `missingFields`.
 * `null` means the value was not provided. Empty arrays mean no data.
 * DONNA must never claim to know a field that is null or in `missingFields`.
 */
export interface AcademyProfileContext {
  // ── Identity ────────────────────────────────────────────────────────────
  /** Supabase academy UUID — always present. */
  academyId: string
  /** Display name from `academies.name`. Null if not loaded. */
  academyName: string | null
  /** URL slug from `academies.slug`. Null if not loaded. */
  academySlug: string | null
  /** IANA timezone from `academies.timezone`. Null if not loaded. */
  timezone: string | null
  /** Country from `academies.country`. Null if not loaded. */
  country: string | null
  /** Director's display name from `profiles.display_name`. Null if not loaded. */
  directorName: string | null

  // ── Roster (counts only — no names) ─────────────────────────────────────
  /** Active player count. Null if not loaded. */
  activePlayerCount: number | null
  /** Active coach count. Null if not loaded. */
  coachCount: number | null

  // ── Curriculum ──────────────────────────────────────────────────────────
  /** Name of the active curriculum version. Null if not loaded or not activated. */
  activeCurriculumVersionName: string | null
  /** Status of the active curriculum version (e.g. 'active', 'draft'). Null if not loaded. */
  activeCurriculumVersionStatus: string | null
  /** Ball level or track names in use at this academy. Empty if not loaded. */
  ballLevelsUsed: string[]

  // ── Preferences ─────────────────────────────────────────────────────────
  /** Full DONNA preference set from `academies.settings` JSON. Null if not loaded. */
  preferences: AcademyDonnaPreferences | null
  /**
   * Parent communication tone — sourced from preferences when available,
   * otherwise defaults to 'balanced'.
   */
  parentCommunicationTone: 'encouraging' | 'factual' | 'balanced'

  // ── Setup / onboarding ───────────────────────────────────────────────────
  /** Per-step setup completion status derived from `academies.settings`. */
  setupGaps: AcademySetupGap[]
  /** True when all 7 setup steps are complete. False when any is incomplete. */
  onboardingComplete: boolean

  // ── Operating lens ───────────────────────────────────────────────────────
  /**
   * Academy operating lens from the DNA Shell onboarding.
   * Present when the director completed the DNA Shell and persisted it to the DB.
   * Null when not yet persisted — DONNA must not claim to know any lens fields.
   */
  operatingLens: AcademyOperatingLens | null

  // ── Data quality ─────────────────────────────────────────────────────────
  /**
   * Fields that could not be resolved. DONNA must not claim to know these.
   * Example: ['academyName', 'activeCurriculumVersionName']
   */
  missingFields: string[]
  /**
   * Data quality level:
   *   'live'     — all identity fields (name, slug, timezone) present
   *   'partial'  — some identity fields present but not all
   *   'fallback' — only academyId known; all other fields are null/empty
   */
  dataSource: 'live' | 'partial' | 'fallback'
  /** What DONNA should say when asked about the academy and data is incomplete. */
  missingDataFallback: string
}

// ── Internal setup gap definitions ───────────────────────────────────────────

interface SetupGapDefinition {
  label: string
  /** Key in `academies.settings` JSON that signals completion. */
  settingsKey: string
  actionHref: string
}

const SETUP_GAP_DEFINITIONS: Record<AcademySetupGapField, SetupGapDefinition> = {
  academy_identity: {
    label: 'Academy Identity',
    settingsKey: 'academy_identity_completed',
    actionHref: '/director/onboarding/interview',
  },
  director_interview: {
    label: 'Director Interview',
    settingsKey: 'director_interview_completed',
    actionHref: '/director/onboarding/interview',
  },
  curriculum_setup: {
    label: 'Curriculum Setup',
    settingsKey: 'curriculum_setup_completed',
    actionHref: '/director/onboarding/curriculum',
  },
  level_gates: {
    label: 'Level Gates',
    settingsKey: 'level_gates_completed',
    actionHref: '/director/onboarding',
  },
  programs_groups: {
    label: 'Programs & Groups',
    settingsKey: 'programs_groups_completed',
    actionHref: '/director/onboarding',
  },
  coaches_permissions: {
    label: 'Coaches & Permissions',
    settingsKey: 'coaches_permissions_completed',
    actionHref: '/director/onboarding',
  },
  players_placement: {
    label: 'Players & Placement',
    settingsKey: 'players_placement_completed',
    actionHref: '/director/placement',
  },
}

/**
 * Extract the AcademyOperatingLens from the raw `academies.settings` JSON.
 * Returns null if the key is absent or the lens has no meaningful data.
 * Never throws — lens extraction is best-effort.
 */
function extractOperatingLens(
  settings: Record<string, unknown> | null | undefined,
): AcademyOperatingLens | null {
  if (!settings) return null
  const raw = settings['academyOperatingLens']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const lens = raw as Record<string, unknown>

  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  const str = (v: unknown): string =>
    typeof v === 'string' ? v : ''

  // Only surface the lens if it has at least one meaningful field
  const coachingStyle = arr(lens['coachingStyle'])
  const developmentPriorities = arr(lens['developmentPriorities'])
  if (coachingStyle.length === 0 && developmentPriorities.length === 0) return null

  return {
    mission: arr(lens['mission']),
    playerDevelopmentPhilosophy: str(lens['playerDevelopmentPhilosophy']),
    coachingStyle,
    developmentPriorities,
    curriculumPreference: str(lens['curriculumPreference']),
    parentCommunicationStyle: arr(lens['parentCommunicationStyle']),
    coachRecapExpectations: str(lens['coachRecapExpectations']),
    donnaCommunicationStyle: str(lens['donnaCommunicationStyle']),
    playerMissionStyle: str(lens['playerMissionStyle']),
    setupMode: str(lens['setupMode']),
  }
}

// ── Builder input ─────────────────────────────────────────────────────────────

/**
 * Optional inputs for buildAcademyProfileFromLiveData.
 * Callers pass whatever they have already fetched — this builder does not query the DB.
 * All fields are optional. Missing fields are recorded in `missingFields`.
 */
export interface BuildAcademyProfileInput {
  /** Required: the academy's Supabase UUID. */
  academyId: string
  /** From `academies.name`. */
  academyName?: string | null
  /** From `academies.slug`. */
  academySlug?: string | null
  /** From `academies.timezone`. */
  timezone?: string | null
  /** From `academies.country`. */
  country?: string | null
  /** From `profiles.display_name` for the director. */
  directorName?: string | null
  /** Total active player count (no names). */
  activePlayerCount?: number | null
  /** Total active coach count (no names). */
  coachCount?: number | null
  /** Name of the activated curriculum version. */
  activeCurriculumVersionName?: string | null
  /** Status of the activated curriculum version. */
  activeCurriculumVersionStatus?: string | null
  /** Ball level or track names used at this academy. */
  ballLevelsUsed?: string[]
  /**
   * The raw `academies.settings` JSON, passed as-is from the DB query.
   * Used to extract onboarding flags and DONNA preferences.
   */
  rawAcademySettings?: Record<string, unknown> | null
  /**
   * Pre-parsed DONNA preferences (if already extracted from settings by the caller).
   * Takes precedence over rawAcademySettings preference parsing when provided.
   */
  preferences?: AcademyDonnaPreferences | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive setup gaps from the raw `academies.settings` JSON.
 * Each field that is not explicitly `true` is treated as incomplete.
 */
function deriveSetupGaps(settings: Record<string, unknown> | null | undefined): AcademySetupGap[] {
  const fields = Object.keys(SETUP_GAP_DEFINITIONS) as AcademySetupGapField[]
  return fields.map(field => {
    const def = SETUP_GAP_DEFINITIONS[field]
    const isComplete = settings?.[def.settingsKey] === true
    return {
      field,
      label: def.label,
      isComplete,
      actionHref: def.actionHref,
    }
  })
}

/**
 * Attempt to extract AcademyDonnaPreferences from the raw settings JSON.
 * Returns null if the settings object is absent or does not contain preference keys.
 * Never throws — preference extraction is best-effort.
 */
function extractPreferences(
  settings: Record<string, unknown> | null | undefined,
): AcademyDonnaPreferences | null {
  if (!settings) return null
  // Check for the presence of at least one preference key to confirm preferences are stored
  if (typeof settings['summaryStyle'] !== 'string' && typeof settings['parentSummaryTone'] !== 'string') {
    return null
  }
  // Merge with defaults so missing preference fields are always populated safely
  return {
    ...DEFAULT_DONNA_PREFERENCES,
    summaryStyle: (settings['summaryStyle'] as AcademyDonnaPreferences['summaryStyle']) ?? DEFAULT_DONNA_PREFERENCES.summaryStyle,
    parentSummaryTone: (settings['parentSummaryTone'] as AcademyDonnaPreferences['parentSummaryTone']) ?? DEFAULT_DONNA_PREFERENCES.parentSummaryTone,
    usesCustomLevelNames: (settings['usesCustomLevelNames'] as boolean) ?? DEFAULT_DONNA_PREFERENCES.usesCustomLevelNames,
    customTerminology: (settings['customTerminology'] as Record<string, string>) ?? DEFAULT_DONNA_PREFERENCES.customTerminology,
    preferredCoachLanguage: (settings['preferredCoachLanguage'] as string | null) ?? DEFAULT_DONNA_PREFERENCES.preferredCoachLanguage,
    saturdaySessionDefault: (settings['saturdaySessionDefault'] as boolean) ?? DEFAULT_DONNA_PREFERENCES.saturdaySessionDefault,
    defaultSessionDurationMin: (settings['defaultSessionDurationMin'] as number | null) ?? DEFAULT_DONNA_PREFERENCES.defaultSessionDurationMin,
    hiddenKpiIds: (settings['hiddenKpiIds'] as string[]) ?? DEFAULT_DONNA_PREFERENCES.hiddenKpiIds,
    donnaGreetsWithName: (settings['donnaGreetsWithName'] as boolean) ?? DEFAULT_DONNA_PREFERENCES.donnaGreetsWithName,
    donnaDefaultConfidenceThreshold: (settings['donnaDefaultConfidenceThreshold'] as AcademyDonnaPreferences['donnaDefaultConfidenceThreshold']) ?? DEFAULT_DONNA_PREFERENCES.donnaDefaultConfidenceThreshold,
  }
}

/**
 * Determine data source quality level based on which identity fields are present.
 */
function deriveDataSource(
  academyName: string | null,
  academySlug: string | null,
  timezone: string | null,
): 'live' | 'partial' | 'fallback' {
  const identityFields = [academyName, academySlug, timezone]
  const presentCount = identityFields.filter(f => f !== null && f !== '').length
  if (presentCount === 3) return 'live'
  if (presentCount > 0) return 'partial'
  return 'fallback'
}

// ── Public builders ───────────────────────────────────────────────────────────

/**
 * Build an AcademyProfileContext from caller-provided live data.
 * Does not query the database — accepts whatever the caller already fetched.
 * All missing fields are recorded in `missingFields`.
 *
 * @example
 * // In a server component that already has academy data:
 * const profile = buildAcademyProfileFromLiveData({
 *   academyId: academy.id,
 *   academyName: academy.name,
 *   academySlug: academy.slug,
 *   timezone: academy.timezone,
 *   directorName: profile.display_name,
 *   rawAcademySettings: academy.settings,
 *   activePlayerCount: playerCount,
 *   coachCount,
 * })
 */
export function buildAcademyProfileFromLiveData(
  input: BuildAcademyProfileInput,
): AcademyProfileContext {
  const {
    academyId,
    academyName = null,
    academySlug = null,
    timezone = null,
    country = null,
    directorName = null,
    activePlayerCount = null,
    coachCount = null,
    activeCurriculumVersionName = null,
    activeCurriculumVersionStatus = null,
    ballLevelsUsed = [],
    rawAcademySettings = null,
    preferences: passedPreferences = null,
  } = input

  // Resolve preferences: use passed preferences first, then extract from raw settings
  const resolvedPreferences =
    passedPreferences ?? extractPreferences(rawAcademySettings as Record<string, unknown> | null)

  // Derive setup gaps from raw settings
  const setupGaps = deriveSetupGaps(rawAcademySettings as Record<string, unknown> | null)
  const onboardingComplete = setupGaps.every(g => g.isComplete)

  // Extract operating lens from raw settings
  const operatingLens = extractOperatingLens(rawAcademySettings as Record<string, unknown> | null)

  // Track missing fields — never fake them
  const missingFields: string[] = []
  if (!academyName) missingFields.push('academyName')
  if (!academySlug) missingFields.push('academySlug')
  if (!timezone) missingFields.push('timezone')
  if (!country) missingFields.push('country')
  if (!directorName) missingFields.push('directorName')
  if (activePlayerCount === null) missingFields.push('activePlayerCount')
  if (coachCount === null) missingFields.push('coachCount')
  if (!activeCurriculumVersionName) missingFields.push('activeCurriculumVersionName')
  if (!activeCurriculumVersionStatus) missingFields.push('activeCurriculumVersionStatus')
  if (ballLevelsUsed.length === 0) missingFields.push('ballLevelsUsed')
  if (!resolvedPreferences) missingFields.push('preferences')
  if (!operatingLens) missingFields.push('operatingLens')

  const dataSource = deriveDataSource(academyName, academySlug, timezone)

  const parentCommunicationTone: 'encouraging' | 'factual' | 'balanced' =
    resolvedPreferences?.parentSummaryTone ?? 'balanced'

  const missingDataFallback = academyName
    ? `Academy profile for ${academyName} is partially loaded. Some context fields are unavailable: ${missingFields.join(', ')}.`
    : `Academy profile context is not fully loaded. Academy identity and configuration data are unavailable. I can answer page-specific questions, but I cannot confirm academy-specific preferences or setup status.`

  return {
    academyId,
    academyName,
    academySlug,
    timezone,
    country,
    directorName,
    activePlayerCount,
    coachCount,
    activeCurriculumVersionName,
    activeCurriculumVersionStatus,
    ballLevelsUsed,
    preferences: resolvedPreferences,
    parentCommunicationTone,
    setupGaps,
    onboardingComplete,
    operatingLens,
    missingFields,
    dataSource,
    missingDataFallback,
  }
}

/**
 * Build an empty AcademyProfileContext when no live data is available.
 * All fields are null or empty. dataSource = 'fallback'.
 * Use this as a safe default — it never fabricates information.
 *
 * @example
 * const profile = buildEmptyAcademyProfile(academyId)
 * // profile.academyName === null, profile.dataSource === 'fallback'
 */
export function buildEmptyAcademyProfile(academyId: string): AcademyProfileContext {
  const setupGaps = deriveSetupGaps(null)
  return {
    academyId,
    academyName: null,
    academySlug: null,
    timezone: null,
    country: null,
    directorName: null,
    activePlayerCount: null,
    coachCount: null,
    activeCurriculumVersionName: null,
    activeCurriculumVersionStatus: null,
    ballLevelsUsed: [],
    preferences: null,
    parentCommunicationTone: 'balanced',
    setupGaps,
    onboardingComplete: false,
    operatingLens: null,
    missingFields: [
      'academyName',
      'academySlug',
      'timezone',
      'country',
      'directorName',
      'activePlayerCount',
      'coachCount',
      'activeCurriculumVersionName',
      'activeCurriculumVersionStatus',
      'ballLevelsUsed',
      'preferences',
      'operatingLens',
    ],
    dataSource: 'fallback',
    missingDataFallback:
      'Academy profile context has not been loaded. I can answer page-specific questions, but I cannot confirm academy-level details, preferences, or setup status right now.',
  }
}

// ── Summary helper ─────────────────────────────────────────────────────────────

/**
 * Produce a concise natural-language summary of the academy profile for use
 * in DONNA prompts, context packets, and orchestrator context payloads.
 *
 * The summary is intentionally brief (2–4 sentences) so it can be prepended
 * to any DONNA prompt without significantly increasing token count.
 *
 * Only includes fields that are known. Never invents values for null fields.
 *
 * @example
 * // Returns: "Academy: Dabul Tennis Academy. Director: Brian Dabul.
 * //           15 active players, 3 coaches. Curriculum: Orange Ball V2 (active).
 * //           Parent communication tone: balanced."
 */
export function getAcademyProfileSummaryText(profile: AcademyProfileContext): string {
  const parts: string[] = []

  // Academy identity
  if (profile.academyName) {
    const countryPart = profile.country ? ` (${profile.country})` : ''
    parts.push(`Academy: ${profile.academyName}${countryPart}.`)
  }

  // Director
  if (profile.directorName) {
    parts.push(`Director: ${profile.directorName}.`)
  }

  // Roster
  const hasPlayers = profile.activePlayerCount !== null
  const hasCoaches = profile.coachCount !== null
  if (hasPlayers && hasCoaches) {
    parts.push(`${profile.activePlayerCount} active player${profile.activePlayerCount !== 1 ? 's' : ''}, ${profile.coachCount} coach${profile.coachCount !== 1 ? 'es' : ''}.`)
  } else if (hasPlayers) {
    parts.push(`${profile.activePlayerCount} active player${profile.activePlayerCount !== 1 ? 's' : ''}.`)
  } else if (hasCoaches) {
    parts.push(`${profile.coachCount} coach${profile.coachCount !== 1 ? 'es' : ''}.`)
  }

  // Curriculum
  if (profile.activeCurriculumVersionName) {
    const statusPart = profile.activeCurriculumVersionStatus
      ? ` (${profile.activeCurriculumVersionStatus})`
      : ''
    parts.push(`Curriculum: ${profile.activeCurriculumVersionName}${statusPart}.`)
  }

  // Ball levels
  if (profile.ballLevelsUsed.length > 0) {
    parts.push(`Ball levels: ${profile.ballLevelsUsed.join(', ')}.`)
  }

  // Preferences
  if (profile.preferences) {
    parts.push(`Parent communication tone: ${profile.parentCommunicationTone}.`)
    if (profile.preferences.defaultSessionDurationMin) {
      parts.push(`Default session duration: ${profile.preferences.defaultSessionDurationMin} min.`)
    }
    if (profile.preferences.customTerminology && Object.keys(profile.preferences.customTerminology).length > 0) {
      const terms = Object.entries(profile.preferences.customTerminology)
        .slice(0, 3)
        .map(([k, v]) => `"${k}" → "${v}"`)
        .join(', ')
      parts.push(`Custom terminology: ${terms}.`)
    }
  }

  // Operating lens — compact token-efficient summary of the academy's identity
  if (profile.operatingLens) {
    const lens = profile.operatingLens
    const lensParts: string[] = []
    if (lens.coachingStyle.length > 0) {
      lensParts.push(`coaching: ${lens.coachingStyle.slice(0, 2).join(', ')}`)
    }
    if (lens.developmentPriorities.length > 0) {
      lensParts.push(`priorities: ${lens.developmentPriorities.slice(0, 3).join(', ')}`)
    }
    if (lens.parentCommunicationStyle.length > 0) {
      lensParts.push(`parent style: ${lens.parentCommunicationStyle.slice(0, 2).join(', ')}`)
    }
    if (lens.curriculumPreference) {
      lensParts.push(`curriculum preference: ${lens.curriculumPreference}`)
    }
    if (lens.mission.length > 0) {
      lensParts.push(`mission: ${lens.mission.slice(0, 2).join(', ')}`)
    }
    if (lens.playerMissionStyle) {
      lensParts.push(`player mission style: ${lens.playerMissionStyle}`)
    }
    if (lensParts.length > 0) {
      parts.push(`Operating lens: ${lensParts.join('; ')}.`)
    }
  }

  // Onboarding / setup gaps
  if (!profile.onboardingComplete) {
    const incompleteGaps = profile.setupGaps.filter(g => !g.isComplete)
    if (incompleteGaps.length > 0) {
      const gapLabels = incompleteGaps.map(g => g.label).join(', ')
      parts.push(`Setup incomplete: ${gapLabels}.`)
    }
  }

  // Data quality note for partial/fallback
  if (profile.dataSource === 'fallback') {
    parts.push('Academy profile not loaded — answers limited to page context.')
  } else if (profile.dataSource === 'partial' && profile.missingFields.length > 2) {
    parts.push(`Some academy context unavailable: ${profile.missingFields.slice(0, 3).join(', ')}.`)
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'Academy profile context is not available.'
}
