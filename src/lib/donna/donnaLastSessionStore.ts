/**
 * Sprint 784 — DONNA Cross-Session Memory
 *
 * localStorage-backed store that persists safe, non-sensitive page context
 * across browser sessions (tab closes, page refreshes, etc.).
 *
 * Safety rules:
 * - Store ONLY: page labels, page routes, safe action labels. Never store
 *   player names, coach notes, scores, coach identifiers, or any PII.
 * - Scoped per academyId — different academies never share context.
 * - 7-day TTL — stale context is silently discarded.
 * - SSR-safe — all localStorage calls are guarded by typeof window check.
 */

const STORAGE_VERSION = 'v1'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface DonnaLastSession {
  /** Human-readable module label (e.g. "Review Queue", "Player Profiles") */
  lastPageLabel: string | null
  /** Full route path (e.g. "/director/review") */
  lastPageRoute: string | null
  /** Safe action label — last completed non-sensitive assistant action */
  lastSafeActionLabel: string | null
  /** Unix timestamp (ms) when this was saved */
  savedAt: number
}

function storageKey(academyId: string): string {
  return `academyos:donna:last-session:${academyId}:${STORAGE_VERSION}`
}

/**
 * Load the last session context for this academy.
 * Returns null if nothing stored, data is malformed, or data is older than 7 days.
 */
export function loadLastSession(academyId: string): DonnaLastSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(academyId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as DonnaLastSession
    if (typeof parsed !== 'object' || parsed === null) return null
    if (typeof parsed.savedAt !== 'number') return null
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      // Expired — remove silently
      window.localStorage.removeItem(storageKey(academyId))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * Save the current page context to localStorage for cross-session recall.
 * Only saves when a meaningful page label exists.
 */
export function saveLastSession(
  academyId: string,
  session: Omit<DonnaLastSession, 'savedAt'>
): void {
  if (typeof window === 'undefined') return
  if (!session.lastPageLabel) return // nothing meaningful to persist
  try {
    const data: DonnaLastSession = {
      ...session,
      savedAt: Date.now(),
    }
    window.localStorage.setItem(storageKey(academyId), JSON.stringify(data))
  } catch {
    // localStorage may be full or blocked — fail silently
  }
}

/**
 * Clear cross-session context for this academy.
 * Called when director explicitly logs out or clears data.
 */
export function clearLastSession(academyId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(storageKey(academyId))
  } catch {
    // fail silently
  }
}

/**
 * Build a natural cross-session welcome message.
 * Used when DONNA opens after a gap (new tab, page refresh, or new session day
 * where `isFirstOpenToday` is false but we have prior session context).
 *
 * Tone: brief, not chatty, gives the director orientation without friction.
 */
export function buildCrossSessionWelcome(
  session: DonnaLastSession | null,
  firstName: string | null
): string {
  const name = firstName ? ` ${firstName}` : ''
  if (!session?.lastPageLabel) {
    return `Welcome back${name}. I can help you review today, check what needs attention, or walk you through the agenda.`
  }
  return `Welcome back${name}. Last time you were on the ${session.lastPageLabel}. I can continue there, give you today's brief, or show what needs attention.`
}
