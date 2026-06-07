// Natural language date phrase resolver — no DB calls, no external deps.
// Converts spoken date phrases to ISO date strings (YYYY-MM-DD).
// Used by the session resolver before querying scheduled_date.

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

// Returns the most recent past occurrence of a given day (or today if today matches)
function mostRecentOccurrence(targetDow: number, from: Date): Date {
  const d = new Date(from)
  const currentDow = d.getDay()
  let daysBack = currentDow - targetDow
  if (daysBack < 0) daysBack += 7
  d.setDate(d.getDate() - daysBack)
  return d
}

/**
 * Converts natural language date phrases to ISO date strings.
 * Returns null if the phrase is not a recognized date expression.
 *
 * Supported patterns:
 *   today, yesterday, tomorrow
 *   monday...sunday (most recent past occurrence)
 *   last monday...last sunday (most recent past, guaranteed in the past)
 *   this monday...this sunday (occurrence in the current calendar week)
 *   YYYY-MM-DD passthrough
 */
export function resolveDatePhrase(input: string): string | null {
  const phrase = input.toLowerCase().trim()
  if (!phrase) return null

  // ISO passthrough
  if (/^\d{4}-\d{2}-\d{2}$/.test(phrase)) return phrase

  const now = new Date()

  if (phrase === 'today') return toISO(now)

  if (phrase === 'yesterday') {
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    return toISO(d)
  }

  if (phrase === 'tomorrow') {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return toISO(d)
  }

  // "last [day]" — guaranteed to be at least 1 day in the past
  const lastMatch = phrase.match(/^last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)
  if (lastMatch) {
    const targetDow = DAY_INDEX[lastMatch[1]]
    const d = mostRecentOccurrence(targetDow, now)
    // If today IS that day, go back 7 more days to get "last" occurrence
    if (d.toDateString() === now.toDateString()) {
      d.setDate(d.getDate() - 7)
    }
    return toISO(d)
  }

  // "this [day]" — the occurrence in the current calendar week
  const thisMatch = phrase.match(/^this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)
  if (thisMatch) {
    const targetDow = DAY_INDEX[thisMatch[1]]
    const d = new Date(now)
    const currentDow = d.getDay()
    // Sunday = 0 as week start; go to start of week (Sunday), then add targetDow
    const startOfWeek = new Date(d)
    startOfWeek.setDate(d.getDate() - currentDow)
    startOfWeek.setDate(startOfWeek.getDate() + targetDow)
    return toISO(startOfWeek)
  }

  // Bare "[day]" — most recent past occurrence (or today if today matches)
  const dayMatch = phrase.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)
  if (dayMatch) {
    const targetDow = DAY_INDEX[dayMatch[1]]
    return toISO(mostRecentOccurrence(targetDow, now))
  }

  return null
}

/** Returns true if the input looks like a date phrase (not a session name). */
export function looksLikeDatePhrase(input: string): boolean {
  return resolveDatePhrase(input) !== null
}
