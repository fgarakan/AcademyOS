// Sprint 383 — Donna Attendance Session Resolution V1
// Client-side types + helpers for session/group selection in attendance exception drafts.
// No DB writes. No API calls. Pure types + local helpers.

// ── Session option ─────────────────────────────────────────────────────────────

export type AttendanceSessionSource = 'existing_session' | 'demo_option' | 'manual_placeholder'

export interface AttendanceSessionOption {
  sessionId: string
  title: string
  dateLabel: string
  timeLabel?: string
  groupLabel?: string
  coachLabel?: string
  source: AttendanceSessionSource
  confidence: 'high' | 'medium' | 'low'
}

// ── Resolution state ──────────────────────────────────────────────────────────

export interface AttendanceSessionResolutionState {
  selected: AttendanceSessionOption | null
  options: AttendanceSessionOption[]
  isLoading: boolean
  error: string | null
}

export function createEmptyResolutionState(): AttendanceSessionResolutionState {
  return { selected: null, options: [], isLoading: false, error: null }
}

// ── Demo options — used when no real sessions are available ───────────────────

export const ATTENDANCE_DEMO_SESSIONS: AttendanceSessionOption[] = [
  {
    sessionId: 'demo_session_orange2_today',
    title: 'Orange 2 — Today',
    dateLabel: 'Today',
    groupLabel: 'Orange 2',
    source: 'demo_option',
    confidence: 'low',
  },
  {
    sessionId: 'demo_session_yellow1_today',
    title: 'Yellow 1 — Today',
    dateLabel: 'Today',
    groupLabel: 'Yellow 1',
    source: 'demo_option',
    confidence: 'low',
  },
]

export const MANUAL_PLACEHOLDER: AttendanceSessionOption = {
  sessionId: 'manual_placeholder',
  title: 'Not sure / will confirm later',
  dateLabel: '',
  source: 'manual_placeholder',
  confidence: 'low',
}

// ── Label formatter ───────────────────────────────────────────────────────────

export function formatSessionOptionLabel(option: AttendanceSessionOption): string {
  const parts: string[] = [option.title]
  if (option.dateLabel) parts.push(option.dateLabel)
  if (option.groupLabel) parts.push(option.groupLabel)
  return parts.join(' · ')
}

// ── Natural language attendance flag extraction ───────────────────────────────
// Mirrors the server-side logic in donnaAttendanceActions.ts.
// Client-side only — no DB read. Used to pre-populate flaggedAbsences/Unrostered.

const EVERYONE_PHRASES = [
  'everyone was here', 'everyone came', 'everyone here', 'everyone present',
  'everybody was here', 'everybody came', 'all were here', 'all came',
  'whole group', 'full group', 'everyone showed up', 'all showed up',
]

const EXCEPT_TRIGGERS = ['except', 'apart from', 'but not', 'excluding', 'other than']

const NAME_STOP_WORDS = new Set([
  'everyone', 'everybody', 'all', 'they', 'he', 'she', 'it', 'we', 'you', 'i',
  'the', 'a', 'an', 'this', 'that', 'also', 'and', 'but', 'or', 'so', 'just',
  'only', 'even', 'now', 'today', 'here', 'there', 'then', 'no', 'not', 'new',
  'kid', 'player', 'student', 'member', 'coach', 'one', 'two', 'three',
])

export function hasEveryoneBaseline(text: string): boolean {
  const lower = text.toLowerCase()
  return EVERYONE_PHRASES.some(p => lower.includes(p))
}

export function extractNaturalAttendanceFlags(text: string): {
  absences: string[]
  unrostered: string[]
} {
  const lower = text.toLowerCase()

  // Extract absent names (after "except", "but not", etc.)
  const absences: string[] = []
  for (const trigger of EXCEPT_TRIGGERS) {
    const idx = lower.indexOf(trigger)
    if (idx === -1) continue
    const afterTrigger = text.slice(idx + trigger.length).trim()
    const end = afterTrigger.search(/[.!?\n]/)
    const chunk = end >= 0 ? afterTrigger.slice(0, end) : afterTrigger
    const parts = chunk
      .replace(/\band\b/gi, ',')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50)
    for (const part of parts) {
      const word = part.split(/\s+/)[0]
      if (word && !NAME_STOP_WORDS.has(word.toLowerCase())) {
        absences.push(word)
      }
    }
    break
  }

  // Extract unrostered / unexpected arrivals
  const ARRIVAL_PATTERNS = [
    /\b([A-Z][a-z]{1,20})\s+(?:showed\s+up|came\s+in|turned\s+up|arrived|appeared)\b/g,
    /\bnew\s+(?:kid|player|student|member)\s+([A-Z][a-z]{1,20})\b/g,
    /\balso[,\s]+([A-Z][a-z]{1,20})\s+(?:showed|came|turned|arrived)\b/g,
  ]
  const unrostered: string[] = []
  const seen = new Set<string>()
  for (const pattern of ARRIVAL_PATTERNS) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const name = m[1]?.trim()
      if (!name || NAME_STOP_WORDS.has(name.toLowerCase()) || seen.has(name.toLowerCase())) continue
      if (absences.some(a => a.toLowerCase() === name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      unrostered.push(name)
    }
  }

  return { absences, unrostered }
}

// ── Natural phrase detector ───────────────────────────────────────────────────
// Returns true if the input is a natural attendance phrase (not just a command trigger).

export function looksLikeNaturalAttendancePhrase(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('everyone') ||
    lower.includes('except') ||
    lower.includes('showed up') ||
    lower.includes('was absent') ||
    lower.includes('was late') ||
    lower.includes('came late') ||
    lower.includes('left early') ||
    lower.includes('was here') ||
    lower.includes('were here') ||
    lower.includes('didn\'t come') ||
    lower.includes('did not come') ||
    lower.includes('not in')
  )
}

// ── Draft phase helper ────────────────────────────────────────────────────────
// Derives the current UI phase from a draft. Consumed by DonnaAttendanceExceptionCard.

export type AttendanceDraftPhase = 'collecting' | 'choose_session' | 'ready'

export function getAttendanceDraftPhase(
  fieldsReady: boolean,
  sessionId: string | undefined,
): AttendanceDraftPhase {
  if (!fieldsReady) return 'collecting'
  if (!sessionId) return 'choose_session'
  return 'ready'
}
