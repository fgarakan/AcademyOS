// Sprint 647/650 — First Daily Welcome (final)
// Stateless helper. No DB reads. No API calls. localStorage only.

const STORAGE_KEY = 'academyos:donna:lastGreetedDate:v1'

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late night'

export interface DailyGreetingState {
  isFirstOpenToday: boolean
  primaryText: string
  followUp: string
}

// Use local calendar date — toISOString() returns UTC which can mismatch local
// date for users in negative-offset timezones after midnight.
function todayDateString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'late night'
}

// Shared salutation — used by both director and coach branches.
function greetingWord(timeOfDay: TimeOfDay): string {
  if (timeOfDay === 'morning') return 'Good morning'
  if (timeOfDay === 'afternoon') return 'Good afternoon'
  return 'Good evening'
}

function buildPrimaryText(firstName: string | null, timeOfDay: TimeOfDay): string {
  const salutation = firstName ? `Coach ${firstName}` : 'Coach'
  return `${greetingWord(timeOfDay)}, ${salutation}. I'm ready to help you run the academy today.`
}

/**
 * Returns the daily greeting state for the given user.
 * Reads localStorage — must only be called in a browser context.
 * Call markGreetedToday() separately after confirming a first open.
 *
 * role='coach' returns coach-specific priority routing copy.
 * role='director' (default) returns director/academy-operations copy.
 */
export function getDailyGreetingState(
  firstName: string | null,
  role: 'director' | 'coach' = 'director',
): DailyGreetingState {
  if (typeof window === 'undefined') {
    return {
      isFirstOpenToday: false,
      primaryText: 'Welcome back. What would you like to check next?',
      followUp: '',
    }
  }

  const lastDate = window.localStorage.getItem(STORAGE_KEY)
  const today = todayDateString()
  const isFirstOpenToday = lastDate !== today

  if (isFirstOpenToday) {
    const timeOfDay = getTimeOfDay()
    if (role === 'coach') {
      const salutation = firstName ? `Coach ${firstName}` : 'Coach'
      return {
        isFirstOpenToday: true,
        primaryText: `${greetingWord(timeOfDay)}, ${salutation}. I'm here to help with your sessions today.`,
        followUp: "If you have a session to wrap up, I'll bring it up first.",
      }
    }
    return {
      isFirstOpenToday: true,
      primaryText: buildPrimaryText(firstName, timeOfDay),
      followUp: 'Would you like me to walk you through what needs attention?',
    }
  }

  return {
    isFirstOpenToday: false,
    primaryText: 'Welcome back. What would you like to check next?',
    followUp: '',
  }
}

/** Write today's date to localStorage. Call once on first DONNA open of the day. */
export function markGreetedToday(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, todayDateString())
}
