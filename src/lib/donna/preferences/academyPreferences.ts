// Sprint 470 — DONNA Academy Preferences V1
// Safe academy preference model for DONNA behavior customization.
// No sensitive personal memory. All preferences must be visible/editable by allowed roles.
// Stored in academy settings JSON column — no new table required.
// Pure types and helpers.

// ── Preference schema ─────────────────────────────────────────────────────────

export interface AcademyDonnaPreferences {
  summaryStyle: 'short' | 'standard' | 'detailed'   // Director preference for brief length
  parentSummaryTone: 'encouraging' | 'factual' | 'balanced'
  usesCustomLevelNames: boolean                       // True if academy uses non-standard level names
  customTerminology: Record<string, string>           // e.g. { 'group': 'squad', 'session': 'training' }
  preferredCoachLanguage: string | null               // e.g. 'en-AU', 'fr', 'es'
  saturdaySessionDefault: boolean                     // Whether Saturday sessions are standard
  defaultSessionDurationMin: number | null            // e.g. 60, 90
  hiddenKpiIds: string[]                              // KPI IDs that the director has muted
  donnaGreetsWithName: boolean                        // Whether DONNA uses the director's first name
  donnaDefaultConfidenceThreshold: 'high' | 'partial' | 'low'  // Minimum confidence to surface answers
}

export const DEFAULT_DONNA_PREFERENCES: AcademyDonnaPreferences = {
  summaryStyle: 'standard',
  parentSummaryTone: 'balanced',
  usesCustomLevelNames: false,
  customTerminology: {},
  preferredCoachLanguage: null,
  saturdaySessionDefault: false,
  defaultSessionDurationMin: 60,
  hiddenKpiIds: [],
  donnaGreetsWithName: true,
  donnaDefaultConfidenceThreshold: 'partial',
}

// ── Preference validation ──────────────────────────────────────────────────────

export function validateAcademyPreferences(
  input: Partial<AcademyDonnaPreferences>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (
    input.summaryStyle !== undefined &&
    !['short', 'standard', 'detailed'].includes(input.summaryStyle)
  ) {
    errors.push('summaryStyle must be short, standard, or detailed')
  }

  if (
    input.parentSummaryTone !== undefined &&
    !['encouraging', 'factual', 'balanced'].includes(input.parentSummaryTone)
  ) {
    errors.push('parentSummaryTone must be encouraging, factual, or balanced')
  }

  if (input.defaultSessionDurationMin !== undefined && input.defaultSessionDurationMin !== null) {
    if (input.defaultSessionDurationMin < 15 || input.defaultSessionDurationMin > 240) {
      errors.push('defaultSessionDurationMin must be between 15 and 240')
    }
  }

  if (input.donnaDefaultConfidenceThreshold !== undefined) {
    if (!['high', 'partial', 'low'].includes(input.donnaDefaultConfidenceThreshold)) {
      errors.push('donnaDefaultConfidenceThreshold must be high, partial, or low')
    }
  }

  // customTerminology: keys must not be empty, values must be non-empty strings
  if (input.customTerminology !== undefined) {
    for (const [key, value] of Object.entries(input.customTerminology)) {
      if (!key.trim() || !value.trim()) {
        errors.push('customTerminology entries must have non-empty keys and values')
        break
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

// ── Preference merge ──────────────────────────────────────────────────────────

export function mergeAcademyPreferences(
  base: AcademyDonnaPreferences,
  overrides: Partial<AcademyDonnaPreferences>,
): AcademyDonnaPreferences {
  return {
    ...base,
    ...overrides,
    customTerminology: {
      ...base.customTerminology,
      ...(overrides.customTerminology ?? {}),
    },
    hiddenKpiIds: overrides.hiddenKpiIds ?? base.hiddenKpiIds,
  }
}

// ── Terminology resolver ───────────────────────────────────────────────────────

// Applies custom terminology to DONNA-generated text.
// Example: replaces 'group' with 'squad' if the academy has that preference.
export function applyCustomTerminology(
  text: string,
  terminology: Record<string, string>,
): string {
  let result = text
  for (const [standard, custom] of Object.entries(terminology)) {
    // Case-insensitive whole-word replacement
    const regex = new RegExp(`\\b${standard}\\b`, 'gi')
    result = result.replace(regex, custom)
  }
  return result
}

// ── Future schema note ────────────────────────────────────────────────────────
// AcademyDonnaPreferences are stored in the academy settings JSON column.
// No new table is required for the current implementation.
// If persistent per-director preferences are needed, a new 'director_preferences'
// table will be required (separate from academy-wide settings).
// That work is deferred to a future sprint requiring schema approval.
