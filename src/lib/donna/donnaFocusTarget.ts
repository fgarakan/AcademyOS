// Sprint 817 — DONNA Focus Target Store
// sessionStorage-backed focus target for guided navigation + teal highlighting.
// No DB. No RLS. No mutations. Pure visual guidance.
// Safe to import on client only — uses browser sessionStorage API.

// ── Types ─────────────────────────────────────────────────────────────────────

export type DonnaHighlightStyle = 'teal-glow' | 'warning'

export interface DonnaFocusTarget {
  /** The page route this target belongs to — must match pathname exactly */
  route: string
  /** Matches the data-donna-focus-id attribute on the target element */
  targetId: string
  /** Human-readable label shown in the highlight badge */
  label: string
  /** Optional explanation of why DONNA is pointing here */
  reason?: string
  /** The user command that triggered this (for logging only — never shown to users) */
  sourceCommand?: string
  /** Visual style: teal-glow (default) or warning (orange) */
  highlightStyle?: DonnaHighlightStyle
  /** Unix ms timestamp — focus target is ignored after this point */
  expiresAt?: number
}

// ── Storage key ───────────────────────────────────────────────────────────────

export const DONNA_FOCUS_TARGET_KEY = 'donna_focus_target'

// Default highlight duration: 8 seconds after setDonnaFocusTarget is called.
const DEFAULT_DURATION_MS = 8000

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Set the active DONNA focus target.
 * Call this immediately before router.push() so the target is available when
 * the destination page mounts.
 *
 * Safety: targetId and label must not contain player names, coach notes,
 * or any private data. Only route + element identifier + display label.
 */
export function setDonnaFocusTarget(target: DonnaFocusTarget): void {
  if (typeof window === 'undefined') return
  const withExpiry: DonnaFocusTarget = {
    ...target,
    expiresAt: target.expiresAt ?? Date.now() + DEFAULT_DURATION_MS,
  }
  try {
    sessionStorage.setItem(DONNA_FOCUS_TARGET_KEY, JSON.stringify(withExpiry))
  } catch {
    // sessionStorage unavailable (private browsing quota) — silently skip
  }
}

/**
 * Read the active DONNA focus target from sessionStorage.
 * Returns null if no target is set or if the target has expired.
 * Clears expired targets automatically.
 */
export function getDonnaFocusTarget(): DonnaFocusTarget | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DONNA_FOCUS_TARGET_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DonnaFocusTarget
    // Expired — clear and return null
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      clearDonnaFocusTarget()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * Clear the active DONNA focus target.
 * Call after highlighting is applied, on manual dismiss, or on panel close.
 */
export function clearDonnaFocusTarget(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(DONNA_FOCUS_TARGET_KEY)
  } catch {
    // sessionStorage unavailable — silently skip
  }
}

/**
 * Check if the stored focus target has expired without reading or clearing it.
 * Returns true if expired or missing, false if still valid.
 * Useful for conditional UI rendering before reading the full target.
 */
export function isDonnaFocusTargetExpired(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = sessionStorage.getItem(DONNA_FOCUS_TARGET_KEY)
    if (!raw) return true
    const parsed = JSON.parse(raw) as DonnaFocusTarget
    if (!parsed.expiresAt) return false
    return Date.now() > parsed.expiresAt
  } catch {
    return true
  }
}
