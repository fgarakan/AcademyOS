// Sprint 647 — First Daily Welcome
// Stateless helper. No DB reads. No API calls. localStorage only.

const STORAGE_KEY = 'academyos:donna:lastGreetedDate:v1'

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late night'

export interface DailyGreetingState {
  isFirstOpenToday: boolean
  primaryText: string
  followUp: string
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'late night'
}

function buildPrimaryText(firstName: string | null, timeOfDay: TimeOfDay): string {
  const salutation = firstName ? `Coach ${firstName}` : 'Coach'
  const greeting =
    timeOfDay === 'morning' ? 'Good morning'
    : timeOfDay === 'afternoon' ? 'Good afternoon'
    : timeOfDay === 'evening' ? 'Good evening'
    : 'Good evening'
  return `${greeting}, ${salutation}. I'm ready to help you run the academy today.`
}

/**
 * Returns the daily greeting state for the given user.
 * Reads localStorage — must only be called in a browser context.
 * Call markGreetedToday() separately after confirming a first open.
 */
export function getDailyGreetingState(firstName: string | null): DailyGreetingState {
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
