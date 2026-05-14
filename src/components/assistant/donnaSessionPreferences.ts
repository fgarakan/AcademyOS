// Donna Session Preferences — Sprint 287
// Pure TypeScript only. No DB, no Supabase, no async, no AI.
//
// Director preferences that persist only for the current browser session
// (localStorage). No database table exists for academy preferences.
//
// Preference scope: this module only stores lightweight display/UX preferences.
// It NEVER stores player data, curriculum state, or any operational data.
//
// If the user closes the tab, preferences reset to defaults. This is by design:
// no preference migration path exists until a DB table is created.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DonnaSessionPreferences {
  /** Whether Donna speaks responses aloud via TTS. Default: true. */
  voiceFeedbackEnabled: boolean
  /** Whether the greeting card is shown on first panel open. Default: true. */
  greetingEnabled: boolean
  /** Whether predictive suggestions are shown in the panel. Default: true. */
  predictiveSuggestionsEnabled: boolean
  /** Preferred panel default mode on open. Default: null (shows all). */
  defaultMode: 'review_queue' | null
}

const STORAGE_KEY = 'donna_session_prefs_v1'

const DEFAULT_PREFERENCES: DonnaSessionPreferences = {
  voiceFeedbackEnabled: true,
  greetingEnabled: true,
  predictiveSuggestionsEnabled: true,
  defaultMode: null,
}

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------

export function getDonnaSessionPreferences(): DonnaSessionPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    const parsed = JSON.parse(raw) as Partial<DonnaSessionPreferences>
    return { ...DEFAULT_PREFERENCES, ...parsed }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function setDonnaSessionPreferences(
  updates: Partial<DonnaSessionPreferences>,
): DonnaSessionPreferences {
  const current = getDonnaSessionPreferences()
  const next = { ...current, ...updates }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // localStorage may be unavailable (private mode, storage full)
    }
  }
  return next
}

export function resetDonnaSessionPreferences(): DonnaSessionPreferences {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }
  return { ...DEFAULT_PREFERENCES }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isDonnaVoiceEnabled(): boolean {
  return getDonnaSessionPreferences().voiceFeedbackEnabled
}
