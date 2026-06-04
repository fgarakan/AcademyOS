// Sprint 1911–1960 — DONNA Reasoning + Memory Optimization V1
// Academy pattern memory.
//
// Tracks repeated patterns across the current session:
//   - recurring player issues
//   - recurring curriculum gaps
//   - repeated parent concerns
//   - repeated coach concerns
//   - repeated academy bottlenecks
//
// DONNA uses this to say: "This keeps coming up — it may be worth addressing
// the underlying pattern rather than each instance individually."
//
// Design rules:
//   - sessionStorage only (clears on tab close).
//   - 2-hour TTL — covers a working session.
//   - No raw content stored — only pattern labels and counts.
//   - No player names or sensitive data.

// ── Types ─────────────────────────────────────────────────────────────────────

export type AcademyPatternCategory =
  | 'player_stall'          // recurring: player progress stalling
  | 'curriculum_gap'        // recurring: curriculum level incomplete
  | 'parent_concern'        // recurring: parent-related attention items
  | 'coach_concern'         // recurring: coach performance or support items
  | 'review_queue_backlog'  // recurring: review queue not being cleared
  | 'attendance_gap'        // recurring: attendance exceptions unresolved
  | 'assessment_missing'    // recurring: assessments overdue

export interface AcademyPatternRecord {
  category: AcademyPatternCategory
  /** Safe, non-identifying label — e.g. "curriculum level gap", not a player name */
  patternLabel: string
  occurrenceCount: number
  firstSeenAt: number
  lastSeenAt: number
}

export interface AcademyMemoryState {
  sessionId: string
  patterns: AcademyPatternRecord[]
  /** Running count of attention-worthy signals seen this session */
  totalSignalCount: number
  createdAt: number
  lastActivityAt: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'donna_academy_memory'
const TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

/** How many times a pattern must appear before DONNA flags it as recurring */
const RECURRING_THRESHOLD = 2

// ── Serialization ─────────────────────────────────────────────────────────────

function read(): AcademyMemoryState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as AcademyMemoryState
    if (Date.now() - state.lastActivityAt > TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return state
  } catch {
    return null
  }
}

function write(state: AcademyMemoryState): void {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

function ensureState(): AcademyMemoryState {
  const existing = read()
  if (existing) return existing
  const now = Date.now()
  const state: AcademyMemoryState = {
    sessionId: Math.random().toString(36).slice(2, 10),
    patterns: [],
    totalSignalCount: 0,
    createdAt: now,
    lastActivityAt: now,
  }
  write(state)
  return state
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Get the current academy memory state (null if empty or expired). */
export function getAcademyMemory(): AcademyMemoryState | null {
  return read()
}

/**
 * Record an observed pattern.
 * If the same category + label has been seen before, increments occurrence count.
 */
export function recordPattern(
  category: AcademyPatternCategory,
  patternLabel: string,
): void {
  const state = ensureState()
  const now = Date.now()

  const existing = state.patterns.find(
    p => p.category === category && p.patternLabel === patternLabel
  )

  if (existing) {
    existing.occurrenceCount += 1
    existing.lastSeenAt = now
  } else {
    state.patterns.push({
      category,
      patternLabel,
      occurrenceCount: 1,
      firstSeenAt: now,
      lastSeenAt: now,
    })
  }

  write({
    ...state,
    totalSignalCount: state.totalSignalCount + 1,
    lastActivityAt: now,
  })
}

/** Get all recurring patterns (occurrence count ≥ threshold). */
export function getRecurringPatterns(): AcademyPatternRecord[] {
  const state = read()
  if (!state) return []
  return state.patterns
    .filter(p => p.occurrenceCount >= RECURRING_THRESHOLD)
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
}

/** Get the top recurring pattern by category (or null if none). */
export function getTopRecurringPattern(
  category: AcademyPatternCategory,
): AcademyPatternRecord | null {
  const state = read()
  if (!state) return null
  const categoryPatterns = state.patterns
    .filter(p => p.category === category && p.occurrenceCount >= RECURRING_THRESHOLD)
    .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
  return categoryPatterns[0] ?? null
}

/**
 * Build a DONNA notice about recurring patterns.
 * Returns null when no recurring patterns exist.
 * Example: "I've noticed curriculum gap issues coming up repeatedly.
 *           It may be worth addressing the underlying cause."
 */
export function buildRecurringPatternNotice(): string | null {
  const recurring = getRecurringPatterns()
  if (recurring.length === 0) return null

  const top = recurring[0]!
  const CATEGORY_NOTICES: Record<AcademyPatternCategory, string> = {
    player_stall:         'Player progress stalls have come up multiple times this session.',
    curriculum_gap:       'Curriculum gaps have come up multiple times — there may be a structural pattern worth addressing.',
    parent_concern:       "Parent-related items have appeared repeatedly — this may reflect a communication cadence gap.",
    coach_concern:        'Coach support items have surfaced multiple times — consider whether there\'s a system or resource gap.',
    review_queue_backlog: 'The review queue has been mentioned repeatedly — clearing it regularly may reduce friction.',
    attendance_gap:       'Attendance exceptions have come up multiple times — there may be a scheduling pattern worth investigating.',
    assessment_missing:   'Missing assessments keep appearing — it may help to set a structured assessment cadence.',
  }

  const notice = CATEGORY_NOTICES[top.category]
  return `${notice} (${top.occurrenceCount}× this session)`
}

/** Clear all academy memory (e.g., on session reset). */
export function clearAcademyMemory(): void {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}
