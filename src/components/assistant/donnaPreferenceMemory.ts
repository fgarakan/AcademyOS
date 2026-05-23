// Sprint 377 — Donna Preference Memory V1
// localStorage-backed preference store. No React, no DB, no API calls.
// Persists user preferences across sessions for the current browser.
// Key: academyos:donna:preferences:v1

const STORAGE_KEY = 'academyos:donna:preferences:v1'

// ── Preference schema ──────────────────────────────────────────────────────────

export interface DonnaPreferences {
  // Panel UX
  preferVoiceInput: boolean          // Director prefers voice over typed input
  skipGreeting: boolean              // Director has dismissed the intro greeting
  expandRecommendationsDefault: boolean  // Whether recommendations are expanded on open

  // Workflow preferences
  lastUsedWorkflowId: string | null  // Most recently started workflow type
  frequentCategories: string[]       // Categories the director interacts with most (max 5)

  // Communication tone
  preferredParentTone: 'formal' | 'warm' | 'concise' | null

  // Version + timestamps
  version: 1
  firstSavedAt: string               // ISO timestamp of first write
  lastUpdatedAt: string              // ISO timestamp of last write
}

// ── Defaults ───────────────────────────────────────────────────────────────────

export function defaultPreferences(): DonnaPreferences {
  const now = new Date().toISOString()
  return {
    preferVoiceInput: false,
    skipGreeting: false,
    expandRecommendationsDefault: false,
    lastUsedWorkflowId: null,
    frequentCategories: [],
    preferredParentTone: null,
    version: 1,
    firstSavedAt: now,
    lastUpdatedAt: now,
  }
}

// ── Read ───────────────────────────────────────────────────────────────────────

/**
 * Load preferences from localStorage. Returns defaults if nothing is stored or parse fails.
 * Safe to call on the server (returns defaults when localStorage is unavailable).
 */
export function loadPreferences(): DonnaPreferences {
  if (typeof window === 'undefined') return defaultPreferences()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPreferences()
    const parsed = JSON.parse(raw) as Partial<DonnaPreferences>
    // Merge with defaults to handle missing keys from older versions
    return { ...defaultPreferences(), ...parsed, version: 1 }
  } catch {
    return defaultPreferences()
  }
}

// ── Write ──────────────────────────────────────────────────────────────────────

/**
 * Persist the full preferences object to localStorage.
 * Safe to call on the server (no-op when localStorage is unavailable).
 */
export function savePreferences(prefs: DonnaPreferences): void {
  if (typeof window === 'undefined') return
  try {
    const updated: DonnaPreferences = { ...prefs, lastUpdatedAt: new Date().toISOString() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage may be full or blocked — silent fail
  }
}

// ── Patch helpers ──────────────────────────────────────────────────────────────

/**
 * Update a single preference field and persist.
 */
export function patchPreference<K extends keyof DonnaPreferences>(
  key: K,
  value: DonnaPreferences[K],
): DonnaPreferences {
  const current = loadPreferences()
  const updated: DonnaPreferences = { ...current, [key]: value }
  savePreferences(updated)
  return updated
}

/**
 * Record that a workflow was used — updates lastUsedWorkflowId.
 */
export function recordWorkflowUsed(workflowId: string): DonnaPreferences {
  return patchPreference('lastUsedWorkflowId', workflowId)
}

/**
 * Record a category interaction — adds to frequentCategories (max 5, most recent first,
 * deduplicated).
 */
export function recordCategoryUsed(category: string): DonnaPreferences {
  const current = loadPreferences()
  const without = current.frequentCategories.filter(c => c !== category)
  const updated: DonnaPreferences = {
    ...current,
    frequentCategories: [category, ...without].slice(0, 5),
  }
  savePreferences(updated)
  return updated
}

/**
 * Mark the greeting as seen so it doesn't replay on subsequent sessions.
 */
export function markGreetingSeen(): DonnaPreferences {
  return patchPreference('skipGreeting', true)
}

/**
 * Clear all preferences (reset to defaults + persist).
 */
export function clearPreferences(): DonnaPreferences {
  const fresh = defaultPreferences()
  savePreferences(fresh)
  return fresh
}
